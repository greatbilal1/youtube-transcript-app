# YouTube Summarizer, Mindmap & LLM Chat

A modern, single-page **React + Vite + TypeScript** web app that runs entirely in the browser to summarize and chat with YouTube transcripts (`.txt` files).

## Features

- **Provider & Settings** — configure DeepInfra, OpenCode Zen, Ollama (localhost), or any custom OpenAI-compatible endpoint. Pick an active default. Settings persist in localStorage.
- **Transcript Ingestion** — drag-and-drop or file picker for `.txt` files. Smart cleaner strips auto-caption artifacts while preserving usable timestamps.
- **Summarize & Chat** — Concise / Normal / Detailed summaries, plus a transcript-grounded chat whose answers come from the transcript and flag anything the model adds from its own knowledge. Copy and export as `.md`; summaries auto-save on generation.
- **Clickable Timestamps** — timestamps in summaries/chat highlight the matching segment in the transcript sidebar.
- **Interactive Mindmap** — generate a hierarchical Markdown outline and render it as an interactive Markmap with zoom, pan, and SVG/PNG export.
- **History** — sessions auto-save to IndexedDB (Dexie). Browse, search, and restore past sessions.
- **Bring your own key** — no backend. Your API key is kept in memory and sent only to the provider you configure; it is written to disk only if you tick "Remember API keys on this device" in Settings.

## Getting Started

```bash
npm install
npm run dev
```

Vite prints the local URL when it starts — `http://localhost:5173` by default, or
the next free port if 5173 is already taken. Open whatever it prints.

## Tests

```bash
npm test
```

11 suites / 76 tests (Vitest + jsdom): cleaner, timestamps, language, prompts, outline dedupe, settings store, LLM stream parsers, and component smoke tests.

## Provider Setup

Open **Settings** (gear icon) and configure at least one provider for example:

| Provider | Base URL | Notes |
|----------|----------|-------|
| DeepInfra | `https://api.deepinfra.com/v1/openai` | Requires API key |
| OpenCode Zen | `https://opencodezen.ai/api/v1` | Requires API key |
| Ollama | `http://localhost:11434` | No API key; must be running locally |
| Custom | your endpoint | Any OpenAI-compatible `/chat/completions` |

### CORS note

Because calls go directly from the browser, the provider must allow CORS. For local **Ollama**, allow the dev server's origin specifically — substitute the port Vite printed if it isn't 5173:

```bash
OLLAMA_ORIGINS=http://localhost:5173 ollama serve
```

Avoid `OLLAMA_ORIGINS=*`, which lets any page you visit in that browser reach your local Ollama instance.

## Tech Stack

- React 18 + Vite + TypeScript (strict)
- Tailwind CSS + Lucide icons
- Dexie.js (IndexedDB) for history, localStorage for settings
- Markmap (interactive mindmap)
- React Markdown + remark-gfm
- Radix UI, framer-motion, sonner

## Project Structure

See [PROJECT_MAP.md](PROJECT_MAP.md) for the full architecture and [CONVENTIONS.md](CONVENTIONS.md) for coding standards.

## Privacy

There is no server component. Transcripts, summaries, and chats are stored in your browser's IndexedDB; your preferences are stored in localStorage. Transcript text is sent to whichever provider you configure — and to no one else.

**API keys are not saved by default.** The key you type lives in memory for the current page and is gone when you reload, so nothing is written to disk. If you'd rather not re-enter it each time, tick **"Remember API keys on this device"** in Settings — that stores it unencrypted in this browser's localStorage, where any script running on this page can read it. Either way the key is only ever sent to the provider you configured, as a `Bearer` token.


## Transcript loader
upload, drop, or paste it. 

<img width="1492" height="790" alt="image" src="https://github.com/user-attachments/assets/3008477f-1c49-478d-a3dd-3cdad1ff8ca0" />


## Summary + Chat with the content

<img width="1871" height="936" alt="image" src="https://github.com/user-attachments/assets/32b0f070-bd4d-4569-8f17-6758ac2e519f" />


## Mindmap Screenshot

<img width="1083" height="878" alt="image" src="https://github.com/user-attachments/assets/131a76bf-7df6-45b0-8f01-670f1b087a63" />


