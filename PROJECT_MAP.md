# PROJECT_MAP.md

## Project Overview
A modern, single-page **React + Vite + TypeScript** web application that runs locally in the browser to **summarize and chat with YouTube transcript (.txt) files**. It ingests transcripts via drag-and-drop/file picker, smart-cleans auto-caption artifacts while preserving timestamps, and provides three tabs: **Summarize & Chat**, **Interactive Mindmap**, and **History & Saved Summaries**. All data persists locally via Dexie (IndexedDB) and localStorage.

## Tech Stack
- **React 18.3** + **Vite 5.4** + **TypeScript 5.6** (strict mode)
- **Tailwind CSS 3.4** (`darkMode: 'class'`, custom `brand` palette, Inter font)
- **Dexie.js 4.0.8** — IndexedDB wrapper for persistence
- **Markmap** (markmap-lib/view/common 0.18.8) — interactive mindmap rendering
- **React Markdown 9** + **remark-gfm** — renders summaries/chat responses
- **lucide-react 0.454** — icons
- **uuid 10** — ID generation
- **Vitest 2.1** + **jsdom** + **@testing-library** — testing

## Directory Structure
```
youtube-transcript-app/
├── index.html
├── package.json
├── vite.config.ts          # vitest/config defineConfig, manualChunks, test config
├── tsconfig.json / tsconfig.node.json
├── tailwind.config.js / postcss.config.js
├── src/
│   ├── main.tsx / App.tsx / index.css
│   ├── types/              # transcript, provider, summary, index (barrel)
│   ├── config/             # providers.ts (defaults)
│   ├── lib/
│   │   ├── timestamps.ts
│   │   ├── cleaner/transcriptCleaner.ts
│   │   ├── llm/            # client, openaiCompatible, ollama, factory, prompts
│   │   └── storage/        # db, settingsStore, sessionStore
│   ├── hooks/              # useSettings, useTranscript, useChat, useSummary,
│   │                       #   useMindmap, useHistory, useTheme
│   ├── utils/              # cn, download
│   └── components/
│       ├── common/         # Button, Modal, Spinner, Toast, Tabs, TimestampChip, MarkdownContent
│       ├── layout/         # AppShell, Sidebar
│       ├── settings/       # SettingsModal, ProviderList, ProviderForm
│       ├── upload/         # DropZone
│       ├── summarize/      # SummaryPanel, SummaryControls, ActionBar
│       ├── chat/           # ChatPanel, MessageList, MessageBubble, ChatInput
│       ├── mindmap/        # MindmapPanel, MarkmapView, MindmapControls
│       └── history/        # HistoryPanel, SessionCard, SearchBar
└── tests/                  # cleaner, timestamps, language, prompts, dedupeOutline, markmap, setup
```

## Utility Helpers & Key Exports

### `src/lib/timestamps.ts`
- `parseTimestamp(raw: string): number | null` — parse MM:SS / HH:MM:SS / fractional to seconds.
- `formatTimestamp(seconds: number): string` — format seconds to MM:SS or HH:MM:SS.
- `extractLeadingTimestamp(line: string): { start: number | null; rest: string }` — pull leading timestamp off a line (reconstructs token from capture groups).
- `findTimestamps(text: string): Timestamp[]` — find all timestamps in text.

### `src/lib/cleaner/transcriptCleaner.ts`
- `cleanTranscript(raw: string): CleanResult` — returns `{ cleanedText, segments, hasTimestamps }`. Strips boilerplate (`[Music]`, `>>`), dedupes repeated tokens (`the the the`→`the`), drops consecutive duplicate lines, extracts leading timestamps, merges timestamp-less segments into the previous timestamped segment.

