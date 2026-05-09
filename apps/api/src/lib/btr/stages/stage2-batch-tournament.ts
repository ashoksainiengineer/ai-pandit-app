
/**
 * Stage 2: Batch Tournament
 *
 * Dynamic batch elimination tournament for initial candidate pruning.
 * Uses AI-powered analysis to eliminate unlikely candidates while
 * preserving the true birth time through safety net mechanisms.
 */

import { SecondsPrecisionInput } from '@ai-pandit/shared';
import { CandidateTime, getCandidateIdentity, getDynamicBatchSize, getDynamicSurvivors, sortCandidatesByMerit, splitIntoBatches } from '../../time-offset-manager.js';
import { ProgressTracker } from '../../progress-tracker.js';
import { _callAIWithStream, _executeAIInParallel } from '../../ai-client.js';
import { emitAIContext, emitDecision } from '../../session-events.js';
import { throwIfCancelled } from '../../cancellation-manager.js';
import { cleanup } from '../../ephemeris.js';
import { buildCandidateDataPackage } from '../data-package-builder.js';
import { getBatchPrompt } from '../prompts/index.js';
import { extractBatchSurvivors } from '../extractors/index.js';
import { CandidateDataPackage, StageResult, TournamentRound } from '@ai-pandit/shared';
import { logger } from '../../../utils/logger.js';
import { config } from '../../../config/index.js';
import { getMinifiedEphemerisInline, getFullEphemerisPayload } from './_utils.js';
import { getOffsetMinutes } from '../utils.js';
import { buildCandidateReferenceMap } from '../candidate-reference.js';
import { btrDataCapture } from '../data-capture.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
type LifecycleShift = NonNullable<CandidateDataPackage['lifecycleShifts']>[number];

/**
 * Stage 2: Batch tournament with dynamic sizing and safety net protection
 *
 * @param input - BTR input parameters
 * @param candidates - Initial candidate list from Stage 1
 * @param progress - Progress tracker
 * @param globalLifecycle - Pre-calculated lifecycle shifts
 * @returns Tournament survivors and round statistics
 */
