# PROJECT_MAP.md

## Project Overview
A modern, single-page **React + Vite + TypeScript** web application that runs entirely in the browser to **summarize, map, and chat with YouTube transcript (.txt) files**. It ingests transcripts via drag-and-drop/file picker/paste, smart-cleans auto-caption artifacts while preserving timestamps, and provides two tabs: **Summarize & Chat** and **Mindmap** (Markmap outline). A **History** panel is reachable from the app shell. All data persists locally via Dexie (IndexedDB) and localStorage.

## Tech Stack
- **React 18.3** + **Vite 5.4** + **TypeScript 5.6** (strict mode)
- **Tailwind CSS 3.4** (`darkMode: 'class'`, custom `brand` palette, Inter font)
- **Dexie.js 4.0.8** — IndexedDB wrapper for persistence
- **Markmap** (markmap-lib/view/common 0.18.8) — interactive v1 mindmap rendering
- **React Markdown 9** + **remark-gfm** — renders summaries/chat responses (no `rehype-raw`, so raw HTML in model output is escaped)
- **Radix UI** (dialog, slider, tooltip, popover) — accessible primitives
- **framer-motion 13** — layout/enter-exit animation
- **sonner 2** — toasts
- **lucide-react 0.454** — icons
- **uuid 10** — ID generation
- **Vitest 2.1** + **jsdom** + **@testing-library** — testing

## Directory Structure
```
youtube-transcript-app/
├── index.html              # references public/favicon.svg
├── package.json
├── vite.config.ts          # vitest/config defineConfig, manualChunks, test config
├── tsconfig.json / tsconfig.node.json
├── tailwind.config.js / postcss.config.js
├── public/favicon.svg
├── src/
│   ├── main.tsx / App.tsx / index.css
│   ├── types/              # transcript, provider, summary, index (barrel)
│   ├── config/             # providers.ts (defaults)
│   ├── lib/
│   │   ├── timestamps.ts
│   │   ├── language.ts     # detectLanguage (RTL detection)
│   │   ├── cleaner/transcriptCleaner.ts
│   │   ├── llm/            # client, openaiCompatible, ollama, factory, prompts,
│   │   │                   #   dedupeOutline
│   │   └── storage/        # db, settingsStore, sessionStore
│   ├── hooks/              # useSettings, useTranscript, useChat, useSummary,
│   │                       #   useMindmap, useHistory, useTheme
│   ├── utils/              # cn, download
│   └── components/
│       ├── common/         # Button, Modal, Spinner, Toast, Tabs, TimestampChip,
│       │                   #   MarkdownContent, motion
│       ├── layout/         # AppShell, Sidebar
│       ├── settings/       # SettingsModal, ProviderList, ProviderForm
│       ├── upload/         # DropZone
│       ├── summarize/      # SummaryPanel, SummaryControls, ActionBar
│       ├── chat/           # ChatPanel, MessageList, MessageBubble, ChatInput
│       ├── mindmap/        # MindmapControls + v1/ (MarkmapView, MindmapPanel)
│       └── history/        # HistoryPanel, SessionCard, SearchBar
└── tests/                  # 11 suites, 76 tests (see Build & Test Commands)
```

## Utility Helpers & Key Exports

### `src/lib/timestamps.ts`
- `parseTimestamp(raw: string): number | null` — parse MM:SS / HH:MM:SS / fractional to seconds.
- `formatTimestamp(seconds: number): string` — format seconds to MM:SS or HH:MM:SS.
- `extractLeadingTimestamp(line: string): { start: number | null; rest: string }` — pull leading timestamp off a line (reconstructs token from capture groups).
- `findTimestamps(text: string): Array<{ start: number; index: number }>` — find all timestamps in text with their character offsets.

### `src/lib/language.ts`
- `detectLanguage(text: string): LanguageInfo` — heuristic script detection; used to set RTL direction on chat/summary output.

### `src/lib/cleaner/transcriptCleaner.ts`
- `cleanTranscript(raw: string): CleanResult` — returns `{ cleanedText, segments, hasTimestamps }`. Strips boilerplate (`[Music]`, `>>`), dedupes repeated tokens (`the the the`→`the`), drops consecutive duplicate lines, extracts leading timestamps, merges timestamp-less segments into the previous timestamped segment.

### `src/lib/llm/`
- `client.ts` — `ChatOptions` (`temperature`, `maxTokens`, `signal`), `LLMClient` interface (`chat`, `chatStream`), `toWireMessage`.
- `openaiCompatible.ts` — `OpenAICompatibleClient` (POST `/chat/completions`, Bearer auth, SSE streaming).
- `ollama.ts` — `OllamaClient` (POST `/api/chat`, no auth, NDJSON streaming).
- `factory.ts` — `createLLMClient(provider)` (ollama→OllamaClient, else OpenAICompatibleClient).
- `prompts.ts` — `SUMMARY_WORD_TARGETS` (concise 150 / normal 400 / detailed 800), `buildSummaryPrompt`, `buildChatSystemPrompt` (transcript-grounded rules), `buildMindmapPrompt`.
- `dedupeOutline.ts` — `dedupeOutline(markdown)` — removes duplicate branches from a generated outline.

