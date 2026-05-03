import { describe, it, expect } from 'vitest';
import { summarizeEphemerisComparison } from '../../ephemeris/compare';

describe('summarizeEphemerisComparison', () => {
  it('is importable', () => {
    expect(typeof summarizeEphemerisComparison).toBe('function');
  });
});
