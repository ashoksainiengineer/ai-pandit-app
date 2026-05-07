import { describe, it, expect, beforeAll } from 'vitest';
import { buildCandidateDataPackage } from '../data-package-builder.js';
import { initEphemerisProvider } from '../../ephemeris.js';
import { getBatchPrompt, getDeepAnalysisPrompt, getFinalPrecisionPrompt } from '../prompts/index.js';
import type { SecondsPrecisionInput } from '@ai-pandit/shared';

describe('AI Prompt DMS Validation', () => {

    beforeAll(async () => {
        await initEphemerisProvider();
    });

    it('ALL prompts MUST contain Degrees in DMS format (DD° MM\' SS")', async () => {
        const mockInput: SecondsPrecisionInput = {
            sessionId: 'test-session',
            dateOfBirth: '1990-05-15',
            tentativeTime: '09:41:00',
            latitude: 19.0760,
            longitude: 72.8777,
            timezone: 5.5,
            lifeEvents: [],
            offsetConfig: { preset: '30min', description: 'Test offset' },
        };


        // 1. Build a real data package
        // 1. Build a real data package
        const dataPackage = await buildCandidateDataPackage(
            '10:30:00',
            0,
            mockInput,
            { includeFullData: true }
        );

        const candidates = [dataPackage];

        // 2. Generate prompts
        const batchPrompt = getBatchPrompt(candidates, [], 1, 1, 1);
        const deepPrompt = getDeepAnalysisPrompt(candidates, [], null);
        const finalPrompt = getFinalPrecisionPrompt(candidates, [], null);

        // 3. VSL 4.0 Assertions (DMS is now nested in VSL)
        const vslRegex = /Su\[[A-Z][a-z]\|\d{1,2}° \d{2}' \d{2}"/; // Matches Sun's VSL entry

        // Batch Prompt
        expect(batchPrompt).toContain('CANDIDATE: 10:30:00');
        expect(batchPrompt).toMatch(vslRegex);

        // Deep Prompt
        expect(deepPrompt).toContain('STAGE 4');
        expect(deepPrompt).toMatch(vslRegex);

        // Final Prompt
        expect(finalPrompt).toContain('FINAL STAGE');
        expect(finalPrompt).toMatch(vslRegex);

        // 4. Check for binary/leakage indicators
        const leakage = ['[object Object]', 'undefined', 'NaN'];
        console.log("=== BATCH PROMPT ===");
        batchPrompt.split('\n').filter(l => l.includes('[object Object]')).forEach(l => console.log(l));
        console.log("=== DEEP PROMPT ===");
        deepPrompt.split('\n').filter(l => l.includes('[object Object]')).forEach(l => console.log(l));
        console.log("=== FINAL PROMPT ===");
        finalPrompt.split('\n').filter(l => l.includes('[object Object]')).forEach(l => console.log(l));

        leakage.forEach(pattern => {
            expect(batchPrompt, `Batch Prompt contains leak: ${pattern}`).not.toContain(pattern);
            expect(deepPrompt, `Deep Prompt contains leak: ${pattern}`).not.toContain(pattern);
            expect(finalPrompt, `Final Prompt contains leak: ${pattern}`).not.toContain(pattern);
        });

        // 5. Blind-mode assertions:
        // AI should not get direct "tentative/original" markers or DOB labels.
        // Candidate times are expected, but original-anchor metadata is not.
        const forbiddenMarkers = [
            'dateOfBirth',
            'tentativeTime',
            'Tentative (Original)',
            'Original Time',
            'DOB'
        ];

        forbiddenMarkers.forEach(marker => {
            expect(batchPrompt, `Batch Prompt contains forbidden marker: ${marker}`).not.toContain(marker);
            expect(deepPrompt, `Deep Prompt contains forbidden marker: ${marker}`).not.toContain(marker);
            expect(finalPrompt, `Final Prompt contains forbidden marker: ${marker}`).not.toContain(marker);
        });

        console.log('✅ ALL AI PROMPTS VERIFIED FOR DMS PRECISION');
    });
});
