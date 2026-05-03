import { describe, it, expect } from 'vitest';
import { safeJsonParse } from './safe-json-parse';

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
  });

  it('returns fallback on invalid JSON', () => {
    expect(safeJsonParse('invalid', 'fallback')).toBe('fallback');
  });

  it('returns fallback on empty string', () => {
    expect(safeJsonParse('', [])).toEqual([]);
  });

  it('works with arrays', () => {
    expect(safeJsonParse('[1,2,3]', [])).toEqual([1, 2, 3]);
  });
});
