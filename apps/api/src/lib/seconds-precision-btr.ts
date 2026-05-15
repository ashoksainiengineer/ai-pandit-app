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

import { calculateEphemeris, convertToUTC, calculateEphemerisBatch } from './ephemeris.js';

import { calculateVimshottariDasha, getDashaForDate } from './vedic-astrology-engine.js';
import {
    generateDivisionalCharts,
    calculateBoundarySafety,
} from './advanced-btr-methods.js';
import { _callAIWithStream, _executeAIInParallel } from './ai-client.js';
import {
  _generateCandidateTimes,
  _generateRefinementGrid,
  _splitIntoBatches,
  MAX_BATCH_SIZE,
  SURVIVORS_PER_BATCH,
  _getDynamicBatchSize,
  _getDynamicSurvivors,
  _injectSafetyNetCandidates
} from './time-offset-manager.js';
import { logger } from '../utils/logger.js';
import { ProgressTracker, ANALYSIS_STEPS } from './progress-tracker.js';
import { SecondsPrecisionInput, SecondsPrecisionResult, type CandidateTime } from '@ai-pandit/shared';
import { throwIfCancelled, isCancellationError } from './cancellation-manager.js';
import { emitStageStats, cleanupSession } from './session-events.js';
import { _enhanceCandidateWithPrecisionData, _generatePrecisionAIPrompt } from './btr-precision-integrator.js';
import { _getMinifiedEphemeris } from './utils/index.js';
// Inline debug logging utilities to avoid ESM import issues in worker container
const DEBUG_LOG_FILE = './logs/debug-analysis.log';
const logAnalysisContainerAction = (stage: number | string, context: string, payload: unknown) => {
    try {
        console.log(`[DEBUG-BTR] Stage ${stage} - ${context}:`, JSON.stringify(payload).slice(0, 500));
    } catch (e) {}
};
const clearDebugLog = () => {};

// Import from modular BTR components
import {
    _formatLifeEventForAI,
    _getBatchPrompt,
    _getDeepAnalysisPrompt,
    _getFinalPrecisionPrompt,
} from './btr/prompts/index.js';
import {
    _extractBatchSurvivors,
    _extractFinalVerdict,
} from './btr/extractors/index.js';
import { StageResult } from '@ai-pandit/shared';
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
// Checkpoint / Resume support for long-running pipelines
import {
  saveBTRCheckpoint,
  loadBTRCheckpoint,
  getResumeStage,
  getStageCandidates,
  type BTRCheckpoint,
} from './btr/checkpoint-manager.js';


// Main Processing Function

