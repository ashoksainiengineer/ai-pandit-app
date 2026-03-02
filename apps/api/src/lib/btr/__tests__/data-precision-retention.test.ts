import { describe, it, expect, beforeAll } from 'vitest';
import { buildCandidateDataPackage } from '../data-package-builder.js';
import { initSwissEph } from '../../ephemeris.js';
import type { SecondsPrecisionInput } from '@ai-pandit/shared';

describe('Elite E2E Data Precision Retention (DMS)', () => {

    beforeAll(async () => {
        // Ensure the WASM engine is loaded
        await initSwissEph();
    });

    it('MUST retain high precision and follow traditional DMS format (DD° MM\' SS") for AI', async () => {

        const mockInput: SecondsPrecisionInput = {
            dateOfBirth: '2000-01-01',
            latitude: 28.6139,
            longitude: 77.2090,
            timezone: 5.5,
            lifeEvents: []
        };

        // 1. Build the data package exactly as production does
        const dataPackage = await buildCandidateDataPackage(
            '12:00:00',
            0,
            mockInput,
            { includeFullData: true }
        );

        // 2. Extract the stringified payload values sent to the AI Context
        const formattedDegrees: string[] = [];

        // Check Varga Degrees
        if (dataPackage.vargaDegrees) {
            Object.values(dataPackage.vargaDegrees).forEach(vargaGroup => {
                Object.values(vargaGroup).forEach(degStr => formattedDegrees.push(degStr as string));
            });
        }

        // Check Special Points
        if (dataPackage.specialPoints) {
            Object.values(dataPackage.specialPoints).forEach(pt => {
                if (pt.degree) formattedDegrees.push(pt.degree);
            });
        }

        expect(formattedDegrees).toBeDefined();
        expect(formattedDegrees.length).toBeGreaterThan(0);

        // 3. Brutal Assertion: Every single formatted degree MUST match the DMS pattern
        // Regex for DD° MM' SS" (e.g. "15° 30' 45\"")
        const dmsRegex = /\d{1,2}° \d{2}' \d{2}"/;

        let invalidCount = 0;
        formattedDegrees.forEach(match => {
            // Some might be "Unknown" or placeholders, skip those. 
            // AL/UL BB are initialized with 0° 00' 00"
            if (match.includes('°')) {
                const isValid = dmsRegex.test(match);
                if (!isValid) {
                    console.error('DMS FORMAT VIOLATION DETECTED:', match);
                    invalidCount++;
                }
            }
        });

        expect(invalidCount).toBe(0);
    });
});
