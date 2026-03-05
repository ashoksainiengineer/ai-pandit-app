/**
 * Birth Time Rectification (BTR) - Seconds Precision Processing
 *
 * Implements a 6-stage tournament system for determining accurate birth time
 * with seconds-level precision. Uses AI-powered analysis combined with
 * Vedic astrological calculations.
 *
 * This is the main orchestration module that coordinates the 6-stage BTR process.
 * Core functionality has been modularized into:
 * - btr/types.ts - Type definitions
 * - btr/data-package-builder.ts - Candidate data package construction
 * - btr/prompts/ - AI prompt generators
 * - btr/extractors/ - AI response parsers
 * - btr/stages/ - Individual stage implementations
 */

import { calculateEphemeris, calculateJulianDay, cleanup } from './ephemeris.js';
import {
    calculateVimshottariDasha,
    getDashaForDate,
    DashaPeriod,
} from './vedic-astrology-engine.js';
import {
    generateDivisionalCharts,
    calculateBoundarySafety,
} from './advanced-btr-methods.js';
import {
    callAI,
    callAIWithStream,
    executeAIInParallel,
} from './ai-client.js';
import {
    CandidateTime,
    generateCandidateTimes,
    generateRefinementGrid,
    splitIntoBatches,
    MAX_BATCH_SIZE,
    SURVIVORS_PER_BATCH,
    getDynamicBatchSize,
    getDynamicSurvivors,
    injectSafetyNetCandidates,
} from './time-offset-manager.js';
import { logger } from './logger.js';
import { ProgressTracker, ANALYSIS_STEPS } from './progress-tracker.js';
import { SecondsPrecisionInput, SecondsPrecisionResult } from '@ai-pandit/shared';
import { throwIfCancelled, isCancellationError } from './cancellation-manager.js';
import { emitCandidateScore, emitAIContext, emitCalculationLog, emitStageStats } from './session-events.js';
import {
    enhanceCandidateWithPrecisionData,
    generatePrecisionAIPrompt,
    CandidateWithPrecisionData,
} from './btr-precision-integrator.js';
import { getMinifiedEphemeris } from './utils/index.js';

// Import from modular BTR components
import {
    formatLifeEventForAI,
    buildForensicContext,
    buildForensicDNASummary,
    getBatchPrompt,
    getDeepAnalysisPrompt,
    getFinalPrecisionPrompt,
} from './btr/prompts/index.js';
import {
    extractBatchSurvivors,
    extractFinalVerdict,
} from './btr/extractors/index.js';
import {
    CandidateDataPackage,
    StageResult,
    TournamentRound,
    FinalVerdict,
} from '@ai-pandit/shared';
import { buildCandidateDataPackage } from './btr/data-package-builder.js';

// Import stage functions
import {
    stage1ExhaustiveDataGeneration,
    stage2BatchTournament,
    stage3RefinementGrid,
    stage4DeepAnalysis,
    stage5MicroGrid,
    stage6FinalPrecision,
} from './btr/stages/index.js';

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PROCESSING FUNCTION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Main BTR processing function - 6 stage tournament for birth time rectification
 *
 * @param input - BTR input parameters including birth data, life events, and forensic traits
 * @returns Final rectified birth time with accuracy metrics
 */
