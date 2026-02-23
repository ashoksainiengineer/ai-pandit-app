import { describe, it, expect } from 'vitest';
import { calculateVimshottariDasha, getDashaForDate } from '../vedic-astrology-engine.js';

describe('Vedic Astrology Engine - Vimshottari Dasha', () => {
    // Test Case: Fixed Birth Time (Golden Sample)
    // Date: Jan 1, 1980, 12:00:00 UTC
    // Moon Longitude for this date is approximately 68.5 degrees (Gemini)
    const birthDate = new Date(Date.UTC(1980, 0, 1, 12, 0, 0));
    const moonLong = 68.5;

    it('should calculate the correct birth Mahadasha', () => {
        // 68.5 degrees is in Ardra Nakshatra (controlled by Rahu)
        const periods = calculateVimshottariDasha(moonLong, birthDate);

        expect(periods).toBeDefined();
        expect(periods.length).toBeGreaterThan(0);

        // Ardra is Rahu, so the first Mahadasha should be Rahu
        expect(periods[0].lord).toBe('Rahu');
    });

    it('should calculate sub-dashas up to defined depth', () => {
        const maxLevel = 3;
        const periods = calculateVimshottariDasha(moonLong, birthDate, maxLevel);

        // Level 1: Mahadasha
        const mahadasha = periods[0];
        expect(mahadasha.subPeriods.length).toBeGreaterThan(0);

        // Level 2: Antardasha
        const antardasha = mahadasha.subPeriods[0];
        expect(antardasha.subPeriods.length).toBeGreaterThan(0);

        // Level 3: Pratyantardasha
        const pratyantar = antardasha.subPeriods[0];
        // With maxLevel=3, child should be level 3, its subPeriods should be empty
        expect(pratyantar.subPeriods.length).toBe(0);
    });

    it('should retrieve the correct dasha for a specific date', () => {
        const periods = calculateVimshottariDasha(moonLong, birthDate, 5);

        // Check dasha at birth
        const dashaAtBirth = getDashaForDate(periods, birthDate);
        expect(dashaAtBirth).toBeDefined();
        expect(dashaAtBirth?.mahadasha).toBe('Rahu');

        // Check dasha 30 years later (should be different)
        const futureDate = new Date(birthDate);
        futureDate.setFullYear(futureDate.getFullYear() + 30);
        const futureDasha = getDashaForDate(periods, futureDate);

        expect(futureDasha).toBeDefined();
        expect(futureDasha?.mahadasha).not.toBe('Rahu');
    });
});
