import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MindmapV2Panel } from '../src/components/mindmap/MindmapV2Panel';

// jsdom has no ResizeObserver; provide a minimal stub.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;

// jsdom's getBoundingClientRect returns all zeros, which would collapse the
// connector-line math to NaN. Stub it with deterministic rects keyed on the
// measured element so arrows compute to real coordinates.
function makeRect(x: number, y: number, w: number, h: number): DOMRect {
  return { x, y, width: w, height: h, top: y, left: x, right: x + w, bottom: y + h, toJSON: () => ({}) } as DOMRect;
}
function rectStub(this: Element): DOMRect {
  const el = this as HTMLElement;
  if (el.classList?.contains('mindmap-v2')) return makeRect(0, 0, 1200, 900);
  if (el.classList?.contains('mindmap-center')) return makeRect(500, 380, 220, 160);
  if (el.classList?.contains('mindmap-branch-slot')) {
    const left = parseFloat(el.style.left || '600');
    const top = parseFloat(el.style.top || '450');
    return makeRect(left - 120, top - 90, 240, 180);
  }
  if (el.classList?.contains('mindmap-child-slot')) {
    const left = parseFloat(el.style.left || '600');
    const top = parseFloat(el.style.top || '450');
    return makeRect(left - 85, top - 50, 170, 100);
  }
  return makeRect(0, 0, 0, 0);
}

// Outline with 12 top-level branches to prove the V2 view renders more than
// the old 8-slot compass.
const SAMPLE_OUTLINE = ['# Main Topic']
  .concat(Array.from({ length: 12 }, (_, i) => `## Branch ${i + 1}\n- Detail ${i + 1}a\n- Detail ${i + 1}b`))
  .join('\n');

describe('MindmapV2Panel', () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(rectStub);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all branches (more than the old 8-slot cap) as cards', () => {
    const { container } = render(
      <MindmapV2Panel transcript={null} outline={SAMPLE_OUTLINE} isGenerating={false} error={null} onGenerate={vi.fn()} />,
    );
    // 12 branch cards, each header labelled "Branch NN".
    expect(container.querySelectorAll('.mindmap-branch').length).toBe(12);
    expect(container.querySelectorAll('.mindmap-branch-head small').length).toBe(12);
  });

  it('renders animated connector arrows that target each branch box', () => {
    const { container } = render(
      <MindmapV2Panel transcript={null} outline={SAMPLE_OUTLINE} isGenerating={false} error={null} onGenerate={vi.fn()} />,
    );
    const svg = container.querySelector('svg.mindmap-lines');
    expect(svg).toBeTruthy();
    // One static curvy connector (with arrowhead) per branch.
    expect(container.querySelectorAll('.mindmap-link').length).toBe(12);
    // Arrowhead markers exist so the lines end exactly on the box edges.
    expect(container.querySelectorAll('marker[id^="mmv2-arrow-"]').length).toBe(12);
    // Every generated path should carry real coordinates (no NaN/Infinity).
    container.querySelectorAll('.mindmap-link').forEach((path) => {
      const d = path.getAttribute('d') ?? '';
      expect(d).toContain('M ');
      expect(d).not.toContain('NaN');
      expect(d).not.toContain('Infinity');
    });
  });

  it('shows details inside each branch card', () => {
    const { container } = render(
      <MindmapV2Panel transcript={null} outline={SAMPLE_OUTLINE} isGenerating={false} error={null} onGenerate={vi.fn()} />,
    );
    const branch = container.querySelector('.mindmap-branch') as HTMLElement;
    expect(branch).toBeTruthy();
    expect(branch.querySelectorAll('.mindmap-details p').length).toBeGreaterThan(0);
  });

  it('renders child nodes as their own boxes with their own arrows', () => {
    const outlineWithChildren = ['# Main Topic']
      .concat(
        Array.from({ length: 3 }, (_, i) =>
          `## Branch ${i + 1}\n- Detail ${i + 1}a\n### Child ${i + 1}.1\n- Child detail ${i + 1}.1.1\n### Child ${i + 1}.2\n- Child detail ${i + 1}.2.1`,
        ),
      )
      .join('\n');
    const { container } = render(
      <MindmapV2Panel transcript={null} outline={outlineWithChildren} isGenerating={false} error={null} onGenerate={vi.fn()} />,
    );
    // 3 branch cards + 6 child cards (2 per branch).
    expect(container.querySelectorAll('.mindmap-branch').length).toBe(3);
    expect(container.querySelectorAll('.mindmap-child-card').length).toBe(6);
    // 3 branch connectors + 6 child connectors, all with real coordinates.
    expect(container.querySelectorAll('.mindmap-link').length).toBe(9);
    expect(container.querySelectorAll('.mindmap-link-child').length).toBe(6);
    container.querySelectorAll('.mindmap-link').forEach((path) => {
      const d = path.getAttribute('d') ?? '';
      expect(d).toContain('M ');
      expect(d).not.toContain('NaN');
      expect(d).not.toContain('Infinity');
    });
  });

  it('collapses a branch when its header is clicked', () => {
    const { container } = render(
      <MindmapV2Panel transcript={null} outline={SAMPLE_OUTLINE} isGenerating={false} error={null} onGenerate={vi.fn()} />,
    );
    const firstHead = container.querySelector('.mindmap-branch-head') as HTMLButtonElement;
    expect(firstHead).toBeTruthy();
    expect(firstHead.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(firstHead);
    expect(firstHead.getAttribute('aria-expanded')).toBe('false');
    // The details section for that card is removed when collapsed.
    const firstBranch = firstHead.closest('.mindmap-branch') as HTMLElement;
    expect(firstBranch.querySelector('.mindmap-details')).toBeNull();
  });

  it('shows the empty state when no outline is present', () => {
    render(
      <MindmapV2Panel transcript={null} outline="" isGenerating={false} error={null} onGenerate={vi.fn()} />,
    );
    expect(screen.getByText(/Generate a radial mindmap/i)).toBeTruthy();
  });
});
