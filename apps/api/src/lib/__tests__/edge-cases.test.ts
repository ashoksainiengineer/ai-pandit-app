import { describe, it, expect } from 'vitest';
import { calculateEphemeris } from '../ephemeris.js';

describe('Vedic Engine - Edge Cases (Heavy Duty)', () => {

    it('should handle exact midnight transitions (New Year)', async () => {
        const midnight = {
            date: '1999-12-31',
            time: '23:59:59',
            latitude: 28.6139,
            longitude: 77.2090,
            timezone: 5.5
        };

        const eph = await calculateEphemeris(midnight.date, midnight.time, midnight.latitude, midnight.longitude, midnight.timezone);
        expect(eph).toBeDefined();

        const nextSec = await calculateEphemeris('2000-01-01', '00:00:01', 28.6139, 77.2090, 5.5);
        expect(nextSec).toBeDefined();

        expect(Math.abs(eph.planets.sun.longitude - nextSec.planets.sun.longitude)).toBeLessThan(0.1);
    });

    it('should confidently calculate for North Pole (Extreme Latitude)', async () => {
        const northPole = {
            date: '2024-06-21', // Summer Solstice
            time: '12:00:00',
            latitude: 89.99, // Near exact north pole
            longitude: 0.0,
            timezone: 0
        };

        const eph = await calculateEphemeris(northPole.date, northPole.time, northPole.latitude, northPole.longitude, northPole.timezone);

        expect(eph).toBeDefined();
        // Ascendant should still be calculable, though polar houses get distorted
        expect(eph.ascendant.longitude).not.toBeNaN();
    });

    it('should confidently calculate for exactly the Equator', async () => {
        const equator = {
            date: '2024-03-20', // Spring Equinox
            time: '12:00:00',
            latitude: 0.0,
            longitude: 0.0,
            timezone: 0
        };

        const eph = await calculateEphemeris(equator.date, equator.time, equator.latitude, equator.longitude, equator.timezone);

        expect(eph).toBeDefined();
        expect(eph.ascendant.longitude).not.toBeNaN();
    });

    it('should handle leap seconds date equivalents smoothly (e.g. 23:59:60 mapped or 23:59:59)', async () => {
        const leapSecond = {
            date: '2016-12-31',
            time: '23:59:59',
            latitude: 28.0,
            longitude: 77.0,
            timezone: 0
        };

        const eph = await calculateEphemeris(leapSecond.date, leapSecond.time, leapSecond.latitude, leapSecond.longitude, leapSecond.timezone);
        expect(eph).toBeDefined();
        expect(eph.planets.sun.longitude).toBeGreaterThan(0);
    });

    it('should throw error for invalid latitudes', async () => {
        await expect(calculateEphemeris('1980-01-01', '12:00:00', 95, 77, 5.5))
            .rejects.toThrow(/Invalid latitude/);
    });

    it('should hard-fail malformed date input in strict mode', async () => {
        await expect(calculateEphemeris('invalid-date', '12:00:00', 28, 77, 5.5))
            .rejects.toThrow(/Invalid birthDate/);
    });
});
