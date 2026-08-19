import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  KnowledgeLayout,
  KnowledgeNode,
  KnowledgeTree,
  LayoutNode,
} from '../../types/knowledgeMap';
import { computeLayout } from '../../lib/mindmap/layout';
import { getTypeVisual } from '../../lib/mindmap/icons';

interface RadialMindmapProps {
  tree: KnowledgeTree;
  /** Canvas width/height in px (16:9). */
  width: number;
  height: number;
  isDark: boolean;
  onTreeChange?: (tree: KnowledgeTree) => void;
}

interface ViewTransform {
  x: number;
  y: number;
  k: number;
}

const DEFAULT_TRANSFORM: ViewTransform = { x: 0, y: 0, k: 1 };

/**
 * A production-quality radial knowledge map renderer.
 *
 * Renders the semantic tree as a radial infographic: central circular theme,
 * major themes as rounded rectangles arranged radially, subthemes and
 * supporting cards branching outward, with curved connectors and branch
 * colors. Supports selection, expand/collapse, pan/zoom, and fit-to-screen.
 */
export function RadialMindmap({ tree, width, height, isDark, onTreeChange }: RadialMindmapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transform, setTransform] = useState<ViewTransform>(DEFAULT_TRANSFORM);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);

  // Compute layout from the semantic tree (pure function).
  const layout = useMemo<KnowledgeLayout>(() => computeLayout(tree, width, height), [tree, width, height]);

  const nodeById = useMemo(() => {
    const m = new Map<string, LayoutNode>();
    for (const n of layout.nodes) m.set(n.id, n);
    return m;
  }, [layout]);

  // Fit to screen on first render / when tree changes.
  useEffect(() => {
    fitToScreen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, width, height]);

  const fitToScreen = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { bounds } = layout;
    const bw = bounds.maxX - bounds.minX;
    const bh = bounds.maxY - bounds.minY;
    if (!bw || !bh) return;
    const pad = 40;
    const k = Math.min((width - pad * 2) / bw, (height - pad * 2) / bh, 1.5);
    const x = (width - bw * k) / 2 - bounds.minX * k;
    const y = (height - bh * k) / 2 - bounds.minY * k;
    setTransform({ x, y, k });
  }, [layout, width, height]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setTransform((t) => {
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const k = Math.min(3, Math.max(0.2, t.k * factor));
      // Zoom toward cursor.
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { ...t, k };
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const nx = mx - (mx - t.x) * (k / t.k);
      const ny = my - (my - t.y) * (k / t.k);
      return { x: nx, y: ny, k };
    });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only start pan on background drag (not on a node).
    if ((e.target as Element).closest('[data-node-id]')) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: transform.x,
      origY: transform.y,
      moved: false,
    };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }, [transform]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    setTransform((t) => ({ ...t, x: d.origX + dx, y: d.origY + dy }));
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleNodeClick = useCallback(
    (node: LayoutNode) => {
      setSelectedId(node.id);
      // Toggle expansion on click if it has children.
      if (node.children.length > 0) {
        const updated = toggleNode(tree, node.id);
        onTreeChange?.(updated);
      }
    },
    [tree, onTreeChange],
  );

  const handleExpandCollapse = useCallback(
    (e: React.MouseEvent, node: LayoutNode) => {
      e.stopPropagation();
      const updated = toggleNode(tree, node.id);
      onTreeChange?.(updated);
    },
    [tree, onTreeChange],
  );

  const handleExpandAll = useCallback(() => {
    const updated = setAllExpanded(tree, true);
    onTreeChange?.(updated);
  }, [tree, onTreeChange]);

  const handleCollapseAll = useCallback(() => {
    const updated = setAllExpanded(tree, false);
    onTreeChange?.(updated);
  }, [tree, onTreeChange]);

  const handleFocus = useCallback(() => {
    if (!selectedId) return;
    const node = nodeById.get(selectedId);
    if (!node) return;
    const k = Math.max(transform.k, 1.2);
    const x = width / 2 - node.x * k;
    const y = height / 2 - node.y * k;
    setTransform({ x, y, k });
  }, [selectedId, nodeById, transform.k, width, height]);

  const handleReset = useCallback(() => {
    fitToScreen();
  }, [fitToScreen]);

  // Render only visible nodes.
  const visibleNodes = layout.nodes.filter((n) => n.visible);
  const visibleConnectors = layout.connectors.filter((c) => {
    const from = nodeById.get(c.fromId);
    const to = nodeById.get(c.toId);
    return from?.visible && to?.visible;
  });

  return (
    <div className="relative h-full w-full overflow-hidden">
      <svg
        ref={svgRef}
        data-radial-mindmap
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full touch-none select-none"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ cursor: dragRef.current?.moved ? 'grabbing' : 'grab' }}
      >
        <defs>
          {BRANCH_GRADIENTS.map((g) => (
            <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={g.from} />
              <stop offset="100%" stopColor={g.to} />
            </linearGradient>
          ))}
          <filter id="node-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000033" />
          </filter>
          <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          {/* Connectors */}
          <g>
            {visibleConnectors.map((c) => (
              <path
                key={c.id}
                data-connector
                d={c.d}
                fill="none"
                stroke={c.color}
                strokeOpacity={0.5}
                strokeWidth={2}
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* Nodes */}
          <g>
            {visibleNodes.map((n) => (
              <NodeShape
                key={n.id}
                node={n}
                selected={n.id === selectedId}
                hovered={n.id === hoveredId}
                isDark={isDark}
                onClick={() => handleNodeClick(n)}
                onExpandCollapse={(e) => handleExpandCollapse(e, n)}
                onHover={setHoveredId}
              />
            ))}
          </g>
        </g>
      </svg>

      {/* Toolbar */}
      <div className="absolute right-3 top-3 flex flex-col gap-1 rounded-lg border border-gray-200 bg-white/90 p-1 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/90">
        <ToolButton label="Expand all" onClick={handleExpandAll} icon={EXPAND_ICON} />
        <ToolButton label="Collapse all" onClick={handleCollapseAll} icon={COLLAPSE_ICON} />
        <div className="my-0.5 h-px bg-gray-200 dark:bg-gray-700" />
        <ToolButton label="Zoom in" onClick={() => setTransform((t) => ({ ...t, k: Math.min(3, t.k * 1.2) }))} icon={ZOOM_IN_ICON} />
        <ToolButton label="Zoom out" onClick={() => setTransform((t) => ({ ...t, k: Math.max(0.2, t.k * 0.8) }))} icon={ZOOM_OUT_ICON} />
        <ToolButton label="Fit to screen" onClick={handleReset} icon={FIT_ICON} />
        {selectedId && (
          <>
            <div className="my-0.5 h-px bg-gray-200 dark:bg-gray-700" />
            <ToolButton label="Focus selected" onClick={handleFocus} icon={FOCUS_ICON} />
          </>
        )}
      </div>
    </div>
  );
}

/** Toggle a node's expanded state, returning a new tree. */
function toggleNode(tree: KnowledgeTree, id: string): KnowledgeTree {
  const clone = structuredClone(tree);
  const stack: KnowledgeNode[] = [clone];
  while (stack.length) {
    const n = stack.pop()!;
    if (n.id === id) {
      n.expanded = !n.expanded;
      return clone;
    }
    stack.push(...n.children);
  }
  return clone;
}

/** Set all nodes' expanded state. */
function setAllExpanded(tree: KnowledgeTree, expanded: boolean): KnowledgeTree {
  const clone = structuredClone(tree);
  const stack: KnowledgeNode[] = [clone];
  while (stack.length) {
    const n = stack.pop()!;
    n.expanded = expanded;
    stack.push(...n.children);
  }
  return clone;
}

/** Node shape: central circle or rounded rectangle. */
function NodeShape({
  node,
  selected,
  hovered,
  isDark,
  onClick,
  onExpandCollapse,
  onHover,
}: {
  node: LayoutNode;
  selected: boolean;
  hovered: boolean;
  isDark: boolean;
  onClick: () => void;
  onExpandCollapse: (e: React.MouseEvent) => void;
  onHover: (id: string | null) => void;
}) {
  const visual = getTypeVisual(node.type);
  const isCentral = node.depth === 0;
  const x = node.x;
  const y = node.y;
  const w = node.width;
  const h = node.height;
  const rx = isCentral ? w / 2 : 12;
  const fill = isCentral
    ? `url(#grad-${node.color.replace('#', '')})`
    : node.isCrossCutting
      ? crossCuttingFill(node.color, isDark)
      : nodeFill(node.color, isDark);
  const stroke = selected ? '#ffffff' : node.color;
  const strokeWidth = selected ? 3 : node.isCrossCutting ? 2 : 1.5;
  const textColor = isCentral || node.isCrossCutting ? '#ffffff' : isDark ? '#e2e8f0' : '#1e293b';

  return (
    <g
      data-node-id={node.id}
      transform={`translate(${x},${y})`}
      onClick={onClick}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'pointer' }}
      className="transition-opacity duration-200"
    >
      {selected && (
        <rect
          x={-w / 2 - 6}
          y={-h / 2 - 6}
          width={w + 12}
          height={h + 12}
          rx={rx + 6}
          fill="none"
          stroke={node.color}
          strokeWidth={2}
          strokeOpacity={0.6}
          filter="url(#node-glow)"
        />
      )}
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={rx}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        filter={hovered ? 'url(#node-glow)' : 'url(#node-shadow)'}
      />
      {/* Icon */}
      <g transform={`translate(${-w / 2 + 14},${-h / 2 + 14})`} opacity={0.9}>
        <path
          d={visual.path}
          fill="none"
          stroke={isCentral || node.isCrossCutting ? '#ffffff' : node.color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="scale(0.9)"
        />
      </g>
      {/* Title */}
      <text
        x={-w / 2 + 30}
        y={node.content ? -2 : 4}
        fill={textColor}
        fontSize={isCentral ? 16 : node.depth === 1 ? 14 : 12.5}
        fontWeight={isCentral ? 700 : 600}
        textAnchor="start"
        dominantBaseline="middle"
      >
        {truncate(node.title, isCentral ? 26 : node.depth === 1 ? 22 : 18)}
      </text>
      {/* Content */}
      {node.content && (
        <text
          x={-w / 2 + 30}
          y={14}
          fill={isCentral || node.isCrossCutting ? '#ffffffcc' : isDark ? '#94a3b8' : '#64748b'}
          fontSize={10}
          textAnchor="start"
          dominantBaseline="middle"
        >
          {truncate(node.content, 30)}
        </text>
      )}
      {/* Expand/collapse control */}
      {node.children.length > 0 && (
        <g
          transform={`translate(${w / 2 - 12},${h / 2 - 12})`}
          onClick={onExpandCollapse}
          style={{ cursor: 'pointer' }}
        >
          <circle r={9} fill={isDark ? '#1e293b' : '#ffffff'} stroke={node.color} strokeWidth={1.5} />
          <path
            d={node.expanded ? 'M-3.5 0h7' : 'M-3.5 0h7M0 -3.5v7'}
            stroke={node.color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </g>
      )}
    </g>
  );
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

function nodeFill(color: string, isDark: boolean): string {
  // Light tint of the branch color.
  return isDark ? `${color}22` : `${color}14`;
}

function crossCuttingFill(color: string, isDark: boolean): string {
  return isDark ? `${color}33` : `${color}1f`;
}

/** Toolbar button. */
function ToolButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={icon} />
      </svg>
    </button>
  );
}

