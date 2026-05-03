import { describe, it, expect } from 'vitest';
import {
  capitalizeFirstLetter,
  convertToDegreesMinutesSeconds,
  formatTimeHHMMSS,
  truncateWithEllipsis,
  formatDecimal,
  padZero,
} from './formatting';

describe('capitalizeFirstLetter', () => {
  it('capitalizes first letter', () => expect(capitalizeFirstLetter('hello')).toBe('Hello'));
  it('returns empty for empty string', () => expect(capitalizeFirstLetter('')).toBe(''));
  it('handles single char', () => expect(capitalizeFirstLetter('a')).toBe('A'));
});

describe('convertToDegreesMinutesSeconds', () => {
  it('formats degrees', () => {
    expect(convertToDegreesMinutesSeconds(15)).toBe("15° 00' 00\"");
  });
});

describe('formatTimeHHMMSS', () => {
  it('adds seconds to HH:MM', () => {
    expect(formatTimeHHMMSS('12:30')).toBe('12:30:00');
  });
  it('passes through HH:MM:SS', () => {
    expect(formatTimeHHMMSS('12:30:45')).toBe('12:30:45');
  });
});

describe('truncateWithEllipsis', () => {
  it('truncates long string', () => expect(truncateWithEllipsis('hello world', 8)).toBe('hello...'));
  it('keeps short string', () => expect(truncateWithEllipsis('hi', 8)).toBe('hi'));
});

describe('formatDecimal', () => {
  it('formats with decimals', () => expect(formatDecimal(3.14159, 2)).toBe('3.14'));
  it('handles NaN', () => expect(formatDecimal(NaN, 2)).toBe('0.00'));
});

describe('padZero', () => {
  it('pads single digit', () => expect(padZero(5, 2)).toBe('05'));
  it('does not pad when already long enough', () => expect(padZero(42, 2)).toBe('42'));
});
