import type {
  Connector,
  KnowledgeLayout,
  KnowledgeNode,
  KnowledgeTree,
  LayoutNode,
} from '../../types/knowledgeMap';

/**
 * Radial knowledge-map layout engine.
 *
 * The hierarchy is semantic; this engine derives visual coordinates from it.
 * It allocates angular sectors proportional to each branch's content, places
 * nodes radially, resolves collisions, and routes curved connectors.
 *
 * The engine is deterministic and pure — it takes a tree and returns geometry.
 */

/** Canvas aspect ratio target (16:9). */
export const CANVAS_ASPECT = 16 / 9;

/** Branch color palette (major themes). */
export const BRANCH_COLORS = [
  '#6366f1', // indigo
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#3b82f6', // blue
  '#84cc16', // lime
  '#a855f7', // purple
];

/** Cross-cutting concept color (distinct from branch colors). */
export const CROSS_CUTTING_COLOR = '#e11d48';

/** Font metrics used to estimate node sizes. */
const FONT = '600 14px Inter, ui-sans-serif, system-ui, sans-serif';
const SMALL_FONT = '500 12px Inter, ui-sans-serif, system-ui, sans-serif';

/** Estimate text width using canvas measurement (cached). */
const measureCache = new Map<string, number>();
function measureText(text: string, font: string): number {
  const key = `${font}|${text}`;
  const cached = measureCache.get(key);
  if (cached !== undefined) return cached;
  let width = 0;
  if (typeof document !== 'undefined') {
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.font = font;
      width = ctx.measureText(text).width;
    }
  }
  // Fallback estimate if canvas is unavailable.
  if (width === 0) width = text.length * 7.5;
  measureCache.set(key, width);
  return width;
}

/** Node size by depth. */
const NODE_SIZES = [
  { minW: 150, maxW: 220, h: 64 }, // depth 0 central
  { minW: 120, maxW: 190, h: 52 }, // depth 1 major theme
  { minW: 100, maxW: 160, h: 44 }, // depth 2 subtheme
  { minW: 90, maxW: 140, h: 38 }, // depth 3+
];

function nodeSizeFor(depth: number, title: string, content?: string): { width: number; height: number } {
  const s = NODE_SIZES[Math.min(depth, NODE_SIZES.length - 1)];
  const titleW = measureText(title, FONT);
  let contentW = 0;
  if (content) contentW = measureText(content, SMALL_FONT);
  const textW = Math.max(titleW, contentW);
  const width = Math.min(s.maxW, Math.max(s.minW, textW + 24));
  let height = s.h;
  if (content) height += 18;
  return { width, height };
}

/** Compute the "weight" of a branch = how much angular space it needs. */
function branchWeight(node: KnowledgeNode): number {
  // Base weight from node size + descendants.
  const size = nodeSizeFor(0, node.title, node.content);
  let w = size.width * size.height;
  for (const c of node.children) {
    w += branchWeight(c);
  }
  return w;
}

interface PlacedNode {
  node: KnowledgeNode;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  sectorStart: number;
  sectorEnd: number;
  color: string;
  isCrossCutting: boolean;
}

interface LayoutContext {
  nodes: PlacedNode[];
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  maxRadius: number;
}