export async function processSecondsPrecisionBTR(
    input: SecondsPrecisionInput
): Promise<SecondsPrecisionResult> {
    const startTime = Date.now();
    const progress = new ProgressTracker(input.sessionId);
    const stageHistory: Record<number, StageResult> = {};

    try {
        await progress.updateETA(600);
        await progress.startStep('init', 'Initializing Professional BTR v7.0 (Batch Tournament)...');

        // 🦾 Pre-calculate Global Lifecycle Shifts
        const globalLifecycle: any[] = [];
        try {
            const birthDate = new Date(input.dateOfBirth);
            const startYear = birthDate.getFullYear();
            const endYear = new Date().getFullYear();
            let lastSaturnSign = '';
            let lastJupiterSign = '';

            const baseEph = await calculateEphemeris(input.dateOfBirth, input.tentativeTime, input.latitude, input.longitude, input.timezone);
            const baseDashas = calculateVimshottariDasha(baseEph.planets.moon.longitude, birthDate);

            for (let y = startYear; y <= endYear; y++) {
                for (let m of [1, 5, 9] as const) {
                    const checkDateForCycle = `${y}-${String(m).padStart(2, '0')}-01`;
                    const ephShift = await calculateEphemeris(checkDateForCycle, '12:00:00', input.latitude, input.longitude, input.timezone);
                    const currentSatSign = ephShift.planets.saturn.sign;
                    const currentJupSign = ephShift.planets.jupiter.sign;

                    if (currentSatSign !== lastSaturnSign || currentJupSign !== lastJupiterSign) {
                        const dashaCycle = getDashaForDate(baseDashas, new Date(checkDateForCycle));
                        globalLifecycle.push({
                            date: checkDateForCycle,
                            event: `TRANSIT INGRESS: Saturn in ${currentSatSign} | Jupiter in ${currentJupSign}`,
                            dasha: dashaCycle ? `${dashaCycle.mahadasha}-${dashaCycle.antardasha}` : 'N/A'
                        });
                        lastSaturnSign = currentSatSign;
                        lastJupiterSign = currentJupSign;
                    }
                    if (globalLifecycle.length > 50) break;
                }
                if (globalLifecycle.length > 50) break;
            }
        } catch (e) {
            logger.warn('Global lifecycle calculation failed', e);
        }

        logger.info('Starting Professional BTR v7.0 (Batch Tournament)', {
            sessionId: input.sessionId,
            dateOfBirth: input.dateOfBirth,
            globalLifecycleItems: globalLifecycle.length
        });

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 1: EXHAUSTIVE DATA GENERATION
        // ═══════════════════════════════════════════════════════════════════════
        await throwIfCancelled(input.sessionId, input.abortSignal);
        logger.info('[PIPELINE] Entering Stage 1: Exhaustive Data Generation');
        const stage1 = await stage1ExhaustiveDataGeneration(input, progress);
        logger.info(`[PIPELINE] Stage 1 Complete: ${stage1.candidates.length} candidates generated`);
        stageHistory[1] = stage1.stageResult;
        emitStageStats(input.sessionId, 1, stage1.stageResult.candidatesOut, `Generated ${stage1.stageResult.candidatesOut} candidates`);
        await progress.flush("Initiating Forensic Evaluation: Pruning non-matching paths...");

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 2: BATCH TOURNAMENT
        // ═══════════════════════════════════════════════════════════════════════
        await throwIfCancelled(input.sessionId, input.abortSignal);
        await progress.updateETA(480);
        logger.info('[PIPELINE] Entering Stage 2: Batch Tournament');
        const stage2 = await stage2BatchTournament(input, stage1.candidates, progress, input.forensicTraits, globalLifecycle);
        logger.info(`[PIPELINE] Stage 2 Complete: ${stage2.survivors.length} survivors`);
        stageHistory[2] = stage2.stageResult;
        emitStageStats(input.sessionId, 2, stage2.stageResult.candidatesOut,
            `Tournament: ${stage2.rounds.length} rounds, ${stage2.survivors.length} survivors`);
        await progress.flush("Stage 2 finalized. Expanding research grid...");

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 3: REFINEMENT GRID
        // ═══════════════════════════════════════════════════════════════════════
        await throwIfCancelled(input.sessionId, input.abortSignal);
        await progress.updateETA(360);
        logger.info('[PIPELINE] Entering Stage 3: Refinement Grid');
        const stage3 = await stage3RefinementGrid(input, stage2.survivors, progress);
        logger.info(`[PIPELINE] Stage 3 Complete: ${stage3.candidates.length} candidates refined`);
        stageHistory[3] = stage3.stageResult;
        emitStageStats(input.sessionId, 3, stage3.stageResult.candidatesOut, `Refined to ${stage3.stageResult.candidatesOut}`);
        await progress.flush("Stage 3 finalized. Starting multi-dasha analysis...");

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 4: DEEP ANALYSIS
        // ═══════════════════════════════════════════════════════════════════════
        await throwIfCancelled(input.sessionId, input.abortSignal);
        await progress.updateETA(240);
        logger.info('[PIPELINE] Entering Stage 4: Deep Analysis');
        const stage4 = await stage4DeepAnalysis(input, stage3.candidates, progress, input.forensicTraits, globalLifecycle);
        logger.info(`[PIPELINE] Stage 4 Complete: ${stage4.survivors.length} deep survivors`);
        stageHistory[4] = stage4.stageResult;
        emitStageStats(input.sessionId, 4, stage4.stageResult.candidatesOut, `Deep: ${stage4.survivors.length} survivors`);
        await progress.flush("Stage 4 finalized. Entering micro-precision phase...");

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 5: MICRO GRID
        // ═══════════════════════════════════════════════════════════════════════
        await throwIfCancelled(input.sessionId, input.abortSignal);
        await progress.updateETA(120);
        logger.info('[PIPELINE] Entering Stage 5: Micro Grid');
        const stage5 = await stage5MicroGrid(input, stage4.survivors, progress);
        logger.info(`[PIPELINE] Stage 5 Complete: ${stage5.candidates.length} micro candidates`);
        stageHistory[5] = stage5.stageResult;
        emitStageStats(input.sessionId, 5, stage5.stageResult.candidatesOut, `Micro: ${stage5.candidates.length}`);
        await progress.flush("Stage 5 finalized. Running final seconds-level synthesis...");

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 6: FINAL PRECISION
        // ═══════════════════════════════════════════════════════════════════════
        await throwIfCancelled(input.sessionId, input.abortSignal);
        await progress.updateETA(60);
        logger.info('[PIPELINE] Entering Stage 6: Final Precision');
        const stage6 = await stage6FinalPrecision(input, stage5.candidates, progress, input.forensicTraits, globalLifecycle);
        logger.info('[PIPELINE] Stage 6 Complete: Final Verdict reached');
        stageHistory[6] = stage6.stageResult;
        emitStageStats(input.sessionId, 6, 1, 'FINAL TIME DETERMINED');
        await progress.flush("All analysis stages complete. Generating final report...");

        // ═══════════════════════════════════════════════════════════════════════
        // BUILD FINAL RESULT
        // ═══════════════════════════════════════════════════════════════════════
        const finalEphemeris = await calculateEphemeris(
            input.dateOfBirth,
            stage6.finalTime,
            input.latitude,
            input.longitude,
            input.timezone
        );

        const divCharts = generateDivisionalCharts(finalEphemeris);
        const boundary = calculateBoundarySafety(finalEphemeris);

        await progress.complete();

        // FINAL JIT: Enrich the winner package
        const winnerPkg = await buildCandidateDataPackage(stage6.finalTime, 0, input, {
            includeFullData: true,
            dashaDepth: 5,
            pranaWindowDays: 7
        });

        const enrichedResult = {
            summary: stage6.aiReasoning.slice(0, 5000),
            finalCandidate: {
                time: stage6.finalTime,
                score: stage6.accuracy,
                confidence: stage6.confidence,
                margin: stage6.margin,
                thinking: stage6.thinking || 'Final analysis completed.',
                vimsopakaBala: winnerPkg?.vimsopakaBala,
                ishtaKashtaPhala: winnerPkg?.ishtaKashtaPhala,
                chalitDiscrepancies: winnerPkg?.chalitDiscrepancies
            },
            alternatives: stage6.finalists.filter(f => f.time !== stage6.finalTime),
            technicalProof: {
                ephemeris: finalEphemeris,
                divCharts,
                boundary,
                d60Deity: (winnerPkg?.planets?.sun as any)?.d60Deity,
                vimsopakaAvg: winnerPkg?.vimsopakaBala ?
                    Object.values(winnerPkg.vimsopakaBala).reduce((a: number, b: number) => a + b, 0) / 7 : 0
            },
            precisionData: {
                ephemeris: finalEphemeris,
                divCharts,
                boundarySafety: boundary,
                shuddhi: {
                    kunda: {
                        score: winnerPkg.vedicSignals?.kundaLagna?.matchesMoon ? 100 : 40,
                        details: `Kunda Lagna: ${winnerPkg.vedicSignals?.kundaLagna?.sign} ${winnerPkg.vedicSignals?.kundaLagna?.degree.toFixed(4)}° | ${winnerPkg.vedicSignals?.kundaLagna?.matchesMoon ? 'Matches Moon Nakshatra' : 'Genetic Offset Detected'}`
                    },
                    tatwa: {
                        score: winnerPkg.vedicSignals?.tatwa?.isAuspicious ? 100 : 20,
                        details: `Current Tatwa: ${winnerPkg.vedicSignals?.tatwa?.name} (${winnerPkg.vedicSignals?.tatwa?.element}) | Aligning with the 90-min cycle.`
                    }
                },
                dasha: stage6.aiReasoning.match(/DASHA[:\s]*([^\n]+)/i)?.[1] || 'Final decision context',
                precisionMetrics: {
                    vimsopaka: winnerPkg?.vimsopakaBala,
                    avasthaMap: Object.fromEntries(Object.entries(winnerPkg?.planets || {}).map(([k, p]) => [k, (p as any).avastha])),
                    deityMap: Object.fromEntries(Object.entries(winnerPkg?.planets || {}).map(([k, p]) => [k, (p as any).d60Deity])),
                    sambandhaMap: Object.fromEntries(Object.entries(winnerPkg?.planets || {}).map(([k, p]) => [k, (p as any).compoundDignity]))
                }
            },
            stageHistory: Object.fromEntries(
                Object.entries(stageHistory).map(([k, v]) => [k, {
                    candidatesIn: v.candidatesIn,
                    candidatesOut: v.candidatesOut,
                    aiReasoning: v.aiReasoning
                }])
            ),
            // 📝 PERSIST FULL REASONING LOGS
            reasoningLogs: progress.getStageHistory()
        };

        return {
            rectifiedTime: stage6.finalTime,
            accuracy: stage6.accuracy,
            confidence: stage6.confidence,
            precisionLevel: 'seconds',
            marginOfError: stage6.margin,
            stagesCompleted: 6,
            boundaryWarnings: boundary.isDangerous ? ['Near boundary transition'] : [],
            methodsUsed: ['DeepSeek v3.2 (Reasoning Mode)', 'Swiss Ephemeris', 'Vimshottari', 'Yogini', 'Chara', 'D9', 'D10', 'D60'],
            processingTimeMs: Date.now() - startTime,
            analysisResult: enrichedResult
        };

    } catch (error) {
        logger.error('Professional BTR v7.0 FAILED', error);
        if (isCancellationError(error)) {
            throw error;
        }
        const currentStepId = ANALYSIS_STEPS[Math.min(ANALYSIS_STEPS.length - 1, progress.getProgress().currentStep)]?.id || 'final';
        await progress.errorStep(currentStepId, error instanceof Error ? error.message : String(error));
        throw error;
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════════════════════════════════════

export { MAX_BATCH_SIZE, SURVIVORS_PER_BATCH };
export type { CandidateDataPackage, StageResult, TournamentRound, FinalVerdict } from '@ai-pandit/shared';
export { buildCandidateDataPackage } from './btr/data-package-builder.js';

// Re-export for backward compatibility
export {
    formatLifeEventForAI,
    buildForensicContext,
    buildForensicDNASummary,
    getBatchPrompt,
    getDeepAnalysisPrompt,
    getFinalPrecisionPrompt,
} from './btr/prompts/index.js';

export {
    extractBatchSurvivors,
    extractFinalVerdict,
} from './btr/extractors/index.js';
