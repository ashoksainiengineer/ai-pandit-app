/**
 * Stage 3: Refinement Grid
 *
 * Expands around Stage 2 survivors with a fine-grained time grid
 * at 1-minute intervals for more precise candidate selection.
 */

import { SecondsPrecisionInput } from '../../../types/index.js';
import { CandidateTime, generateRefinementGrid } from '../../time-offset-manager.js';
import { ProgressTracker } from '../../progress-tracker.js';
import { StageResult } from '../types.js';

/**
 * Stage 3: Generate refinement grid around Stage 2 survivors
 *
 * @param input - BTR input parameters
 * @param survivors - Survivors from Stage 2
 * @param progress - Progress tracker
 * @returns Refined candidates and stage result
 */
export async function stage3RefinementGrid(
    input: SecondsPrecisionInput,
    survivors: CandidateTime[],
    progress: ProgressTracker
): Promise<{ candidates: CandidateTime[]; stageResult: StageResult }> {
    await progress.startStep('fine', 'Stage 3: Generating refinement grid...');

    const refinedCandidates: CandidateTime[] = [];

    // Generate ±5 min grid at 1-min interval around each survivor
    for (const survivor of survivors.slice(0, 3)) {
        const fineGrid = generateRefinementGrid(survivor.time, 5, 60); // ±5 min @ 1 min

        for (const gridPoint of fineGrid) {
            // Check if already exists
            if (!refinedCandidates.some(c => c.time === gridPoint.time)) {
                refinedCandidates.push(gridPoint);
            }
        }
    }

    await progress.completeStep('fine', [`Generated refinement grid: ${refinedCandidates.length} points`]);

    return {
        candidates: refinedCandidates,
        stageResult: {
            stageNumber: 3,
            stageName: 'Refinement Grid',
            candidatesIn: survivors.length,
            candidatesOut: refinedCandidates.length
        }
    };
}
