import { FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Transcript } from '../../types';
import { formatTimestamp } from '../../lib/timestamps';
import { cn } from '../../utils/cn';

interface SidebarProps {
  transcript: Transcript | null;
  viewMode: 'raw' | 'cleaned';
  onViewModeChange: (mode: 'raw' | 'cleaned') => void;
  highlightedSegment: number | null;
}

/**
 * Transcript viewer sidebar. Shows raw or cleaned text, with
 * clickable segments that highlight when a timestamp is clicked.
 */
export function Sidebar({
  transcript,
  viewMode,
  onViewModeChange,
  highlightedSegment,
}: SidebarProps) {
  if (!transcript) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-gray-300 dark:text-gray-600"
        >
          <FileText className="h-10 w-10" />
        </motion.div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No transcript loaded. Upload a .txt file to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-xl">
      <div className="mb-3 rounded-xl border border-gray-200/70 bg-white/50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
        <h2
          className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100"
          title={transcript.title}
        >
          {transcript.title}
        </h2>
        <div className="mt-2 flex gap-1 rounded-lg bg-gray-100/80 p-0.5 dark:bg-gray-800/80">
          {(['cleaned', 'raw'] as const).map((mode) => {
            const active = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={cn(
                  'relative flex-1 rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors',
                  active
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="viewmode-pill"
                    className="absolute inset-0 rounded-md bg-gradient-brand shadow-glow-primary"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{mode}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="flex-1 space-y-1 overflow-y-auto px-1"
        dir={transcript.isRTL ? 'rtl' : undefined}
      >
        {viewMode === 'raw' ? (
          <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-gray-700 dark:text-gray-300">
            {transcript.rawText}
          </pre>
        ) : (
          transcript.segments.map((seg, i) => (
            <motion.div
              key={i}
              id={`segment-${i}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.004, 0.25) }}
              className={cn(
                'rounded-lg px-2 py-1.5 text-xs leading-relaxed transition-colors duration-200',
                highlightedSegment === i
                  ? 'bg-brand-500/15 text-gray-800 ring-1 ring-brand-400 shadow-glow dark:bg-brand-400/10 dark:text-gray-100'
                  : 'text-gray-700 hover:bg-white/60 hover:shadow-sm dark:text-gray-300 dark:hover:bg-white/[0.04]',
              )}
            >
              {seg.start !== undefined && (
                <span className="mr-1.5 font-mono text-[10px] text-brand-600 dark:text-brand-400">
                  [{formatTimestamp(seg.start)}]
                </span>
              )}
              {seg.text}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
