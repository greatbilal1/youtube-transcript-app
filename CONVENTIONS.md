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
- TypeScript strict mode. No `any` unless unavoidable (mark with `as never` where a structural type is intentionally loose).
- Functional components with hooks. No class components.
- Named exports only (no default exports except `App`).
- Use `cn()` for conditional class names.
- Tailwind utility classes; dark mode via `dark:` variants and the `dark` class on `<html>`.

## Error Handling
- All async LLM calls are wrapped in try/catch and surface a user-facing error string.
- Storage operations use Dexie; assume they may fail and handle gracefully.
- Never throw uncaught errors from event handlers.

## Testing
- Vitest + jsdom. Tests live in `tests/`.
- Pure functions (cleaner, timestamps, prompts) must have unit tests.
- Run `npm test` before considering a change complete.

## Naming
- Files: `camelCase.ts` for libs/hooks, `PascalCase.tsx` for components.
- Hooks prefixed `use`.
- Types: `PascalCase`; interfaces without `I` prefix.

## Provider Abstraction
- All LLM access goes through `createLLMClient(provider)`.
- Never call `fetch` to a provider directly outside `src/lib/llm/`.
