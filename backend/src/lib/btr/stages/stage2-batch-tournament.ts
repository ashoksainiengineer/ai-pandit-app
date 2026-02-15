/**
 * Stage 2: Batch Tournament
 *
 * Dynamic batch elimination tournament for initial candidate pruning.
 * Uses AI-powered analysis to eliminate unlikely candidates while
 * preserving the true birth time through safety net mechanisms.
 */

import { SecondsPrecisionInput, ForensicTraits } from '../../../types/index.js';
import { CandidateTime, getDynamicBatchSize, getDynamicSurvivors, splitIntoBatches } from '../../time-offset-manager.js';
import { ProgressTracker } from '../../progress-tracker.js';
import { callAIWithStream, executeAIInParallel } from '../../ai-client.js';
import { emitCandidateScore, emitAIContext, emitDecision } from '../../session-events.js';
import { throwIfCancelled } from '../../cancellation-manager.js';
import { cleanup } from '../../ephemeris.js';
import { buildCandidateDataPackage } from '../data-package-builder.js';
import { getBatchPrompt } from '../prompts/index.js';
import { extractBatchSurvivors } from '../extractors/index.js';
import { CandidateDataPackage, StageResult, TournamentRound } from '../types.js';
import { logger } from '../../logger.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Stage 2: Batch tournament with dynamic sizing and safety net protection
 *
 * @param input - BTR input parameters
 * @param candidates - Initial candidate list from Stage 1
 * @param progress - Progress tracker
 * @param forensicTraits - User's forensic traits
 * @param globalLifecycle - Pre-calculated lifecycle shifts
 * @returns Tournament survivors and round statistics
 */
