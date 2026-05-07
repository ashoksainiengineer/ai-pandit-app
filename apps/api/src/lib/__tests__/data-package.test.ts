import { describe, it, expect } from 'vitest';
import { buildCandidateDataPackage } from '../btr/data-package-builder.js';
import { SecondsPrecisionInput, CandidateDataPackageSchema } from '@ai-pandit/shared';

describe('Data Package Builder - Explicit Validation', () => {
    // Golden Sample: Jan 1, 1980, 12:00:00 (Delhi)
    const mockInput: SecondsPrecisionInput = {
        sessionId: 'test-session',
        dateOfBirth: '1980-01-01',
        tentativeTime: '12:00:00',
        latitude: 28.6139,
        longitude: 77.2090,
        timezone: 5.5,
        lifeEvents: [],
        offsetConfig: { description: 'test' },
    };

    it('should produce a valid CandidateDataPackage structure', async () => {
        const dataPackage = await buildCandidateDataPackage(
            '12:00:00',
            0,
            mockInput,
            { dashaDepth: 2 }
        );

        // Explicit Zod validation replaces brittle snapshot testing (Desloppify 4.1).
        expect(() => CandidateDataPackageSchema.parse(dataPackage)).not.toThrow();
    });

    it('should generate all required engine components', async () => {
        const dataPackage = await buildCandidateDataPackage(
            '12:00:00',
            0,
            mockInput,
            { dashaDepth: 2 }
        );

        expect(dataPackage.vargaDegrees).toBeDefined();
        expect(dataPackage.vimshottariDasha).toBeDefined();
        expect(dataPackage.panchanga).toBeDefined();
        expect(dataPackage.planets).toBeDefined();
        expect(dataPackage.ascendant).toBeDefined();
    });
});
