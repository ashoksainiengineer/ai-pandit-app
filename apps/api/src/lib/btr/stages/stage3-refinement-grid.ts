/**
 * Stage 3: Refinement Grid
 *
 * Expands around Stage 2 survivors with a fine-grained time grid
 * at 1-minute intervals for more precise candidate selection.
 */

import { SecondsPrecisionInput } from '@ai-pandit/shared';
import { CandidateTime, generateRefinementGrid } from '../../time-offset-manager.js';
import { ProgressTracker } from '../../progress-tracker.js';
import { StageResult } from '@ai-pandit/shared';

function getStage3FocusCount(offsetMinutes: number, survivorsCount: number): number {
    if (survivorsCount <= 3) return survivorsCount;
    if (offsetMinutes <= 30) return Math.min(7, survivorsCount);
    if (offsetMinutes <= 120) return Math.min(6, survivorsCount);
    if (offsetMinutes <= 360) return Math.min(5, survivorsCount);
    return Math.min(4, survivorsCount);
}

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

    const rankedSurvivors = [...survivors].sort((a, b) => {
        const absDiff = Math.abs(a.offsetMinutes) - Math.abs(b.offsetMinutes);
        if (absDiff !== 0) return absDiff;
        const signedDiff = a.offsetMinutes - b.offsetMinutes;
        if (signedDiff !== 0) return signedDiff;
        return a.time.localeCompare(b.time);
    });

    const focusCount = getStage3FocusCount(offsetMinutes, rankedSurvivors.length);

    // Generate explicit dynamic grids around adaptive top-K survivors
    for (const survivor of rankedSurvivors.slice(0, focusCount)) {
        const fineGrid = generateRefinementGrid(survivor.time, rangeMinutes, intervalSeconds); // Telescopic Focus

        for (const gridPoint of fineGrid) {
            // Check if already exists
            if (!refinedCandidates.some(c => c.time === gridPoint.time)) {
                refinedCandidates.push(gridPoint);
            }
        }
    }

    await progress.completeStep('fine', [
        `Generated refinement grid: ${refinedCandidates.length} points`,
        `Adaptive focus: top ${focusCount}/${rankedSurvivors.length} survivors`
    ]);

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