export async function stage2BatchTournament(
    input: SecondsPrecisionInput,
    candidates: CandidateTime[],
    progress: ProgressTracker,
    globalLifecycle: LifecycleShift[] = []
): Promise<{ survivors: CandidateTime[]; stageResult: StageResult; rounds: TournamentRound[] }> {
    await progress.startStep('coarse', 'Stage 2: Batch Tournament...');

    // FIXED: Log initial data state for debugging
    logger.info('🔱 [STAGE-2] Starting batch tournament', {
        totalCandidates: candidates.length,
        sampleCandidate: candidates[0]?.time,
        hasInputData: !!input.lifeEvents?.length,
    });

    const rounds: TournamentRound[] = [];
    let currentCandidates = [...candidates];
    let roundNumber = 0;

    // Get offset from config for dynamic batch sizing
    const offsetMinutes = getOffsetMinutes(input);

    // Dynamic batch size based on offset
    const batchSize = getDynamicBatchSize(candidates.length, offsetMinutes);

    // GOD-TIER ELASTICITY: First round keeps more survivors, wider offsets keep more survivors
    const isFirstRound = roundNumber === 0;
    const survivorsPerBatch = getDynamicSurvivors(batchSize, offsetMinutes, isFirstRound);

    logger.info('🔱 Stage 2: Starting batch tournament', {
        totalCandidates: currentCandidates.length,
        offsetMinutes,
        batchSize,
        survivorsPerBatch
    });

    const MAX_ROUNDS = config.btr.stage2MaxRounds;

    // FORCED FIRST ROUND
    if (roundNumber === 0 && currentCandidates.length > 0) {
        roundNumber++;
        const batches = splitIntoBatches(currentCandidates, batchSize, `${input.sessionId}:stage2:r${roundNumber}`);
        const _roundSurvivors: CandidateTime[] = [];

        await progress.updateMessage(`Base Analysis: Evaluating ${currentCandidates.length} potential paths...`);

        const batchSurvivorResults = new Map<number, CandidateTime[]>();
        const tasks = batches.map((batchTimes, i) => async () => {
            // BUILD DATA ON-DEMAND per batch (not all at once) to control memory
            const batchEnriched = await Promise.all(batchTimes.map(ct =>
                buildCandidateDataPackage(ct.time, ct.offsetMinutes, input, {
                    includeFullData: true,
                    dashaDepth: 4,
                    lifecycleShifts: globalLifecycle,
                    candidate: ct,
                })
            ));
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
            });

            const systemPrompt = 'You are the SUPREME VEDIC ASTROLOGER. Analyze candidate birth times for primary astrological alignment.';
            const userPrompt = getBatchPrompt(batchEnriched, input.lifeEvents, i + 1, batches.length, survivorsPerBatch, input.spouseData, offsetMinutes);
            
            // Save batch metadata
            btrDataCapture.saveBatchMetadata(
                input.sessionId,
                2,
                roundNumber,
                i + 1,
                batchTimes.map(c => c.time),
                survivorsPerBatch
            );
            
            // Save ephemeris data for each candidate in batch
            for (const candidate of batchEnriched) {
                btrDataCapture.saveEphemeris(
                    input.sessionId,
                    2,
                    candidate.time,
                    {
                        planets: candidate.planets,
                        houses: candidate.houseLords,
                        lagna: candidate.ascendant,
                        vimshottariDasha: candidate.vimshottariDasha,
                        vargas: candidate.vargaDegrees,
                        transits: candidate.transitData
                    },
                    roundNumber,
                    i + 1
                );
                
                // Save prompt
                btrDataCapture.savePrompt(
                    input.sessionId,
                    2,
                    candidate.time,
                    systemPrompt,
                    userPrompt,
                    {
                        candidateCount: batchEnriched.length,
                        eventCount: input.lifeEvents.length,
                        spouseDataPresent: !!input.spouseData,
                    },
                    roundNumber,
                    i + 1
                );
            }
            
            const response = await _callAIWithStream(
                input.sessionId,
                2,
                systemPrompt,
                userPrompt,
                {
                    candidateTime: `R${roundNumber}-B${i + 1}`,
                    progressTracker: progress,
                    maxTokens: config.ai.stage2MaxTokens,
                    model: config.ai.model,
                }
            );
            
            // PROCESS BATCH IMMEDIATELY AND EMIT SCORES
            const batchSurvivors: CandidateTime[] = [];
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            const referenceMap = buildCandidateReferenceMap(batchTimes);
            const aiScores = extractBatchSurvivors(aiContent, [...referenceMap.keys()], Math.min(batchTimes.length, survivorsPerBatch));

            // Save AI responses after parsing
            if (response.success) {
                for (const candidate of batchEnriched) {
                    const scoreObj = aiScores.find(s => getCandidateIdentity(referenceMap.get(s.time) || { time: s.time }) === getCandidateIdentity(candidate));
                    btrDataCapture.saveAIResponse(
                        input.sessionId,
                        2,
                        candidate.time,
                        response.thinking || '',
                        response.content || '',
                        {
                            score: scoreObj?.score,
                            verdict: scoreObj?.time,
                            tokensUsed: { prompt: 0, completion: 0, total: 0 },
                            duration: 0,
                            model: config.ai.model
                        },
                        roundNumber,
                        i + 1
                    );
                }
            }

            // 🔱 RESILIENT FALLBACK: If AI fails or returns empty, preserve the first N candidates
            let survivorTimes: string[] = [];
            if (!response.success || aiScores.length === 0) {
                logger.warn(`🔱 [STAGE-2] Batch ${i + 1} AI verdict failed. FALLBACK: Preserving top candidates.`);
                survivorTimes = sortCandidatesByMerit(batchTimes)
                    .slice(0, survivorsPerBatch)
                    .map(c => getCandidateIdentity(c));
            } else {
                survivorTimes = aiScores
                    .sort((a, b) => b.score - a.score)
                    .slice(0, Math.min(batchTimes.length, survivorsPerBatch))
                    .map(s => getCandidateIdentity(referenceMap.get(s.time) || { time: s.time }));
            }

            for (let j = 0; j < batchEnriched.length; j++) {
                const candidate = batchEnriched[j];
                const originalTimeInfo = batchTimes[j];
                const candidateId = getCandidateIdentity(originalTimeInfo);
                const isSurvivor = survivorTimes.includes(candidateId);

                // If AI failed, use fallback scores
                const scoreObj = aiScores.find(s => getCandidateIdentity(referenceMap.get(s.time) || { time: s.time }) === candidateId);
                const score = scoreObj ? scoreObj.score : (isSurvivor ? config.btr.fallbackPromotedScore : config.btr.fallbackRejectedScore);
                const reason = scoreObj ? scoreObj.reason : (isSurvivor ? "Meets primary alignment criteria (Fallback)" : "Low astrological match score");

                if (isSurvivor) {
                    batchSurvivors.push(originalTimeInfo);
                }

                // IMMEDIATE EMIT & PERSIST - SYNCED WITH AI
                // 🔱 UX SMOOTHING: Stagger emissions in first round to prevent "leaderboard pop"
                if (roundNumber === 1 && j > 0) {
                    await sleep(100);
                }

                await progress.addCandidateScore({
                    time: candidate.time,
                    score,
                    stage: 2,
                    batch: i + 1,
                    minifiedEph: getMinifiedEphemerisInline(candidate),
                    fullEph: getFullEphemerisPayload(candidate)
                });
                emitDecision(input.sessionId, {
                    stage: 2,
                    time: candidate.time,
                    verdict: isSurvivor ? 'promoted' : 'rejected',
                    score,
                    reason,
                    batch: i + 1
                });
            }

            batchSurvivorResults.set(i, batchSurvivors);
            return batchSurvivors;
        });

        const results = await _executeAIInParallel(tasks, config.ai.parallelConcurrency, config.ai.parallelStaggerMs);
        if (global.gc) global.gc();

        // Read lightweight survivors from map (heavy batchEnriched already GC'd)
        let nextCandidates: CandidateTime[] = [];
        for (let i = 0; i < batches.length; i++) {
            const survivors = batchSurvivorResults.get(i) || [];
            nextCandidates.push(...survivors);
        }

        // 🔱 SAFETY NET 2.0: Cluster-Aware Survival
        // If candidates are very close (within specified threshold), keep both if one is a survivor
        const clusterThreshold = config.btr.clusterThreshold; // minutes
        const additionalSurvivors: CandidateTime[] = [];
        for (const s of nextCandidates) {
            const nearby = currentCandidates.filter(c =>
                !nextCandidates.some(nc => getCandidateIdentity(nc) === getCandidateIdentity(c)) &&
                Math.abs(c.offsetMinutes - s.offsetMinutes) <= clusterThreshold
            );
            // Pick the CLOSEST nearby candidate (sorted by offset distance)
            if (nearby.length > 0) {
                nearby.sort((a, b) => Math.abs(a.offsetMinutes - s.offsetMinutes) - Math.abs(b.offsetMinutes - s.offsetMinutes));
                additionalSurvivors.push(nearby[0]);
            }
        }
        nextCandidates = [...nextCandidates, ...additionalSurvivors];

        // 🔱 SAFETY NET 2.0: Wildcard Quadrants
        // Divide the offset range into 4 quadrants and ensure at least one survives from each
        const minOffset = Math.min(...currentCandidates.map(c => c.offsetMinutes));
        const maxOffset = Math.max(...currentCandidates.map(c => c.offsetMinutes));
        const qSize = (maxOffset - minOffset) / 4;

        for (let i = 0; i < 4; i++) {
            const qStart = minOffset + i * qSize;
            const qEnd = qStart + qSize;
            const hasSurvivor = nextCandidates.some(c => c.offsetMinutes >= qStart && c.offsetMinutes <= qEnd);
            if (!hasSurvivor) {
                const bestInQuadrant = currentCandidates
                    .filter(c => c.offsetMinutes >= qStart && c.offsetMinutes <= qEnd)
                    .sort((a, b) => {
                      // BUG-FIX: Proper transitive comparator — favor tentative, then by offset
                      const aTent = a.time === input.tentativeTime ? 0 : 1;
                      const bTent = b.time === input.tentativeTime ? 0 : 1;
                      if (aTent !== bTent) return aTent - bTent;
                      return a.offsetMinutes - b.offsetMinutes;
                    })[0]; // Favor tentative if in quadrant
                if (bestInQuadrant) {
                    nextCandidates.push(bestInQuadrant);
                    logger.info('🔱 Safety Net: Injected Wildcard from quadrant', { quadrant: i + 1, time: bestInQuadrant.time });
                }
            }
        }

        // 🔱 PROTECTION: Boundary Locks and Tentative always survive Round 1
        const protectedCandidates = currentCandidates.filter(c =>
            (c.time === input.tentativeTime && (c.dayOffset ?? 0) === 0) ||
            c.offsetDescription.includes('Boundary')
        );
        for (const p of protectedCandidates) {
            if (!nextCandidates.some(nc => getCandidateIdentity(nc) === getCandidateIdentity(p))) {
                nextCandidates.push(p);
            }
        }

        rounds.push({ roundNumber, batchesProcessed: batches.length, candidatesIn: currentCandidates.length, candidatesOut: nextCandidates.length });
        currentCandidates = nextCandidates;
    }

    // Continue tournament for larger sets
    while (currentCandidates.length > 1 && roundNumber <= MAX_ROUNDS) {
        roundNumber++;

        // Recalculate per round: adapting to shrinking candidate pool
        const roundBatchSize = getDynamicBatchSize(currentCandidates.length, offsetMinutes);
        const roundSurvivorsPerBatch = getDynamicSurvivors(roundBatchSize, offsetMinutes, false);
        const batches = splitIntoBatches(currentCandidates, roundBatchSize, `${input.sessionId}:stage2:r${roundNumber}`);
        const roundSurvivors: CandidateTime[] = [];
        await progress.updateMessage(`Tournament Round ${roundNumber}: ${batches.length} batches of ${roundBatchSize}`);

        const batchSurvivorResults = new Map<number, CandidateTime[]>();
        const tasks = batches.map((batchTimes, i) => async () => {
            const batchEnriched = await Promise.all(batchTimes.map(ct =>
                buildCandidateDataPackage(ct.time, ct.offsetMinutes, input, {
                    includeFullData: true,
                    dashaDepth: 4, // Upgraded to Sukshma for precision pruning
                    lifecycleShifts: globalLifecycle,
                    candidate: ct,
                })
            ));
            // NOTE: batchEnriched is NOT stored in any global Map — GC reclaims it after this task
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

            const systemPrompt = 'You are the SUPREME VEDIC ASTROLOGER. Tournament analysis: prune based on astrological alignment.';
            const userPrompt = getBatchPrompt(batchEnriched, input.lifeEvents, i + 1, batches.length, roundSurvivorsPerBatch, input.spouseData, offsetMinutes);
            
            // Save batch metadata
            btrDataCapture.saveBatchMetadata(
                input.sessionId,
                2,
                roundNumber,
                i + 1,
                batchTimes.map(c => c.time),
                roundSurvivorsPerBatch
            );
            
            // Save ephemeris and prompts for each candidate
            for (const candidate of batchEnriched) {
                btrDataCapture.saveEphemeris(
                    input.sessionId,
                    2,
                    candidate.time,
                    {
                        planets: candidate.planets,
                        houses: candidate.houseLords,
                        lagna: candidate.ascendant,
                        vimshottariDasha: candidate.vimshottariDasha,
                        vargas: candidate.vargaDegrees,
                        transits: candidate.transitData
                    },
                    roundNumber,
                    i + 1
                );
                
                btrDataCapture.savePrompt(
                    input.sessionId,
                    2,
                    candidate.time,
                    systemPrompt,
                    userPrompt,
                    {
                        candidateCount: batchEnriched.length,
                        eventCount: input.lifeEvents.length,
                        spouseDataPresent: !!input.spouseData,
                    },
                    roundNumber,
                    i + 1
                );
            }
            
            const response = await _callAIWithStream(
                input.sessionId,
                2,
                systemPrompt,
                userPrompt,
                {
                    candidateTime: `R${roundNumber}-B${i + 1}`,
                    progressTracker: progress,
                    maxTokens: config.ai.stage2MaxTokens,
                    model: config.ai.model,
                }
            );
            
            // PROCESS BATCH IMMEDIATELY AND EMIT SCORES
            const batchSurvivors: CandidateTime[] = [];
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            const referenceMap = buildCandidateReferenceMap(batchTimes);
            const aiScores = extractBatchSurvivors(aiContent, [...referenceMap.keys()], roundSurvivorsPerBatch);
            
            // Save AI responses after parsing
            if (response.success) {
                for (const candidate of batchEnriched) {
                    const scoreObj = aiScores.find(s => getCandidateIdentity(referenceMap.get(s.time) || { time: s.time }) === getCandidateIdentity(candidate));
                    btrDataCapture.saveAIResponse(
                        input.sessionId,
                        2,
                        candidate.time,
                        response.thinking || '',
                        response.content || '',
                        {
                            score: scoreObj?.score,
                            verdict: scoreObj?.time,
                            tokensUsed: { prompt: 0, completion: 0, total: 0 },
                            duration: 0,
                            model: config.ai.model
                        },
                        roundNumber,
                        i + 1
                    );
                }
            }

            // 🔱 RESILIENT FALLBACK: If AI fails or returns empty, preserve the first N candidates
            let survivorTimes: string[] = [];
            if (!response.success || aiScores.length === 0) {
                logger.warn(`🔱 [STAGE-2] Tournament batch ${i + 1} verdict failed. FALLBACK: Preserving top candidates.`);
                survivorTimes = sortCandidatesByMerit(batchTimes)
                    .slice(0, roundSurvivorsPerBatch)
                    .map(c => getCandidateIdentity(c));
            } else {
                survivorTimes = aiScores
                    .sort((a, b) => b.score - a.score)
                    .slice(0, roundSurvivorsPerBatch)
                    .map(s => getCandidateIdentity(referenceMap.get(s.time) || { time: s.time }));
            }

            for (let j = 0; j < batchEnriched.length; j++) {
                const candidate = batchEnriched[j];
                const originalTimeInfo = batchTimes[j];
                const candidateId = getCandidateIdentity(originalTimeInfo);
                const isSurvivor = survivorTimes.includes(candidateId);

                // If AI failed, use fallback scores
                const scoreObj = aiScores.find(s => getCandidateIdentity(referenceMap.get(s.time) || { time: s.time }) === candidateId);
                const score = scoreObj ? scoreObj.score : (isSurvivor ? config.btr.fallbackPromotedScore + 3 : config.btr.fallbackRejectedScore - 10);
                const reason = scoreObj ? scoreObj.reason : (isSurvivor ? "Superior alignment in tournament round (Fallback)" : "Eliminated in batch tournament");

                if (isSurvivor) {
                    batchSurvivors.push(originalTimeInfo);
                }

                await progress.addCandidateScore({
                    time: candidate.time,
                    score,
                    stage: 2,
                    batch: i + 1,
                    minifiedEph: getMinifiedEphemerisInline(candidate),
                    fullEph: getFullEphemerisPayload(candidate)
                });
                emitDecision(input.sessionId, {
                    stage: 2,
                    time: candidate.time,
                    verdict: isSurvivor ? 'promoted' : 'rejected',
                    score,
                    reason,
                    batch: i + 1
                });
            }

            // Store ONLY lightweight survivors (NOT heavy batchEnriched)
            batchSurvivorResults.set(i, batchSurvivors);
            // batchEnriched goes out of scope here — GC can reclaim it

            return response;
        });

        const results = await _executeAIInParallel(tasks, config.ai.parallelConcurrency, config.ai.parallelStaggerMs);
        if (global.gc) global.gc();
        await progress.updateSubProgress(batches.length, batches.length);

        // Read lightweight survivors from map (heavy batchEnriched already GC'd)
        for (let i = 0; i < batches.length; i++) {
            const survivors = batchSurvivorResults.get(i) || [];
            roundSurvivors.push(...survivors);
        }

        await throwIfCancelled(input.sessionId, input.abortSignal);
        cleanup();

        rounds.push({
            roundNumber,
            batchesProcessed: batches.length,
            candidatesIn: currentCandidates.length,
            candidatesOut: roundSurvivors.length
        });

        if (roundSurvivors.length >= currentCandidates.length) {
            logger.warn(`🔱 [STAGE-2] Round ${roundNumber} failed to reduce candidate pool. Breaking loop early.`);
            break;
        }

        currentCandidates = roundSurvivors;
    }

    if (currentCandidates.length > batchSize) {
        logger.warn(`🔱 [STAGE-2] Truncating remaining ${currentCandidates.length} candidates down to ${batchSize} after hitting max rounds.`);
        currentCandidates = sortCandidatesByMerit(currentCandidates).slice(0, batchSize);
    }

    // GOD-TIER SAFETY: Ensure tentative time and safety net always survive
    const tentativeTime = input.tentativeTime;
        const hasTentative = currentCandidates.some(c => c.time === tentativeTime && (c.dayOffset ?? 0) === 0);
    const hasSafetyNet = currentCandidates.some(c => c.offsetDescription.includes('Safety Net'));

    if (!hasTentative || !hasSafetyNet) {
        logger.warn('🔱 Safety Net: Adding missing tentative/safety net candidates back to survivors');

        if (!hasTentative) {
            const tentativeCandidate = candidates.find(c => c.time === tentativeTime && (c.dayOffset ?? 0) === 0);
            if (tentativeCandidate) {
                currentCandidates.push(tentativeCandidate);
                logger.info('🔱 Safety Net: Restored tentative time', { tentativeTime });
            }
        }

        const missingSafetyNet = candidates
            .filter(c => c.offsetDescription.includes('Safety Net'))
            .filter(c => !currentCandidates.some(survivor => getCandidateIdentity(survivor) === getCandidateIdentity(c)))
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
        currentCandidates = sortCandidatesByMerit(candidates).slice(0, 10);
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
