import '@testing-library/jest-dom';

/**
 * jsdom ships no canvas backend, so `HTMLCanvasElement.getContext('2d')` logs a
 * "Not implemented" error and returns null. The layout engine measures text
 * with a 2d context, which meant every uncached measurement polluted the test
 * output. Stub it with a minimal context so the layout tests exercise the real
 * measurement path rather than the fallback estimate.
 */
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  writable: true,
  value(this: HTMLCanvasElement, contextId: string) {
    if (contextId !== '2d') return null;
    return {
      font: '',
      measureText: (text: string) => ({ width: text.length * 7.5 }),
    } as unknown as CanvasRenderingContext2D;
  },
});

/**
 * jsdom implements no ResizeObserver, which Radix primitives (the temperature
 * slider) call on mount. A no-op observer is enough for rendering — nothing has
 * a measurable size in jsdom anyway.
 */
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

/**
 * Node 22 defines a `localStorage` global that stays inert unless the process is
 * started with `--localstorage-file`, and that inert global shadows the working
 * one jsdom installs on `window`. Install the same minimal in-memory store on
 * both so settings code exercises its real read/write paths instead of always
 * hitting the "storage unavailable" fallback.
 */
const store = new Map<string, string>();
const memoryStorage = {
  get length() {
    return store.size;
  },
  clear: () => store.clear(),
  getItem: (key: string) => store.get(key) ?? null,
  key: (index: number) => [...store.keys()][index] ?? null,
  removeItem: (key: string) => store.delete(key),
  setItem: (key: string, value: string) => void store.set(key, String(value)),
} as unknown as Storage;

for (const target of [globalThis, window]) {
  Object.defineProperty(target, 'localStorage', {
    configurable: true,
    writable: true,
    value: memoryStorage,
  });
}
