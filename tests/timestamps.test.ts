import { describe, it, expect } from 'vitest';
import {
  parseTimestamp,
  formatTimestamp,
  findTimestamps,
} from '../src/lib/timestamps';

describe('parseTimestamp', () => {
  it('parses MM:SS', () => {
    expect(parseTimestamp('01:30')).toBe(90);
  });

  it('parses HH:MM:SS', () => {
    expect(parseTimestamp('01:02:03')).toBe(3723);
  });

  it('parses fractional seconds', () => {
    expect(parseTimestamp('00:05.500')).toBeCloseTo(5.5);
  });

  it('returns null for invalid input', () => {
    expect(parseTimestamp('abc')).toBeNull();
    expect(parseTimestamp('99:99')).toBeNull();
    expect(parseTimestamp('')).toBeNull();
  });
});

describe('formatTimestamp', () => {
  it('formats MM:SS', () => {
    expect(formatTimestamp(90)).toBe('01:30');
  });

  it('formats HH:MM:SS', () => {
    expect(formatTimestamp(3723)).toBe('01:02:03');
  });

  it('handles zero', () => {
    expect(formatTimestamp(0)).toBe('00:00');
  });

  it('handles negative gracefully', () => {
    expect(formatTimestamp(-5)).toBe('00:00');
  });
});

describe('findTimestamps', () => {
  it('finds timestamps in text', () => {
    const results = findTimestamps('At [00:10] we start and [01:20] we finish');
    expect(results).toHaveLength(2);
    expect(results[0].start).toBe(10);
    expect(results[1].start).toBe(80);
  });

  it('returns empty for no timestamps', () => {
    expect(findTimestamps('no timestamps here')).toEqual([]);
  });
});
