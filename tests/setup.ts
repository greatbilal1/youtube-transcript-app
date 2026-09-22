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
 * jsdom implements neither `SVGElement.transform` nor `SVGSVGElement.viewBox`,
 * and d3 reads both through markmap: `d3-interpolate` consolidates a transform
 * when it builds a transition tween, and `d3-zoom` derives its default extent
 * from the viewBox. Those reads happen inside a requestAnimationFrame callback,
 * so the throw lands *after* the test that triggered it has finished, and vitest
 * reports it as an unhandled error — failing the run even though every test
 * passed. (It reproduces reliably in CI and only intermittently locally, which
 * is what makes it worth pinning down here rather than in one test file.)
 *
 * `consolidate()` returning null is d3's own "no transform" signal, so the stub
 * reports the identity instead of inventing geometry.
 */
Object.defineProperty(SVGElement.prototype, 'transform', {
  configurable: true,
  get() {
    return { baseVal: { consolidate: () => null } };
  },
});

Object.defineProperty(SVGSVGElement.prototype, 'viewBox', {
  configurable: true,
  get(this: SVGSVGElement) {
    const [x, y, width, height] = (this.getAttribute('viewBox') ?? '')
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    return {
      baseVal: { x: x || 0, y: y || 0, width: width || 0, height: height || 0 },
    };
  },
});

/**
 * The other half of `defaultExtent`: with no viewBox on the element it falls
 * back to `svg.width.baseVal.value` / `svg.height.baseVal.value`, and jsdom
 * implements neither `width` nor `height` on `SVGSVGElement` as the
 * `SVGAnimatedLength` d3 expects. Markmap wires d3-zoom onto its SVG, so this
 * branch runs on the first gesture.
 */
for (const prop of ['width', 'height']) {
  Object.defineProperty(SVGSVGElement.prototype, prop, {
    configurable: true,
    get(this: SVGSVGElement) {
      return { baseVal: { value: Number(this.getAttribute(prop)) || 0 } };
    },
  });
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
