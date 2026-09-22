# Codebase Audit — YouTube Transcript Summarizer

> **Status: historical record.** This audit was written against an earlier revision of the app and is kept as a record of what was found. **Every code-level item below has since been fixed** — see [Resolution Status](#6-resolution-status) at the end. It does **not** describe the current codebase; use [PROJECT_MAP.md](PROJECT_MAP.md) for current architecture.

Comprehensive review performed by an advisory board across bug-detection, performance, security, architecture, and UI/UX dimensions.

---

## 1. Executive Summary

This is a **well-structured, genuinely impressive** single-page app. The codebase is clean, idiomatic, and consistently follows its own conventions (named exports, one-concern hooks, pure logic in `src/lib`, barrel re-exports, proper error surfacing). The build, typecheck (`strict` mode), and all **40 unit tests pass**. Architecture is sound: the LLM provider abstraction, storage layer, and markmap chunking are strong.

However, there are **three functional bugs that undermine core features**: (1) the chat system prompt is sent with `role: 'assistant'` instead of `'system'`, weakening the app's headline "strict context" guarantee; (2) the chat **Stop button is a no-op** — the abort controller is never wired up, so stopping does nothing; (3) the history "Save to History" button does nothing beyond showing a toast. Additionally, there are performance and UX concerns (markmap bundle at 655 kB, `messages` in a `useCallback` dependency array causing churn, and an unhandled streaming-abort path).

---

## 2. Critical Issues (Blockers & Security)

### 🔴 CRITICAL-1 — Chat system prompt sent as `role: 'assistant'` instead of `'system'`
[src/hooks/useChat.ts:68-77](src/hooks/useChat.ts#L68-L77)

The `ChatRole` type only allows `'user' | 'assistant'` ([src/types/summary.ts:11](src/types/summary.ts#L11)), so the strict-context system prompt is delivered as an *assistant* turn. Providers treat assistant-role content as prior model output, not authoritative instructions — so the app's core "answer only from the transcript / report neutrally" contract is weakened, and the transcript gets echoed back through the visible history in a confusing way.

**Fix:** add `'system'` to the union and use it for the system prompt.

```ts
// src/types/summary.ts
export type ChatRole = 'user' | 'assistant' | 'system';

// src/hooks/useChat.ts
const systemMsg: ChatMessage = {
  id: uuid(),
  role: 'system',                        // was 'assistant'
  content: buildChatSystemPrompt(transcript),
  createdAt: Date.now(),
};
```

### 🔴 CRITICAL-2 — "Stop" streaming button is a no-op (abort never wired)
[src/hooks/useChat.ts:26](src/hooks/useChat.ts#L26), [src/hooks/useChat.ts:116](src/hooks/useChat.ts#L116), [src/hooks/useChat.ts:123](src/hooks/useChat.ts#L123)

`abortRef` is declared and reset to `null`, but **no `AbortController` is ever created** and **no `signal` is passed to `fetch`** in either [openaiCompatible.ts](src/lib/llm/openaiCompatible.ts) or [ollama.ts](src/lib/llm/ollama.ts). `stopStreaming()` therefore calls `abort()` on `null` and just flips `isStreaming` to `false` while the request keeps streaming into state.

**Fix:** create the controller in `sendMessage`, pass it through the client, and abort on stop.

```ts
// useChat.ts — inside sendMessage, before the try
abortRef.current = new AbortController();
const signal = abortRef.current.signal;
```
```ts
// openaiCompatible.ts / ollama.ts — add signal to both chat & chatStream fetches
const res = await fetch(this.endpoint, { ..., signal }); // accept `signal` in opts
```
Expose `signal` through `ChatOptions` (or add an `opts.signal` field) so it reaches the fetch. Then `stopStreaming` actually halts the request, and the `finally` block already resets the ref.

### 🟠 HIGH-3 — "Save to History" button is a functional no-op
[src/App.tsx:101-108](src/App.tsx#L101-L108)

`handleSaveSummary` ignores the passed `_summary`, ensures a session, and shows a success toast — **without persisting anything**. The summary was already persisted on generation via `upsertSummary` in [useSummary.ts](src/hooks/useSummary.ts), making the button misleading: the toast claims "saved to history" when no new save occurs (and if the user never generated, they cannot reach this button). Decide intent: either the button genuinely saves an unsaved edit, or it should be removed/re-labelled as an informational "already saved" affordance.

---

## 3. Performance & Architecture Enhancements

### 🟠 HIGH — Markmap chunk is 655 kB (235 kB gzip), over the 500 kB warning threshold
[vite.config.ts:12-14](vite.config.ts#L12-L14)

The build splits `markmap-lib/view/common` into a dedicated chunk, which is correct for caching — but 655 kB is large. The mindmap is one tab among several; consider **lazy-loading the tab** with `React.lazy(() => import('./components/mindmap/MindmapPanel'))` so the 235 kB isn't fetched until the user opens it.

### 🟠 MED — `useChat.sendMessage` depends on `messages` → recreated on every streamed token
[src/hooks/useChat.ts:126](src/hooks/useChat.ts#L126)

The dependency array `[input, messages, transcript, session, settings, isStreaming]` includes `messages`, so `sendMessage` gets a new identity on **every token** during streaming (each `setMessages` re-renders). This invalidates the memoized callbacks that hold it in `App.tsx` and re-renders the panel. Use a `messagesRef` (functional updates inside already do the right thing) to keep `sendMessage` stable across the stream.

### 🟠 MED — Search is O(n) over all sessions on every keystroke
[src/lib/storage/sessionStore.ts:74-91](src/lib/storage/sessionStore.ts#L74-L91)

`searchSessions` loads **every session** from IndexedDB and filters in JS on each query change, and `useHistory.refresh` re-runs on every `query` change ([useHistory.ts:15-31](src/hooks/useHistory.ts#L15-L31)). Fine for small data, but it will degrade with history growth. Add **debouncing** to the search input (~250 ms) and consider a `text`-indexed field in the Dexie schema for future scale.

### 🟡 LOW — `mergeSegments` silently mutates a shared object
[src/lib/cleaner/transcriptCleaner.ts:72-83](src/lib/cleaner/transcriptCleaner.ts#L72-L83)

`last.text = `${last.text} ${seg.text}`` mutates the last pushed object in place (it was pushed via spread, so it's a fresh object — technically safe here). Prefer building the merged text immutably (`{ ...last, text: ... }`) to avoid surprising downstream aliasing if this helper is ever reused.

---

## 4. Code Quality, Readability & Nice-to-Haves

### 🟡 LOW — Missing `aria-label` on timestamp-only icon buttons
[src/components/mindmap/MarkmapView.tsx](src/components/mindmap/MarkmapView.tsx) (expand-all/collapse/zoom/fit buttons)

The Markmap control buttons (list-tree, list-collapse, zoom-in/out, fit) rely only on `title` tooltips. Add `aria-label` for screen-reader parity, matching the icon buttons in [AppShell.tsx](src/components/layout/AppShell.tsx) which already use `aria-label` correctly.

### 🟡 LOW — `Alert()` for file validation is a poor UX pattern
[src/components/upload/DropZone.tsx:27](src/components/upload/DropZone.tsx#L27)

Rejecting a non-`.txt` file with a native `alert()` blocks the JS thread and reads procedurally. The app already has a toast system — route validation errors through `onFile`'s parent (toast) instead, or inline an error message in the DropZone.

### 🟡 LOW — Redundant docs drift
[PROJECT_MAP.md](PROJECT_MAP.md) documents the directory and key exports well, but duplicates `README.md`; `PROJECT_MAP.md` also states "25 tests" while the suite is now **40**. Keep one source of truth and verify counts to avoid misleading contributors.

### 🟡 LOW — Could use native `crypto.randomUUID()` instead of `uuid` package
The app depends on `uuid` though `crypto.randomUUID()` is universally supported in modern browsers. Minor dependency trim; not urgent.

### 🟡 LOW — Committed build artifacts
`dist/`, `tsconfig.tsbuildinfo`, and `tsconfig.node.tsbuildinfo` exist on disk. `.gitignore` excludes `dist` but the tsbuildinfo files aren't ignored — add `*.tsbuildinfo` to `.gitignore` so incremental-build caches aren't committed. (Note: the repo is not currently under git.)

---

## 5. Action Plan (Prioritized Roadmap)

### ✅ Quick Wins (high impact, low effort)
1. **Fix the `system` role** for the chat prompt (add `'system'` to `ChatRole`). — Restores the core strict-context feature.
2. **Wire up the abort controller** so Stop actually cancels streaming; pass `signal` through the clients' `fetch` calls.
3. **Remove/re-implement the no-op "Save to History" button** so the UI never claims a save that didn't happen.
4. **Debounce the history search** input (~250 ms) and add `aria-label`s to the Markmap control buttons.

### 🎯 High Impact (medium effort)
5. **Code-split the Mindmap tab** (`React.lazy`) to defer ~235 kB gzip until the user opens it.
6. **Stabilize `useChat.sendMessage`** by removing `messages` from its dependency array (use a ref + functional updates).
7. **Fix DropZone validation UX** — replace `alert()` with the existing toast/inline error pattern.

### 🏗️ Long-term Refactoring (higher effort, architectural payoff)
8. **Add an `AbortSignal` to `ChatOptions`** as a first-class part of the LLM interface so all providers support cancellation uniformly (currently a per-client concern).
9. **IndexedDB text-search index** for sessions to keep search O(indexed) as history grows.
10. **Reconcile docs** — collapse `PROJECT_MAP.md`/`README.md` duplication, update the test count, and gitignore `*.tsbuildinfo`.

---

## 6. Resolution Status

Verified against the current source. Each item lists where the fix lives.

| Item | Status | Where |
|------|--------|-------|
| CRITICAL-1 — chat prompt sent as `assistant` | ✅ Fixed | `ChatRole` now includes `'system'` ([src/types/summary.ts:11](src/types/summary.ts#L11)); the prompt is built as a system message ([src/hooks/useChat.ts:93](src/hooks/useChat.ts#L93)) |
| CRITICAL-2 — Stop button was a no-op | ✅ Fixed | Controller created per request and its `signal` passed through ([src/hooks/useChat.ts:98-112](src/hooks/useChat.ts#L98-L112)); `signal` is part of `ChatOptions` and reaches both clients' `fetch` calls |
| HIGH-3 — no-op "Save to History" | ✅ Fixed | The button was removed; summaries auto-save on generation and `ActionBar` documents this ([src/components/summarize/ActionBar.tsx](src/components/summarize/ActionBar.tsx)) |
| Markmap chunk in the initial bundle | ✅ Fixed | The mindmap panel is `React.lazy`-loaded ([src/App.tsx:26-28](src/App.tsx#L26-L28)) |
| `sendMessage` depended on `messages` | ✅ Fixed | Dependency array is now `[input, transcript, session, settings, isStreaming]` ([src/hooks/useChat.ts:175](src/hooks/useChat.ts#L175)) |
| Search re-queried on every keystroke | ✅ Fixed | 250 ms debounce ([src/hooks/useHistory.ts:41](src/hooks/useHistory.ts#L41)) |
| `mergeSegments` mutated in place | ✅ Fixed | Builds a fresh object instead of assigning to `last.text` |
| Missing `aria-label`s on icon buttons | ✅ Fixed | `MarkmapView` now carries 7 `aria-label`s |
| `alert()` for file validation | ✅ Fixed | No `alert(` remains in `src/`; `DropZone` shows an inline error |
| Docs drift (test counts, duplication) | ✅ Fixed | `PROJECT_MAP.md` and `README.md` reconciled; `*.tsbuildinfo` is gitignored |
| Native `crypto.randomUUID()` over `uuid` | ⏸️ Deliberately not actioned | `crypto.randomUUID()` is unavailable in non-secure contexts, so serving the built app over plain HTTP on a LAN address would break ID generation. `uuid` works everywhere and is ~1 kB. |

Beyond the original list, a later review added: hardened settings parsing that rejects non-object JSON and merges per provider, and test coverage for the SSE/NDJSON stream parsers.
