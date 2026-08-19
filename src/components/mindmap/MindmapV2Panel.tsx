import { useCallback, useState } from 'react';
import { Network, ZoomIn, ZoomOut, Maximize, ListTree, ListCollapse, Hand, MousePointer2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Transcript } from '../../types';
import { MindmapControls } from './MindmapControls';
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

type PanTool = 'pointer' | 'hand';

export function MindmapV2Panel({
  transcript,
  outline,
  isGenerating,
  error,
  onGenerate,
}: MindmapV2PanelProps) {
  const [tool, setTool] = useState<PanTool>('pointer');
  const handleExportSvg = useCallback(() => {
    const svg = document.querySelector('#mindmap-v2-container svg');
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, `${transcript?.title ?? 'mindmap-v2'}.svg`);
  }, [transcript]);

  const handleExportPng = useCallback(() => {
    const svg = document.querySelector('#mindmap-v2-container svg') as SVGSVGElement | null;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = svg.clientWidth * scale;
      canvas.height = svg.clientHeight * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `${transcript?.title ?? 'mindmap-v2'}.png`);
      }, 'image/png');
    };
    img.src = url;
  }, [transcript]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200/70 px-4 py-3 dark:border-white/10">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <Network className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Mindmap V2
        </h2>
        <div className="ml-auto">
          <MindmapControls
            onGenerate={onGenerate}
            onExportSvg={handleExportSvg}
            onExportPng={handleExportPng}
            isGenerating={isGenerating}
            hasOutline={!!outline}
            disabled={!transcript}
          />
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="m-4 rounded-xl border border-red-200/80 bg-red-50/80 p-3 text-sm text-red-700 backdrop-blur dark:border-red-800/60 dark:bg-red-900/30 dark:text-red-300"
        >
          {error}
        </motion.div>
      )}

      <div className="min-h-0 flex-1">
        {isGenerating ? (
          <div className="flex h-full items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
            <Spinner />
            <span className="text-sm">Generating mindmap outline…</span>
          </div>
        ) : outline ? (
          <div className="relative h-full w-full">
            <div id="mindmap-v2-container" className="h-full w-full">
              {/* Mindmap V2 visualization goes here. */}
            </div>
            {/* Navigation tools: pointer (interact) vs hand (pan), expand/collapse,
                and zoom controls — same set as the original Mindmap panel. */}
            <div className="absolute right-3 top-3 flex flex-col gap-1 rounded-lg border border-gray-200 bg-white/90 p-1 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/90">
              <div className="flex flex-col gap-0.5 rounded-md bg-gray-100/80 p-0.5 dark:bg-gray-800/80">
                <button
                  onClick={() => setTool('pointer')}
                  title="Pointer tool — click nodes to expand/collapse"
                  aria-label="Pointer tool — click nodes to expand/collapse"
                  aria-pressed={tool === 'pointer'}
                  className={cn(
                    'rounded-md p-1.5 transition-colors',
                    tool === 'pointer'
                      ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-300'
                      : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-700/70',
                  )}
                >
                  <MousePointer2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setTool('hand')}
                  title="Hand tool — drag to pan"
                  aria-label="Hand tool — drag to pan"
                  aria-pressed={tool === 'hand'}
                  className={cn(
                    'rounded-md p-1.5 transition-colors',
                    tool === 'hand'
                      ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-300'
                      : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-700/70',
                  )}
                >
                  <Hand className="h-4 w-4" />
                </button>
              </div>
              <div className="my-0.5 h-px bg-gray-200 dark:bg-gray-700" />
              <button
                title="Expand all nodes"
                aria-label="Expand all nodes"
                className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <ListTree className="h-4 w-4" />
              </button>
              <button
                title="Collapse to top levels"
                aria-label="Collapse to top levels"
                className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <ListCollapse className="h-4 w-4" />
              </button>
              <div className="my-0.5 h-px bg-gray-200 dark:bg-gray-700" />
              <button
                title="Zoom in"
                aria-label="Zoom in"
                className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                title="Zoom out"
                aria-label="Zoom out"
                className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                title="Fit to view"
                aria-label="Fit to view"
                className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center"
          >
            <Network className="h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Generate a mindmap to visualize the transcript's core concepts.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