/** Branch gradient defs (one per branch color). */
const BRANCH_GRADIENTS = [
  { id: 'grad-6366f1', from: '#818cf8', to: '#4f46e5' },
  { id: 'grad-0ea5e9', from: '#38bdf8', to: '#0284c7' },
  { id: 'grad-10b981', from: '#34d399', to: '#059669' },
  { id: 'grad-f59e0b', from: '#fbbf24', to: '#d97706' },
  { id: 'grad-ef4444', from: '#f87171', to: '#dc2626' },
  { id: 'grad-8b5cf6', from: '#a78bfa', to: '#7c3aed' },
  { id: 'grad-ec4899', from: '#f472b6', to: '#db2777' },
  { id: 'grad-14b8a6', from: '#2dd4bf', to: '#0d9488' },
  { id: 'grad-f97316', from: '#fb923c', to: '#ea580c' },
  { id: 'grad-3b82f6', from: '#60a5fa', to: '#2563eb' },
  { id: 'grad-84cc16', from: '#a3e635', to: '#65a30d' },
  { id: 'grad-a855f7', from: '#c084fc', to: '#9333ea' },
];

const EXPAND_ICON = 'M12 5v14M5 12h14';
const COLLAPSE_ICON = 'M5 12h14';
const ZOOM_IN_ICON = 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3M11 8v6M8 11h6';
const ZOOM_OUT_ICON = 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3M8 11h6';
const FIT_ICON = 'M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3';
const FOCUS_ICON = 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8v8M8 12h8';
