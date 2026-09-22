import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MarkmapView } from '../src/components/mindmap/v1/MarkmapView';

// jsdom has no ResizeObserver; provide a minimal stub.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;

// jsdom has no SVG getBBox; markmap relies on it for layout.
const getBBox = () => ({ x: 0, y: 0, width: 100, height: 20 });
(globalThis as any).SVGElement.prototype.getBBox = getBBox;

const SAMPLE_OUTLINE = `# Main Topic
## Category A
- Point 1
- Point 2
## Category B
- Point 3
- Point 4`;

/**
 * Let jsdom run queued animation frames, which is where markmap's d3 transitions
 * and zoom gestures tick. Without this the frames fire after the test has
 * finished and anything they throw is reported as an unhandled error — the run
 * fails while every test still says it passed. Draining them inside the test
 * turns that into a normal failure with a stack trace.
 */
async function flushFrames(count = 12) {
  for (let i = 0; i < count; i++) {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  }
}

describe('MarkmapView', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an SVG mindmap with nodes and links', async () => {
    const { container } = render(<MarkmapView markdown={SAMPLE_OUTLINE} />);

    // Markmap renders asynchronously; wait for the SVG to appear.
    await waitFor(() => {
      expect(container.querySelector('svg')).toBeTruthy();
    });

    await flushFrames();

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(container.querySelectorAll('.markmap-node').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.markmap-link').length).toBeGreaterThan(0);
  });

  it('renders zoom control buttons once ready', async () => {
    const { container } = render(<MarkmapView markdown={SAMPLE_OUTLINE} />);

    await waitFor(() => {
      expect(container.querySelector('svg')).toBeTruthy();
    });

    // Zoom controls appear after the markmap is ready.
    await waitFor(() => {
      expect(container.querySelectorAll('button').length).toBeGreaterThanOrEqual(3);
    });

    await flushFrames();
  });
});
