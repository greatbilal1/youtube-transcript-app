import { describe, expect, it } from 'vitest';
import { detectLanguage } from '../src/lib/language';

describe('detectLanguage', () => {
  it('detects Arabic text as RTL', () => {
    const info = detectLanguage(
      'مرحبا بكم في هذا الفيديو حول الذكاء الاصطناعي. اليوم سنتحدث عن أساسيات التعلم الآلي.',
    );
    expect(info.code).toBe('ar');
    expect(info.isRTL).toBe(true);
    expect(info.label).toBe('Arabic');
  });

  it('detects English text as LTR', () => {
    const info = detectLanguage(
      'Welcome to this video about artificial intelligence. Today we will cover machine learning.',
    );
    expect(info.code).toBe('en');
    expect(info.isRTL).toBe(false);
    expect(info.label).toBe('English');
  });

  it('returns unknown for empty input', () => {
    const info = detectLanguage('');
    expect(info.code).toBe('unknown');
    expect(info.isRTL).toBe(false);
  });

  it('prefers Arabic when mixed with some Latin', () => {
    const info = detectLanguage(
      'مرحبا بكم في هذا الفيديو حول الذكاء الاصطناعي. AI is the future.',
    );
    expect(info.code).toBe('ar');
    expect(info.isRTL).toBe(true);
  });
});
