import { describe, it, expect } from 'vitest';
import {
    getMinifiedEphemeris,
    formatPlanetPosition,
    formatHouseLords,
    extractKeyDignities,
    hasSandhiWarnings,
    getPrimaryDashaLord,
    type MinifiedEphemeris,
} from './ephemeris-helpers.js';

describe('ephemeris-helpers', () => {
    describe('getMinifiedEphemeris', () => {
        it('extracts sun, moon, and ascendant positions', () => {
            const candidate = {
                planets: {
                    sun: { sign: 'Aries', degree: '15.50°' },
                    moon: { sign: 'Taurus', degree: '22.30°' },
                },
                ascendant: { sign: 'Leo', degree: '5.20°' },
                vimshottariDasha: [{ maha: 'Mars' }],
            };
            const result = getMinifiedEphemeris(candidate as any);
            expect(result.sun).toBe('Aries 15.50°');
            expect(result.moon).toBe('Taurus 22.30°');
            expect(result.ascendant).toBe('Leo 5.20°');
        });
    });

    describe('formatPlanetPosition', () => {
        it('formats position with 4 decimal places', () => {
            expect(formatPlanetPosition('Aries', 15.5)).toBe('Aries 15.5000°');
            expect(formatPlanetPosition('Virgo', 0)).toBe('Virgo 0.0000°');
        });
    });

    describe('formatHouseLords', () => {
        it('formats house lords as key=value pairs', () => {
            expect(formatHouseLords({ 1: 'Mars', 7: 'Venus' })).toBe('1=Mars, 7=Venus');
        });

        it('returns empty string for empty object', () => {
            expect(formatHouseLords({})).toBe('');
        });
    });

    describe('extractKeyDignities', () => {
        it('extracts planets with dignity', () => {
            const planets = {
                Mars: { dignity: 'Exalted' },
                Venus: { dignity: 'Debilitated' },
                Jupiter: {},
            };
            const result = extractKeyDignities(planets);
            expect(result).toEqual({
                Mars: 'Exalted',
                Venus: 'Debilitated',
            });
        });

        it('returns empty object when no dignities', () => {
            expect(extractKeyDignities({})).toEqual({});
        });
    });

    describe('hasSandhiWarnings', () => {
        it('returns true when sandhi zones exist', () => {
            expect(hasSandhiWarnings(['Moon at 29°', 'Sun at 0.5°'])).toBe(true);
        });

        it('returns false for empty array', () => {
            expect(hasSandhiWarnings([])).toBe(false);
        });

        it('returns false for undefined', () => {
            expect(hasSandhiWarnings(undefined)).toBe(false);
        });
    });

    describe('getPrimaryDashaLord', () => {
        it('returns first maha dasha lord', () => {
            expect(getPrimaryDashaLord([{ maha: 'Jupiter' }, { maha: 'Saturn' }])).toBe('Jupiter');
        });

        it('returns Unknown for empty dasha', () => {
            expect(getPrimaryDashaLord([])).toBe('Unknown');
        });

        it('returns Unknown for undefined', () => {
            expect(getPrimaryDashaLord(undefined)).toBe('Unknown');
        });
    });
});
