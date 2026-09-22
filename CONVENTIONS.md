# CONVENTIONS.md — YouTube Transcript App

Project-wide standards for contributors and automated agents.

## Structure
- **`src/types/`** — all shared TypeScript interfaces. Barrel re-export via `index.ts`.
- **`src/lib/`** — pure logic (LLM clients, cleaner, storage, timestamps, export).
- **`src/hooks/`** — React state hooks. Each hook owns one concern.
- **`src/components/`** — UI components grouped by feature (`settings/`, `chat/`, etc.).
- **`src/utils/`** — tiny generic helpers (`cn`, `download`).
- **`tests/`** — Vitest tests mirroring `src/lib` modules.

## Style
- TypeScript strict mode. No `any`. If a type genuinely must be loose, model it with a named interface (e.g. `ChatOptions`, `SettingsState`) rather than casting — `as never` silences the checker without documenting the shape.
- Functional components with hooks. No class components.
- Named exports only (no default exports except `App`).
- Use `cn()` for conditional class names.
- Tailwind utility classes; dark mode via `dark:` variants and the `dark` class on `<html>`.

## Error Handling
- All async LLM calls are wrapped in try/catch and surface a user-facing error string.
- Storage operations use Dexie; assume they may fail and handle gracefully.
- Never throw uncaught errors from event handlers.

## Testing
- Vitest + jsdom. Tests live in `tests/`. Shared stubs (canvas 2d context, in-memory `localStorage`) live in `tests/setup.ts`.
- Pure functions (cleaner, timestamps, prompts, parsers, layout) must have unit tests.
- Anything that parses untrusted input — model JSON, streamed SSE/NDJSON — must have tests for malformed and partial chunks.
- Run `npm test` and `npx tsc -b --force` before considering a change complete.

## Naming
- Files: `camelCase.ts` for libs/hooks, `PascalCase.tsx` for components.
- Hooks prefixed `use`.
- Types: `PascalCase`; interfaces without `I` prefix.

## Provider Abstraction
- All LLM access goes through `createLLMClient(provider)`.
- Never call `fetch` to a provider directly outside `src/lib/llm/`.
- Long-running requests take an `AbortSignal` via `ChatOptions.signal` so the UI can cancel them.
- API keys are held in `SettingsState` and stay in memory unless `settings.rememberApiKeys` is set. `saveSettings` strips them otherwise, so never persist a key outside that path. Never hardcode a key, and never log one.

## Untrusted Input
- Model output is untrusted: validate and cap it (see `dedupeOutline.ts`) before it reaches a renderer.
- Markdown is rendered without `rehype-raw`; keep it that way so raw HTML in model output stays escaped.
