import { describe, it, expect } from 'vitest';
import { SpouseD9Verification, NativeD9Positions, SpouseChartPositions } from '../../spouse-d9-verification.js';

describe('God-Tier BTR - Spouse D9 Verification', () => {

    it('should verify with EXACT match when D9 7th house equals spouse Lagna', () => {
        const nativeD9: NativeD9Positions = {
            lagna: { sign: 'Aries', degree: 10 },
            seventhHouse: { sign: 'Libra', degree: 10 },
            venus: { sign: 'Taurus', degree: 5 },
            moon: { sign: 'Cancer', degree: 15 },
            jupiter: { sign: 'Sagittarius', degree: 20 }
        };

        const spousePositions: SpouseChartPositions = {
            lagna: { sign: 'Libra', degree: 5, longitude: 185 }, // EXACT
            moon: { sign: 'Cancer', degree: 10, longitude: 100 }, // EXACT D9 Moon
            venus: { sign: 'Taurus', degree: 15, longitude: 45 }, // EXACT
            sun: { sign: 'Leo', degree: 5, longitude: 125 },
            jupiter: { sign: 'Pisces', degree: 10, longitude: 340 }
        };

        const result = SpouseD9Verification.verify(nativeD9, spousePositions);

        expect(result.verified).toBe(true);
        expect(result.confidence).toBe('high');

        const lagnaMatch = result.matches.find(m => m.type === 'lagna');
        expect(lagnaMatch?.matchType).toBe('exact');
    });

    it('should produce mismatch when D9 7th house opposes spouse lagna', () => {
        const nativeD9: NativeD9Positions = {
            lagna: { sign: 'Aries', degree: 10 },
            seventhHouse: { sign: 'Libra', degree: 10 },
            venus: { sign: 'Taurus', degree: 5 },
            moon: { sign: 'Cancer', degree: 15 },
            jupiter: { sign: 'Sagittarius', degree: 20 }
        };

        const spousePositions: SpouseChartPositions = {
            lagna: { sign: 'Aries', degree: 5, longitude: 5 }, // OPPOSITE 7th (which is Libra)
            moon: { sign: 'Capricorn', degree: 10, longitude: 280 }, // OPPOSITE
            venus: { sign: 'Scorpio', degree: 15, longitude: 225 }, // OPPOSITE
            sun: { sign: 'Leo', degree: 5, longitude: 125 },
            jupiter: { sign: 'Pisces', degree: 10, longitude: 340 }
        };

        const result = SpouseD9Verification.verify(nativeD9, spousePositions);

        expect(result.mismatches.length).toBeGreaterThan(0);
        // Might still be strictly verified if score isn't zeroed out, but confidence drops heavily
        expect(result.confidence).toBe('low');
    });

});
