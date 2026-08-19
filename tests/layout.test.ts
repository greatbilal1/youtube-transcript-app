import { describe, expect, it } from 'vitest';
import { computeLayout, CROSS_CUTTING_COLOR } from '../src/lib/mindmap/layout';
import type { KnowledgeTree } from '../src/types/knowledgeMap';

function makeTree(): KnowledgeTree {
  return {
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
          {
            id: 'unsupervised',
            parentId: 'ml',
            title: 'Unsupervised Learning',
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
        children: [
          {
            id: 'nn',
            parentId: 'dl',
            title: 'Neural Networks',
            type: 'concept',
            expanded: true,
            children: [],
          },
        ],
      },
      {
        id: 'apps',
        parentId: 'root',
        title: 'Applications',
        type: 'theme',
        expanded: true,
        children: [],
      },
    ],
  };
}

describe('computeLayout', () => {
  it('places the central node at the canvas center', () => {
    const layout = computeLayout(makeTree(), 1280, 720);
    const central = layout.nodes.find((n) => n.depth === 0);
    expect(central).toBeTruthy();
    expect(central!.x).toBeCloseTo(640, 0);
    expect(central!.y).toBeCloseTo(360, 0);
  });

  it('produces a node for every node in the tree', () => {
    const layout = computeLayout(makeTree(), 1280, 720);
    // root + 3 themes + 3 concepts = 7
    expect(layout.nodes.length).toBe(7);
  });

  it('assigns each node a branch color', () => {
    const layout = computeLayout(makeTree(), 1280, 720);
    for (const n of layout.nodes) {
      expect(n.color).toBeTruthy();
    }
  });

  it('keeps all nodes within the canvas bounds', () => {
    const layout = computeLayout(makeTree(), 1280, 720);
    for (const n of layout.nodes) {
      expect(n.x - n.width / 2).toBeGreaterThanOrEqual(0);
      expect(n.x + n.width / 2).toBeLessThanOrEqual(1280);
      expect(n.y - n.height / 2).toBeGreaterThanOrEqual(0);
      expect(n.y + n.height / 2).toBeLessThanOrEqual(720);
    }
  });

  it('builds connectors for visible parent-child pairs', () => {
    const layout = computeLayout(makeTree(), 1280, 720);
    expect(layout.connectors.length).toBeGreaterThan(0);
    // Every connector references existing node ids.
    const ids = new Set(layout.nodes.map((n) => n.id));
    for (const c of layout.connectors) {
      expect(ids.has(c.fromId)).toBe(true);
      expect(ids.has(c.toId)).toBe(true);
    }
  });

  it('marks cross-cutting nodes with the cross-cutting color', () => {
    const tree = makeTree();
    tree.children.push({
      id: 'insight',
      parentId: 'root',
      title: 'Key Insight',
      type: 'insight',
      expanded: true,
      children: [],
    });
    const layout = computeLayout(tree, 1280, 720);
    const insight = layout.nodes.find((n) => n.id === 'insight');
    expect(insight).toBeTruthy();
    expect(insight!.isCrossCutting).toBe(true);
    expect(insight!.color).toBe(CROSS_CUTTING_COLOR);
  });

  it('exposes a 16:9 canvas aspect', () => {
    // The layout is computed against a 16:9 canvas; verify the ratio is used.
    const layout = computeLayout(makeTree(), 1280, 720);
    expect(layout.width / layout.height).toBeCloseTo(16 / 9, 5);
  });
});
