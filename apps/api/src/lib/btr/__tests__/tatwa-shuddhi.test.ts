import { describe, it, expect } from 'vitest';
import { TatwaShuddhi } from '../tatwa-shuddhi.js';

describe('Vedic Engine - Tatwa Shuddhi Analysis', () => {
    // Basic test case for Tatwa Shuddhi corrections
    it('should calculate valid correction windows for morning births', () => {
        // Sunrise around 6 AM
        const sunriseTime = new Date('2024-01-01T06:00:00.000Z');
        // Tentative birth time: 7:30 AM (90 mins after sunrise)
        // 90 mins / 26 mins per cycle = 3.46 cycles = 4th cycle (Vayu tatwa usually)
        const tentativeTime = new Date('2024-01-01T07:30:00.000Z');

        const result = TatwaShuddhi.findCorrections({
            sunriseTime,
            birthTime: tentativeTime,
            // Assuming the candidate is predominantly 'pitta' (Fire/Agni)
            // No knownPrakriti provided
        });

        expect(result).toBeDefined();
        expect(result.correctionWindows).toBeInstanceOf(Array);

        // If known prakriti is provided, it should try to find matching tatwa windows
        if (result.correctionWindows.length > 0) {
            expect(result.correctionWindows[0]).toHaveProperty('startTime');
            expect(result.correctionWindows[0]).toHaveProperty('endTime');
            expect(result.correctionWindows[0]).toHaveProperty('tatwa');
        }
    });

    it('should generate cycle sequence correctly', () => {
        const sunriseTime = new Date('2024-01-01T06:00:00.000Z');
        // Test getting windows for 2 hours (approx 1 full cycle of 130 mins)
        const windows = TatwaShuddhi.getDailyWindows(sunriseTime, 2);
        expect(windows.length).toBeGreaterThanOrEqual(4);

        // Standard sequence: Prithvi -> Jala -> Agni -> Vayu -> Akasha
        expect(windows[0].tatwa).toBe('prithvi');
        expect(windows[1].tatwa).toBe('jala');
    });
});
