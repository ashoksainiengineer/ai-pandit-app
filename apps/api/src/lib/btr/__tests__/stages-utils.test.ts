import { describe, it, expect } from 'vitest';
import { getMinifiedEphemerisInline } from '../../btr/stages/_utils';

const mockCandidate = {
  planets: {
    sun: { sign: 'Leo', degree: 15.5, longitude: 135.5, latitude: 0, speed: 1, house: 1, nakshatra: 'Magha', retrograde: false },
    moon: { sign: 'Cancer', degree: 10.2, longitude: 100.2, latitude: 0, speed: 12, house: 5, nakshatra: 'Pushya', retrograde: false },
  },
  ascendant: { sign: 'Aries', degree: 5.0, longitude: 5, latitude: 0, speed: 0, house: 1, nakshatra: 'Ashwini', retrograde: false },
} as any;

describe('_utils', () => {
  it('getMinifiedEphemerisInline returns sun, moon, ascendant', () => {
    const result = getMinifiedEphemerisInline(mockCandidate);
    expect(result.sun).toContain('Leo');
    expect(result.moon).toContain('Cancer');
    expect(result.ascendant).toContain('Aries');
  });
});
