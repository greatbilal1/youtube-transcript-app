/**
 * Defensive cleanup for LLM-generated mindmap outlines.
 *
 * Some models, especially when asked to produce a long outline in a
 * non-English language, will repeat the same node many times. This helper
 * removes duplicate node texts anywhere in the outline (not just
 * consecutive ones) so the rendered mindmap doesn't show the same node
 * dozens of times.
 */

/**
 * Normalize a markdown outline line to its semantic content so that
 * duplicates are detected regardless of heading level, list marker,
 * trailing punctuation, or Arabic diacritics.
 * e.g. "## التعلم الآلي." and "### التعلم الآلي" both normalize to
 * "التعلم الآلي".
 */
function normalizeNode(line: string): string {
  return line
    .replace(/^[#*\-\s]+/, '') // strip heading hashes / list markers / leading space
    // Strip Arabic diacritics (tashkeel) so "التَّعَلُّم" == "التعلم".
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Strip trailing punctuation (period, comma, Arabic comma, colon, etc.).
    .replace(/[\s.,،:;!؟?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Remove duplicate node texts from a markdown outline, keeping the first
 * occurrence of each unique node. Blank lines are preserved as separators.
 * A node is considered a duplicate if its normalized content (ignoring
 * heading level, list markers, and case) has already appeared.
 */
export function dedupeOutline(markdown: string): string {
  if (!markdown) return markdown;

  const lines = markdown.split(/\r?\n/);
  const result: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    // Preserve blank lines (they separate sections).
    if (trimmed === '') {
      result.push(line);
      continue;
    }

    const key = normalizeNode(trimmed);
    // Skip empty normalized keys (e.g. a line of only markers) and
    // any node whose content has already appeared.
    if (key === '' || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(line);
  }

  return result.join('\n');
}