async function initializeBTRSession(
    input: SecondsPrecisionInput,
    progress: ProgressTracker
): Promise<Array<{ date: string; event: string; dasha: string }>> {
    await progress.updateETA(600);
    await progress.startStep('init', 'Initializing Professional BTR v7.0 (Batch Tournament)...');

    const globalLifecycle: Array<{ date: string; event: string; dasha: string }> = [];
    try {
        const birthDate = convertToUTC(input.dateOfBirth, input.tentativeTime, input.timezone);
        const startYear = birthDate.getUTCFullYear();
        const endYear = new Date().getFullYear();
        let lastSaturnSign = '';
        let lastJupiterSign = '';

        logger.info('[BTR] Calling base ephemeris', { sessionId: input.sessionId, date: input.dateOfBirth, time: input.tentativeTime });
        const baseEph = await calculateEphemeris(input.dateOfBirth, input.tentativeTime, input.latitude, input.longitude, input.timezone);
        logger.info('[BTR] Base ephemeris returned', { sessionId: input.sessionId, moonSign: baseEph.planets.moon.sign });
        const baseDashas = calculateVimshottariDasha(baseEph.planets.moon.longitude, birthDate);

        let ephemerisCalls = 0;

        // Collect all lifecycle check dates for batch ephemeris
        const lifecycleInputs: Array<{ birthDate: string; birthTime: string; latitude: number; longitude: number; timezone: number | string }> = [];
        const lifecycleDates: string[] = [];
        for (let y = startYear; y <= endYear; y++) {
            for (const m of [1, 5, 9] as const) {
                const checkDateForCycle = `${y}-${String(m).padStart(2, '0')}-01`;
                lifecycleInputs.push({
                    birthDate: checkDateForCycle,
                    birthTime: '12:00:00',
                    latitude: input.latitude,
                    longitude: input.longitude,
                    timezone: input.timezone,
                });
                lifecycleDates.push(checkDateForCycle);
                if (lifecycleDates.length > 50) break;
            }
            if (lifecycleDates.length > 50) break;
        }

        logger.info(`[BTR] Batch fetching lifecycle ephemeris for ${lifecycleInputs.length} dates`);
        const batchStart = Date.now();
        const lifecycleEphemeris = await calculateEphemerisBatch(lifecycleInputs, 'whole_sign');
        logger.info(`[BTR] Lifecycle batch complete`, {
            dates: lifecycleInputs.length,
            durationMs: Date.now() - batchStart,
        });

        for (let idx = 0; idx < lifecycleEphemeris.length; idx++) {
            const ephShift = lifecycleEphemeris[idx];
            const checkDateForCycle = lifecycleDates[idx];
            ephemerisCalls++;
            const currentSatSign = ephShift.planets.saturn.sign;
            const currentJupSign = ephShift.planets.jupiter.sign;

            // Periodic progress pulse so the frontend knows we're alive
            if (ephemerisCalls % 10 === 0) {
                await progress.updateMessage(`Checking planetary transits: ${ephemerisCalls} epochs processed`);
            }

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
        logger.info(`[BTR] Lifecycle complete`, { sessionId: input.sessionId, ephemerisCalls, globalLifecycleItems: globalLifecycle.length });
    } catch (e) {
        logger.warn('Global lifecycle calculation failed', { error: e instanceof Error ? e.message : String(e) });
    }

    logger.info('Starting Professional BTR v7.0 (Batch Tournament)', {
        sessionId: input.sessionId,
        dateOfBirth: input.dateOfBirth,
        globalLifecycleItems: globalLifecycle.length
    });

    clearDebugLog();
    logAnalysisContainerAction('INIT', `Starting Professional BTR (Session: ${input.sessionId})`, {
        input,
        globalLifecycle
    });

    return globalLifecycle;
}


/**
 * Main BTR processing function - 6 stage tournament for birth time rectification
 *
 * Supports checkpoint/resume so that a crashed worker can continue from the
 * last completed stage instead of restarting from Stage 1.
 *
 * @param input - BTR input parameters including birth data and life events
 * @returns Final rectified birth time with accuracy metrics
 */
export async function executeSecondsPrecisionRectification(
    input: SecondsPrecisionInput
): Promise<SecondsPrecisionResult> {
    const startTime = Date.now();
    const progress = new ProgressTracker(input.sessionId);
    const stageHistory: Record<number, StageResult> = {};

    // ── CHECKPOINT: Resume support ───────────────────────────────────────────
    let checkpoint: BTRCheckpoint | null = null;
    let resumeStage = 1;

    if (input.jobId) {
        checkpoint = loadBTRCheckpoint(input.jobId);
        resumeStage = getResumeStage(checkpoint);
        if (resumeStage > 1) {
            logger.info('[PIPELINE] Resuming from checkpoint', {
                sessionId: input.sessionId,
                resumeStage,
                completedStages: checkpoint?.completedStages ?? [],
            });
        }
    }

    try {
        const globalLifecycle = await initializeBTRSession(input, progress);

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 1: EXHAUSTIVE DATA GENERATION
        // ═══════════════════════════════════════════════════════════════════════
        let stage1Candidates: CandidateTime[];
        if (resumeStage <= 1) {
            await throwIfCancelled(input.sessionId, input.abortSignal);
            logger.info('[PIPELINE] Entering Stage 1: Exhaustive Data Generation');
            const stage1 = await stage1ExhaustiveDataGeneration(input, progress);
            logger.info(`[PIPELINE] Stage 1 Complete: ${stage1.candidates.length} candidates generated`);
            stageHistory[1] = stage1.stageResult;
            stage1Candidates = stage1.candidates;
            if (input.jobId) {
                await saveBTRCheckpoint({
                    jobId: input.jobId,
                    sessionId: input.sessionId,
                    stage: 1,
                    candidates: stage1Candidates,
                    stageResult: stage1.stageResult,
                });
            }
        } else {
            stage1Candidates = getStageCandidates(checkpoint, 1) ?? [];
            logger.info(`[PIPELINE] Skipping Stage 1 (resumed): ${stage1Candidates.length} candidates from checkpoint`);
        }
        emitStageStats(input.sessionId, 1, stage1Candidates.length, `Generated ${stage1Candidates.length} candidates`);
        await progress.flush("Initiating Batch Tournament: Pruning non-matching paths...");

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 2: BATCH TOURNAMENT
        // ═══════════════════════════════════════════════════════════════════════
        let stage2Survivors: CandidateTime[];
        if (resumeStage <= 2) {
            await throwIfCancelled(input.sessionId, input.abortSignal);
            await progress.updateETA(480);
            logger.info('[PIPELINE] Entering Stage 2: Batch Tournament');
            const stage2 = await stage2BatchTournament(input, stage1Candidates, progress, globalLifecycle);
            logger.info(`[PIPELINE] Stage 2 Complete: ${stage2.survivors.length} survivors`);
            stageHistory[2] = stage2.stageResult;
            stage2Survivors = stage2.survivors;
            if (input.jobId) {
                await saveBTRCheckpoint({
                    jobId: input.jobId,
                    sessionId: input.sessionId,
                    stage: 2,
                    candidates: stage2Survivors,
                    stageResult: stage2.stageResult,
                });
            }
        } else {
            stage2Survivors = getStageCandidates(checkpoint, 2) ?? [];
            logger.info(`[PIPELINE] Skipping Stage 2 (resumed): ${stage2Survivors.length} survivors from checkpoint`);
        }
        emitStageStats(input.sessionId, 2, stage2Survivors.length,
            `Tournament survivors: ${stage2Survivors.length}`);
        await progress.flush("Stage 2 finalized. Expanding research grid...");

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 3: REFINEMENT GRID
        // ═══════════════════════════════════════════════════════════════════════
        let stage3Candidates: CandidateTime[];
        if (resumeStage <= 3) {
            await throwIfCancelled(input.sessionId, input.abortSignal);
            await progress.updateETA(360);
            logger.info('[PIPELINE] Entering Stage 3: Refinement Grid');
            const stage3 = await stage3RefinementGrid(input, stage2Survivors, progress);
            logger.info(`[PIPELINE] Stage 3 Complete: ${stage3.candidates.length} candidates refined`);
            stageHistory[3] = stage3.stageResult;
            stage3Candidates = stage3.candidates;
            if (input.jobId) {
                await saveBTRCheckpoint({
                    jobId: input.jobId,
                    sessionId: input.sessionId,
                    stage: 3,
                    candidates: stage3Candidates,
                    stageResult: stage3.stageResult,
                });
            }
        } else {
            stage3Candidates = getStageCandidates(checkpoint, 3) ?? [];
            logger.info(`[PIPELINE] Skipping Stage 3 (resumed): ${stage3Candidates.length} candidates from checkpoint`);
        }
        emitStageStats(input.sessionId, 3, stage3Candidates.length, `Refined to ${stage3Candidates.length}`);
        await progress.flush("Stage 3 finalized. Starting multi-dasha analysis...");

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 4: DEEP ANALYSIS
        // ═══════════════════════════════════════════════════════════════════════
        let stage4Survivors: CandidateTime[];
        if (resumeStage <= 4) {
            await throwIfCancelled(input.sessionId, input.abortSignal);
            await progress.updateETA(240);
            logger.info('[PIPELINE] Entering Stage 4: Deep Analysis');
            const stage4 = await stage4DeepAnalysis(input, stage3Candidates, progress, globalLifecycle);
            logger.info(`[PIPELINE] Stage 4 Complete: ${stage4.survivors.length} deep survivors`);
            stageHistory[4] = stage4.stageResult;
            stage4Survivors = stage4.survivors;
            if (input.jobId) {
                await saveBTRCheckpoint({
                    jobId: input.jobId,
                    sessionId: input.sessionId,
                    stage: 4,
                    candidates: stage4Survivors,
                    stageResult: stage4.stageResult,
                });
            }
        } else {
            stage4Survivors = getStageCandidates(checkpoint, 4) ?? [];
            logger.info(`[PIPELINE] Skipping Stage 4 (resumed): ${stage4Survivors.length} survivors from checkpoint`);
        }
        emitStageStats(input.sessionId, 4, stage4Survivors.length, `Deep: ${stage4Survivors.length} survivors`);
        await progress.flush("Stage 4 finalized. Entering micro-precision phase...");

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 5: MICRO GRID
        // ═══════════════════════════════════════════════════════════════════════
        let stage5Candidates: CandidateTime[];
        if (resumeStage <= 5) {
            await throwIfCancelled(input.sessionId, input.abortSignal);
            await progress.updateETA(120);
            logger.info('[PIPELINE] Entering Stage 5: Micro Grid');
            const stage5 = await stage5MicroGrid(input, stage4Survivors, progress);
            logger.info(`[PIPELINE] Stage 5 Complete: ${stage5.candidates.length} micro candidates`);
            stageHistory[5] = stage5.stageResult;
            stage5Candidates = stage5.candidates;
            if (input.jobId) {
                await saveBTRCheckpoint({
                    jobId: input.jobId,
                    sessionId: input.sessionId,
                    stage: 5,
                    candidates: stage5Candidates,
                    stageResult: stage5.stageResult,
                });
            }
        } else {
            stage5Candidates = getStageCandidates(checkpoint, 5) ?? [];
            logger.info(`[PIPELINE] Skipping Stage 5 (resumed): ${stage5Candidates.length} candidates from checkpoint`);
        }
        emitStageStats(input.sessionId, 5, stage5Candidates.length, `Micro: ${stage5Candidates.length}`);
        await progress.flush("Stage 5 finalized. Running final seconds-level synthesis...");

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 6: FINAL PRECISION
        // ═══════════════════════════════════════════════════════════════════════
        await throwIfCancelled(input.sessionId, input.abortSignal);
        await progress.updateETA(60);
        logger.info('[PIPELINE] Entering Stage 6: Final Precision');
        const stage6 = await stage6FinalPrecision(input, stage5Candidates, progress, globalLifecycle);
        logger.info('[PIPELINE] Stage 6 Complete: Final Verdict reached');
        stageHistory[6] = stage6.stageResult;
        emitStageStats(input.sessionId, 6, 1, 'FINAL TIME DETERMINED');
        await progress.flush("All analysis stages complete. Generating final report...");

        return await buildFinalBTResult(input, stage6, stageHistory, progress, startTime);

    } catch (error) {
        logger.error('Professional BTR v7.0 FAILED', { error: error instanceof Error ? error.message : String(error) });
        if (isCancellationError(error)) {
            throw error;
        }
        const currentStepId = ANALYSIS_STEPS[Math.min(ANALYSIS_STEPS.length - 1, progress.getProgress().currentStep)]?.id || 'final';
        await progress.errorStep(currentStepId, error instanceof Error ? error.message : String(error));
        // Clean up session event resources to prevent memory leak from orphaned
        // EventEmitter + event buffers. Without this, the 1-hour GC is the only cleanup.
        cleanupSession(input.sessionId);
        throw error;
    }
}

function getBoundaryWarnings(boundary: { lagnaSignBoundary: number; moonNakshatraBoundary: number; isDangerous: boolean }): string[] {
    const warnings: string[] = [];

    if (boundary.lagnaSignBoundary < 60) {
        warnings.push(`Lagna near sign boundary (${boundary.lagnaSignBoundary}s)`);
    }

    if (boundary.moonNakshatraBoundary < 120) {
        warnings.push(`Moon near nakshatra boundary (${boundary.moonNakshatraBoundary}s)`);
    }

    if (boundary.isDangerous) {
        warnings.push('Birth in critical boundary zone');
    }

    return warnings;
}

async function buildFinalBTResult(
    input: SecondsPrecisionInput,
    stage6: Awaited<ReturnType<typeof stage6FinalPrecision>>,
    stageHistory: Record<number, StageResult>,
    progress: ProgressTracker,
    startTime: number
): Promise<SecondsPrecisionResult> {
    const finalEphemeris = await calculateEphemeris(
        stage6.finalCandidate.candidateDate || input.dateOfBirth,
        stage6.finalCandidate.time,
        input.latitude,
        input.longitude,
        input.timezone
    );

    const divCharts = generateDivisionalCharts(finalEphemeris);
    const boundary = calculateBoundarySafety(finalEphemeris);
    const boundaryWarnings = [...new Set([
        ...getBoundaryWarnings(boundary),
        ...stage6.boundaryWarnings
    ])];

    await progress.complete();

    const winnerPkg = await buildCandidateDataPackage(stage6.finalTime, 0, input, {
        includeFullData: true,
        dashaDepth: 5,
        pranaWindowDays: 7,
        candidate: stage6.finalCandidate,
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
            d60Deity: winnerPkg?.planets?.sun?.d60Deity,
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
                avasthaMap: Object.fromEntries(Object.entries(winnerPkg?.planets || {}).map(([k, p]) => [k, p.avastha])),
                deityMap: Object.fromEntries(Object.entries(winnerPkg?.planets || {}).map(([k, p]) => [k, p.d60Deity])),
                sambandhaMap: Object.fromEntries(Object.entries(winnerPkg?.planets || {}).map(([k, p]) => [k, p.compoundDignity]))
            }
        },
        stageHistory: Object.fromEntries(
            Object.entries(stageHistory).map(([k, v]) => [k, {
                candidatesIn: v.candidatesIn,
                candidatesOut: v.candidatesOut,
                aiReasoning: v.aiReasoning
            }])
        ),
        reasoningLogs: progress.getStageHistory()
    };

    const resultPayload = {
        rectifiedTime: stage6.finalTime,
        accuracy: stage6.accuracy,
        confidence: stage6.confidence,
        precisionLevel: 'seconds' as const,
        marginOfError: stage6.margin,
        stagesCompleted: 6,
        boundaryWarnings,
        methodsUsed: ['DeepSeek v3.2 (Reasoning Mode)', 'Skyfield Astronomy Service', 'Vimshottari', 'Yogini', 'Chara', 'D9', 'D10', 'D60'],
        processingTimeMs: Date.now() - startTime,
        analysisResult: enrichedResult
    };

    logAnalysisContainerAction('FINAL', 'Final Verification & Result', resultPayload);

    return resultPayload;
}


// Exports

export { MAX_BATCH_SIZE, SURVIVORS_PER_BATCH };
export type { CandidateDataPackage, StageResult, TournamentRound, FinalVerdict } from '@ai-pandit/shared';
export { buildCandidateDataPackage } from './btr/data-package-builder.js';

