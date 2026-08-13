import { describe, it, expect } from 'vitest';
import { cleanTranscript } from '../src/lib/cleaner/transcriptCleaner';

describe('cleanTranscript', () => {
  it('strips repeated tokens', () => {
    const { cleanedText } = cleanTranscript('the the the quick brown fox');
    expect(cleanedText).toBe('the quick brown fox');
  });

  it('removes caption boilerplate', () => {
    const { cleanedText } = cleanTranscript('[Music]\nHello world\n[Applause]');
    expect(cleanedText).toBe('Hello world');
  });

  it('deduplicates consecutive duplicate lines', () => {
    const { cleanedText } = cleanTranscript('line one\nline one\nline two');
    expect(cleanedText).toBe('line one\nline two');
  });

  it('parses [MM:SS] timestamps', () => {
    const { segments, hasTimestamps } = cleanTranscript('[00:05] Hello world');
    expect(hasTimestamps).toBe(true);
    expect(segments[0].start).toBe(5);
    expect(segments[0].text).toBe('Hello world');
  });

  it('parses MM:SS timestamps', () => {
    const { segments } = cleanTranscript('01:30 Some content');
    expect(segments[0].start).toBe(90);
  });

  it('parses HH:MM:SS timestamps', () => {
    const { segments } = cleanTranscript('01:02:03 Long video');
    expect(segments[0].start).toBe(3723);
  });

  it('parses (MM:SS) timestamps', () => {
    const { segments } = cleanTranscript('(00:10) Parenthesized');
    expect(segments[0].start).toBe(10);
  });

  it('returns hasTimestamps false when none present', () => {
    const { hasTimestamps } = cleanTranscript('Just plain text without timestamps');
    expect(hasTimestamps).toBe(false);
  });

  it('handles empty input', () => {
    const result = cleanTranscript('');
    expect(result.cleanedText).toBe('');
    expect(result.segments).toEqual([]);
    expect(result.hasTimestamps).toBe(false);
  });

  it('handles whitespace-only input', () => {
    const result = cleanTranscript('   \n  \n ');
    expect(result.cleanedText).toBe('');
  });
});