### `src/lib/storage/`
- `db.ts` — `TranscriptDB extends Dexie`, `db` instance (tables: `transcripts`, `sessions`, `summaries`).
- `settingsStore.ts` — `loadSettings`, `saveSettings` (localStorage key `yt-transcript-settings`). Load merges stored values over defaults per field *and* per provider, and rejects non-object JSON. **API keys are stripped on both read and write unless `settings.rememberApiKeys` is set**, so keys stay in memory by default and a key written by an older version is dropped rather than restored.
- `sessionStore.ts` — `saveTranscript`, `getTranscript`, `listTranscripts`, `deleteTranscript`, `getOrCreateSession`, `getSession`, `saveSession`, `listSessions`, `searchSessions`, `deleteSession`, `appendChatMessage`, `upsertSummary`, `setMindmapOutline`, `setKnowledgeTree`.

### `src/config/providers.ts`
- `DEFAULT_PROVIDERS` — DeepInfra, OpenCode Zen, Ollama (localhost), Custom (OpenAI-compatible).
- `DEFAULT_SETTINGS` — activeProviderId `deepinfra`, temperature 0.3, maxTokens 2048, `rememberApiKeys` false.

### `src/types/`
- `transcript.ts` — `Timestamp`, `Segment`, `Transcript`.
- `provider.ts` — `ProviderId`, `ProviderConfig`, `SettingsState`.
- `summary.ts` — `SummaryLength`, `Summary`, `ChatRole` (`user | assistant | system`), `ChatMessage`, `Session`.
- `index.ts` — barrel re-exports for transcript/provider/summary.

### `src/hooks/`
- `useSettings.ts` — settings state + persistence; `updateProvider`, `setActiveProvider`, `setTemperature`, `setMaxTokens`, `resetSettings`.
- `useTranscript.ts` — `ingestFile`, `loadTranscript`, `highlightSegment`, `clearTranscript`, `viewMode`/`setViewMode`, `highlightedSegment`.
- `useChat.ts` — transcript-grounded chat with streaming; `sendMessage`, `stopStreaming` (aborts the in-flight request), `clearChat`.
- `useSummary.ts` — `generate(length)`, `clearSummary`.
- `useMindmap.ts` — `generate()`, `outline`, `containerRef`.
- `useHistory.ts` — `sessions`, `query`, `setQuery`, `loading`, `refresh`, `removeSession`, `createSessionFor`; search is debounced 250 ms.
- `useTheme.ts` — dark/light toggle (localStorage `yt-transcript-theme`, respects prefers-color-scheme).

### `src/utils/`
- `cn.ts` — `cn(...classes)` class merge.
- `download.ts` — `downloadBlob`, `downloadText`.

### `src/components/` (overview)
- **common/** — `Button` (variants/sizes), `Modal`, `Spinner`, `Toast` (ToastContainer/ToastData), `Tabs`, `TimestampChip` (clickable timestamp), `MarkdownContent` (renders markdown + splits timestamps into clickable chips), `motion` (`FadeIn`, `SlideIn`, `ScaleIn`, `Stagger`, `StaggerItem` animation wrappers).
- **layout/** — `AppShell` (top bar + collapsible sidebars + History toggle), `Sidebar` (transcript viewer, raw/cleaned toggle, segment list).
- **settings/** — `SettingsModal`, `ProviderList`, `ProviderForm` (incl. "Reset to defaults").
- **upload/** — `DropZone` (drag-and-drop + file picker + paste, validates `.txt`).
- **summarize/** — `SummaryPanel`, `SummaryControls`, `ActionBar` (copy / export; summaries auto-save on generation).
- **chat/** — `ChatPanel`, `MessageList`, `MessageBubble`, `ChatInput`.
- **mindmap/** — `MindmapControls`; `v1/MindmapPanel` (SVG/PNG export) + `v1/MarkmapView` (Transformer + Markmap.create).
- **history/** — `HistoryPanel`, `SessionCard`, `SearchBar`.

The mindmap panel is loaded with `React.lazy` so the markmap chunk is only fetched when that tab is opened.

## Build & Test Commands
- `npm run dev` — start Vite dev server (port 5173).
- `npm run build` — `tsc -b && vite build` (code-split chunks: markmap, markdown, dexie).
- `npm run preview` — preview the production build.
- `npm test` — run the Vitest suite (11 files, 76 tests).
- `npm run test:watch` — watch mode.