/** Compute the layout for a knowledge tree. */
export function computeLayout(tree: KnowledgeTree, width: number, height: number): KnowledgeLayout {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - 40;

  const ctx: LayoutContext = {
    nodes: [],
    width,
    height,
    centerX,
    centerY,
    maxRadius,
  };

  // Central node.
  const centralSize = nodeSizeFor(0, tree.title);
  const central: PlacedNode = {
    node: tree,
    depth: 0,
    x: centerX,
    y: centerY,
    width: centralSize.width,
    height: centralSize.height,
    sectorStart: 0,
    sectorEnd: Math.PI * 2,
    color: '#6366f1',
    isCrossCutting: false,
  };
  ctx.nodes.push(central);

  // Separate cross-cutting children from regular branches.
  const crossCutting = tree.children.filter((c) => isCrossCuttingType(c.type));
  const branches = tree.children.filter((c) => !isCrossCuttingType(c.type));

  // Allocate angular sectors proportional to branch weight.
  const totalWeight = branches.reduce((sum, b) => sum + branchWeight(b), 0) || 1;
  const gap = 0.06; // angular gap between sectors (radians)
  const usable = Math.PI * 2 - gap * branches.length;

  let angle = -Math.PI / 2; // start at top
  const sectorAssignments: { node: KnowledgeNode; start: number; end: number }[] = [];
  for (const b of branches) {
    const frac = branchWeight(b) / totalWeight;
    const span = usable * frac;
    sectorAssignments.push({ node: b, start: angle, end: angle + span });
    angle += span + gap;
  }

  // Place each branch recursively.
  for (const sa of sectorAssignments) {
    const color = BRANCH_COLORS[sectorAssignments.indexOf(sa) % BRANCH_COLORS.length];
    placeBranch(ctx, sa.node, 1, sa.start, sa.end, color);
  }

  // Place cross-cutting nodes in the remaining space (top area).
  placeCrossCutting(ctx, crossCutting, centerX, centerY);

  // Resolve collisions.
  resolveCollisions(ctx);

  // Build connectors.
  const connectors = buildConnectors(ctx);

  // Build LayoutNode list with visibility + bounds.
  const visibleSet = new Set<string>();
  const expandedSet = new Set<string>();
  collectVisible(tree, visibleSet, expandedSet);

  const nodes: LayoutNode[] = ctx.nodes.map((p) => {
    const visible = visibleSet.has(p.node.id);
    const hasVisibleChildren = p.node.children.some((c) => visibleSet.has(c.id));
    return {
      ...p.node,
      depth: p.depth,
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
      sectorStart: p.sectorStart,
      sectorEnd: p.sectorEnd,
      visible,
      hasVisibleChildren,
      color: p.color,
      isCrossCutting: p.isCrossCutting,
    };
  });

  // Compute bounds of visible nodes.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    if (!n.visible) continue;
    minX = Math.min(minX, n.x - n.width / 2);
    maxX = Math.max(maxX, n.x + n.width / 2);
    minY = Math.min(minY, n.y - n.height / 2);
    maxY = Math.max(maxY, n.y + n.height / 2);
  }
  if (!isFinite(minX)) {
    minX = centerX - 100; minY = centerY - 100; maxX = centerX + 100; maxY = centerY + 100;
  }

  return {
    nodes,
    connectors,
    width,
    height,
    bounds: { minX, minY, maxX, maxY },
  };
}

function isCrossCuttingType(type: string): boolean {
  return [
    'cross-cutting', 'conflict', 'key-questions', 'insight', 'takeaway',
    'framework', 'relationship',
  ].includes(type);
}

/** Recursively place a branch's nodes within its angular sector. */
function placeBranch(
  ctx: LayoutContext,
  node: KnowledgeNode,
  depth: number,
  sectorStart: number,
  sectorEnd: number,
  color: string,
): void {
  const size = nodeSizeFor(depth, node.title, node.content);
  const mid = (sectorStart + sectorEnd) / 2;

  // Radial distance grows with depth.
  const baseRadius = 90 + depth * 95;
  const x = ctx.centerX + Math.cos(mid) * baseRadius;
  const y = ctx.centerY + Math.sin(mid) * baseRadius;

  ctx.nodes.push({
    node,
    depth,
    x,
    y,
    width: size.width,
    height: size.height,
    sectorStart,
    sectorEnd,
    color,
    isCrossCutting: false,
  });

  // Place children within sub-sectors of this node's sector.
  const children = node.children;
  if (children.length === 0) return;

  const totalWeight = children.reduce((sum, c) => sum + branchWeight(c), 0) || 1;
  const gap = 0.04;
  const usable = (sectorEnd - sectorStart) - gap * children.length;
  let a = sectorStart;
  for (const c of children) {
    const frac = branchWeight(c) / totalWeight;
    const span = usable * frac;
    placeBranch(ctx, c, depth + 1, a, a + span, color);
    a += span + gap;
  }
}

/** Place cross-cutting nodes in the top region, distinct from branches. */
function placeCrossCutting(
  ctx: LayoutContext,
  nodes: KnowledgeNode[],
  centerX: number,
  centerY: number,
): void {
  const count = nodes.length;
  if (count === 0) return;
  const startAngle = -Math.PI / 2 - 0.5;
  const endAngle = -Math.PI / 2 + 0.5;
  const radius = 150;
  for (let i = 0; i < count; i++) {
    const node = nodes[i];
    const t = count === 1 ? 0.5 : i / (count - 1);
    const angle = startAngle + (endAngle - startAngle) * t;
    const size = nodeSizeFor(1, node.title, node.content);
    ctx.nodes.push({
      node,
      depth: 1,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      width: size.width,
      height: size.height,
      sectorStart: angle - 0.1,
      sectorEnd: angle + 0.1,
      color: CROSS_CUTTING_COLOR,
      isCrossCutting: true,
    });
    // Place cross-cutting children below the node.
    placeCrossCuttingChildren(ctx, node, 2, angle, colorForCrossCutting());
  }
}

