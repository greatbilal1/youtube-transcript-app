import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { findTimestamps } from '../../lib/timestamps';
import { TimestampChip } from './TimestampChip';

interface MarkdownContentProps {
  content: string;
  onTimestampClick: (seconds: number) => void;
  className?: string;
}

/**
 * Renders markdown and converts [MM:SS] / MM:SS timestamp tokens
 * into clickable chips that highlight the transcript segment.
 */
export function MarkdownContent({ content, onTimestampClick, className }: MarkdownContentProps) {
  const segments = useMemo(() => splitByTimestamps(content), [content]);

  return (
    <div className={className}>
      {segments.map((seg, i) =>
        seg.timestamp !== undefined ? (
          <TimestampChip key={i} seconds={seg.timestamp} onClick={onTimestampClick} />
        ) : (
          <ReactMarkdown
            key={i}
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ children, ...props }) => (
                <a {...props} className="text-brand-600 underline dark:text-brand-400">
                  {children}
                </a>
              ),
              ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              h1: ({ children }) => (
                <h1 className="mb-2 mt-4 text-xl font-bold">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-2 mt-3 text-lg font-semibold">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-1 mt-2 text-base font-semibold">{children}</h3>
              ),
              p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
              code: ({ children }) => (
                <code className="rounded bg-gray-100 px-1 py-0.5 text-sm dark:bg-gray-800">
                  {children}
                </code>
              ),
            }}
          >
            {seg.text}
          </ReactMarkdown>
        ),
      )}
    </div>
  );
}

interface Segment {
  text: string;
  timestamp?: number;
}

/**
 * Split content into text/timestamp segments so timestamps can be
 * rendered as clickable chips outside of markdown parsing.
 */
function splitByTimestamps(content: string): Segment[] {
  const timestamps = findTimestamps(content);
  if (timestamps.length === 0) {
    return [{ text: content }];
  }

  const result: Segment[] = [];
  let cursor = 0;

  for (const ts of timestamps) {
    if (ts.index > cursor) {
      result.push({ text: content.slice(cursor, ts.index) });
    }
    // Extract the full timestamp token (bracket + content).
    const tokenMatch = content.slice(ts.index).match(/^[\[(]?\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?[)\]]?/);
    const token = tokenMatch ? tokenMatch[0] : content.slice(ts.index, ts.index + 8);
    result.push({ text: token, timestamp: ts.start });
    cursor = ts.index + token.length;
  }

  if (cursor < content.length) {
    result.push({ text: content.slice(cursor) });
  }

  return result;
}
