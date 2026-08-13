# YouTube Transcript Summarizer & Chat

A modern, single-page **React + Vite + TypeScript** web app that runs entirely in the browser to summarize and chat with YouTube transcripts (`.txt` files).

## Features

- **Provider & Settings** — configure DeepInfra, OpenCode Zen, Ollama (localhost), or any custom OpenAI-compatible endpoint. Pick an active default. Settings persist in localStorage.
- **Transcript Ingestion** — drag-and-drop or file picker for `.txt` files. Smart cleaner strips auto-caption artifacts while preserving usable timestamps.
- **Summarize & Chat** — Concise / Normal / Detailed summaries, plus a strict-context chat that only answers from the transcript. Copy, save to history, and export as `.md`.
- **Clickable Timestamps** — timestamps in summaries/chat highlight the matching segment in the transcript sidebar.
- **Interactive Mindmap** — generate a hierarchical Markdown outline and render it as an interactive Markmap with zoom, pan, and SVG/PNG export.
- **History** — sessions auto-save to IndexedDB (Dexie). Browse, search, and restore past sessions.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Tests

```bash
npm test
```

## Provider Setup

Open **Settings** (gear icon) and configure at least one provider:

| Provider | Base URL | Notes |
|----------|----------|-------|
| DeepInfra | `https://api.deepinfra.com/v1/openai` | Requires API key |
| OpenCode Zen | `https://opencodezen.ai/api/v1` | Requires API key |
| Ollama | `http://localhost:11434` | No API key; must be running locally |
| Custom | your endpoint | Any OpenAI-compatible `/chat/completions` |

### CORS note

Because calls go directly from the browser, the provider must allow CORS. For local **Ollama**, set:

```bash
OLLAMA_ORIGINS=* ollama serve
```

## Tech Stack

- React 18 + Vite + TypeScript
- Tailwind CSS + Lucide icons
- Dexie.js (IndexedDB)
- Markmap (interactive mindmaps)
- React Markdown + remark-gfm

## Project Structure

See `TECH_SPEC.md` for the full architecture and `CONVENTIONS.md` for coding standards.
