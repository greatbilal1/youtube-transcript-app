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

const BRANCH_W = 240;
const BRANCH_H = 190;
const MAX_BRANCHES = 12;
const MAX_DETAILS = 5;
const MAX_CHILDREN = 4;
const MAX_CHILD_DETAILS = 3;

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
  const branchRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number; active: boolean } | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<PanTool>('pointer');
  const [isPanning, setIsPanning] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [lines, setLines] = useState<ConnectorLine[]>([]);
  const root = useMemo(() => parseOutline(outline), [outline]);
  const branches = useMemo(() => root.children.slice(0, MAX_BRANCHES), [root]);

  // Radial layout: place each branch around the centre and grow the stage so
  // extra nodes fit without crowding.
  const layout = useMemo(() => {
    const n = branches.length;
    const radius = Math.max(250, 160 + n * 26);
    const stageW = Math.max(1000, radius * 2 + BRANCH_W + 160);
    const stageH = Math.max(760, radius * 2 + BRANCH_H + 160);
    const cx = stageW / 2;
    const cy = stageH / 2;
    const positions = branches.map((_, i) => {
      const angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
      return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
    });
    return { stageW, stageH, cx, cy, radius, positions };
  }, [branches]);

  // Measure the actual rendered boxes and compute connector lines that touch
  // each box's edge exactly. Normalising by the map's rendered size keeps the
  // measurement correct at any pan/zoom level.
  useLayoutEffect(() => {
    const map = mapRef.current;
    const center = centerRef.current;
    if (!map || !center || branches.length === 0) {
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
    const next: ConnectorLine[] = [];
    branches.forEach((_, i) => {
      const el = branchRefs.current[i];
      if (!el) return;
      const rect = toLocal(el.getBoundingClientRect());
      const dx = rect.x + rect.w / 2 - (centerRect.x + centerRect.w / 2);
      const dy = rect.y + rect.h / 2 - (centerRect.y + centerRect.h / 2);
      const start = edgePoint(centerRect, dx, dy);
      const end = edgePoint(rect, -dx, -dy);
      next.push({
        x1: start.x, y1: start.y, x2: end.x, y2: end.y,
        c1x: start.x + (end.x - start.x) * 0.35,
        c1y: start.y + (end.y - start.y) * 0.35,
        c2x: start.x + (end.x - start.x) * 0.65,
        c2y: start.y + (end.y - start.y) * 0.65,
      });
    });
    setLines(next);
  }, [branches, collapsed, layout]);

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
        {isGenerating ? <div className="flex h-full items-center justify-center gap-3 text-gray-500 dark:text-gray-400"><Spinner /><span className="text-sm">Generating mindmap outline…</span></div> : outline ? <div ref={viewportRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={endDrag} onMouseLeave={endDrag} className={cn('mindmap-v2-viewport', tool === 'hand' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default')}><div ref={mapRef} className="mindmap-v2" style={{ width: layout.stageW, height: layout.stageH, transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: 'center center', transition: isPanning ? 'none' : undefined }}><svg key={outline} className="mindmap-lines" viewBox={`0 0 ${layout.stageW} ${layout.stageH}`} preserveAspectRatio="none" aria-hidden="true"><defs>{COLORS.slice(0, branches.length).map((c, i) => (<marker key={i} id={`mmv2-arrow-${i}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={c} /></marker>))}</defs><circle className="mindmap-ring" cx={layout.cx} cy={layout.cy} r={Math.min(150, layout.radius * 0.4)} fill="none" stroke="rgba(99,102,241,.28)" strokeWidth="1.5" />{lines.map((line, i) => (<g key={i}><path className="mindmap-link" d={`M ${line.x1} ${line.y1} C ${line.c1x} ${line.c1y}, ${line.c2x} ${line.c2y}, ${line.x2} ${line.y2}`} pathLength={1} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="2.5" strokeOpacity=".5" markerEnd={`url(#mmv2-arrow-${i % COLORS.length})`} /><path className="mindmap-link-flow" d={`M ${line.x1} ${line.y1} C ${line.c1x} ${line.c1y}, ${line.c2x} ${line.c2y}, ${line.x2} ${line.y2}`} pathLength={1} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="2" strokeOpacity=".9" /></g>))}</svg><div ref={centerRef} className="mindmap-center" data-export-card data-color="#818cf8" data-title={root.title}><span className="mb-2 text-2xl">🧠</span><strong>{root.title}</strong>{root.details.slice(0, 2).map((detail) => <span key={detail}>{detail}</span>)}</div>{branches.map((branch, index) => <div key={`${branch.title}-${index}`} ref={(el) => { branchRefs.current[index] = el; }} className="mindmap-branch-slot" style={{ left: layout.positions[index].x, top: layout.positions[index].y }}><section className="mindmap-branch" style={{ '--branch-color': COLORS[index % COLORS.length] } as CSSProperties} data-export-card data-color={COLORS[index % COLORS.length]} data-title={branch.title}><button type="button" className="mindmap-branch-head" onClick={() => toggleBranch(index)} aria-expanded={!collapsed.has(index)}><span className="mindmap-emoji">{EMOJIS[index % EMOJIS.length]}</span><span className="min-w-0 flex-1 text-left"><small>Branch {String(index + 1).padStart(2, '0')}</small><strong>{branchLabel(branch.title)}</strong></span>{collapsed.has(index) ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}</button>{!collapsed.has(index) && <div className="mindmap-details">{branch.details.slice(0, MAX_DETAILS).map((detail) => <p key={detail}><span>•</span>{detail}</p>)}{branch.children.slice(0, MAX_CHILDREN).map((child) => <div className="mindmap-child" key={child.title}><strong>{child.title}</strong>{child.details.slice(0, MAX_CHILD_DETAILS).map((detail) => <p key={detail}>• {detail}</p>)}</div>)}</div>}</section></div>)}</div></div> : <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center"><Network className="h-10 w-10 text-gray-300 dark:text-gray-600" /><p className="text-sm text-gray-500 dark:text-gray-400">Generate a radial mindmap to visualize the transcript’s core concepts.</p></motion.div>}
      </div>
    </div>
  );
}
