/**
 * Stage 6: Final Precision Judgement
 *
 * Final seconds-level precision determination using Precision integration.
 * Performs the ultimate AI analysis to determine the exact birth time.
 */

import { SecondsPrecisionInput, ForensicTraits } from '@ai-pandit/shared';
import { CandidateTime, getDynamicBatchSize, getDynamicSurvivors, splitIntoBatches } from '../../time-offset-manager.js';
import { ProgressTracker } from '../../progress-tracker.js';
import { callAIWithStream, executeAIInParallel } from '../../ai-client.js';
import { emitCandidateScore, emitAIContext } from '../../session-events.js';
import { calculateEphemeris } from '../../ephemeris.js';
import { getDashaForDate } from '../../vedic-astrology-engine.js';
import { buildCandidateDataPackage } from '../data-package-builder.js';
import { getFinalPrecisionPrompt } from '../prompts/index.js';
import { extractFinalVerdict } from '../extractors/index.js';
import { CandidateDataPackage, StageResult } from '@ai-pandit/shared';
import {
    enhanceCandidateWithPrecisionData,
    generatePrecisionAIPrompt,
    CandidateWithPrecisionData,
} from '../../btr-precision-integrator.js';
import { logger } from '../../logger.js';
import { config } from '../../../config/index.js';
import { getMinifiedEphemerisInline, getFullEphemerisPayload } from './_utils.js';

function getPresentTransitData(c: CandidateDataPackage, currentEph: any, now: Date) {
    if (!c || !c.rawVimshottari) {
        logger.warn('🔱 [STAGE-6] Missing rawVimshottari in candidate for transit calculation');
        return {
            dashaAtNow: 'Unknown',
            jupiter: 'Unknown',
            saturn: 'Unknown',
            rahu: 'Unknown',
        };
    }
    const dashaAtNow = getDashaForDate(c.rawVimshottari as any, now);
    return {
        dashaAtNow: dashaAtNow ? `${dashaAtNow.mahadasha}-${dashaAtNow.antardasha}-${dashaAtNow.pratyantardasha}` : 'Unknown',
        jupiter: `${currentEph.planets.jupiter.sign}${currentEph.planets.jupiter.retro ? ' (R)' : ''}`,
        saturn: `${currentEph.planets.saturn.sign}${currentEph.planets.saturn.retro ? ' (R)' : ''}`,
        rahu: `${currentEph.planets.rahu.sign}${currentEph.planets.rahu.retro ? ' (R)' : ''}`
    };
}

/**
 * Stage 6: Final seconds-level precision judgement
 *
 * @param input - BTR input parameters
 * @param candidates - Micro-precision candidates from Stage 5
 * @param progress - Progress tracker
 * @param forensicTraits - User's forensic traits
 * @param globalLifecycle - Pre-calculated lifecycle shifts
 * @returns Final verdict with rectified time
 */
