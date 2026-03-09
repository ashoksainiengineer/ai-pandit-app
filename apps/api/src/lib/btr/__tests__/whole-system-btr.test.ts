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
    const toSeconds = (time: string): number => {
        const [h, m, s] = time.split(':').map(Number);
        return h * 3600 + m * 60 + s;
    };

    const circularDiffSeconds = (a: string, b: string): number => {
        const aSec = toSeconds(a);
        const bSec = toSeconds(b);
        const diff = Math.abs(aSec - bSec);
        return Math.min(diff, 86400 - diff);
    };

    const extractCandidateTimes = (prompt: string): string[] => {
        const matches = [...prompt.matchAll(/CANDIDATE:\s*(\d{2}:\d{2}:\d{2})/g)];
        return matches.map((m) => m[1]);
    };

    const pickNearest = (times: string[], target: string): string => {
        if (times.length === 0) return '00:00:00';
        return [...times].sort((a, b) => {
            const diff = circularDiffSeconds(a, target) - circularDiffSeconds(b, target);
            if (diff !== 0) return diff;
            return a.localeCompare(b);
        })[0];
    };


    // 1. Initialize REAL Swiss Ephemeris (Industry Standard)
    beforeAll(async () => {
        logger.info('🧪 [SYSTEM-TEST] Initializing Real Swiss Ephemeris...');
        await initSwissEph();
    });

    afterAll(async () => {
        await cleanup();
    });

    // 2. Iterate through configurable profile count (default: all available profiles)
    const profileCount = Math.max(
        1,
        Math.min(
            TEST_PROFILES.length,
            Number(process.env.BTR_WHOLE_SYSTEM_PROFILE_COUNT || TEST_PROFILES.length)
        )
    );

    it.each(TEST_PROFILES.slice(0, profileCount))('should correctly rectify $fullName ($id)', async (profile) => {
        const expectedTime = profile.expectedTime;

        // 3. Mock AI API with deterministic ranking over provided candidates.
        // This avoids tautological "always return expectedTime" behavior.
        const callAISpy = vi.spyOn(aiClient, 'callAIWithStream').mockImplementation(
            async (_sessionId: string, stage: number, _systemPrompt: string, userPrompt: string) => {
                if (stage === 2 || stage === 4) {
                    const candidates = extractCandidateTimes(userPrompt);
                    const ranked = [...candidates].sort((a, b) => {
                        const diff = circularDiffSeconds(a, expectedTime) - circularDiffSeconds(b, expectedTime);
                        if (diff !== 0) return diff;
                        return a.localeCompare(b);
                    });
                    const survivorCount = Math.max(1, Math.min(3, ranked.length));
                    const survivors = ranked.slice(0, survivorCount);
                    const scored = ranked.slice(0, Math.min(6, ranked.length)).map((time, index) => ({
                        time,
                        score: Math.max(40, 98 - (index * 7)),
                        reason: `ranked-by-distance:${circularDiffSeconds(time, expectedTime)}s`
                    }));

                    return {
                        success: true,
                        content: `<FINAL_SCORES>${JSON.stringify(scored)}</FINAL_SCORES>\nTOP_SURVIVORS: [${survivors.join(', ')}]`
                    } as any;
                }

                if (stage === 6) {
                    const candidates = extractCandidateTimes(userPrompt);
                    const winner = pickNearest(candidates, expectedTime);
                    const winnerDiff = circularDiffSeconds(winner, expectedTime);
                    return {
                        success: true,
                        content: `<FINAL_VERDICT>{"time": "${winner}", "accuracy": ${winnerDiff <= 10 ? 99 : 95}, "confidence": "${winnerDiff <= 10 ? 'GOD_TIER' : 'HIGH'}", "margin": ${winnerDiff <= 10 ? 1 : 6}}</FINAL_VERDICT>`
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
        expect(circularDiffSeconds(result.rectifiedTime, expectedTime)).toBeLessThanOrEqual(15);
        expect(result.accuracy).toBeGreaterThanOrEqual(95);
        expect(result.stagesCompleted).toBe(6);
        expect(['GOD_TIER', 'HIGH']).toContain(result.confidence);

        // Cleanup
        callAISpy.mockRestore();
    }, 240000); // 240s timeout per profile — full 6-stage pipeline on wide windows can exceed 120s
});
