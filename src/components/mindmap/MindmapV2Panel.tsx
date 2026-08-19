import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Download,
  Hand,
  Image as ImageIcon,
  Maximize2,
  Minus,
  MousePointer2,
  Network,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Transcript } from '../../types';
import { Spinner } from '../common/Spinner';
import { downloadBlob } from '../../utils/download';
import { cn } from '../../utils/cn';

interface MindmapV2PanelProps {
  transcript: Transcript | null;
  outline: string;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
}

interface MindNode {
  title: string;
  details: string[];
  children: MindNode[];
}

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#f97316', '#14b8a6', '#3b82f6', '#ef4444', '#84cc16', '#a855f7'];
const EMOJIS = ['🧭', '💡', '🔎', '⚖️', '📌', '🌱', '🎯', '🧩', '🚀', '🛡️', '📈', '🧠'];

const CENTER_W = 220;
const CENTER_H = 160;
const BRANCH_W = 230;
const BRANCH_H = 150;
const CHILD_W = 170;
const CHILD_H = 92;
const GRAND_W = 150;
const GRAND_H = 72;
const DETAIL_W = 150;
const DETAIL_H = 60;
const GAP = 20;
const MAX_BRANCHES = 12;
const MAX_CHILDREN = 4;
const MAX_GRANDCHILDREN = 3;
// Details shown as text inside a box; anything beyond becomes a small box.
const BRANCH_MAX_TEXT = 3;
const CHILD_MAX_TEXT = 2;
const GRAND_MAX_TEXT = 2;
const MAX_OVERFLOW_DETAILS = 3;

function parseOutline(markdown: string): MindNode {
  const root: MindNode = { title: 'Transcript Mindmap', details: [], children: [] };
  const stack: { level: number; node: MindNode }[] = [{ level: -1, node: root }];
  for (const raw of markdown.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    const bullet = line.match(/^(?:[-*+]\s+|\d+[.)]\s+)(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const node: MindNode = { title: heading[2].replace(/[*_`]/g, '').trim(), details: [], children: [] };
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      stack[stack.length - 1].node.children.push(node);
      stack.push({ level, node });
    } else if (bullet) {
      stack[stack.length - 1].node.details.push(bullet[1].replace(/[*_`]/g, '').trim());
    } else if (stack.length > 1) {
      stack[stack.length - 1].node.details.push(line.replace(/[*_`]/g, '').trim());
    } else if (!root.title || root.title === 'Transcript Mindmap') {
      root.title = line.replace(/^#\s*/, '').replace(/[*_`]/g, '').trim();
    }
  }
  if (root.children.length === 1 && root.children[0].children.length) {
    const generatedRoot = root.children.shift()!;
    root.title = generatedRoot.title;
    root.details = generatedRoot.details;
    root.children = generatedRoot.children;
  }
  return root;
}

function branchLabel(title: string) {
  const clean = title.replace(/^\d+[.)]\s*/, '');
  return clean.length > 42 ? `${clean.slice(0, 40)}…` : clean;
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]!));
}
interface ConnectorLine {
  x1: number; y1: number; x2: number; y2: number;
  c1x: number; c1y: number; c2x: number; c2y: number;
  colorIndex: number;
  depth: number;
}

type BoxType = 'branch' | 'child' | 'grand' | 'detail';

interface BoxSpec {
  id: string;
  type: BoxType;
  x: number;
  y: number;
  title: string;
  details: string[];
  colorIndex: number;
  branchIndex: number;
  parentId: string; // 'center' or a box id
}

interface EdgeSpec {
  from: string;
  to: string;
  colorIndex: number;
  depth: number;
}

// Curvy bezier control points: bulge perpendicular to the straight line so
// connectors arc gracefully instead of running straight.
function curvePoints(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const bulge = Math.min(70, len * 0.22);
  return {
    c1x: x1 + dx * 0.25 + px * bulge,
    c1y: y1 + dy * 0.25 + py * bulge,
    c2x: x1 + dx * 0.75 + px * bulge,
    c2y: y1 + dy * 0.75 + py * bulge,
  };
}

