import { describe, it, expect, beforeAll } from 'vitest';
import { buildCandidateDataPackage } from '../data-package-builder.js';
import { initSwissEph } from '../../ephemeris.js';
import { getBatchPrompt, getDeepAnalysisPrompt, getFinalPrecisionPrompt } from '../prompts/index.js';
import type { SecondsPrecisionInput, ForensicTraits } from '@ai-pandit/shared';

describe('AI Prompt DMS Validation', () => {

    beforeAll(async () => {
        await initSwissEph();
    });

    it('ALL prompts MUST contain Degrees in DMS format (DD° MM\' SS")', async () => {
        const mockInput: SecondsPrecisionInput = {
            dateOfBirth: '1990-05-15',
            latitude: 19.0760,
            longitude: 72.8777,
            timezone: 5.5,
            lifeEvents: []
        };

        const forensicTraits: ForensicTraits = {
            physical: { facialStructure: { forehead: 'broad', eyeShape: 'almond' } },
            psychographic: { temperament: 'calm' },
            biological: { prakriti: 'pitta' }
        };

        // 1. Build a real data package
        const dataPackage = await buildCandidateDataPackage(
            '10:30:00',
            0,
            mockInput,
            { includeFullData: true }
        );

        const candidates = [dataPackage];

        // 2. Generate prompts
        const batchPrompt = getBatchPrompt(candidates, [], forensicTraits, 1, 1, 1);
        const deepPrompt = getDeepAnalysisPrompt(candidates, [], forensicTraits, null);
        const finalPrompt = getFinalPrecisionPrompt(candidates, [], forensicTraits, null);

        // 3. Brutal DMS Assertions
        const dmsRegex = /\d{1,2}° \d{2}' \d{2}"/;

        // Batch Prompt
        expect(batchPrompt).toContain('10:30:00');
        expect(batchPrompt).toMatch(dmsRegex);

        // Deep Prompt
        expect(deepPrompt).toContain('STAGE 4');
        expect(deepPrompt).toMatch(dmsRegex);

        // Final Prompt
        expect(finalPrompt).toContain('FINAL STAGE');
        expect(finalPrompt).toMatch(dmsRegex);

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

        console.log('✅ ALL AI PROMPTS VERIFIED FOR DMS PRECISION');
    });
});