export async function stage6FinalPrecision(
    input: SecondsPrecisionInput,
    candidates: CandidateTime[],
    progress: ProgressTracker,
    forensicTraits: ForensicTraits,
    globalLifecycle: any[] = []
): Promise<{
    finalTime: string;
    accuracy: number;
    confidence: string;
    margin: number;
    aiReasoning: string;
    allReasoning?: string;
    thinking?: string;
    finalists: Array<{ time: string; score: number; ephemeris?: any }>;
    stageResult: StageResult;
}> {
    await progress.startStep('final', 'Stage 6: Final precision filtering...');

    if (!candidates || candidates.length === 0) {
        logger.error('🔱 [STAGE-6] FAILED: No candidates provided for final precision judgment');
        throw new Error('AI_OUT_OF_CANDIDATES: No birth time candidates survived the previous analysis stages. This usually happens when life events and forensic traits are highly contradictory.');
    }

    // Get offset from config for dynamic batch sizing
    const offsetMinutes = input.offsetConfig.customMinutes ||
        (input.offsetConfig.preset === '30min' ? 30 :
            input.offsetConfig.preset === '1hour' ? 60 :
                input.offsetConfig.preset === '2hours' ? 120 :
                    input.offsetConfig.preset === '4hours' ? 240 :
                        input.offsetConfig.preset === '6hours' ? 360 :
                            input.offsetConfig.preset === '12hours' ? 720 : 60);

    const batchSize = getDynamicBatchSize(candidates.length, offsetMinutes);
    const survivorsPerBatch = getDynamicSurvivors(batchSize, offsetMinutes, false);

    const now = new Date();
    const currentEph = await calculateEphemeris(
        now.toISOString().split('T')[0],
        now.toTimeString().split(' ')[0],
        input.latitude,
        input.longitude,
        input.timezone
    );

    // Removed orphaned getPresentTransitData block

    // PRECISION ENHANCEMENT: Enhance finalists with KP and Consensus data
    let godTierEnhancedCandidates: Array<CandidateWithPrecisionData & { time: string; offsetMinutes: number }> = [];

    // FIXED: Log candidate data state before enhancement
    logger.info('[STAGE-6] Starting final precision judgment', {
        candidatesIn: candidates.length,
        sampleTime: candidates[0]?.time,
        lifeEventsCount: input.lifeEvents?.length,
        hasForensicTraits: !!forensicTraits,
        hasSpouseData: !!input.spouseData
    });

    let currentCandidates = [...candidates];
    let allReasoning = '';

    for (const candidate of candidates.slice(0, 7)) {
        try {
            const pkg = await buildCandidateDataPackage(candidate.time, candidate.offsetMinutes, input, {
                includeFullData: true,
                dashaDepth: 3,
                pranaWindowDays: 3,
                lifecycleShifts: globalLifecycle
            });

            const baseCandidate: CandidateWithPrecisionData = {
                time: candidate.time,
                offsetMinutes: candidate.offsetMinutes,
                ephemeris: pkg,
                dasha: pkg.vimshottariDasha,
                vargas: {
                    D9: pkg.d9Chart,
                    D10: pkg.d10Chart,
                    D60: pkg.d60Sign
                },
                kpData: {}
            };

            const enhanced = enhanceCandidateWithPrecisionData(
                baseCandidate,
                input.lifeEvents,
                input.forensicTraits,
                input.tentativeTime
            );

            godTierEnhancedCandidates.push({
                ...enhanced,
                time: candidate.time,
                offsetMinutes: candidate.offsetMinutes
            });
        } catch (error: any) {
            logger.warn(`Failed to enhance candidate ${candidate.time} with God-Tier data`, { error: error?.message || error });
        }
    }

    let finalists = [...candidates];

    const godTierCount = godTierEnhancedCandidates.filter(c => c.precision?.isPrecisionStandard).length;
    logger.info(`Stage 6: ${godTierCount}/${godTierEnhancedCandidates.length} candidates achieved High-Precision status`);

    let roundNumber = 1;
    const MAX_ROUNDS = config.btr.stage6MaxRounds;

    while (finalists.length > batchSize && roundNumber <= MAX_ROUNDS) {
        const initialFinalistsCount = finalists.length;
        const batches = splitIntoBatches(finalists, batchSize);
        const batchWinners: CandidateTime[] = [];
        const batchDataMap = new Map<number, CandidateDataPackage[]>();

        const tasks = batches.map((batchTimes, i) => async () => {
            const batchEnriched = await Promise.all(batchTimes.map(ct =>
                buildCandidateDataPackage(ct.time, ct.offsetMinutes, input, {
                    includeFullData: true,
                    dashaDepth: 4,
                    pranaWindowDays: 3,
                    lifecycleShifts: globalLifecycle
                })
            ));
            batchDataMap.set(i, batchEnriched);

            if (batchEnriched.length === 0) {
                logger.error(`🔱 [STAGE-6] Batch ${i + 1} enrichment returned no data`);
                return { success: false, error: 'Enrichment failed', content: '' };
            }

            const presentAnchor = getPresentTransitData(batchEnriched[0], currentEph, now);

            const resp = await callAIWithStream(
                input.sessionId,
                6,
                'FINAL FORENSIC JUDGEMENT. Pick THE ONE based on bio-Vedic alignment.',
                getFinalPrecisionPrompt(batchEnriched, input.lifeEvents, forensicTraits, input.spouseData, presentAnchor),
                {
                    candidateTime: `R1-B${i + 1}`,
                    progressTracker: progress,
                    maxTokens: config.ai.stage6MaxTokens // Driven by AI_STAGE6_MAX_TOKENS
                }
            );

            const aiContent = resp.success ? (resp.content || resp.thinking || '') : '';
            return { response: resp, aiContent };
        });

        const results = await executeAIInParallel(tasks, config.ai.parallelConcurrency, config.ai.parallelStaggerMs); // Configurable concurrency/stagger

        // Accumulate reasoning from batches
        allReasoning += results.map(r => r.aiContent).filter(Boolean).join('\n\n---\n\n');

        for (let i = 0; i < batches.length; i++) {
            const batchTimes = batches[i];
            const result = results[i];
            if (!result) continue;

            const response = result.response;
            if (!response) continue;

            const fullBatchData = batchDataMap.get(i) || [];
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            const verdict = extractFinalVerdict(aiContent);

            for (let j = 0; j < fullBatchData.length; j++) {
                const candidate = fullBatchData[j];
                const originalTimeInfo = batchTimes[j];
                const isWinner = verdict && candidate.time === verdict.time;
                const score = isWinner ? (verdict.accuracy || 90) : 60;

                if (isWinner) {
                    batchWinners.push(originalTimeInfo);
                } else if (!verdict && fullBatchData.length > 0 && j === 0) {
                    // 🔱 FALLBACK: If AI fails to pick a winner in a batch, preserve the first one
                    logger.warn(`🔱 [STAGE-6] Batch ${i + 1} AI verdict failed. FALLBACK: Preserving ${candidate.time}`);
                    batchWinners.push(originalTimeInfo);
                }

                await progress.addCandidateScore({
                    time: candidate.time,
                    score,
                    stage: 6,
                    batch: i + 1,
                    minifiedEph: getMinifiedEphemerisInline(candidate),
                    fullEph: getFullEphemerisPayload(candidate)
                });
            }
        }

        // Break early if we made no progress cutting down candidates
        if (batchWinners.length >= initialFinalistsCount) {
            logger.warn(`🔱 [STAGE-6] Round ${roundNumber} failed to reduce candidate pool. Breaking loop.`);
            break;
        }

        finalists = batchWinners;
        roundNumber++;
    }

    if (finalists.length > batchSize) {
        logger.warn(`🔱 [STAGE-6] Truncating remaining ${finalists.length} candidates down to ${batchSize} after hitting max rounds.`);
        finalists = finalists.slice(0, batchSize);
    }

    // 🔱 EMERGENCY FALLBACK: If all finalists vanish (critical glitch), restore original candidates
    if (finalists.length === 0 && candidates.length > 0) {
        logger.error('🔱 [STAGE-6] CRITICAL: Finalists empty before judgment. Restoring top 3 from input.');
        finalists = candidates.slice(0, 3);
    }

    // Final judgement with God-Tier prompt enhancement
    // FIXED: Enhance ALL finalists with God-Tier data for comprehensive judgment
    const enhancedFinalBatch: Array<CandidateWithPrecisionData & { time: string; offsetMinutes: number }> = [];

    for (const finalist of finalists) {
        const existingEnhanced = godTierEnhancedCandidates.find(ge => ge.time === finalist.time);
        if (existingEnhanced) {
            enhancedFinalBatch.push(existingEnhanced);
        } else {
            // Build and enhance if not already done
            try {
                const pkg = await buildCandidateDataPackage(finalist.time, finalist.offsetMinutes, input, {
                    includeFullData: true,
                    dashaDepth: 5,
                    pranaWindowDays: 5,
                    lifecycleShifts: globalLifecycle
                });
                const baseCandidate: CandidateWithPrecisionData = {
                    time: finalist.time,
                    offsetMinutes: finalist.offsetMinutes,
                    ephemeris: pkg,
                    dasha: pkg.vimshottariDasha,
                    vargas: { D9: pkg.d9Chart, D10: pkg.d10Chart, D60: pkg.d60Sign },
                    kpData: {}
                };
                const enhanced = enhanceCandidateWithPrecisionData(
                    baseCandidate, input.lifeEvents, input.forensicTraits, input.tentativeTime
                );
                enhancedFinalBatch.push({ ...enhanced, time: finalist.time, offsetMinutes: finalist.offsetMinutes });
            } catch (error: any) {
                logger.warn(`Failed to enhance finalist ${finalist.time}`, { error: error?.message || error });
            }
        }
    }

    const finalBatch = await Promise.all(finalists.map(ct =>
        buildCandidateDataPackage(ct.time, ct.offsetMinutes, input, {
            includeFullData: true,
            dashaDepth: 5,
            pranaWindowDays: 5,
            lifecycleShifts: globalLifecycle
        })
    ));

    if (finalBatch.length === 0) {
        logger.error('🔱 [STAGE-6] FAILED: No candidates survived final building phase');
        throw new Error('AI_ANALYSIS_FAILED: Unable to build final candidate data. Please check your internet connection and retry.');
    }

    const finalAnchor = getPresentTransitData(finalBatch[0], currentEph, now);
    let prompt = getFinalPrecisionPrompt(finalBatch, input.lifeEvents, forensicTraits, input.spouseData, finalAnchor);

    // FIXED: Aggregate God-Tier data from ALL finalists for comprehensive prompt
    // This provides the AI with consensus patterns across all finalists
    const validEnhanced = enhancedFinalBatch.filter(e => e.precision?.consensus);
    if (validEnhanced.length > 0) {
        // Use the candidate with highest consensus for main enhancement
        const bestEnhanced = validEnhanced.reduce((best, current) =>
            (current.precision?.consensus?.overallConsensus ?? 0) > (best.precision?.consensus?.overallConsensus ?? 0)
                ? current : best
        );

        // Add comparative analysis section
        const comparativeAnalysis = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔱 FINALIST CONSENSUS COMPARISON (${validEnhanced.length} candidates)           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
${validEnhanced.map((c, i) =>
            `  ${i + 1}. ${c.time}: ${c.precision?.consensus.overallConsensus.toFixed(1)}% (${c.precision?.consensus.confidenceLevel})`
        ).join('\n')}

Consensus Range: ${Math.min(...validEnhanced.map(c => c.precision?.consensus.overallConsensus ?? 0)).toFixed(1)}% - ${Math.max(...validEnhanced.map(c => c.precision?.consensus.overallConsensus ?? 0)).toFixed(1)}%
`;

        prompt = generatePrecisionAIPrompt(bestEnhanced, prompt) + comparativeAnalysis;
        logger.info('Precision AI prompt enhancement applied with comparative analysis', {
            finalistCount: validEnhanced.length,
            bestConsensus: bestEnhanced.precision?.consensus.overallConsensus,
            confidenceLevel: bestEnhanced.precision?.consensus.confidenceLevel
        });
    }

    emitAIContext(input.sessionId, {
        stage: 6,
        candidateTime: 'FINAL VERDICT',
        round: 1,
        candidatesInBatch: finalBatch.map(c => ({
            time: c.time,
            ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`,
            moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`
        })),
        lifeEventsCount: input.lifeEvents.length,
        hasForensicTraits: !!forensicTraits
    });

    const response = await callAIWithStream(
        input.sessionId,
        6,
        'You are THE DIVINE ARCHITECT of Time. Perform the ultimate FINAL JUDGEMENT.',
        prompt,
        {
            candidateTime: 'FINAL VERDICT',
            progressTracker: progress,
            timeoutMs: 120000,
            maxTokens: config.ai.stage6MaxTokens // Driven by AI_STAGE6_MAX_TOKENS
        }
    );

    const aiContent = response.success ? (response.content || response.thinking || '') : '';
    const verdict = extractFinalVerdict(aiContent);

    // C2 FIX: Proper null handling with GOD-TIER FALLBACK
    if (!verdict) {
        logger.error('AI failed to return valid verdict in Stage 6', {
            sessionId: input.sessionId,
            responseSuccess: response.success,
            hasContent: !!response.content,
        });

        if (finalBatch.length > 0) {
            const fallbackWinner = finalBatch[0];
            logger.warn(`🔱 [STAGE-6] EMERGENCY FALLBACK: Using first candidate ${fallbackWinner.time} as winner`);

            return {
                finalTime: fallbackWinner.time,
                accuracy: 80,
                confidence: '⚠️ LOW (AI Unavailable)',
                margin: 60,
                aiReasoning: response.content || '⚠️ AI analysis failed — result based on weighted estimation, not AI verification.',
                thinking: response.thinking,
                finalists: finalBatch.map(c => ({
                    time: c.time,
                    score: c.time === fallbackWinner.time ? 80 : 70,
                    ephemeris: getMinifiedEphemerisInline(c)
                })),
                stageResult: {
                    stageNumber: 6,
                    stageName: 'Final Precision (Fallback)',
                    candidatesIn: candidates.length,
                    candidatesOut: 1,
                    aiReasoning: 'Emergency recovery triggered'
                }
            };
        }

        throw new Error('AI_ANALYSIS_INCOMPLETE: Unable to determine final birth time. Even the recovery system failed. Please check backend logs.');
    }

    const finalTime = verdict.time;
    const accuracy = verdict.accuracy ?? 85;
    const confidence = verdict.confidence ?? 'MEDIUM';
    const margin = verdict.margin ?? 5;

    const winnerPkg = finalBatch.find(c => c.time === finalTime) || finalBatch[0];

    await progress.addCandidateScore({
        time: finalTime,
        score: accuracy,
        stage: 6,
        batch: 0,
        rank: 1,
        minifiedEph: winnerPkg ? getMinifiedEphemerisInline(winnerPkg) : undefined,
        fullEph: winnerPkg ? getFullEphemerisPayload(winnerPkg) : undefined
    });

    await progress.completeStep('final', [`FINAL: ${finalTime} (${confidence})`]);

    return {
        finalTime,
        accuracy,
        confidence,
        margin,
        aiReasoning: aiContent,
        thinking: response.thinking,
        finalists: finalBatch.map(c => ({
            time: c.time,
            score: c.time === finalTime ? accuracy : config.btr.fallbackRejectedScore + 30, // Basic score for runner-ups if not specified
            ephemeris: getMinifiedEphemerisInline(c)
        })),
        stageResult: {
            stageNumber: 6,
            stageName: 'Final Precision',
            candidatesIn: candidates.length,
            candidatesOut: 1,
            aiReasoning: allReasoning
        }
    };
}