### `src/lib/llm/`
- `client.ts` — `ChatOptions`, `LLMClient` interface (`chat`, `chatStream`), `toWireMessage`.
- `openaiCompatible.ts` — `OpenAICompatibleClient` (POST `/chat/completions`, Bearer auth, SSE streaming).
- `ollama.ts` — `OllamaClient` (POST `/api/chat`, no auth, NDJSON streaming).
- `factory.ts` — `createLLMClient(provider)` (ollama→OllamaClient, else OpenAICompatibleClient).
- `prompts.ts` — `SUMMARY_WORD_TARGETS` (concise 150 / normal 400 / detailed 800), `buildSummaryPrompt`, `buildChatSystemPrompt` (strict-context rules), `buildMindmapPrompt`.

### `src/lib/storage/`
- `db.ts` — `TranscriptDB extends Dexie`, `db` instance (tables: `transcripts`, `sessions`, `summaries`).
- `settingsStore.ts` — `loadSettings`, `saveSettings` (localStorage key `yt-transcript-settings`).
- `sessionStore.ts` — `saveTranscript`, `getTranscript`, `listTranscripts`, `deleteTranscript`, `getOrCreateSession`, `saveSession`, `listSessions`, `searchSessions`, `deleteSession`, `appendChatMessage`, `upsertSummary`, `setMindmapOutline`.

### `src/config/providers.ts`
- `DEFAULT_PROVIDERS` — DeepInfra, OpenCode Zen, Ollama (localhost), Custom (OpenAI-compatible).
- `DEFAULT_SETTINGS` — activeProviderId `deepinfra`, temperature 0.3, maxTokens 2048.

### `src/types/`
- `transcript.ts` — `Timestamp`, `Segment`, `Transcript`.
- `provider.ts` — `ProviderId`, `ProviderConfig`, `SettingsState`.
- `summary.ts` — `SummaryLength`, `Summary`, `ChatRole`, `ChatMessage`, `Session`.
- `index.ts` — barrel re-exports.

### `src/hooks/`
- `useSettings.ts` — settings state + persistence; `updateProvider`, `setActiveProvider`, `setTemperature`, `setMaxTokens`, `resetSettings`.
- `useTranscript.ts` — `ingestFile`, `loadTranscript`, `highlightSegment`, `clearTranscript`, `viewMode`/`setViewMode`, `highlightedSegment`.
- `useChat.ts` — strict-context chat with streaming; `sendMessage`, `stopStreaming`, `clearChat`.
- `useSummary.ts` — `generate(length)`, `clearSummary`.
- `useMindmap.ts` — `generate()`, `outline`, `containerRef`.
- `useHistory.ts` — `sessions`, `query`, `setQuery`, `loading`, `refresh`, `removeSession`, `createSessionFor`.
- `useTheme.ts` — dark/light toggle (localStorage `yt-transcript-theme`, respects prefers-color-scheme).

### `src/utils/`
- `cn.ts` — `cn(...classes)` class merge.
- `download.ts` — `downloadBlob`, `downloadText`.

### `src/components/` (overview)
- **common/** — `Button` (variants/sizes), `Modal`, `Spinner`, `Toast` (ToastContainer/ToastData), `Tabs`, `TimestampChip` (clickable timestamp), `MarkdownContent` (renders markdown + splits timestamps into clickable chips).
- **layout/** — `AppShell` (top bar + collapsible sidebars), `Sidebar` (transcript viewer, raw/cleaned toggle, segment list).
- **settings/** — `SettingsModal`, `ProviderList`, `ProviderForm`.
- **upload/** — `DropZone` (drag-and-drop + file picker, validates `.txt`).
- **summarize/** — `SummaryPanel`, `SummaryControls`, `ActionBar`.
- **chat/** — `ChatPanel`, `MessageList`, `MessageBubble`, `ChatInput`.
- **mindmap/** — `MindmapPanel` (SVG/PNG export), `MarkmapView` (Transformer + Markmap.create), `MindmapControls`.
- **history/** — `HistoryPanel`, `SessionCard`, `SearchBar`.

## Build & Test Commands
- `npm run dev` — start Vite dev server (port 5173).
- `npm run build` — `tsc -b && vite build` (code-split chunks: markmap, markdown, dexie).
- `npm run preview` — preview the production build.
- `npm test` — run Vitest suite (40 tests).
- `npm run test:watch` — watch mode.
