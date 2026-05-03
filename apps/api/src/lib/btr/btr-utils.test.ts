import { describe, it, expect } from 'vitest';
import { getOffsetMinutes } from './utils';

describe('getOffsetMinutes', () => {
  it('returns 60 when no offsetConfig', () => {
    expect(getOffsetMinutes({})).toBe(60);
  });

  it('returns customMinutes when set', () => {
    expect(getOffsetMinutes({ offsetConfig: { customMinutes: 120 } })).toBe(120);
  });

  it('returns preset value', () => {
    expect(getOffsetMinutes({ offsetConfig: { preset: '1hour' } })).toBe(60);
    expect(getOffsetMinutes({ offsetConfig: { preset: '30min' } })).toBe(30);
    expect(getOffsetMinutes({ offsetConfig: { preset: '12hours' } })).toBe(720);
  });

  it('defaults to 60 for unknown preset', () => {
    expect(getOffsetMinutes({ offsetConfig: { preset: 'unknown' } })).toBe(60);
  });
});
