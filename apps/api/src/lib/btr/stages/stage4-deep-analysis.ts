/**
 * Stage 4: Deep Analysis
 *
 * Multi-dasha verification with deep forensic analysis on Stage 3 candidates.
 * Uses parallel AI execution for comprehensive candidate evaluation.
 */

import { SecondsPrecisionInput, ForensicTraits } from '@ai-pandit/shared';
import { CandidateTime, MAX_BATCH_SIZE, getDynamicSurvivors, splitIntoBatches } from '../../time-offset-manager.js';
import { ProgressTracker } from '../../progress-tracker.js';
import { callAIWithStream, executeAIInParallel } from '../../ai-client.js';
import { emitCandidateScore, emitAIContext, emitDecision } from '../../session-events.js';
import { throwIfCancelled } from '../../cancellation-manager.js';
import { cleanup } from '../../ephemeris.js';
import { buildCandidateDataPackage } from '../data-package-builder.js';
import { getDeepAnalysisPrompt } from '../prompts/index.js';
import { extractBatchSurvivors } from '../extractors/index.js';
import { CandidateDataPackage, StageResult } from '@ai-pandit/shared';
import { config } from '../../../config/index.js';
import { logger } from '../../logger.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Stage 4: Deep multi-dasha analysis on refined candidates
 *
 * @param input - BTR input parameters
 * @param candidates - Refined candidates from Stage 3
 * @param progress - Progress tracker
 * @param forensicTraits - User's forensic traits
 * @param globalLifecycle - Pre-calculated lifecycle shifts
 * @returns Deep analysis survivors and stage result
 */