// Point where a ray from the rect centre (dx, dy) crosses the rect's edge, so
// arrows start/end exactly on the box borders instead of floating in space.
function edgePoint(rect: { x: number; y: number; w: number; h: number }, dx: number, dy: number) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const tx = ux !== 0 ? rect.w / 2 / Math.abs(ux) : Infinity;
  const ty = uy !== 0 ? rect.h / 2 / Math.abs(uy) : Infinity;
  const t = Math.min(tx, ty);
  return { x: cx + ux * t, y: cy + uy * t };
}
type PanTool = 'pointer' | 'hand';

export function MindmapV2Panel({ transcript, outline, isGenerating, error, onGenerate }: MindmapV2PanelProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number; active: boolean } | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<PanTool>('pointer');
  const [isPanning, setIsPanning] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [lines, setLines] = useState<ConnectorLine[]>([]);
  const root = useMemo(() => parseOutline(outline), [outline]);
  const branches = useMemo(() => root.children.slice(0, MAX_BRANCHES), [root]);

  // Sunburst layout: every node (branch, child, grandchild, overflow detail)
  // is its own box. Each box owns an angular wedge proportional to its subtree
  // size, and children fan out inside that wedge at the next ring. Radii are
  // derived from the box sizes so nothing overlaps and nothing scrolls.
  const layout = useMemo(() => {
    const n = branches.length;
    if (n === 0) {
      return { stageW: 900, stageH: 700, cx: 450, cy: 350, R1: 0, R2: 0, R3: 0, boxes: [], edges: [] };
    }

    const boxes: BoxSpec[] = [];
    const edges: EdgeSpec[] = [];
    const branchMeta: {
      weight: number;
      children: MindNode[];
      overflow: string[];
      childWeights: number[];
      childSubs: { grandchildren: MindNode[]; overflow: string[] }[];
    }[] = [];

    branches.forEach((branch, i) => {
      const colorIndex = i;
      const branchId = `b-${i}`;
      const children = branch.children.slice(0, MAX_CHILDREN);
      const overflow = branch.details.slice(BRANCH_MAX_TEXT, BRANCH_MAX_TEXT + MAX_OVERFLOW_DETAILS);
      const childSubs = children.map((child) => ({
        grandchildren: child.children.slice(0, MAX_GRANDCHILDREN),
        overflow: child.details.slice(CHILD_MAX_TEXT, CHILD_MAX_TEXT + MAX_OVERFLOW_DETAILS),
      }));
      const childWeights = childSubs.map((s) => 1 + s.grandchildren.length + s.overflow.length);
      const weight = 1 + children.length + overflow.length + childWeights.reduce((a, b) => a + b, 0);
      branchMeta.push({ weight, children, overflow, childWeights, childSubs });

      boxes.push({ id: branchId, type: 'branch', x: 0, y: 0, title: branch.title, details: branch.details.slice(0, BRANCH_MAX_TEXT), colorIndex, branchIndex: i, parentId: 'center' });
      edges.push({ from: 'center', to: branchId, colorIndex, depth: 1 });

      children.forEach((child, j) => {
        const childId = `c-${i}-${j}`;
        boxes.push({ id: childId, type: 'child', x: 0, y: 0, title: child.title, details: child.details.slice(0, CHILD_MAX_TEXT), colorIndex, branchIndex: i, parentId: branchId });
        edges.push({ from: branchId, to: childId, colorIndex, depth: 2 });
        childSubs[j].grandchildren.forEach((g, k) => {
          const gid = `g-${i}-${j}-${k}`;
          boxes.push({ id: gid, type: 'grand', x: 0, y: 0, title: g.title, details: g.details.slice(0, GRAND_MAX_TEXT), colorIndex, branchIndex: i, parentId: childId });
          edges.push({ from: childId, to: gid, colorIndex, depth: 3 });
        });
        childSubs[j].overflow.forEach((d, k) => {
          const did = `cd-${i}-${j}-${k}`;
          boxes.push({ id: did, type: 'detail', x: 0, y: 0, title: d, details: [], colorIndex, branchIndex: i, parentId: childId });
          edges.push({ from: childId, to: did, colorIndex, depth: 3 });
        });
      });
      overflow.forEach((d, j) => {
        const did = `bd-${i}-${j}`;
        boxes.push({ id: did, type: 'detail', x: 0, y: 0, title: d, details: [], colorIndex, branchIndex: i, parentId: branchId });
        edges.push({ from: branchId, to: did, colorIndex, depth: 2 });
      });
    });

    // Angular spans (sunburst): each node's span is proportional to its
    // subtree leaf count.
    const totalWeight = branchMeta.reduce((a, m) => a + m.weight, 0);
    let cursor = -Math.PI / 2;
    const branchSectors = branchMeta.map((m) => {
      const span = (m.weight / totalWeight) * Math.PI * 2;
      const start = cursor;
      const mid = start + span / 2;
      cursor += span;
      return { start, mid, end: start + span };
    });

    // Smallest angular span at each ring, used to size the radii so boxes
    // never overlap.
    const minBranchSpan = Math.min(...branchSectors.map((s) => s.end - s.start));
    let minSubSpan = Infinity;
    let minGrandSpan = Infinity;
    branchMeta.forEach((m, i) => {
      const span = branchSectors[i].end - branchSectors[i].start;
      const subWeights = [...m.childWeights, ...m.overflow.map(() => 1)];
      if (subWeights.length) {
        subWeights.forEach((w) => { minSubSpan = Math.min(minSubSpan, (w / m.weight) * span); });
      }
      m.childSubs.forEach((s, j) => {
        const childSpan = (m.childWeights[j] / m.weight) * span;
        const grandWeights = [...s.grandchildren.map(() => 1), ...s.overflow.map(() => 1)];
        if (grandWeights.length) {
          grandWeights.forEach((w) => { minGrandSpan = Math.min(minGrandSpan, (w / m.childWeights[j]) * childSpan); });
        }
      });
    });

    const R1 = Math.max(
      CENTER_H / 2 + BRANCH_H / 2 + 70,
      (BRANCH_W + GAP) / (2 * Math.sin(minBranchSpan / 2)),
    );
    const R2 = Math.max(
      R1 + BRANCH_H / 2 + CHILD_H / 2 + 50,
      Number.isFinite(minSubSpan) ? (CHILD_W + GAP) / (2 * Math.sin(minSubSpan / 2)) : 0,
    );
    const R3 = Math.max(
      R2 + CHILD_H / 2 + GRAND_H / 2 + 70,
      Number.isFinite(minGrandSpan) ? (GRAND_W + GAP * 1.5) / (2 * Math.sin(minGrandSpan / 2)) : 0,
    );

    const stageW = Math.max(1000, (R3 + GRAND_W / 2 + 90) * 2);
    const stageH = Math.max(760, (R3 + GRAND_H / 2 + 90) * 2);
    const cx = stageW / 2;
    const cy = stageH / 2;
    const pos = (angle: number, radius: number) => ({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
    const boxById = new Map(boxes.map((b) => [b.id, b]));

    branchMeta.forEach((m, i) => {
      const sector = branchSectors[i];
      const branchBox = boxById.get(`b-${i}`)!;
      branchBox.x = pos(sector.mid, R1).x;
      branchBox.y = pos(sector.mid, R1).y;

      // Sub-nodes (children + overflow details) spread across the wedge.
      const subWeights = [...m.childWeights, ...m.overflow.map(() => 1)];
      let offset = 0;
      const subAngles = subWeights.map((w) => {
        const a = sector.start + ((offset + w / 2) / m.weight) * (sector.end - sector.start);
        offset += w;
        return a;
      });

      m.children.forEach((child, j) => {
        const childBox = boxById.get(`c-${i}-${j}`)!;
        const a = subAngles[j];
        childBox.x = pos(a, R2).x;
        childBox.y = pos(a, R2).y;

        // Grandchildren + child overflow within the child's sub-wedge.
        const childSpan = (m.childWeights[j] / m.weight) * (sector.end - sector.start);
        const childStart = a - childSpan / 2;
        const grandWeights = [...m.childSubs[j].grandchildren.map(() => 1), ...m.childSubs[j].overflow.map(() => 1)];
        let goffset = 0;
        grandWeights.forEach((w, k) => {
          const ga = childStart + ((goffset + w / 2) / m.childWeights[j]) * childSpan;
          const gid = k < m.childSubs[j].grandchildren.length
            ? `g-${i}-${j}-${k}`
            : `cd-${i}-${j}-${k - m.childSubs[j].grandchildren.length}`;
          const gBox = boxById.get(gid)!;
          gBox.x = pos(ga, R3).x;
          gBox.y = pos(ga, R3).y;
          goffset += w;
        });
      });

      m.overflow.forEach((d, j) => {
        const dBox = boxById.get(`bd-${i}-${j}`)!;
        const a = subAngles[m.children.length + j];
        dBox.x = pos(a, R2).x;
        dBox.y = pos(a, R2).y;
      });
    });

    return { stageW, stageH, cx, cy, R1, R2, R3, boxes, edges };
  }, [branches]);

  // Only render boxes/edges that aren't under a collapsed branch.
  const visibleBoxes = useMemo(() => {
    if (collapsed.size === 0) return layout.boxes;
    return layout.boxes.filter((b) => {
      if (b.type === 'branch') return true;           // branch card itself always visible
      return !collapsed.has(b.branchIndex);            // hide children when collapsed
    });
  }, [layout, collapsed]);
  const visibleEdges = useMemo(() => {
    if (collapsed.size === 0) return layout.edges;
    const ids = new Set(visibleBoxes.map((b) => b.id));
    return layout.edges.filter((e) => ids.has(e.from) && ids.has(e.to));
  }, [layout, collapsed, visibleBoxes]);

  // Measure the actual rendered boxes and compute connector lines that touch
  // each box's edge exactly. Normalising by the map's rendered size keeps the
  // measurement correct at any pan/zoom level.
  useLayoutEffect(() => {
    const map = mapRef.current;
    const center = centerRef.current;
    if (!map || !center || visibleBoxes.length === 0) {
      setLines([]);
      return;
    }
    const mapRect = map.getBoundingClientRect();
    const kx = layout.stageW / mapRect.width;
    const ky = layout.stageH / mapRect.height;
    const toLocal = (rect: DOMRect) => ({
      x: (rect.left - mapRect.left) * kx,
      y: (rect.top - mapRect.top) * ky,
      w: rect.width * kx,
      h: rect.height * ky,
    });
    const centerRect = toLocal(center.getBoundingClientRect());
    const rects = new Map<string, { x: number; y: number; w: number; h: number }>();
    visibleBoxes.forEach((box) => {
      const el = boxRefs.current[box.id];
      if (el) rects.set(box.id, toLocal(el.getBoundingClientRect()));
    });
    const next: ConnectorLine[] = [];
    visibleEdges.forEach((edge) => {
      const fromRect = edge.from === 'center' ? centerRect : rects.get(edge.from);
      const toRect = rects.get(edge.to);
      if (!fromRect || !toRect) return;
      const dx = toRect.x + toRect.w / 2 - (fromRect.x + fromRect.w / 2);
      const dy = toRect.y + toRect.h / 2 - (fromRect.y + fromRect.h / 2);
      const start = edgePoint(fromRect, dx, dy);
      const end = edgePoint(toRect, -dx, -dy);
      next.push({ x1: start.x, y1: start.y, x2: end.x, y2: end.y, colorIndex: edge.colorIndex, depth: edge.depth, ...curvePoints(start.x, start.y, end.x, end.y) });
    });
    setLines(next);
  }, [visibleBoxes, visibleEdges, layout]);

  const toggleBranch = (index: number) => setCollapsed((current) => {
    const next = new Set(current);
    if (next.has(index)) next.delete(index); else next.add(index);
    return next;
  });

  const exportMap = useCallback((format: 'svg' | 'png') => {
    const map = mapRef.current;
    if (!map) return;
    const cards = Array.from(map.querySelectorAll<HTMLElement>('[data-export-card]'));
    const width = Math.round(map.offsetWidth * 1.5);
    const height = Math.round(map.offsetHeight * 1.5);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#07111f"/><text x="${(width / 2).toFixed(1)}" y="72" text-anchor="middle" fill="#f8fafc" font-family="Inter,Arial" font-size="28" font-weight="700">${escapeXml(root.title)}</text>${cards.map((card) => { const r = card.getBoundingClientRect(); const m = map.getBoundingClientRect(); const x = ((r.left - m.left) / m.width) * width; const y = ((r.top - m.top) / m.height) * (height - 100) + 100; const w = (r.width / m.width) * width; const h = (r.height / m.height) * (height - 100); return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="18" fill="#102033" stroke="${card.dataset.color || '#6366f1'}" stroke-width="2"/><text x="${(x + 20).toFixed(1)}" y="${(y + 32).toFixed(1)}" fill="#f8fafc" font-family="Inter,Arial" font-size="18" font-weight="700">${escapeXml(card.dataset.title || '')}</text></svg>`; }).join('')}</svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    if (format === 'svg') {
      downloadBlob(blob, `${transcript?.title ?? 'mindmap-v2'}-v2.svg`);
      return;
    }
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = width * 2; canvas.height = height * 2;
      const context = canvas.getContext('2d'); if (!context) return;
      context.drawImage(image, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url);
      canvas.toBlob((png) => { if (png) downloadBlob(png, `${transcript?.title ?? 'mindmap-v2'}-v2.png`); }, 'image/png');
    };
    image.src = url;
  }, [root.title, transcript]);

  // Reset zoom and panning back to the centered fit.
  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // ---- Panning (move the map freely around the canvas) --------------
  // Works in both tools so the map can always be repositioned. The hand
  // tool simply signals the grab affordance, mirroring the original map.
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // left button only
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y, active: true };
    setIsPanning(true);
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const drag = dragRef.current;
    if (!drag?.active) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setPan({ x: drag.panX + dx, y: drag.panY + dy });
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setIsPanning(false);
  }, []);

  // Wheel-to-zoom, matching the original map's scroll-to-zoom behaviour.
  // Registered as a non-passive native listener so preventDefault works and
  // the page doesn't scroll underneath the canvas.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      setScale((v) => Math.min(1.6, Math.max(0.5, v * factor)));
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, []);

  // Fit the whole map into the viewport whenever a new outline is rendered.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const map = mapRef.current;
    if (!viewport || !map) return;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const mw = map.offsetWidth;
    const mh = map.offsetHeight;
    if (!mw || !mh) return;
    const fit = Math.min(1, Math.min(vw / mw, vh / mh) * 0.92);
    setScale(Math.max(0.5, fit));
    setPan({ x: 0, y: 0 });
  }, [outline]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200/70 px-4 py-3 dark:border-white/10">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><Network className="h-4 w-4" /></div>
        <div><h2 className="text-lg font-semibold tracking-tight">Mindmap V2</h2><p className="text-[11px] text-gray-500 dark:text-gray-400">Radial view · centered context</p></div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={onGenerate} disabled={!transcript || isGenerating} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-semibold text-white shadow-glow-primary disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5" />{isGenerating ? 'Generating…' : 'Generate'}</button>
          {outline && <><button type="button" onClick={() => exportMap('svg')} className="map-action"><Download className="h-3.5 w-3.5" />SVG</button><button type="button" onClick={() => exportMap('png')} className="map-action"><ImageIcon className="h-3.5 w-3.5" />PNG</button></>}
          <span className="mx-1 hidden h-5 w-px bg-gray-200 dark:bg-white/10 sm:block" />
          <div className="flex items-center gap-0.5 rounded-lg border border-[rgba(148,163,184,.25)] p-0.5">
            <button type="button" onClick={() => setTool('pointer')} title="Pointer tool" aria-label="Pointer tool" aria-pressed={tool === 'pointer'} className={cn('map-icon border-0', tool === 'pointer' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'hover:bg-transparent')}><MousePointer2 className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => setTool('hand')} title="Hand tool — drag to move the map" aria-label="Hand tool" aria-pressed={tool === 'hand'} className={cn('map-icon border-0', tool === 'hand' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'hover:bg-transparent')}><Hand className="h-3.5 w-3.5" /></button>
          </div>
          <button type="button" onClick={() => setScale((v) => Math.max(.5, v - .1))} className="map-icon" aria-label="Zoom out"><Minus className="h-3.5 w-3.5" /></button><span className="w-10 text-center text-[11px] text-gray-500">{Math.round(scale * 100)}%</span><button type="button" onClick={() => setScale((v) => Math.min(1.6, v + .1))} className="map-icon" aria-label="Zoom in"><Plus className="h-3.5 w-3.5" /></button><button type="button" onClick={resetView} className="map-icon" aria-label="Fit map"><Maximize2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="m-4 rounded-xl border border-red-200/80 bg-red-50/80 p-3 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-900/30 dark:text-red-300">{error}</motion.div>}
      <div className="min-h-0 flex-1 overflow-auto bg-slate-950/[.02] dark:bg-slate-950/30">
        {isGenerating ? <div className="flex h-full items-center justify-center gap-3 text-gray-500 dark:text-gray-400"><Spinner /><span className="text-sm">Generating mindmap outline…</span></div> : outline ? <div ref={viewportRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={endDrag} onMouseLeave={endDrag} className={cn('mindmap-v2-viewport', tool === 'hand' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default')}><div ref={mapRef} className="mindmap-v2" style={{ width: layout.stageW, height: layout.stageH, transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: 'center center', transition: isPanning ? 'none' : undefined }}><svg key={outline} className="mindmap-lines" viewBox={`0 0 ${layout.stageW} ${layout.stageH}`} preserveAspectRatio="none" aria-hidden="true"><defs>{COLORS.slice(0, branches.length).map((c, i) => (<marker key={i} id={`mmv2-arrow-${i}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={c} /></marker>))}</defs><circle className="mindmap-ring" cx={layout.cx} cy={layout.cy} r={Math.min(150, layout.R1 * 0.4)} fill="none" stroke="rgba(99,102,241,.28)" strokeWidth="1.5" />{lines.map((line, i) => (<path key={i} className={cn('mindmap-link', line.depth > 1 && 'mindmap-link-child')} d={`M ${line.x1} ${line.y1} C ${line.c1x} ${line.c1y}, ${line.c2x} ${line.c2y}, ${line.x2} ${line.y2}`} fill="none" stroke={COLORS[line.colorIndex % COLORS.length]} strokeWidth={line.depth > 1 ? 1.8 : 2.5} strokeOpacity=".6" markerEnd={`url(#mmv2-arrow-${line.colorIndex % COLORS.length})`} />))}</svg><div ref={centerRef} className="mindmap-center" data-export-card data-color="#818cf8" data-title={root.title}><span className="mb-2 text-2xl">🧠</span><strong>{root.title}</strong>{root.details.slice(0, 2).map((detail) => <span key={detail}>{detail}</span>)}</div>{visibleBoxes.map((box) => <div key={box.id} ref={(el) => { boxRefs.current[box.id] = el; }} className={box.type === 'branch' ? 'mindmap-branch-slot' : box.type === 'child' ? 'mindmap-child-slot' : 'mindmap-grand-slot'} style={{ left: box.x, top: box.y }}><section className={box.type === 'branch' ? 'mindmap-branch' : box.type === 'child' ? 'mindmap-child-card' : box.type === 'grand' ? 'mindmap-grand-card' : 'mindmap-detail-card'} style={{ '--branch-color': COLORS[box.colorIndex % COLORS.length] } as CSSProperties} data-export-card data-color={COLORS[box.colorIndex % COLORS.length]} data-title={box.title}>{box.type === 'branch' ? <button type="button" className="mindmap-branch-head" onClick={() => toggleBranch(box.branchIndex)} aria-expanded={!collapsed.has(box.branchIndex)}><span className="mindmap-emoji">{EMOJIS[box.colorIndex % EMOJIS.length]}</span><span className="min-w-0 flex-1 text-left"><small>Branch {String(box.branchIndex + 1).padStart(2, '0')}</small><strong>{branchLabel(box.title)}</strong></span>{collapsed.has(box.branchIndex) ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}</button> : <strong className="mindmap-box-title">{branchLabel(box.title)}</strong>}{box.type !== 'branch' || !collapsed.has(box.branchIndex) ? box.details.length > 0 && <div className="mindmap-details">{box.details.map((detail) => <p key={detail}><span>•</span>{detail}</p>)}</div> : null}</section></div>)}</div></div> : <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center"><Network className="h-10 w-10 text-gray-300 dark:text-gray-600" /><p className="text-sm text-gray-500 dark:text-gray-400">Generate a radial mindmap to visualize the transcript’s core concepts.</p></motion.div>}
      </div>
    </div>
  );
}
