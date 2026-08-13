import type { SummaryLength, Transcript } from '../../types';

/** Word targets for each summary length. */
export const SUMMARY_WORD_TARGETS: Record<SummaryLength, number> = {
  concise: 150,
  normal: 400,
  detailed: 800,
};

/** Build the user prompt for summary generation. */
export function buildSummaryPrompt(
  transcript: Transcript,
  length: SummaryLength,
): string {
  const target = SUMMARY_WORD_TARGETS[length];
  return [
    `Please provide a ${length} summary of the following YouTube transcript.`,
    `Aim for approximately ${target} words.`,
    'Use clear Markdown with headings and bullet points where helpful.',
    'Do NOT append a timestamp summary or a list of timestamps at the end of the output.',
    'Do NOT repeat the same sentence or paragraph multiple times to reach the word count.',
    languageInstruction(transcript),
    '',
    '<TRANSCRIPT>',
    transcript.cleanedText,
    '</TRANSCRIPT>',
  ].join('\n');
}

/**
 * Build a language instruction for the model based on the transcript's
 * detected language, so the output matches the source language.
 */
function languageInstruction(transcript: Transcript): string {
  if (transcript.language === 'ar') {
    return 'The transcript is in Arabic. Write your entire response in Arabic, using proper Arabic text.';
  }
  if (transcript.language === 'he') {
    return 'The transcript is in Hebrew. Write your entire response in Hebrew.';
  }
  if (transcript.language && transcript.language !== 'unknown') {
    return `The transcript is in ${transcript.language}. Write your entire response in that language.`;
  }
  return 'Write your response in the same language as the transcript.';
}

/**
 * Build the chat system prompt.
 * The model answers primarily from the transcript, may explain concepts
 * to aid understanding, and may use its own knowledge when the answer is
 * not in the transcript — but must clearly flag when it does so.
 */
export function buildChatSystemPrompt(transcript: Transcript): string {
  return [
    'You are a helpful assistant answering questions about the following YouTube transcript.',
    'Rules:',
    '- Answer primarily using information present in the transcript.',
    '- When relevant, cite timestamps in the format [MM:SS].',
    '- You may explain concepts or terms mentioned in the transcript to help the user understand, but do not go far beyond what the transcript covers.',
    '- If the answer is not in the transcript, you may use your own general knowledge to help, but you MUST clearly state that this comes from your own knowledge and is not in the transcript.',
    '- Do not invent facts or fabricate details.',
    '- Report the content neutrally. Do NOT add your own opinions, judgments, or evaluations.',
    '- Do NOT comment on whether the speaker\'s views are correct, right, wrong, or biased.',
    `- ${languageInstruction(transcript)}`,
    '',
    '<TRANSCRIPT>',
    transcript.cleanedText,
    '</TRANSCRIPT>',
  ].join('\n');
}

/** Build the user prompt for mindmap outline generation. */
export function buildMindmapPrompt(transcript: Transcript): string {
  return [
    'Create a clean, hierarchical Markdown outline of the core concepts in the following YouTube transcript.',
    'Requirements:',
    '- Use only Markdown headings (#, ##, ###, ####) and bullet lists (-).',
    '- Start with a single top-level heading (#) for the main topic.',
    '- Organize into logical sections with sub-bullets.',
    '- Nest deeply where relevant: break each major concept into its key sub-topics, and those into supporting details (aim for 3-4 levels of depth when the content warrants it).',
    '- Keep it concise and concept-focused; do not include timestamps.',
    '- CRITICAL: Do NOT repeat, duplicate, or echo the same node, heading, or bullet more than once. Every node in the outline must be unique. Never list the same concept multiple times to pad the outline.',
    `- ${languageInstruction(transcript)}`,
    '',
    '<TRANSCRIPT>',
    transcript.cleanedText,
    '</TRANSCRIPT>',
  ].join('\n');
}
