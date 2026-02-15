/**
 * Stage 6: Final Precision Judgement
 *
 * Final seconds-level precision determination using God-Tier integration.
 * Performs the ultimate AI analysis to determine the exact birth time.
 */

import { SecondsPrecisionInput, ForensicTraits } from '../../../types/index.js';
import { CandidateTime, MAX_BATCH_SIZE, splitIntoBatches } from '../../time-offset-manager.js';
import { ProgressTracker } from '../../progress-tracker.js';
import { callAIWithStream, executeAIInParallel } from '../../ai-client.js';
import { emitCandidateScore } from '../../session-events.js';
import { calculateEphemeris } from '../../ephemeris.js';
import { getDashaForDate } from '../../vedic-astrology-engine.js';
import { buildCandidateDataPackage } from '../data-package-builder.js';
import { getFinalPrecisionPrompt } from '../prompts/index.js';
import { extractFinalVerdict } from '../extractors/index.js';
import { CandidateDataPackage, StageResult } from '../types.js';
import {
    enhanceCandidateWithGodTierData,
    generateGodTierAIPrompt,
    CandidateWithGodTierData,
} from '../../btr-god-tier-integrator.js';
import { logger } from '../../logger.js';

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
    thinking?: string;
    stageResult: StageResult;
}> {
    const now = new Date();
    const currentEph = await calculateEphemeris(
        now.toISOString().split('T')[0],
        now.toTimeString().split(' ')[0],
        input.latitude,
        input.longitude,
        input.timezone
    );

    const getPresentTransitData = (c: CandidateDataPackage) => {
        const dashaAtNow = getDashaForDate(c.rawVimshottari as any, now);
        return {
            dashaAtNow: dashaAtNow ? `${dashaAtNow.mahadasha}-${dashaAtNow.antardasha}-${dashaAtNow.pratyantardasha}` : 'Unknown',
            jupiter: `${currentEph.planets.jupiter.sign}${currentEph.planets.jupiter.retro ? ' (R)' : ''}`,
            saturn: `${currentEph.planets.saturn.sign}${currentEph.planets.saturn.retro ? ' (R)' : ''}`,
            rahu: `${currentEph.planets.rahu.sign}${currentEph.planets.rahu.retro ? ' (R)' : ''}`,
        };
    };

    // GOD-TIER ENHANCEMENT: Enhance finalists with KP and Consensus data
    let godTierEnhancedCandidates: Array<CandidateWithGodTierData & { time: string; offsetMinutes: number }> = [];

    // FIXED: Log candidate data state before enhancement
    logger.info('🔱 [STAGE-6] Starting final precision judgment', {
        candidatesIn: candidates.length,
        sampleTime: candidates[0]?.time,
        lifeEventsCount: input.lifeEvents?.length,
        hasForensicTraits: !!forensicTraits,
        hasSpouseData: !!input.spouseData
    });

    for (const candidate of candidates.slice(0, 7)) {
        try {
            const pkg = await buildCandidateDataPackage(candidate.time, candidate.offsetMinutes, input, {
                includeFullData: true,
                dashaDepth: 3,
                pranaWindowDays: 3,
                lifecycleShifts: globalLifecycle
            });

            const baseCandidate: CandidateWithGodTierData = {
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

            const enhanced = enhanceCandidateWithGodTierData(
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
        } catch (error) {
            logger.warn(`Failed to enhance candidate ${candidate.time} with God-Tier data`, error);
        }
    }

    let finalists = [...candidates];

    const godTierCount = godTierEnhancedCandidates.filter(c => c.godTier?.isGodTier).length;
    logger.info(`🔱 Stage 6: ${godTierCount}/${godTierEnhancedCandidates.length} candidates achieved God-Tier status`);

    while (finalists.length > MAX_BATCH_SIZE) {
        const batches = splitIntoBatches(finalists, MAX_BATCH_SIZE);
        const batchWinners: CandidateTime[] = [];
        const batchDataMap = new Map<number, CandidateDataPackage[]>();

        const tasks = batches.map((batchTimes, i) => async () => {
            const batchEnriched = await Promise.all(batchTimes.map(ct =>
                buildCandidateDataPackage(ct.time, ct.offsetMinutes, input, {
                    includeFullData: true,
                    dashaDepth: 5,
                    pranaWindowDays: 3,
                    lifecycleShifts: globalLifecycle
                })
            ));
            batchDataMap.set(i, batchEnriched);
            const presentAnchor = getPresentTransitData(batchEnriched[0]);

            return callAIWithStream(
                input.sessionId,
                6,
                'FINAL FORENSIC JUDGEMENT. Pick THE ONE based on bio-Vedic alignment.',
                getFinalPrecisionPrompt(batchEnriched, input.lifeEvents, forensicTraits, input.spouseData, presentAnchor),
                {
                    candidateTime: 'FINAL',
                    progressTracker: progress
                }
            );
        });

        const results = await executeAIInParallel(tasks, 10, 200);

        for (let i = 0; i < batches.length; i++) {
            const batchTimes = batches[i];
            const response = results[i];
            const fullBatchData = batchDataMap.get(i) || [];
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            const verdict = extractFinalVerdict(aiContent);

            const getMinifiedEphemerisInline = (c: CandidateDataPackage) => ({
                sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
                moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
                ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
            });

            for (let j = 0; j < fullBatchData.length; j++) {
                const candidate = fullBatchData[j];
                const originalTimeInfo = batchTimes[j];
                const isWinner = verdict && candidate.time === verdict.time;
                const score = isWinner ? (verdict.accuracy || 90) : 60;

                if (isWinner) {
                    batchWinners.push(originalTimeInfo);
                } else if (!verdict && fullBatchData.length > 0 && candidate === fullBatchData[0]) {
                    batchWinners.push(originalTimeInfo);
                }

                emitCandidateScore(input.sessionId, candidate.time, score, 6, undefined, getMinifiedEphemerisInline(candidate));
            }
        }

        finalists = batchWinners;
    }

    // Final judgement with God-Tier prompt enhancement
    // FIXED: Enhance ALL finalists with God-Tier data for comprehensive judgment
    const enhancedFinalBatch: Array<CandidateWithGodTierData & { time: string; offsetMinutes: number }> = [];

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
                const baseCandidate: CandidateWithGodTierData = {
                    time: finalist.time,
                    offsetMinutes: finalist.offsetMinutes,
                    ephemeris: pkg,
                    dasha: pkg.vimshottariDasha,
                    vargas: { D9: pkg.d9Chart, D10: pkg.d10Chart, D60: pkg.d60Sign },
                    kpData: {}
                };
                const enhanced = enhanceCandidateWithGodTierData(
                    baseCandidate, input.lifeEvents, input.forensicTraits, input.tentativeTime
                );
                enhancedFinalBatch.push({ ...enhanced, time: finalist.time, offsetMinutes: finalist.offsetMinutes });
            } catch (error) {
                logger.warn(`Failed to enhance finalist ${finalist.time}`, error);
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
    const finalAnchor = getPresentTransitData(finalBatch[0]);
    let prompt = getFinalPrecisionPrompt(finalBatch, input.lifeEvents, forensicTraits, input.spouseData, finalAnchor);

    // FIXED: Aggregate God-Tier data from ALL finalists for comprehensive prompt
    // This provides the AI with consensus patterns across all finalists
    const validEnhanced = enhancedFinalBatch.filter(e => e.godTier?.consensus);
    if (validEnhanced.length > 0) {
        // Use the candidate with highest consensus for main enhancement
        const bestEnhanced = validEnhanced.reduce((best, current) =>
            (current.godTier?.consensus?.overallConsensus ?? 0) > (best.godTier?.consensus?.overallConsensus ?? 0)
                ? current : best
        );

        // Add comparative analysis section
        const comparativeAnalysis = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔱 FINALIST CONSENSUS COMPARISON (${validEnhanced.length} candidates)           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
${validEnhanced.map((c, i) =>
            `  ${i + 1}. ${c.time}: ${c.godTier?.consensus.overallConsensus.toFixed(1)}% (${c.godTier?.consensus.confidenceLevel})`
        ).join('\n')}

Consensus Range: ${Math.min(...validEnhanced.map(c => c.godTier?.consensus.overallConsensus ?? 0)).toFixed(1)}% - ${Math.max(...validEnhanced.map(c => c.godTier?.consensus.overallConsensus ?? 0)).toFixed(1)}%
`;

        prompt = generateGodTierAIPrompt(bestEnhanced, prompt) + comparativeAnalysis;
        logger.info('🔱 God-Tier AI prompt enhancement applied with comparative analysis', {
            finalistCount: validEnhanced.length,
            bestConsensus: bestEnhanced.godTier?.consensus.overallConsensus,
            confidenceLevel: bestEnhanced.godTier?.consensus.confidenceLevel
        });
    }

    const response = await callAIWithStream(
        input.sessionId,
        6,
        'You are the DIVINE ARCHITECT of Time. FINAL JUDGEMENT.',
        prompt,
        {
            candidateTime: 'FINAL VERDICT',
            progressTracker: progress,
            timeoutMs: 120000
        }
    );

    const aiContent = response.success ? (response.content || response.thinking || '') : '';
    const verdict = extractFinalVerdict(aiContent);

    // C2 FIX: Proper null handling
    if (!verdict) {
        logger.error('AI failed to return valid verdict in Stage 6', {
            sessionId: input.sessionId,
            responseSuccess: response.success,
            hasContent: !!response.content,
            hasThinking: !!response.thinking,
        });

        throw new Error('AI_ANALYSIS_INCOMPLETE: Unable to determine final birth time. The AI analysis did not return a valid verdict. Please retry the analysis.');
    }

    const finalTime = verdict.time;
    const accuracy = verdict.accuracy ?? 85;
    const confidence = verdict.confidence ?? 'MEDIUM';
    const margin = verdict.margin ?? 5;

    const getMinifiedEphemerisInline = (c: CandidateDataPackage) => ({
        sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
        moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
        ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
    });

    const winnerPkg = finalBatch.find(c => c.time === finalTime) || finalBatch[0];

    emitCandidateScore(input.sessionId, finalTime, accuracy, 6, 1, winnerPkg ? getMinifiedEphemerisInline(winnerPkg) : undefined);

    await progress.completeStep('final', [`FINAL: ${finalTime} (${confidence})`]);

    return {
        finalTime,
        accuracy,
        confidence,
        margin,
        aiReasoning: aiContent,
        thinking: response.thinking,
        stageResult: {
            stageNumber: 6,
            stageName: 'Final Precision',
            candidatesIn: candidates.length,
            candidatesOut: 1,
            aiReasoning: aiContent
        }
    };
}
