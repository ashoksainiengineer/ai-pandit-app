import { describe, it, expect } from 'vitest';
import {
    calculateVimshottariDasha,
    getDashaForDate,
    calculatePanchanga
} from '../vedic-astrology-engine.js';
import { calculateJulianDay } from '../ephemeris.js';

describe('Phase A: Industrial Precision (Engine Edge Cases)', () => {

    describe('Vimshottari Nakshatra Boundaries', () => {
        const birthDate = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));

        it('should correctly identify the first Nakshatra (Ashwini/Ketu) at exactly 0.0 longitude', () => {
            const moonLong = 0.0;
            const periods = calculateVimshottariDasha(moonLong, birthDate);
            expect(periods[0].lord).toBe('Ketu');
        });

        it('should correctly transition to second Nakshatra (Bharani/Venus) exactly at 13.333... longitude', () => {
            const moonLong = 360 / 27; // Exactly 13.333...
            const periods = calculateVimshottariDasha(moonLong, birthDate);
            expect(periods[0].lord).toBe('Venus');
        });

        it('should handle last Nakshatra (Revati/Mercury) at 359.99 longitude', () => {
            const moonLong = 359.99;
            const periods = calculateVimshottariDasha(moonLong, birthDate);
            expect(periods[0].lord).toBe('Mercury');
        });

        it('should wrap around correctly at 360.0 (treated as 0.0)', () => {
            const moonLong = 360.0;
            const periods = calculateVimshottariDasha(moonLong, birthDate);
            expect(periods[0].lord).toBe('Ketu');
        });
    });

    describe('Historical Date & Time Resilience', () => {
        it('should handle Leap Day births (Feb 29) without logic errors', () => {
            const leapBirth = new Date(Date.UTC(2024, 1, 29, 10, 0, 0));
            const periods = calculateVimshottariDasha(10.0, leapBirth);

            expect(periods[0].startDate.getFullYear()).toBe(2024);
            expect(periods[0].startDate.getMonth()).toBe(1); // February
            expect(periods[0].startDate.getDate()).toBe(29);
        });

        it('should handle Millennial boundary (Dec 31, 1999 vs Jan 1, 2000)', () => {
            const y2k = new Date(Date.UTC(2000, 0, 1, 0, 0, 1));
            const periods = calculateVimshottariDasha(45.0, y2k);
            expect(periods[0].startDate.getFullYear()).toBe(2000);
        });
    });

    describe('Panchanga Precision (Tithi/Yoga)', () => {
        it('should calculate Tithi 1 (Pratipada) at 0 longitude difference', () => {
            // Tithi = (Moon - Sun) / 12
            const sunLong = 0;
            const moonLong = 5;
            const res = calculatePanchanga(0, sunLong, moonLong, new Date());
            expect(res.tithi.number).toBe(1);
        });

        it('should calculate Tithi 30 (Amavasya) at 350 longitude difference', () => {
            const sunLong = 0;
            const moonLong = 350;
            const res = calculatePanchanga(0, sunLong, moonLong, new Date());
            expect(res.tithi.number).toBe(30);
        });

        it('should calculate Tithi 15 (Purnima) at 180 longitude difference', () => {
            const sunLong = 0;
            const moonLong = 180;
            const res = calculatePanchanga(0, sunLong, moonLong, new Date());
            expect(res.tithi.number).toBe(15);
            expect(res.tithi.name).toBe('Purnima');
        });
    });
});
