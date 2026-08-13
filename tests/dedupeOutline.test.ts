import { describe, expect, it } from 'vitest';
import { dedupeOutline } from '../src/lib/llm/dedupeOutline';

describe('dedupeOutline', () => {
  it('collapses consecutive duplicate lines', () => {
    const input = [
      '# الذكاء الاصطناعي',
      '## التعلم الآلي',
      '## التعلم الآلي',
      '## التعلم الآلي',
      '- الشبكات العصبية',
      '- الشبكات العصبية',
    ].join('\n');
    const out = dedupeOutline(input);
    expect(out).toBe(['# الذكاء الاصطناعي', '## التعلم الآلي', '- الشبكات العصبية'].join('\n'));
  });

  it('removes non-consecutive duplicates anywhere in the outline', () => {
    const input = [
      '# الذكاء الاصطناعي',
      '## التعلم الآلي',
      '- الشبكات العصبية',
      '## التعلم الآلي',
      '- الشبكات العصبية',
      '## التعلم الآلي',
    ].join('\n');
    const out = dedupeOutline(input);
    expect(out).toBe(
      ['# الذكاء الاصطناعي', '## التعلم الآلي', '- الشبكات العصبية'].join('\n'),
    );
  });

  it('treats the same node at different heading levels as a duplicate', () => {
    const input = ['## التعلم الآلي', '### التعلم الآلي', '#### التعلم الآلي'].join('\n');
    const out = dedupeOutline(input);
    expect(out).toBe('## التعلم الآلي');
  });

  it('treats nodes differing only by punctuation or diacritics as duplicates', () => {
    const input = [
      '## التَّعَلُّم الآلي.',
      '### التعلم الآلي',
      '- التعلم الآلي،',
    ].join('\n');
    const out = dedupeOutline(input);
    expect(out).toBe('## التَّعَلُّم الآلي.');
  });

  it('collapses duplicates separated by blank lines', () => {
    const input = ['## التعلم الآلي', '', '## التعلم الآلي', '', '## التعلم الآلي'].join('\n');
    const out = dedupeOutline(input);
    expect(out).toBe(['## التعلم الآلي', '', ''].join('\n'));
  });

  it('preserves unique lines', () => {
    const input = ['# Topic', '## A', '## B', '### C'].join('\n');
    expect(dedupeOutline(input)).toBe(input);
  });

  it('handles empty input', () => {
    expect(dedupeOutline('')).toBe('');
  });
});
