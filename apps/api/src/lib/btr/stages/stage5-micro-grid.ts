/**
 * Stage 5: Micro Grid
 *
 * Generates ultra-fine time grid at 3-second intervals around
 * Stage 4 survivors for final precision candidates.
 * 
 * D150 Nadi Amsha changes every ~4.8 seconds
 * 3-second intervals ensure we capture every D150 transition
 */

import { SecondsPrecisionInput } from '@ai-pandit/shared';
import { CandidateTime, generateRefinementGrid, getCandidateIdentity, sortCandidatesByMerit } from '../../time-offset-manager.js';
import { ProgressTracker } from '../../progress-tracker.js';
import { StageResult } from '@ai-pandit/shared';
import { logger } from '../../logger.js';

function getStage5FocusCount(offsetMinutes: number, survivorsCount: number): number {
    if (survivorsCount <= 3) return survivorsCount;
    if (offsetMinutes <= 30) return Math.min(5, survivorsCount);
    if (offsetMinutes <= 120) return Math.min(4, survivorsCount);
    return Math.min(3, survivorsCount);
}

function getMicroGridParams(offsetMinutes: number): { rangeMinutes: number; intervalSeconds: number } {
    if (offsetMinutes <= 30) {
        return { rangeMinutes: 1, intervalSeconds: 2 };
    }
    if (offsetMinutes <= 120) {
        return { rangeMinutes: 0.75, intervalSeconds: 3 };
    }
    if (offsetMinutes <= 360) {
        return { rangeMinutes: 1, intervalSeconds: 4 };
    }
    return { rangeMinutes: 1.5, intervalSeconds: 6 };
}

/**
 * Stage 5: Generate micro-precision grid around Stage 4 survivors
 * Uses 3-second intervals to capture D150 Nadi transitions (~4.8s resolution)
 *
 * @param input - BTR input parameters
 * @param survivors - Survivors from Stage 4
 * @param progress - Progress tracker
 * @returns Micro-precision candidates and stage result
 */
export async function stage5MicroGrid(
    input: SecondsPrecisionInput,
    survivors: CandidateTime[],
    progress: ProgressTracker
): Promise<{ candidates: CandidateTime[]; stageResult: StageResult }> {
    await progress.startStep('micro', 'Stage 5: Micro-precision grid (D150 Nadi Resolution)...');

    if (!survivors || survivors.length === 0) {
        logger.error('🔱 [STAGE-5] FAILED: No survivors provided for micro-grid generation');
        throw new Error('AI_OUT_OF_CANDIDATES: No birth time candidates survived the previous analysis stages. This usually happens when life events and forensic traits are highly contradictory.');
    }

    const microCandidates: CandidateTime[] = [];

    const offsetMinutes = input.offsetConfig.customMinutes ||
        (input.offsetConfig.preset === '30min' ? 30 :
            input.offsetConfig.preset === '1hour' ? 60 :
                input.offsetConfig.preset === '2hours' ? 120 :
                    input.offsetConfig.preset === '4hours' ? 240 :
                        input.offsetConfig.preset === '6hours' ? 360 :
                            input.offsetConfig.preset === '12hours' ? 720 : 60);

    const rankedSurvivors = sortCandidatesByMerit(survivors);

    const focusCount = getStage5FocusCount(offsetMinutes, rankedSurvivors.length);
    const microGridParams = getMicroGridParams(offsetMinutes);

    // Adaptive micro-grid around top-K survivors.
    for (const survivor of rankedSurvivors.slice(0, focusCount)) {
        const microGrid = generateRefinementGrid(
            survivor,
            microGridParams.rangeMinutes,
            microGridParams.intervalSeconds
        );

        for (const gridPoint of microGrid) {
            if (!microCandidates.some(c => getCandidateIdentity(c) === getCandidateIdentity(gridPoint))) {
                microCandidates.push(gridPoint);
            }
        }
    }

    await progress.completeStep('micro', [
        `Generated D150-precision grid: ${microCandidates.length} candidates`,
        `Adaptive focus: top ${focusCount}/${rankedSurvivors.length}, interval=${microGridParams.intervalSeconds}s`
    ]);

    return {
        candidates: microCandidates,
        stageResult: {
            stageNumber: 5,
            stageName: 'Micro Precision Grid (D150 Nadi Resolution)',
            candidatesIn: survivors.length,
            candidatesOut: microCandidates.length
        }
    };
}
