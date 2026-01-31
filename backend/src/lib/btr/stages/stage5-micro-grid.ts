/**
 * Stage 5: Micro Grid
 *
 * Generates ultra-fine time grid at 6-second intervals around
 * Stage 4 survivors for final precision candidates.
 */

import { SecondsPrecisionInput } from '../../../types/index.js';
import { CandidateTime, generateRefinementGrid } from '../../time-offset-manager.js';
import { ProgressTracker } from '../../progress-tracker.js';
import { StageResult } from '../types.js';

/**
 * Stage 5: Generate micro-precision grid around Stage 4 survivors
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
    await progress.startStep('micro', 'Stage 5: Micro-precision grid...');

    const microCandidates: CandidateTime[] = [];

    // Generate ±30 sec grid at 6-sec interval around top 3 survivors
    for (const survivor of survivors.slice(0, 3)) {
        const microGrid = generateRefinementGrid(survivor.time, 0.5, 6); // ±30 sec @ 6 sec

        for (const gridPoint of microGrid) {
            if (!microCandidates.some(c => c.time === gridPoint.time)) {
                microCandidates.push(gridPoint);
            }
        }
    }

    await progress.completeStep('micro', [`Generated micro grid: ${microCandidates.length} candidates`]);

    return {
        candidates: microCandidates,
        stageResult: {
            stageNumber: 5,
            stageName: 'Micro Precision Grid',
            candidatesIn: survivors.length,
            candidatesOut: microCandidates.length
        }
    };
}
