import { describe, it, expect } from 'vitest';
import { Shadbala } from '../../shadbala.js';
import { EphemerisData } from '@ai-pandit/shared';

describe('God-Tier BTR - Shadbala (6-Source planetary strength)', () => {

    const createMockEphemeris = (planetsData: Record<string, any>): EphemerisData => {
        return {
            planets: planetsData,
            ascendant: { longitude: 15, sign: 'Aries', degree: 15 },
            houses: [],
            divisionalCharts: {}
        } as unknown as EphemerisData;
    };

    it('should give maximum Sthana Bala (60) to an exalted planet', () => {
        // Sun is exalted in Aries at 10 degrees.
        const ephemeris = createMockEphemeris({
            sun: { sign: 'Aries', degree: 10, longitude: 10, house: 1 }
        });

        const shadbala = Shadbala.calculate(ephemeris);
        const sunStrength = shadbala.planets['sun'];

        expect(sunStrength.details.exaltation).toBe(true);
        // Exaltation gives 60 points max. Avastha might slightly adjust but should be close to 60.
        expect(sunStrength.breakdown.sthanaBala).toBeGreaterThan(50);
    });

    it('should give maximum Dig Bala (60) to a directionally strong planet', () => {
        // Sun gets Dig Bala in 10th house
        const ephemeris = createMockEphemeris({
            sun: { sign: 'Capricorn', degree: 15, longitude: 285, house: 10 }
        });

        const shadbala = Shadbala.calculate(ephemeris);
        const sunStrength = shadbala.planets['sun'];

        expect(sunStrength.details.directionalStrong).toBe(true);
        expect(sunStrength.breakdown.digBala).toBeCloseTo(60);
    });

    it('should give 0 Dig Bala if placed in opposite house', () => {
        // Sun gets 0 Dig Bala in 4th house
        const ephemeris = createMockEphemeris({
            sun: { sign: 'Cancer', degree: 15, longitude: 105, house: 4 }
        });

        const shadbala = Shadbala.calculate(ephemeris);
        const sunStrength = shadbala.planets['sun'];

        expect(sunStrength.details.directionalStrong).toBe(false);
        expect(sunStrength.breakdown.digBala).toBeCloseTo(0);
    });

});
