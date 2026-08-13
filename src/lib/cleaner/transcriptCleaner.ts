import type { Segment } from '../../types';
import { extractLeadingTimestamp } from '../timestamps';

export interface CleanResult {
  cleanedText: string;
  segments: Segment[];
  hasTimestamps: boolean;
}

/** Caption boilerplate markers that should be stripped. */
const BOILERPLATE_RE =
  /^(\[music\]|\[applause\]|\[laughter\]|\[music playing\]|\[inaudible\]|\[silence\]|>>+|>>>+)$/i;

/** Repeated-token artifact, e.g. "the the the" -> "the". */
const REPEATED_TOKEN_RE = /\b(\w+)(?:\s+\1\b)+/gi;

/**
 * Smart transcript cleaner.
 * Strips auto-caption artifacts while preserving usable timestamps.
 */
export function cleanTranscript(raw: string): CleanResult {
  if (!raw || !raw.trim()) {
    return { cleanedText: '', segments: [], hasTimestamps: false };
  }

  const lines = raw.split(/\r?\n/);
  const cleanedLines: string[] = [];
  const segments: Segment[] = [];
  let hasTimestamps = false;
  let lastText = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Strip caption boilerplate.
    if (BOILERPLATE_RE.test(line)) continue;

    // Extract a leading timestamp if present.
    const { start, rest } = extractLeadingTimestamp(line);
    if (start !== null) hasTimestamps = true;

    let text = rest || line;
    if (!text) continue;

    // Remove repeated-token artifacts.
    text = text.replace(REPEATED_TOKEN_RE, '$1').trim();
    if (!text) continue;

    // Drop consecutive duplicate lines (common in auto-captions).
    if (text.toLowerCase() === lastText.toLowerCase()) continue;
    lastText = text;

    cleanedLines.push(text);
    segments.push({ text, start: start ?? undefined });
  }

  // Merge adjacent segments that share the same timestamp-less grouping.
  const merged = mergeSegments(segments);

  return {
    cleanedText: cleanedLines.join('\n'),
    segments: merged,
    hasTimestamps,
  };
}

/**
 * Merge consecutive segments that have no timestamp into the previous
 * timestamped segment, so timestamps map to meaningful content blocks.
 */
function mergeSegments(segments: Segment[]): Segment[] {
  const result: Segment[] = [];
  for (const seg of segments) {
    const last = result[result.length - 1];
    if (seg.start === undefined && last && last.start !== undefined) {
      last.text = `${last.text} ${seg.text}`.trim();
    } else {
      result.push({ ...seg });
    }
  }
  return result;
}
