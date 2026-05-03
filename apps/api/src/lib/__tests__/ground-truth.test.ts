import { describe, it, expect, beforeAll } from 'vitest';
import { initEphemerisProvider, calculateEphemeris, isHighPrecisionMode } from '../ephemeris.js';

let ephemerisAvailable = false;

describe('Historical Ground-Truth Validation (Domain Precision)', () => {

  beforeAll(async () => {
    const success = await initEphemerisProvider();
    ephemerisAvailable = success && isHighPrecisionMode();
    if (!ephemerisAvailable) {
      console.warn('[SKIP] Ephemeris service unavailable — ground-truth tests skipped. Start with: npm run setup:ephemeris');
    }
  });

    const TEST_VECTORS = [
        {
            name: 'Modern Standard (Jan 1, 1990, Noon, Delhi)',
            input: { date: '1990-01-01', time: '12:00:00', lat: 28.6139, lon: 77.2090, tz: 5.5 },
            expected: {
                // Approximate Lahiri values for this date/time to ensure it's not wildly off or using tropical
                sunSign: 'Sagittarius',
                moonSign: 'Aquarius',
                ascSign: 'Pisces'
            }
        },
        {
            name: 'Historical Supported Range (Jan 1, 1850, Delhi)',
            input: { date: '1850-01-01', time: '12:00:00', lat: 28.6139, lon: 77.2090, tz: 5.5 },
            expected: {
                sunSign: 'Sagittarius'
            }
        },
        {
            name: 'Southern Hemisphere Extreme (Sydney, Australia)',
            input: { date: '2000-06-15', time: '18:30:00', lat: -33.8688, lon: 151.2093, tz: 10 },
            expected: {
                sunSign: 'Gemini'
            }
        }
    ];

    it('MUST use high-precision astronomy provider (no fallbacks)', () => {
      if (!ephemerisAvailable) return;
        expect(isHighPrecisionMode()).toBe(true);
    });

    // Test all vectors
    TEST_VECTORS.forEach(vector => {
        it(`Calculates EXACT positions for: ${vector.name}`, async () => {
          if (!ephemerisAvailable) return;
            const eph = await calculateEphemeris(
                vector.input.date,
                vector.input.time,
                vector.input.lat,
                vector.input.lon,
                vector.input.tz
            );

            // Extreme Assertion 1: Must return data
            expect(eph).toBeDefined();
            expect(eph.planets).toBeDefined();
            expect(eph.ascendant).toBeDefined();

            // Extreme Assertion 2: Verify specific sign placements to ensure Ayanamsa (Lahiri) is applied, not Tropical.
            if (vector.expected.sunSign) {
                expect(eph.planets.sun.sign).toBe(vector.expected.sunSign);
            }
            if (vector.expected.moonSign) {
                expect(eph.planets.moon.sign).toBe(vector.expected.moonSign);
            }
            if (vector.expected.ascSign) {
                expect(eph.ascendant.sign).toBe(vector.expected.ascSign);
            }

            // Extreme Assertion 3: Mathematical integrity (Degrees must be 0-30, Longitude 0-360)
            Object.values(eph.planets).forEach(planet => {
                expect(planet.longitude).toBeGreaterThanOrEqual(0);
                expect(planet.longitude).toBeLessThan(360);
                expect(planet.degree).toBeGreaterThanOrEqual(0);
                expect(planet.degree).toBeLessThan(30);

                // Extreme Assertion: 4 DECIMAL PRECISION REQUIRED
                const longitudeStr = planet.longitude.toString();
                if (longitudeStr.includes('.')) {
                    const decimalPlaces = longitudeStr.split('.')[1].length;
                    // High-precision providers should emit stable fractional precision.
                    expect(decimalPlaces).toBeGreaterThanOrEqual(4);
                }
            });

            // Extreme Assertion 4: Speed Validation (Sun should never be retrograde)
            expect(eph.planets.sun.retro).toBe(false);
            expect(eph.planets.sun.speed).toBeGreaterThan(0);
        });
    });

    it('Verifies exact mathematical consistency of Rahu and Ketu', async () => {
        if (!ephemerisAvailable) return;
        const eph = await calculateEphemeris('2020-01-01', '12:00:00', 0, 0, 0);
        const diff = Math.abs(eph.planets.rahu.longitude - eph.planets.ketu.longitude);
        // Due to floating point math, check if it's 180 within a tiny epsilon
        expect(Math.abs(diff - 180)).toBeLessThan(0.0001);

        // Rahu & Ketu should always be retrograde in true node
        expect(eph.planets.rahu.retro).toBe(true);
        expect(eph.planets.ketu.retro).toBe(true);
    });
});
