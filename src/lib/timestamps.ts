/**
 * Parse a timestamp string into seconds.
 * Supports MM:SS, HH:MM:SS, and fractional seconds.
 * Returns null if the string is not a valid timestamp.
 */
export function parseTimestamp(raw: string): number | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:[.,](\d{1,3}))?$/);
  if (!match) return null;

  const hours = match[3] ? parseInt(match[1], 10) : 0;
  const minutes = match[3] ? parseInt(match[2], 10) : parseInt(match[1], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : parseInt(match[2], 10);
  const fraction = match[4] ? parseInt(match[4].padEnd(3, '0'), 10) / 1000 : 0;

  if (minutes > 59 || seconds > 59) return null;

  return hours * 3600 + minutes * 60 + seconds + fraction;
}

/** Format seconds into MM:SS or HH:MM:SS. */
export function formatTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00';
  }
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/** Regex matching common timestamp formats: [MM:SS], MM:SS, HH:MM:SS, (MM:SS). */
const TIMESTAMP_RE =
  /(?:\[|\()?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:[.,](\d{1,3}))?(?:\]|\))?/g;

/**
 * Extract the leading timestamp from a line, if present.
 * Returns { start, rest } where rest is the line without the timestamp.
 */
export function extractLeadingTimestamp(line: string): {
  start: number | null;
  rest: string;
} {
  const trimmed = line.trim();
  const match = trimmed.match(
    /^(?:\[|\()?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:[.,](\d{1,3}))?(?:\]|\))?\s*(.*)$/,
  );
  if (!match) return { start: null, rest: trimmed };

  // Reconstruct the timestamp token from captured groups (ignoring brackets).
  const [, h, m, s, f] = match;
  const token = s ? `${h}:${m}:${s}` : `${h}:${m}`;
  const start = parseTimestamp(f ? `${token}.${f}` : token);
  if (start === null) return { start: null, rest: trimmed };

  return { start, rest: match[5]?.trim() ?? '' };
}

/** Find all timestamps in a string, returning their positions and values. */
export function findTimestamps(text: string): Array<{ start: number; index: number }> {
  const results: Array<{ start: number; index: number }> = [];
  TIMESTAMP_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TIMESTAMP_RE.exec(text)) !== null) {
    const [, h, m, s, f] = match;
    const token = s ? `${h}:${m}:${s}` : `${h}:${m}`;
    const value = parseTimestamp(f ? `${token}.${f}` : token);
    if (value !== null) {
      results.push({ start: value, index: match.index });
    }
  }
  return results;
}
