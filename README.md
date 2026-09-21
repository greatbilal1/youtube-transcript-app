# YouTube Summarizer, mindmap & LLm Chat

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

Open http://localhost:XXX.

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


## Transcript loader
upload, drop, or paste it. 

<img width="1492" height="790" alt="image" src="https://github.com/user-attachments/assets/3008477f-1c49-478d-a3dd-3cdad1ff8ca0" />


## Summary + Chat with the content

<img width="1871" height="936" alt="image" src="https://github.com/user-attachments/assets/32b0f070-bd4d-4569-8f17-6758ac2e519f" />


## Mindmap Screenshot

<img width="1083" height="878" alt="image" src="https://github.com/user-attachments/assets/131a76bf-7df6-45b0-8f01-670f1b087a63" />


