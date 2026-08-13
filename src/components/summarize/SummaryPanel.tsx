import { useState } from 'react';
import type { Summary, SummaryLength, Transcript } from '../../types';
import { MarkdownContent } from '../common/MarkdownContent';
import { ActionBar } from './ActionBar';
import { SummaryControls } from './SummaryControls';
import { Spinner } from '../common/Spinner';
import { downloadText } from '../../utils/download';

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
    await navigator.clipboard.writeText(summary.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <h2 className="text-lg font-semibold">Summary</h2>
        <SummaryControls
          onGenerate={onGenerate}
          isGenerating={isGenerating}
          disabled={!transcript}
          selectedLength={selectedLength}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Loading indicator before the first streamed token arrives. */}
      {isGenerating && !summary && (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <Spinner />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Generating summary…
          </span>
        </div>
      )}

      {/* The summary renders as soon as tokens stream in; while generating it
          shows a subtle "streaming" hint instead of a spinner. */}
      {summary && (
        <div
          className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
          dir={transcript?.isRTL ? 'rtl' : undefined}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
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
            className="prose prose-sm max-w-none dark:prose-invert"
          />
          {copied && (
            <p className="mt-2 text-xs text-green-600 dark:text-green-400">
              Copied to clipboard!
            </p>
          )}
        </div>
      )}

      {!summary && !isGenerating && !error && (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Choose a summary length above to generate a summary of the transcript.
        </div>
      )}
    </div>
  );
}