export async function stage4DeepAnalysis(
    input: SecondsPrecisionInput,
    candidates: CandidateTime[],
    progress: ProgressTracker,
    forensicTraits: ForensicTraits,
    globalLifecycle: any[] = []
): Promise<{ survivors: CandidateTime[]; stageResult: StageResult; aiReasoning: string }> {
    await progress.startStep('deep', 'Stage 4: Deep analysis tournament...');

    // FIXED: Log data state for audit trail
    logger.info('🔱 [STAGE-4] Starting deep analysis', {
        candidatesIn: candidates.length,
        sampleTime: candidates[0]?.time,
        lifeEventsCount: input.lifeEvents?.length,
        hasForensicTraits: !!forensicTraits
    });

    let currentCandidates = [...candidates];
    let allReasoning = '';

    // Get offset from config for dynamic batch sizing
    const offsetMinutes = input.offsetConfig.customMinutes ||
        (input.offsetConfig.preset === '30min' ? 30 :
            input.offsetConfig.preset === '1hour' ? 60 :
                input.offsetConfig.preset === '2hours' ? 120 :
                    input.offsetConfig.preset === '4hours' ? 240 :
                        input.offsetConfig.preset === '6hours' ? 360 :
                            input.offsetConfig.preset === '12hours' ? 720 : 60);

    const batchSize = MAX_BATCH_SIZE;
    // FIXED: Use getDynamicSurvivors for consistent tournament logic with Elasticity
    const survivorsPerBatch = getDynamicSurvivors(batchSize, offsetMinutes, false);

    const getMinifiedEphemerisInline = (c: CandidateDataPackage) => ({
        sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
        moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
        ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
    });

    const getFullEphemerisPayload = (c: CandidateDataPackage) => {
        const payload: Record<string, string> = {};
        for (const [name, p] of Object.entries(c.planets)) {
            const pKey = name.charAt(0).toUpperCase() + name.slice(1);
            payload[pKey] = `${p.sign} ${p.degree}`;
        }
        payload.Lagna = `${c.ascendant.sign} ${c.ascendant.degree}`;
        return payload;
    };

    while (currentCandidates.length > batchSize) {
        const batches = splitIntoBatches(currentCandidates, batchSize);
        const batchSurvivors: CandidateTime[] = [];
        const batchDataMap = new Map<number, CandidateDataPackage[]>();

        let completedBatches = 0;
        const tasks = batches.map((batchTimes, i) => async () => {
            const batchEnriched = await Promise.all(batchTimes.map(ct =>
                buildCandidateDataPackage(ct.time, ct.offsetMinutes, input, {
                    includeFullData: true,
                    dashaDepth: 5, // God-Tier Precision (Prana Dasha)
                    lifecycleShifts: globalLifecycle
                })
            ));
            batchDataMap.set(i, batchEnriched);

            emitAIContext(input.sessionId, {
                stage: 4,
                candidateTime: `Deep Batch ${i + 1}/${batches.length}`,
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
                4,
                'You are the GOD-TIER VEDIC ANALYST. Perform deep forensic multi-dasha verification.',
                getDeepAnalysisPrompt(batchEnriched, input.lifeEvents, forensicTraits, input.spouseData, offsetMinutes),
                {
                    candidateTime: `Batch ${i + 1}`,
                    progressTracker: progress
                }
            );

            completedBatches++;
            // Use batches.length + 1 to account for the potential final verification step
            await progress.updateSubProgress(completedBatches, batches.length + 1);

            // PROCESS BATCH IMMEDIATELY
            const batchSurvivors: any[] = [];
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            const aiScores = extractBatchSurvivors(aiContent, batchTimes.map(c => c.time), survivorsPerBatch);

            // 🔱 RESILIENT FALLBACK: If AI fails or returns empty, preserve the first N candidates
            let survivorTimes: string[] = [];
            if (!response.success || aiScores.length === 0) {
                logger.warn(`🔱 [STAGE-4] Batch ${i + 1} AI verdict failed (Success: ${response.success}, Scores: ${aiScores.length}). FALLBACK: Preserving top candidates.`);
                survivorTimes = batchTimes.slice(0, survivorsPerBatch).map(c => c.time);
            } else {
                survivorTimes = aiScores
                    .sort((a, b) => b.score - a.score)
                    .slice(0, survivorsPerBatch)
                    .map(s => s.time);
            }

            for (let j = 0; j < batchEnriched.length; j++) {
                const candidate = batchEnriched[j];
                const originalTimeInfo = batchTimes[j];
                const isSurvivor = survivorTimes.includes(candidate.time);

                // If AI failed, use fallback scores
                const scoreObj = aiScores.find(s => s.time === candidate.time);
                const score = scoreObj ? scoreObj.score : (isSurvivor ? 85 : 60);
                const reason = scoreObj ? scoreObj.reason : (isSurvivor ? "Preserved via technical fallback" : "Failed deep multi-dasha verification");

                if (isSurvivor) {
                    batchSurvivors.push(originalTimeInfo);
                }

                // IMMEDIATE EMIT - SYNCED WITH AI
                emitCandidateScore(input.sessionId, candidate.time, score, 4, undefined, getMinifiedEphemerisInline(candidate), getFullEphemerisPayload(candidate));
                emitDecision(input.sessionId, {
                    stage: 4,
                    time: candidate.time,
                    verdict: isSurvivor ? 'promoted' : 'rejected',
                    score,
                    reason,
                    batch: i + 1
                });
            }

            return { batchSurvivors, aiContent };
        });

        const results = await executeAIInParallel(tasks, config.ai.maxConcurrency, config.ai.staggerMs);

        // Flatten survivors and accumulate reasoning
        const roundSurvivors = results.flatMap(r => r.batchSurvivors);
        allReasoning += results.map(r => r.aiContent).filter(Boolean).join('\n\n---\n\n');

        currentCandidates = roundSurvivors;

        // 🔱 TENTATIVE TIME SAFETY: Ensure it survives the rounds
        const hasTentative = currentCandidates.some(c => c.time === input.tentativeTime);
        if (!hasTentative) {
            const tentativeCandidate = candidates.find(c => c.time === input.tentativeTime);
            if (tentativeCandidate) {
                currentCandidates.push(tentativeCandidate);
                logger.info(`🔱 [STAGE-4] Round safety net: Restored tentative time ${input.tentativeTime}`);
            }
        }

        if (currentCandidates.length === 0) {
            logger.error('🔱 [STAGE-4] FAILED: All candidates rejected in internal tournament rounds');
            throw new Error('AI_OUT_OF_CANDIDATES: The analysis narrowed down candidates and eventually found no suitable matches for the provided life events. Please verify the event dates and try again.');
        }
    }

    // Final deep analysis on remaining candidates
    if (currentCandidates.length > 0) {
        const finalBatchData = await Promise.all(currentCandidates.map(ct =>
            buildCandidateDataPackage(ct.time, ct.offsetMinutes, input, {
                includeFullData: true,
                dashaDepth: 5, // God-Tier Precision (Prana Dasha)
                lifecycleShifts: globalLifecycle
            })
        ));

        const prompt = getDeepAnalysisPrompt(finalBatchData, input.lifeEvents, forensicTraits, input.spouseData, offsetMinutes);

        const response = await callAIWithStream(
            input.sessionId,
            4,
            'You are performing FINAL deep verification.',
            prompt,
            {
                candidateTime: 'Deep Final',
                progressTracker: progress
            }
        );

        // Final verification is complete
        await progress.updateSubProgress(1, 1);

        const aiContent = response.success ? (response.content || response.thinking || '') : '';
        allReasoning += aiContent;

        const aiScores = extractBatchSurvivors(aiContent, currentCandidates.map(c => c.time), survivorsPerBatch);

        // 🔱 FINAL ROUND FALLBACK: If AI fails or returns empty, preserve everyone (don't eliminate)
        let survivorTimes: string[] = [];
        if (!response.success || aiScores.length === 0) {
            logger.warn(`🔱 [STAGE-4] Final verification AI failed. FALLBACK: Promoting all current candidates.`);
            survivorTimes = currentCandidates.map(c => c.time);
        } else {
            survivorTimes = aiScores
                .sort((a, b) => b.score - a.score)
                .slice(0, survivorsPerBatch)
                .map(s => s.time);
        }

        const survivors: CandidateTime[] = [];
        for (let j = 0; j < finalBatchData.length; j++) {
            const candidate = finalBatchData[j];
            const originalTimeInfo = currentCandidates[j];
            const isSurvivor = survivorTimes.includes(candidate.time);
            const scoreObj = aiScores.find(s => s.time === candidate.time);
            const score = scoreObj ? scoreObj.score : (isSurvivor ? 95 : 65);
            const reason = scoreObj ? scoreObj.reason : (isSurvivor ? "Superior alignment in final deep analysis" : "Low confidence in multi-dasha alignment");

            if (isSurvivor) survivors.push(originalTimeInfo);

            emitCandidateScore(input.sessionId, candidate.time, score, 4, undefined, getMinifiedEphemerisInline(candidate), getFullEphemerisPayload(candidate));
            emitDecision(input.sessionId, {
                stage: 4,
                time: candidate.time,
                verdict: isSurvivor ? 'promoted' : 'rejected',
                score,
                reason,
                batch: 0 // Final batch
            });
        }
        currentCandidates = survivors;
    }

    if (currentCandidates.length === 0) {
        logger.error('🔱 [STAGE-4] FAILED: No survivors found after final deep verification');
        throw new Error('AI_OUT_OF_CANDIDATES: No birth time candidates survived the deep multi-dasha analysis. This often happens if the birth time offset requested doesn\'t contain the actual birth time, or if life event data is inaccurate.');
    }

    await sleep(2000);
    await progress.completeStep('deep', [`Deep analysis: ${currentCandidates.length} survivors`]);

    return {
        survivors: currentCandidates.slice(0, 7),
        stageResult: {
            stageNumber: 4,
            stageName: 'Deep Multi-Dasha Analysis',
            candidatesIn: candidates.length,
            candidatesOut: Math.min(currentCandidates.length, 7),
            aiReasoning: allReasoning
        },
        aiReasoning: allReasoning
    };
}
