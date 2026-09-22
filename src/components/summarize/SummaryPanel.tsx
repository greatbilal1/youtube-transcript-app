import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointerClick } from 'lucide-react';
import type { Summary, SummaryLength, Transcript } from '../../types';
import { MarkdownContent } from '../common/MarkdownContent';
import { ActionBar } from './ActionBar';
import { SummaryControls } from './SummaryControls';
import { Spinner } from '../common/Spinner';
import { toast } from '../common/Toast';
import { downloadText } from '../../utils/download';
import { cn } from '../../utils/cn';

interface SummaryPanelProps {
  transcript: Transcript | null;
  summary: Summary | null;
  selectedLength: SummaryLength;
  isGenerating: boolean;
  error: string | null;
  onGenerate: (length: SummaryLength) => void;
  onTimestampClick: (seconds: number) => void;
}

export function SummaryPanel({
  transcript,
  summary,
  selectedLength,
  isGenerating,
  error,
  onGenerate,
  onTimestampClick,
}: SummaryPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access is denied outside secure contexts and when the
      // permission is refused.
      toast.error('Copy failed — clipboard access was blocked.');
    }
  };

  const handleExport = () => {
    if (!summary || !transcript) return;
    downloadText(
      `# ${transcript.title}\n\n${summary.content}`,
      `${transcript.title}-${summary.length}-summary.md`,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Summary
        </h2>
        <SummaryControls
          onGenerate={onGenerate}
          isGenerating={isGenerating}
          disabled={!transcript}
          selectedLength={selectedLength}
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-red-200/80 bg-red-50/80 p-3 text-sm text-red-700 backdrop-blur dark:border-red-800/60 dark:bg-red-900/30 dark:text-red-300"
          >
            {error}
          </motion.div>
        )}

        {/* Loading indicator before the first streamed token arrives. */}
        {isGenerating && !summary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 rounded-xl border border-gray-200/70 bg-white/60 p-6 backdrop-blur dark:border-white/10 dark:bg-white/[0.03]"
          >
            <Spinner />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Generating summary…
            </span>
          </motion.div>
        )}

        {/* The summary renders as soon as tokens stream in; while generating it
            shows a subtle "streaming" hint instead of a spinner. */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'rounded-xl border p-5 backdrop-blur',
              'border-gray-200/70 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]',
              isGenerating && 'shimmer',
            )}
            dir={transcript?.isRTL ? 'rtl' : undefined}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-gradient-brand px-2.5 py-0.5 text-xs font-medium capitalize text-white">
                {summary.length}
              </span>
              <div className="flex items-center gap-3">
                {isGenerating && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Spinner size="sm" />
                    Streaming…
                  </span>
                )}
                <ActionBar
                  onCopy={handleCopy}
                  onExport={handleExport}
                  disabled={isGenerating}
                />
              </div>
            </div>
            <MarkdownContent
              content={summary.content}
              onTimestampClick={onTimestampClick}
            />
            <AnimatePresence>
              {copied && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 text-xs text-green-600 dark:text-green-400"
                >
                  Copied to clipboard!
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty state. The three length buttons above *are* the generate
            action, and one of them already looks selected, so the prompt has to
            say that clicking one is what starts the summary. */}
        {!summary && !isGenerating && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300/70 p-8 text-center dark:border-white/15"
          >
            <MousePointerClick className="h-8 w-8 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              No summary yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click <span className="font-medium text-gray-700 dark:text-gray-200">Concise</span>,{' '}
              <span className="font-medium text-gray-700 dark:text-gray-200">Normal</span>, or{' '}
              <span className="font-medium text-gray-700 dark:text-gray-200">Detailed</span> above
              to generate one.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
