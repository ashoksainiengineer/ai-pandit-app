import { describe, it, expect } from 'vitest';
import { calculateEphemeris } from '../ephemeris.js';

describe('Global Astrological Logic - Geographic Regions', () => {
    // Test Case: Southern Hemisphere (Sydney, Australia)
    // Latitude is negative
    it('should handle Southern Hemisphere calculations (Sydney)', async () => {
        const sydney = {
            date: '1995-06-15',
            time: '14:30:00',
            latitude: -33.8688,
            longitude: 151.2093,
            timezone: 10
        };

        const eph = await calculateEphemeris(sydney.date, sydney.time, sydney.latitude, sydney.longitude, sydney.timezone);

        expect(eph).toBeDefined();
        expect(eph.ascendant).toBeDefined();
        expect(eph.planets).toBeDefined();

        // In Southern Hemisphere, house calculation logic must be robust
        expect(eph.houses.length).toBe(12);
    });

    // Test Case: Western Hemisphere (New York, USA)
    // Longitude is negative
    it('should handle Western Hemisphere calculations (New York)', async () => {
        const nyc = {
            date: '2000-01-01',
            time: '08:00:00',
            latitude: 40.7128,
            longitude: -74.0060,
            timezone: -5
        };

        const eph = await calculateEphemeris(nyc.date, nyc.time, nyc.latitude, nyc.longitude, nyc.timezone);

        expect(eph).toBeDefined();
        expect(eph.planets.sun.sign).toBeDefined();
    });

    // Test Case: Extreme North Latitude (Oslo, Norway)
    // High latitude can cause issues for some house systems
    it('should handle High Latitude calculations (Oslo)', async () => {
        const oslo = {
            date: '1985-12-21',
            time: '12:00:00',
            latitude: 59.9139,
            longitude: 10.7522,
            timezone: 1
        };

        const eph = await calculateEphemeris(oslo.date, oslo.time, oslo.latitude, oslo.longitude, oslo.timezone);

        expect(eph).toBeDefined();
        // Verify Ascendant exists even at extreme latitudes
        expect(eph.ascendant.longitude).toBeGreaterThanOrEqual(0);
        expect(eph.ascendant.longitude).toBeLessThan(360);
    });
});
