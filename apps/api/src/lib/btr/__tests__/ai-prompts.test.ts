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
            sessionId: 'test-session',
            dateOfBirth: '1990-05-15',
            tentativeTime: '10:30:00',
            latitude: 19.0760,
            longitude: 72.8777,
            timezone: 5.5,
            lifeEvents: [],
            offsetConfig: { preset: '30min', description: 'Test offset' },
            forensicTraits: {
                physical: {
                    facialStructure: {
                        forehead: 'broad',
                        eyeShape: 'almond',
                        noseType: 'straight',
                        teethAlignment: 'perfect',
                        voicePitch: 'medium'
                    },
                    skinHair: {
                        texture: 'dry',
                        hairType: 'straight',
                        complexion: 'medium',
                        marks: []
                    },
                    build: 'medium',
                    height: { cm: 175, feet: 5, inches: 9 }
                },
                psychographic: {
                    speechStyle: 'measured_soft',
                    decisionMaking: 'deliberate',
                    stressResponse: 'calm',
                    sleepCycle: 'early_bird',
                    temperament: 'patient'
                },
                biological: {
                    prakriti: 'pitta',
                    sensitivity: { heat: 'medium', cold: 'medium' },
                    recurringHealthIssues: []
                },
                family: {
                    siblingPosition: 'eldest',
                    brotherCount: 1,
                    sisterCount: 0,
                    fatherStatusAtBirth: 'stable',
                    motherHealthAtBirth: 'normal'
                }
            }
        };

        const forensicTraits = mockInput.forensicTraits;

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

        console.log('✅ ALL AI PROMPTS VERIFIED FOR DMS PRECISION');
    });
});
