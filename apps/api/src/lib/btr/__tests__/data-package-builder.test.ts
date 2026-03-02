process.env.SKIP_SWISSEPH_INIT = 'true';

import { describe, it, expect, vi } from 'vitest';
import { buildCandidateDataPackage } from '../data-package-builder.js';
import * as ephemeris from '../../ephemeris.js';

// ═══════════════════════════════════════════════════════════════════════════
// PHASE L: AI TRANSFORMATION & RESILIENCE — data-package-builder.test.ts
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('../../ephemeris.js', () => ({
    calculateEphemeris: vi.fn(),
    calculateJulianDay: vi.fn(),
    calculateSunrise: vi.fn().mockResolvedValue(new Date('1990-01-01T06:00:00Z')),
    convertToUTC: vi.fn().mockReturnValue(new Date('1990-01-01T12:00:00Z')),
}));

vi.mock('../../vedic-astrology-engine.js', () => ({
    calculateAllVargas: vi.fn().mockReturnValue({}),
    calculateAshtakavarga: vi.fn().mockReturnValue({}),
    calculateShadbala: vi.fn().mockReturnValue({}),
    detectYogas: vi.fn().mockReturnValue([]),
    calculateArudhas: vi.fn().mockReturnValue({}),
    calculatePanchanga: vi.fn().mockReturnValue({}),
    calculateVimsopakaBala: vi.fn().mockReturnValue(0),
    detectBhavaChalitDiscrepancy: vi.fn().mockReturnValue([]),
    getD60Deity: vi.fn().mockReturnValue('Kula'),
    calculateHouse: vi.fn().mockReturnValue(1),
    getDignity: vi.fn().mockReturnValue('Neutral'),
    calculateFunctionalNature: vi.fn().mockReturnValue({ role: 'Benefic', reason: 'Lord of Trikona' }),
    calculateAspects: vi.fn().mockReturnValue([]),
    calculateBaladiAvastha: vi.fn().mockReturnValue('Kumara'),
    calculatePanchadhaSambandha: vi.fn().mockReturnValue('Great Friend'),
    calculateIshtaKashtaPhala: vi.fn().mockReturnValue({ ishta: 30, kashta: 10 }),
    calculateVimshottariDasha: vi.fn().mockReturnValue([{
        lord: 'Sun',
        startDate: new Date(),
        endDate: new Date(),
        subPeriods: []
    }]),
}));

describe('🧠 Phase L: AI Transformation & Resilience — Data Package Builder', () => {
    const mockInput = {
        dateOfBirth: '1990-01-01',
        tentativeTime: '12:00:00',
        latitude: 28.6139,
        longitude: 77.2090,
        timezone: 5.5,
        lifeEvents: []
    };

    it('should correctly build a package even with zero-degree (Sandhi) planets', async () => {
        const fullPlanets = {
            sun: { sign: 'Aries', longitude: 0.0001, nakshatra: 'Ashwini', retro: false, speed: 1.0 },
            moon: { sign: 'Taurus', longitude: 30.0001, nakshatra: 'Krittika', retro: false, speed: 12.0 },
            mars: { sign: 'Gemini', longitude: 60.5, nakshatra: 'Mrigashira', retro: false, speed: 0.5 },
            mercury: { sign: 'Gemini', longitude: 65.2, nakshatra: 'Ardra', retro: false, speed: 1.2 },
            jupiter: { sign: 'Cancer', longitude: 90.1, nakshatra: 'Punarvasu', retro: false, speed: 0.1 },
            venus: { sign: 'Leo', longitude: 120.3, nakshatra: 'Magha', retro: false, speed: 1.1 },
            saturn: { sign: 'Virgo', longitude: 150.4, nakshatra: 'Uttara Phalguni', retro: false, speed: 0.05 },
            rahu: { sign: 'Libra', longitude: 180.5, nakshatra: 'Swati', retro: true, speed: -0.05 },
            ketu: { sign: 'Aries', longitude: 0.5, nakshatra: 'Ashwini', retro: true, speed: -0.05 },
        };

        // Mock ephemeris for a planet exactly at 0 degrees (border of sign)
        vi.mocked(ephemeris.calculateEphemeris).mockResolvedValue({
            planets: fullPlanets,
            ascendant: { sign: 'Leo', longitude: 120.0001 },
            houses: Array(12).fill({ sign: 'Leo', lord: 'Sun' }),
            shadbala: {},
            ashtakavarga: {}
        } as any);

        const pkg = await buildCandidateDataPackage('12:00:00', 0, mockInput as any);

        expect(pkg).toBeDefined();
        // 0.0001 degrees -> 0 degrees, 0 minutes, 0 seconds
        expect(pkg.planets.sun.degree).toBe("0° 00' 00\"");
        expect(pkg.planets.sun.sign).toBe('Aries');
    });

    it('should handle missing optional ephemeris data gracefully', async () => {
        vi.mocked(ephemeris.calculateEphemeris).mockResolvedValue({
            planets: {
                sun: { sign: 'Aries', longitude: 10, nakshatra: 'Ashwini', retro: false, speed: 1.0 },
                moon: { sign: 'Taurus', longitude: 35, nakshatra: 'Rohini', retro: false, speed: 13.0 },
                mars: { sign: 'Gemini', longitude: 60, nakshatra: 'Mrigashira', retro: false, speed: 0.5 },
                mercury: { sign: 'Gemini', longitude: 65, nakshatra: 'Ardra', retro: false, speed: 1.2 },
                jupiter: { sign: 'Cancer', longitude: 90, nakshatra: 'Punarvasu', retro: false, speed: 0.1 },
                venus: { sign: 'Leo', longitude: 120, nakshatra: 'Magha', retro: false, speed: 1.1 },
                saturn: { sign: 'Virgo', longitude: 150, nakshatra: 'Uttara Phalguni', retro: false, speed: 0.05 },
                rahu: { sign: 'Libra', longitude: 180, nakshatra: 'Swati', retro: true, speed: -0.05 },
                ketu: { sign: 'Aries', longitude: 0, nakshatra: 'Ashwini', retro: true, speed: -0.05 },
            },
            ascendant: { sign: 'Leo', longitude: 120 },
            houses: Array(12).fill({ sign: 'Leo', lord: 'Sun' }),
        } as any);

        const pkg = await buildCandidateDataPackage('12:00:00', 0, mockInput as any);
        expect(pkg.planets.sun).toBeDefined();
    });
});
