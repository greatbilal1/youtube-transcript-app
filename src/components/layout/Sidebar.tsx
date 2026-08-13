import { FileText } from 'lucide-react';
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
        <FileText className="h-10 w-10 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No transcript loaded. Upload a .txt file to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <h2 className="truncate text-sm font-semibold" title={transcript.title}>
          {transcript.title}
        </h2>
        <div className="mt-2 flex gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
          {(['cleaned', 'raw'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={cn(
                'flex-1 rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors',
                viewMode === mode
                  ? 'bg-white text-brand-700 shadow-sm dark:bg-gray-700 dark:text-brand-300'
                  : 'text-gray-500 dark:text-gray-400',
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div
        className="flex-1 space-y-1 overflow-y-auto p-3"
        dir={transcript.isRTL ? 'rtl' : undefined}
      >
        {viewMode === 'raw' ? (
          <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-gray-700 dark:text-gray-300">
            {transcript.rawText}
          </pre>
        ) : (
          transcript.segments.map((seg, i) => (
            <div
              key={i}
              id={`segment-${i}`}
              className={cn(
                'rounded-md px-2 py-1.5 text-xs leading-relaxed text-gray-700 transition-colors dark:text-gray-300',
                highlightedSegment === i
                  ? 'bg-brand-100 ring-1 ring-brand-400 dark:bg-brand-900/40'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800',
              )}
            >
              {seg.start !== undefined && (
                <span className="mr-1.5 font-mono text-[10px] text-brand-600 dark:text-brand-400">
                  [{formatTimestamp(seg.start)}]
                </span>
              )}
              {seg.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
