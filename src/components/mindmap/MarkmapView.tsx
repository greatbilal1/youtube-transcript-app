import { useCallback, useEffect, useRef, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { walkTree } from 'markmap-common';
import { zoomIdentity } from 'd3';
import { ZoomIn, ZoomOut, Maximize, ListTree, ListCollapse } from 'lucide-react';

interface MarkmapViewProps {
  markdown: string;
}

/**
 * Custom CSS injected into the markmap instance to improve the look and feel
 * of the node text (nicer font, larger size, better spacing, and a more
 * prominent root node). The markmap adds its generated id as a class on the
 * SVG, so we target it via the `.markmap` class scoped to our fixed SVG id.
 */
const MARKMAP_STYLE = () => `
#mindmap-svg {
  --markmap-font: 400 15px/1.5 'Inter', ui-sans-serif, system-ui, sans-serif;
  --markmap-text-color: #334155;
  --markmap-circle-open-bg: #6366f1;
  --markmap-circle-close-bg: #a5b4fc;
  --markmap-a-color: #6366f1;
}
#mindmap-svg.markmap-dark {
  --markmap-text-color: #e2e8f0;
  --markmap-circle-open-bg: #818cf8;
  --markmap-circle-close-bg: #6366f1;
}
#mindmap-svg .markmap-foreign {
  line-height: 1.5;
}
#mindmap-svg .markmap-foreign p {
  margin: 0;
  padding: 2px 0;
}
#mindmap-svg .markmap-node[data-depth="0"] .markmap-foreign {
  font-weight: 700;
  font-size: 18px;
}
#mindmap-svg .markmap-node[data-depth="1"] .markmap-foreign {
  font-weight: 600;
  font-size: 16px;
}
#mindmap-svg .markmap-node[data-depth="2"] .markmap-foreign {
  font-weight: 500;
  font-size: 14px;
}
#mindmap-svg .markmap-node[data-depth="3"] .markmap-foreign {
  font-weight: 400;
  font-size: 13px;
}
#mindmap-svg .markmap-node > circle {
  stroke: #6366f1;
  stroke-width: 1.5;
}
`;

/**
 * Renders a Markdown outline as an interactive Markmap mindmap.
 * Supports zoom in/out, fit-to-view, pan, expand/collapse of individual
 * nodes by clicking, and expand-all / collapse-all. Re-fits automatically
 * when the container resizes.
 */
export function MarkmapView({ markdown }: MarkmapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markmapRef = useRef<Markmap | null>(null);
  const [ready, setReady] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );

  // Keep the markmap's dark-mode styling in sync with the app theme.
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains('dark'));
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Toggle the dark-mode class on the SVG itself so the custom CSS
  // (`#mindmap-svg.markmap-dark`) applies when the theme changes.
  useEffect(() => {
    const svg = containerRef.current?.querySelector('svg#mindmap-svg');
    svg?.classList.toggle('markmap-dark', isDark);
  }, [isDark]);

  // Create the markmap when the container is available.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Markmap expects an <svg> element (not a div) as its root. Create one
    // that fills the container, otherwise the map collapses into plain text.
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'mindmap-svg';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.display = 'block';
    container.appendChild(svg);

    const transformer = new Transformer();
    const { root } = transformer.transform(markdown);
    const mm = Markmap.create(svg, {
      autoFit: true,
      duration: 300,
      initialExpandLevel: 2,
      zoom: true,
      pan: true,
      fitRatio: 0.95,
      maxWidth: 300,
      style: MARKMAP_STYLE,
    });
    // Keep the dark-mode class on the SVG in sync so the custom dark text
    // color applies (the wrapper div also carries it for markmap's built-in
    // `.markmap-dark .markmap` rule).
    svg.classList.toggle('markmap-dark', isDark);
    mm.setData(root);
    markmapRef.current = mm;
    setReady(true);

    // Re-fit when the container resizes (e.g. sidebar toggled, tab shown).
    const observer = new ResizeObserver(() => {
      mm.fit();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      mm.destroy();
      svg.remove();
      markmapRef.current = null;
      setReady(false);
    };
  }, [markdown]);

  const handleZoomIn = useCallback(() => {
    const mm = markmapRef.current;
    if (!mm) return;
    const svgNode = mm.svg.node() as SVGSVGElement | null;
    if (!svgNode) return;
    const current = (svgNode as unknown as { __zoom?: typeof zoomIdentity }).__zoom || zoomIdentity;
    const newZoom = current.translate(0, 0).scale(1.25);
    mm.svg.call(mm.zoom.transform, newZoom);
  }, []);

  const handleZoomOut = useCallback(() => {
    const mm = markmapRef.current;
    if (!mm) return;
    const svgNode = mm.svg.node() as SVGSVGElement | null;
    if (!svgNode) return;
    const current = (svgNode as unknown as { __zoom?: typeof zoomIdentity }).__zoom || zoomIdentity;
    const newZoom = current.translate(0, 0).scale(0.8);
    mm.svg.call(mm.zoom.transform, newZoom);
  }, []);

  const handleFit = useCallback(() => {
    const mm = markmapRef.current;
    if (!mm) return;
    const svgNode = mm.svg.node() as SVGSVGElement | null;
    if (!svgNode) return;
    const { width, height } = svgNode.getBoundingClientRect();
    const fitRatio = mm.options.fitRatio ?? 0.95;
    const maxScale = mm.options.maxInitialScale ?? 2;
    const { x1, y1, x2, y2 } = mm.state.rect;
    const d = x2 - x1;
    const p = y2 - y1;
    if (!d || !p) return;
    const scale = Math.min((width / d) * fitRatio, (height / p) * fitRatio, maxScale);
    const transform = zoomIdentity
      .translate((width - d * scale) / 2 - x1 * scale, (height - p * scale) / 2 - y1 * scale)
      .scale(scale);
    mm.svg.call(mm.zoom.transform, transform);
  }, []);

  // Expand every node in the tree (fold = 0 means expanded), then re-render
  // and fit so the whole expanded map is visible.
  const handleExpandAll = useCallback(() => {
    const mm = markmapRef.current;
    const data = mm?.state.data;
    if (!mm || !data) return;
    walkTree(data, (node, next) => {
      node.payload = { ...node.payload, fold: 0 };
      next();
    });
    void mm.renderData().then(() => mm.fit());
  }, []);

  // Collapse every node back to the initial expand level (fold = 1 means
  // collapsed), then re-render and fit.
  const handleCollapseAll = useCallback(() => {
    const mm = markmapRef.current;
    const data = mm?.state.data;
    if (!mm || !data) return;
    walkTree(data, (node, next) => {
      if (node.state.depth >= 2) {
        node.payload = { ...node.payload, fold: 1 };
      } else {
        node.payload = { ...node.payload, fold: 0 };
      }
      next();
    });
    void mm.renderData().then(() => mm.fit());
  }, []);

  return (
    <div className={`relative h-full w-full ${isDark ? 'markmap-dark' : ''}`}>
      <div ref={containerRef} className="h-full w-full" />
      {ready && (
        <div className="absolute right-3 top-3 flex flex-col gap-1 rounded-lg border border-gray-200 bg-white/90 p-1 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/90">
          <button
            onClick={handleExpandAll}
            title="Expand all nodes"
            aria-label="Expand all nodes"
            className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ListTree className="h-4 w-4" />
          </button>
          <button
            onClick={handleCollapseAll}
            title="Collapse to top levels"
            aria-label="Collapse to top levels"
            className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ListCollapse className="h-4 w-4" />
          </button>
          <div className="my-0.5 h-px bg-gray-200 dark:bg-gray-700" />
          <button
            onClick={handleZoomIn}
            title="Zoom in"
            aria-label="Zoom in"
            className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom out"
            aria-label="Zoom out"
            className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleFit}
            title="Fit to view"
            aria-label="Fit to view"
            className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
