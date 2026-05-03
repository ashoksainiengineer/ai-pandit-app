import { describe, it, expect } from 'vitest';
import { decimalToDMS } from './dms-formatter';

describe('decimalToDMS', () => {
  it('returns Unknown for undefined', () => {
    expect(decimalToDMS(undefined)).toBe('Unknown');
  });

  it('returns Unknown for null', () => {
    expect(decimalToDMS(null)).toBe('Unknown');
  });

  it('returns Unknown for NaN', () => {
    expect(decimalToDMS(NaN)).toBe('Unknown');
  });

  it('formats degrees correctly', () => {
    expect(decimalToDMS(15)).toBe("15° 00' 00\"");
  });

  it('handles negative values', () => {
    const result = decimalToDMS(-15);
    expect(result).toContain('°');
    expect(result).not.toBe('Unknown');
  });
});
