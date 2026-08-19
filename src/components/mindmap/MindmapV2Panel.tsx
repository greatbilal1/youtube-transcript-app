import { useCallback, useRef } from 'react';
import { Network } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Transcript } from '../../types';
import type { KnowledgeTree } from '../../types/knowledgeMap';
import { RadialMindmap } from './RadialMindmap';
import { MindmapControls } from './MindmapControls';
import { Spinner } from '../common/Spinner';
import { downloadBlob } from '../../utils/download';
import { useTheme } from '../../hooks/useTheme';

interface MindmapV2PanelProps {
  transcript: Transcript | null;
  tree: KnowledgeTree | null;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
  onTreeChange: (tree: KnowledgeTree) => void;
}

/** Canvas size for the radial map (16:9). */
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

export function MindmapV2Panel({
  transcript,
  tree,
  isGenerating,
  error,
  onGenerate,
  onTreeChange,
}: MindmapV2PanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleExportSvg = useCallback(() => {
    const svg = containerRef.current?.querySelector('svg[data-radial-mindmap]');
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, `${transcript?.title ?? 'knowledge-map'}.svg`);
  }, [transcript]);

  const handleExportPng = useCallback(() => {
    const svg = containerRef.current?.querySelector('svg[data-radial-mindmap]') as SVGSVGElement | null;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = CANVAS_WIDTH * scale;
      canvas.height = CANVAS_HEIGHT * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `${transcript?.title ?? 'knowledge-map'}.png`);
      }, 'image/png');
    };
    img.src = url;
  }, [transcript, isDark]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200/70 px-4 py-3 dark:border-white/10">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <Network className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Mindmap
        </h2>
        <div className="ml-auto">
          <MindmapControls
            onGenerate={onGenerate}
            onExportSvg={handleExportSvg}
            onExportPng={handleExportPng}
            isGenerating={isGenerating}
            hasOutline={!!tree}
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
            <span className="text-sm">Analyzing structure and building knowledge map…</span>
          </div>
        ) : tree ? (
          <div ref={containerRef} className="h-full w-full">
            <RadialMindmap
              tree={tree}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              isDark={isDark}
              onTreeChange={onTreeChange}
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center"
          >
            <Network className="h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Generate a semantic knowledge map to visualize the transcript's concepts,
              themes, and relationships.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
