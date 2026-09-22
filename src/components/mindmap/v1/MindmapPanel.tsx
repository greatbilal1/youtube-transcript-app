import { useCallback } from 'react';
import { Network } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Transcript } from '../../../types';
import { MarkmapView } from './MarkmapView';
import { MindmapControls } from '../MindmapControls';
import { Spinner } from '../../common/Spinner';
import { downloadBlob } from '../../../utils/download';

interface MindmapPanelProps {
  transcript: Transcript | null;
  outline: string;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
}

export function MindmapPanel({
  transcript,
  outline,
  isGenerating,
  error,
  onGenerate,
}: MindmapPanelProps) {
  const handleExportSvg = useCallback(() => {
    const svg = document.querySelector('#mindmap-container svg');
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, `${transcript?.title ?? 'mindmap'}.svg`);
  }, [transcript]);

  const handleExportPng = useCallback(() => {
    const svg = document.querySelector('#mindmap-container svg') as SVGSVGElement | null;
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
        if (blob) downloadBlob(blob, `${transcript?.title ?? 'mindmap'}.png`);
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
          Mindmap
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
          <div id="mindmap-container" className="h-full w-full">
            <MarkmapView markdown={outline} />
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
