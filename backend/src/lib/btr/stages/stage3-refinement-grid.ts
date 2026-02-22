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

    // Extract offset for Telescopic Zoom Logic
    const offsetMinutes = input.offsetConfig.customMinutes ||
        (input.offsetConfig.preset === '30min' ? 30 :
            input.offsetConfig.preset === '1hour' ? 60 :
                input.offsetConfig.preset === '2hours' ? 120 :
                    input.offsetConfig.preset === '4hours' ? 240 :
                        input.offsetConfig.preset === '6hours' ? 360 :
                            input.offsetConfig.preset === '12hours' ? 720 : 60);

    // 🔱 TELESCOPIC ZOOM LOGIC (Dynamic Stage 3 Fences)
    let rangeMinutes = 5;
    let intervalSeconds = 60;

    if (offsetMinutes <= 15) {
        // Gear 1: Bypass Stage 3 (Stage 1 is already at D150/D60 precision)
        await progress.completeStep('fine', [`Bypassed refinement: Phase already at terminal precision`]);
        return {
            candidates: survivors, // Return originals perfectly untouched
            stageResult: {
                stageNumber: 3,
                stageName: 'Refinement Grid (Bypassed)',
                candidatesIn: survivors.length,
                candidatesOut: survivors.length
            }
        };
    } else if (offsetMinutes <= 30) {
        // Gear 2: Standard Window (±30m) -> Shrink to 15s to catch D60 shifts securely
        rangeMinutes = 3;
        intervalSeconds = 15;
    } else if (offsetMinutes <= 120) {
        // Gear 3: Wide Window (±1 to ±2h) -> Shrink to 30s to map D60 deeply
        rangeMinutes = 5;
        intervalSeconds = 30;
    } else if (offsetMinutes <= 360) {
        // Gear 4: Massive Window (±4 to ±6h) -> Shrink back to Standard Window mapping securely
        rangeMinutes = 10;
        intervalSeconds = 60;
    } else {
        // Gear 5: Absolute Unknown (±12h) -> Mega zoom from 5m down to 60s
        rangeMinutes = 15;
        intervalSeconds = 60;
    }

    // Generate explicit dynamic grids around top 3 survivors
    for (const survivor of survivors.slice(0, 3)) {
        const fineGrid = generateRefinementGrid(survivor.time, rangeMinutes, intervalSeconds); // Telescopic Focus

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
