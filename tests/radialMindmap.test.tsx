import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { RadialMindmap } from '../src/components/mindmap/v2/RadialMindmap';
import type { KnowledgeTree } from '../src/types/knowledgeMap';

// jsdom has no canvas getContext; the layout engine falls back to a
// character-count heuristic, so this is safe to stub.
(globalThis as any).HTMLCanvasElement.prototype.getContext = () => null;

const SAMPLE_TREE: KnowledgeTree = {
  id: 'root',
  parentId: null,
  title: 'Artificial Intelligence',
  type: 'central-theme',
  expanded: true,
  children: [
    {
      id: 'ml',
      parentId: 'root',
      title: 'Machine Learning',
      type: 'theme',
      expanded: true,
      children: [
        {
          id: 'supervised',
          parentId: 'ml',
          title: 'Supervised Learning',
          type: 'concept',
          expanded: true,
          children: [],
        },
      ],
    },
    {
      id: 'dl',
      parentId: 'root',
      title: 'Deep Learning',
      type: 'theme',
      expanded: true,
      children: [],
    },
  ],
};

describe('RadialMindmap', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an SVG with the radial mindmap marker', () => {
    const { container } = render(
      <RadialMindmap tree={SAMPLE_TREE} width={1280} height={720} isDark={false} />,
    );
    expect(container.querySelector('svg[data-radial-mindmap]')).toBeTruthy();
  });

  it('renders a node for the central theme and each child', () => {
    const { container } = render(
      <RadialMindmap tree={SAMPLE_TREE} width={1280} height={720} isDark={false} />,
    );
    // Central + 2 themes + 1 concept = 4 node groups.
    const nodeGroups = container.querySelectorAll('[data-node-id]');
    expect(nodeGroups.length).toBe(4);
  });

  it('renders connector paths', () => {
    const { container } = render(
      <RadialMindmap tree={SAMPLE_TREE} width={1280} height={720} isDark={false} />,
    );
    const connectors = container.querySelectorAll('[data-connector]');
    expect(connectors.length).toBeGreaterThan(0);
  });
});
