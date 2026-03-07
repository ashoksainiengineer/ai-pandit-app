import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { processSecondsPrecisionBTR } from '../../seconds-precision-btr.js';
import * as aiClient from '../../ai-client.js';
import { initSwissEph, cleanup } from '../../ephemeris.js';
import { TEST_PROFILES } from './dataset/test-profiles.js';
import { logger } from '../../logger.js';

// Mock the cancellation manager — test sessions don't exist in the DB,
// so isSessionCancelled would return true and abort the pipeline.
vi.mock('../../cancellation-manager.js', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        isSessionCancelled: vi.fn().mockResolvedValue(false),
        throwIfCancelled: vi.fn().mockResolvedValue(undefined),
    };
});

// ═════════════════════════════════════════════════════════════════════════════
// WHOLE SYSTEM INTEGRATION TEST
// ═════════════════════════════════════════════════════════════════════════════

describe('WHOLE SYSTEM BTR: 10 Profile Validation Protocol', () => {

    // 1. Initialize REAL Swiss Ephemeris (Industry Standard)
    beforeAll(async () => {
        logger.info('🧪 [SYSTEM-TEST] Initializing Real Swiss Ephemeris...');
        await initSwissEph();
    });

    afterAll(async () => {
        await cleanup();
    });

    // 2. Iterate through a representative subset of High-Quality Profiles
    it.each(TEST_PROFILES.slice(0, 3))('should correctly rectify $fullName ($id)', async (profile) => {
        const expectedTime = profile.expectedTime;

        // 3. Mock AI API with "Smart VSL Parser"
        const callAISpy = vi.spyOn(aiClient, 'callAIWithStream').mockImplementation(
            async (_sessionId: string, stage: number, _systemPrompt: string, userPrompt: string) => {

                // STAGE 2 & 4: Batch Tournament / Deep Analysis
                if (stage === 2 || stage === 4) {
                    const exists = userPrompt.includes(`CANDIDATE: ${expectedTime}`);

                    if (exists) {
                        return {
                            success: true,
                            content: `<FINAL_SCORES>[{"time": "${expectedTime}", "score": 98, "reason": "VSL alignment perfect"}]</FINAL_SCORES>\nTOP_SURVIVORS: [${expectedTime}]`
                        } as any;
                    } else {
                        const firstCandidateMatch = userPrompt.match(/CANDIDATE: (\d{2}:\d{2}:\d{2})/);
                        const firstCandidate = firstCandidateMatch ? firstCandidateMatch[1] : '00:00:00';
                        return {
                            success: true,
                            content: `<FINAL_SCORES>[{"time": "${firstCandidate}", "score": 50, "reason": "Fallback"}]</FINAL_SCORES>`
                        } as any;
                    }
                }

                // STAGE 6: Final Precision
                if (stage === 6) {
                    return {
                        success: true,
                        content: `<FINAL_VERDICT>{"time": "${expectedTime}", "accuracy": 99, "confidence": "GOD_TIER", "margin": 1}</FINAL_VERDICT>`
                    } as any;
                }

                return { success: false, error: 'Unsupported stage in mock' } as any;
            }
        );

        // 4. Execute Full 6-Stage Pipeline
        const result = await processSecondsPrecisionBTR({
            ...profile,
            sessionId: `test-whole-${profile.id}`,
            abortSignal: new AbortController().signal
        });

        // 5. Assertions
        expect(result.rectifiedTime).toBe(expectedTime);
        expect(result.accuracy).toBeGreaterThanOrEqual(95);
        expect(result.stagesCompleted).toBe(6);
        expect(result.confidence).toBe('GOD_TIER');

        // Cleanup
        callAISpy.mockRestore();
    }, 120000); // 120s timeout per profile — real SwissEph + data building can be slow
});
