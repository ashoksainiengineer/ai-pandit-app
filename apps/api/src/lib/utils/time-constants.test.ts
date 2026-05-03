import { describe, it, expect } from 'vitest';
import { DAYS_PER_YEAR, addYears } from './time-constants';

describe('time-constants', () => {
  it('DAYS_PER_YEAR is defined', () => {
    expect(DAYS_PER_YEAR).toBeGreaterThan(365);
    expect(DAYS_PER_YEAR).toBeLessThan(366);
  });

  it('addYears adds years correctly', () => {
    const date = new Date('2020-01-01');
    const result = addYears(date, 1);
    expect(result.getTime()).toBeGreaterThan(date.getTime());
  });

  it('addYears does not mutate original', () => {
    const date = new Date('2020-01-01');
    addYears(date, 5);
    expect(date.getFullYear()).toBe(2020);
  });
});
