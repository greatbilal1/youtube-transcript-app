import { describe, it, expect } from 'vitest';
import {
  buildSummaryPrompt,
  buildChatSystemPrompt,
  buildMindmapPrompt,
  SUMMARY_WORD_TARGETS,
} from '../src/lib/llm/prompts';
import type { Transcript } from '../src/types';

const transcript: Transcript = {
  id: 't1',
  title: 'Test',
  fileName: 'test.txt',
  rawText: 'raw',
  cleanedText: 'This is the transcript content.',
  segments: [],
  hasTimestamps: false,
  createdAt: 0,
};

describe('buildSummaryPrompt', () => {
  it('produces different word targets for each length', () => {
    const concise = buildSummaryPrompt(transcript, 'concise');
    const normal = buildSummaryPrompt(transcript, 'normal');
    const detailed = buildSummaryPrompt(transcript, 'detailed');
    expect(concise).toContain(String(SUMMARY_WORD_TARGETS.concise));
    expect(normal).toContain(String(SUMMARY_WORD_TARGETS.normal));
    expect(detailed).toContain(String(SUMMARY_WORD_TARGETS.detailed));
  });

  it('includes the transcript content', () => {
    const prompt = buildSummaryPrompt(transcript, 'normal');
    expect(prompt).toContain('This is the transcript content.');
  });
});

describe('buildChatSystemPrompt', () => {
  it('contains the transcript-first rule', () => {
    const prompt = buildChatSystemPrompt(transcript);
    expect(prompt).toContain('Answer primarily using information present in the transcript');
  });

  it('allows flagged outside knowledge', () => {
    const prompt = buildChatSystemPrompt(transcript);
    expect(prompt).toContain('you MUST clearly state that this comes from your own knowledge');
  });

  it('allows concept explanation but not going beyond the transcript', () => {
    const prompt = buildChatSystemPrompt(transcript);
    expect(prompt).toContain('do not go far beyond what the transcript covers');
  });

  it('includes the transcript', () => {
    const prompt = buildChatSystemPrompt(transcript);
    expect(prompt).toContain('This is the transcript content.');
  });
});

describe('buildMindmapPrompt', () => {
  it('requests a hierarchical outline', () => {
    const prompt = buildMindmapPrompt(transcript);
    expect(prompt.toLowerCase()).toContain('hierarchical');
    expect(prompt).toContain('Markdown');
  });
});