function colorForCrossCutting(): string {
  return CROSS_CUTTING_COLOR;
}

function placeCrossCuttingChildren(
  ctx: LayoutContext,
  node: KnowledgeNode,
  depth: number,
  parentAngle: number,
  color: string,
): void {
  const children = node.children;
  if (children.length === 0) return;
  const radius = 90 + depth * 90;
  const spread = 0.5;
  for (let i = 0; i < children.length; i++) {
    const c = children[i];
    const t = children.length === 1 ? 0.5 : i / (children.length - 1);
    const angle = parentAngle - spread / 2 + spread * t;
    const size = nodeSizeFor(depth, c.title, c.content);
    const x = ctx.centerX + Math.cos(angle) * radius;
    const y = ctx.centerY + Math.sin(angle) * radius;
    ctx.nodes.push({
      node: c,
      depth,
      x,
      y,
      width: size.width,
      height: size.height,
      sectorStart: angle - 0.1,
      sectorEnd: angle + 0.1,
      color,
      isCrossCutting: true,
    });
    placeCrossCuttingChildren(ctx, c, depth + 1, angle, color);
  }
}

/** Detect and resolve node overlaps by pushing nodes outward. */
function resolveCollisions(ctx: LayoutContext): void {
  const nodes = ctx.nodes;
  // Iterate a few passes; each pass pushes overlapping nodes apart.
  for (let pass = 0; pass < 8; pass++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        if (a.depth === 0 || b.depth === 0) continue; // don't move central
        if (rectsOverlap(a, b)) {
          // Push the deeper node outward from center.
          const deeper = a.depth >= b.depth ? a : b;
          const dx = deeper.x - ctx.centerX;
          const dy = deeper.y - ctx.centerY;
          const dist = Math.hypot(dx, dy) || 1;
          const push = 8;
          deeper.x += (dx / dist) * push;
          deeper.y += (dy / dist) * push;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
}

function rectsOverlap(a: PlacedNode, b: PlacedNode): boolean {
  const ax1 = a.x - a.width / 2, ax2 = a.x + a.width / 2;
  const ay1 = a.y - a.height / 2, ay2 = a.y + a.height / 2;
  const bx1 = b.x - b.width / 2, bx2 = b.x + b.width / 2;
  const by1 = b.y - b.height / 2, by2 = b.y + b.height / 2;
  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}

/** Build curved connectors between parent and child nodes. */
function buildConnectors(ctx: LayoutContext): Connector[] {
  const byId = new Map<string, PlacedNode>();
  for (const n of ctx.nodes) byId.set(n.node.id, n);

  const connectors: Connector[] = [];
  for (const n of ctx.nodes) {
    if (n.depth === 0) continue;
    const parent = n.node.parentId ? byId.get(n.node.parentId) : undefined;
    if (!parent) continue;

    // Curved path from parent edge toward child.
    const dx = n.x - parent.x;
    const dy = n.y - parent.y;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;

    const startX = parent.x + ux * (parent.width / 2 + 4);
    const startY = parent.y + uy * (parent.height / 2 + 4);
    const endX = n.x - ux * (n.width / 2 + 4);
    const endY = n.y - uy * (n.height / 2 + 4);

    // Control points for a smooth quadratic-ish curve.
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const ctrlX = midX + ux * dist * 0.15;
    const ctrlY = midY + uy * dist * 0.15;

    const d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
    connectors.push({
      id: `${parent.node.id}->${n.node.id}`,
      fromId: parent.node.id,
      toId: n.node.id,
      d,
      color: n.color,
    });
  }
  return connectors;
}

/** Collect the set of visible node ids based on expansion state. */
function collectVisible(
  node: KnowledgeNode,
  visible: Set<string>,
  expanded: Set<string>,
): void {
  visible.add(node.id);
  if (!node.expanded) return;
  expanded.add(node.id);
  for (const c of node.children) {
    collectVisible(c, visible, expanded);
  }
}
