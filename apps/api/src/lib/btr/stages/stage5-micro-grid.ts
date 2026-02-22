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
import { CandidateTime, generateRefinementGrid } from '../../time-offset-manager.js';
import { ProgressTracker } from '../../progress-tracker.js';
import { StageResult } from '@ai-pandit/shared';

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

    const microCandidates: CandidateTime[] = [];

    // Generate ±45 sec grid at 3-sec interval around top 3 survivors
    // 3-second interval captures D150 Nadi Amsha changes (~4.8s resolution)
    // ±45 seconds = 30 candidates per survivor = 90 total candidates
    for (const survivor of survivors.slice(0, 3)) {
        const microGrid = generateRefinementGrid(survivor.time, 0.75, 3); // ±45 sec @ 3 sec

        for (const gridPoint of microGrid) {
            if (!microCandidates.some(c => c.time === gridPoint.time)) {
                microCandidates.push(gridPoint);
            }
        }
    }

    await progress.completeStep('micro', [`Generated D150-precision grid: ${microCandidates.length} candidates (3-sec intervals)`]);

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
