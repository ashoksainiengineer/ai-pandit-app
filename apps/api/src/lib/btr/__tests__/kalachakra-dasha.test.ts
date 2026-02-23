import { describe, it, expect } from 'vitest';
import { determineKalachakraType, calculateKalachakraDasha } from '../../kalachakra-dasha.js';

describe('God-Tier BTR - Kalachakra Dasha', () => {

    it('should correctly determine Savya/Apasavya orientation based on Moon Nakshatra', () => {
        const ashwini = determineKalachakraType(5.0);
        expect(ashwini.nakshatra).toBe('Ashwini');
        expect(ashwini.type).toBe('Savya');

        const bharani = determineKalachakraType(20.0);
        expect(bharani.nakshatra).toBe('Bharani');
        expect(bharani.type).toBe('Apisavya');
    });

    it('should calculate kalachakra sequence durations properly', () => {
        const birthDate = new Date('2024-01-01T00:00:00Z');
        const dashaPeriods = calculateKalachakraDasha(5.0, birthDate);

        expect(dashaPeriods.length).toBe(12);
        expect(dashaPeriods[0].sign).toBe('Aries');
        expect(dashaPeriods[0].durationYears).toBeLessThanOrEqual(7);
        expect(dashaPeriods[1].durationYears).toBe(8);
        expect(dashaPeriods[1].sign).toBe('Taurus');
    });

    it('should map Apasavya direction correctly', () => {
        const birthDate = new Date('2024-01-01T00:00:00Z');
        const dashaPeriods = calculateKalachakraDasha(20.0, birthDate);

        expect(dashaPeriods.length).toBe(12);
        expect(dashaPeriods[0].sign).toBe('Pisces');
        expect(dashaPeriods[1].sign).toBe('Aquarius');
    });

});
