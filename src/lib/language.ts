/**
 * Lightweight language detection for transcripts.
 * Detects whether the dominant script is Arabic (RTL) so the app can
 * (a) instruct the LLM to respond in the same language and
 * (b) render the UI with the correct text direction.
 */

export interface LanguageInfo {
  /** BCP-47-ish language tag, e.g. 'ar', 'en', or 'unknown'. */
  code: string;
  /** Whether the text should be rendered right-to-left. */
  isRTL: boolean;
  /** Human-readable label, e.g. 'Arabic'. */
  label: string;
}

/** Arabic script ranges (Unicode). */
const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/** Other RTL scripts (Hebrew, etc.). */
const HEBREW_RE = /[\u0590-\u05FF]/;

/** Latin script (English and most European languages). */
const LATIN_RE = /[A-Za-z]/;

/**
 * Detect the dominant language of a text sample by counting script
 * characters. Returns a LanguageInfo describing the result.
 */
export function detectLanguage(text: string): LanguageInfo {
  if (!text) {
    return { code: 'unknown', isRTL: false, label: 'Unknown' };
  }

  let arabic = 0;
  let hebrew = 0;
  let latin = 0;

  for (const ch of text) {
    if (ARABIC_RE.test(ch)) arabic++;
    else if (HEBREW_RE.test(ch)) hebrew++;
    else if (LATIN_RE.test(ch)) latin++;
  }

  const total = arabic + hebrew + latin;
  if (total === 0) {
    return { code: 'unknown', isRTL: false, label: 'Unknown' };
  }

  // Arabic is the dominant script.
  if (arabic > 0 && arabic >= latin && arabic >= hebrew) {
    return { code: 'ar', isRTL: true, label: 'Arabic' };
  }
  if (hebrew > 0 && hebrew >= latin) {
    return { code: 'he', isRTL: true, label: 'Hebrew' };
  }
  if (latin > 0) {
    return { code: 'en', isRTL: false, label: 'English' };
  }

  return { code: 'unknown', isRTL: false, label: 'Unknown' };
}