export async function stage2BatchTournament(
    input: SecondsPrecisionInput,
    candidates: CandidateTime[],
    progress: ProgressTracker,
    forensicTraits: ForensicTraits,
    globalLifecycle: any[] = []
): Promise<{ survivors: CandidateTime[]; stageResult: StageResult; rounds: TournamentRound[] }> {
    await progress.startStep('coarse', 'Stage 2: Batch Tournament...');

    // FIXED: Log initial data state for debugging
    logger.info('🔱 [STAGE-2] Starting batch tournament', {
        totalCandidates: candidates.length,
        sampleCandidate: candidates[0]?.time,
        hasInputData: !!input.lifeEvents?.length,
        forensicTraitsPresent: !!forensicTraits
    });

    const rounds: TournamentRound[] = [];
    let currentCandidates = [...candidates];
    let roundNumber = 0;

    // Get offset from config for dynamic batch sizing
    const offsetMinutes = input.offsetConfig.customMinutes ||
        (input.offsetConfig.preset === '30min' ? 30 :
            input.offsetConfig.preset === '1hour' ? 60 :
                input.offsetConfig.preset === '2hours' ? 120 :
                    input.offsetConfig.preset === '4hours' ? 240 :
                        input.offsetConfig.preset === '6hours' ? 360 :
                            input.offsetConfig.preset === '12hours' ? 720 : 60);

    // Dynamic batch size based on offset
    const batchSize = getDynamicBatchSize(candidates.length, offsetMinutes);

    // GOD-TIER SAFETY: First round keeps more survivors (30% vs 20%)
    const isFirstRound = roundNumber === 0;
    const survivorsPerBatch = getDynamicSurvivors(batchSize, isFirstRound);

    logger.info('🔱 Stage 2: Starting batch tournament', {
        totalCandidates: currentCandidates.length,
        offsetMinutes,
        batchSize,
        survivorsPerBatch
    });

    // Inline helper for minified ephemeris
    const getMinifiedEphemerisInline = (c: CandidateDataPackage) => ({
        sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
        moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
        ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
    });

    // FORCED FIRST ROUND
    if (roundNumber === 0 && currentCandidates.length > 0) {
        roundNumber++;
        const batches = splitIntoBatches(currentCandidates, batchSize);
        const roundSurvivors: CandidateTime[] = [];

        await progress.updateMessage(`Base Analysis: Evaluating ${currentCandidates.length} potential paths...`);

        let completedBatches = 0;
        const batchDataMap = new Map<number, CandidateDataPackage[]>();
        const tasks = batches.map((batchTimes, i) => async () => {
            const batchEnriched = await Promise.all(batchTimes.map(ct =>
                buildCandidateDataPackage(ct.time, ct.offsetMinutes, input, {
                    includeFullData: true,
                    dashaDepth: 3, // Corrected Dasha Depth
                    lifecycleShifts: globalLifecycle
                })
            ));
            batchDataMap.set(i, batchEnriched);
            emitAIContext(input.sessionId, {
                stage: 2,
                candidateTime: `Batch ${i + 1}/${batches.length}`,
                batch: i + 1,
                totalBatches: batches.length,
                candidatesInBatch: batchEnriched.map(c => ({
                    time: c.time,
                    ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`,
                    moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`
                })),
                lifeEventsCount: input.lifeEvents.length,
                hasForensicTraits: !!forensicTraits
            });

            const response = await callAIWithStream(
                input.sessionId,
                2,
                'You are the SUPREME VEDIC ASTROLOGER. Analyze candidate birth times for primary alignment using forensic markers.',
                getBatchPrompt(batchEnriched, input.lifeEvents, forensicTraits, i + 1, batches.length, survivorsPerBatch),
                {
                    candidateTime: `Batch ${i + 1}/${batches.length}`,
                    progressTracker: progress
                }
            );

            completedBatches++;
            await progress.updateSubProgress(completedBatches, batches.length);

            return response;
        });

        const results = await executeAIInParallel(tasks, 10, 100);

        for (let i = 0; i < batches.length; i++) {
            const batchTimes = batches[i];
            const response = results[i];
            const fullBatchData = batchDataMap.get(i) || [];
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            const aiScores = extractBatchSurvivors(aiContent, batchTimes.map(c => c.time), Math.min(batchTimes.length, survivorsPerBatch));
            const survivorTimes = aiScores
                .sort((a, b) => b.score - a.score)
                .slice(0, Math.min(batchTimes.length, survivorsPerBatch))
                .map(s => s.time);

            for (let j = 0; j < fullBatchData.length; j++) {
                const candidate = fullBatchData[j];
                const originalTimeInfo = batchTimes[j];
                const isSurvivor = survivorTimes.includes(candidate.time);
                const scoreObj = aiScores.find(s => s.time === candidate.time);
                const score = scoreObj ? scoreObj.score : (isSurvivor ? 85 : 40);
                const reason = scoreObj ? scoreObj.reason : (isSurvivor ? "Meets primary alignment criteria" : "Low forensic match score");

                if (isSurvivor) {
                    roundSurvivors.push(originalTimeInfo);
                }

                // Emit score and structured decision
                emitCandidateScore(input.sessionId, candidate.time, score, 2, undefined, getMinifiedEphemerisInline(candidate));
                emitDecision(input.sessionId, {
                    stage: 2,
                    time: candidate.time,
                    verdict: isSurvivor ? 'promoted' : 'rejected',
                    score,
                    reason,
                    batch: i + 1
                });
            }
        }

        rounds.push({ roundNumber, batchesProcessed: batches.length, candidatesIn: currentCandidates.length, candidatesOut: roundSurvivors.length });
        currentCandidates = roundSurvivors;
    }

    // Continue tournament for larger sets
    while (currentCandidates.length > batchSize) {
        roundNumber++;
        const batches = splitIntoBatches(currentCandidates, batchSize);
        const roundSurvivors: CandidateTime[] = [];

        await progress.updateMessage(`Tournament Round ${roundNumber}: ${batches.length} batches of ${batchSize}`);

        let completedBatches = 0;
        const batchDataMap = new Map<number, CandidateDataPackage[]>();
        const tasks = batches.map((batchTimes, i) => async () => {
            const batchEnriched = await Promise.all(batchTimes.map(ct =>
                buildCandidateDataPackage(ct.time, ct.offsetMinutes, input, {
                    includeFullData: true,
                    dashaDepth: 3, // Corrected Dasha Depth
                    lifecycleShifts: globalLifecycle
                })
            ));
            batchDataMap.set(i, batchEnriched);
            emitAIContext(input.sessionId, {
                stage: 2,
                candidateTime: `Tournament ${roundNumber}-${i + 1}`,
                batch: i + 1,
                totalBatches: batches.length,
                candidatesInBatch: batchEnriched.map(c => ({
                    time: c.time,
                    ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
                }))
            });

            const response = await callAIWithStream(
                input.sessionId,
                2,
                'You are the SUPREME VEDIC ASTROLOGER. Tournament analysis: prune based on forensic alignment.',
                getBatchPrompt(batchEnriched, input.lifeEvents, forensicTraits, i + 1, batches.length, survivorsPerBatch),
                { candidateTime: `Tournament ${roundNumber}-${i + 1}`, progressTracker: progress }
            );

            completedBatches++;
            await progress.updateSubProgress(completedBatches, batches.length);

            return response;
        });

        const results = await executeAIInParallel(tasks, 10, 100);

        for (let i = 0; i < batches.length; i++) {
            const batchTimes = batches[i];
            const response = results[i];
            const fullBatchData = batchDataMap.get(i) || [];
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            const aiScores = extractBatchSurvivors(aiContent, batchTimes.map(c => c.time), survivorsPerBatch);
            const survivorTimes = aiScores
                .sort((a, b) => b.score - a.score)
                .slice(0, survivorsPerBatch)
                .map(s => s.time);

            for (let j = 0; j < fullBatchData.length; j++) {
                const candidate = fullBatchData[j];
                const originalTimeInfo = batchTimes[j];
                const isSurvivor = survivorTimes.includes(candidate.time);
                const scoreObj = aiScores.find(s => s.time === candidate.time);
                const score = scoreObj ? scoreObj.score : (isSurvivor ? 88 : 30);
                const reason = scoreObj ? scoreObj.reason : (isSurvivor ? "Superior alignment in tournament round" : "Eliminated in batch tournament");

                if (isSurvivor) {
                    roundSurvivors.push(originalTimeInfo);
                }

                emitCandidateScore(input.sessionId, candidate.time, score, 2, undefined, getMinifiedEphemerisInline(candidate));
                emitDecision(input.sessionId, {
                    stage: 2,
                    time: candidate.time,
                    verdict: isSurvivor ? 'promoted' : 'rejected',
                    score,
                    reason,
                    batch: i + 1
                });
            }
        }

        await throwIfCancelled(input.sessionId, input.abortSignal);
        cleanup();

        rounds.push({
            roundNumber,
            batchesProcessed: batches.length,
            candidatesIn: currentCandidates.length,
            candidatesOut: roundSurvivors.length
        });

        currentCandidates = roundSurvivors;
    }

    // GOD-TIER SAFETY: Ensure tentative time and safety net always survive
    const tentativeTime = input.tentativeTime;
    const hasTentative = currentCandidates.some(c => c.time === tentativeTime);
    const hasSafetyNet = currentCandidates.some(c => c.offsetDescription.includes('Safety Net'));

    if (!hasTentative || !hasSafetyNet) {
        logger.warn('🔱 Safety Net: Adding missing tentative/safety net candidates back to survivors');

        if (!hasTentative) {
            const tentativeCandidate = candidates.find(c => c.time === tentativeTime);
            if (tentativeCandidate) {
                currentCandidates.push(tentativeCandidate);
                logger.info('🔱 Safety Net: Restored tentative time', { tentativeTime });
            }
        }

        const missingSafetyNet = candidates
            .filter(c => c.offsetDescription.includes('Safety Net'))
            .filter(c => !currentCandidates.some(survivor => survivor.time === c.time))
            .slice(0, 3);

        if (missingSafetyNet.length > 0) {
            currentCandidates.push(...missingSafetyNet);
            logger.info('🔱 Safety Net: Restored safety net candidates', {
                count: missingSafetyNet.length,
                times: missingSafetyNet.map(c => c.time),
            });
        }
    }

    // Ensure we don't return an empty set
    if (currentCandidates.length === 0 && candidates.length > 0) {
        logger.warn('Tournament failed to yield survivors, using top candidates from original set');
        currentCandidates = candidates.slice(0, 10);
    }

    await progress.completeStep('coarse', [
        `Tournament complete: ${currentCandidates.length} survivors verified.`,
        `(Includes tentative + safety net protection)`,
    ]);

    return {
        survivors: currentCandidates,
        stageResult: {
            stageNumber: 2,
            stageName: 'Batch Tournament',
            candidatesIn: candidates.length,
            candidatesOut: currentCandidates.length,
            batchCount: rounds.reduce((sum, r) => sum + r.batchesProcessed, 0)
        },
        rounds
    };
}
