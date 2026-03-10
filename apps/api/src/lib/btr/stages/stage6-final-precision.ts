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

const BATCH_VERDICT_MATCH_THRESHOLD_SECONDS = 8;
const FINAL_VERDICT_MATCH_THRESHOLD_SECONDS = 12;

function parseTimeToSeconds(time: string): number | null {
    const match = time.trim().match(/^(\d{2}):(\d{2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    if (hours > 23 || minutes > 59 || seconds > 59) return null;
    return hours * 3600 + minutes * 60 + seconds;
}

function circularTimeDiffSeconds(a: string, b: string): number | null {
    const aSeconds = parseTimeToSeconds(a);
    const bSeconds = parseTimeToSeconds(b);
    if (aSeconds === null || bSeconds === null) return null;
    const diff = Math.abs(aSeconds - bSeconds);
    return Math.min(diff, 86400 - diff);
}

function parseVimshottariWindow(startEnd: string): { start: Date; end: Date } | null {
    const compact = startEnd.trim();
    if (!compact) return null;

    const dateRange = compact.match(/^(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})$/);
    if (dateRange) {
        const start = new Date(`${dateRange[1]}T00:00:00Z`);
        const end = new Date(`${dateRange[2]}T23:59:59Z`);
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
            return { start, end };
        }
    }

    const timeRange = compact.match(/^(\d{2}:\d{2})\s+to\s+(\d{2}:\d{2})\s+\((\d{4}-\d{2}-\d{2})\)$/);
    if (timeRange) {
        const start = new Date(`${timeRange[3]}T${timeRange[1]}:00Z`);
        const end = new Date(`${timeRange[3]}T${timeRange[2]}:00Z`);
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
            return { start, end };
        }
    }

    return null;
}

function pickDashaAtNowFromVimshottari(
    entries: Array<{ maha: string; antar: string; pratyantar: string; startEnd: string }>,
    now: Date
): { maha: string; antar: string; pratyantar: string } | null {
    if (entries.length === 0) return null;

    for (const entry of entries) {
        const window = parseVimshottariWindow(entry.startEnd);
        if (!window) continue;
        if (now >= window.start && now <= window.end) {
            return entry;
        }
    }

    let nearest: { entry: { maha: string; antar: string; pratyantar: string }; diffMs: number } | null = null;
    for (const entry of entries) {
        const window = parseVimshottariWindow(entry.startEnd);
        if (!window) continue;
        const diffMs = Math.abs(now.getTime() - window.start.getTime());
        if (!nearest || diffMs < nearest.diffMs) {
            nearest = { entry, diffMs };
        }
    }

    if (nearest) return nearest.entry;
    return entries[0];
}

function resolveCandidateByVerdictTime(
    requestedTime: string | undefined,
    candidates: CandidateTime[],
    thresholdSeconds: number
): { match: CandidateTime | null; mappedFrom?: string; diffSeconds?: number } {
    if (!requestedTime || candidates.length === 0) {
        return { match: null };
    }

    const exact = candidates.find(c => c.time === requestedTime);
    if (exact) {
        return { match: exact, mappedFrom: requestedTime, diffSeconds: 0 };
    }

    let best: CandidateTime | null = null;
    let bestDiff = Number.POSITIVE_INFINITY;

    for (const candidate of candidates) {
        const diff = circularTimeDiffSeconds(requestedTime, candidate.time);
        if (diff === null) continue;
        if (diff < bestDiff) {
            bestDiff = diff;
            best = candidate;
        }
    }

    if (!best || bestDiff > thresholdSeconds) {
        return { match: null };
    }

    return { match: best, mappedFrom: requestedTime, diffSeconds: bestDiff };
}

function pickDeterministicFallbackWinner(candidates: CandidateTime[]): CandidateTime {
    return [...candidates].sort((a, b) => {
        const absOffsetDiff = Math.abs(a.offsetMinutes) - Math.abs(b.offsetMinutes);
        if (absOffsetDiff !== 0) return absOffsetDiff;
        const signedOffsetDiff = a.offsetMinutes - b.offsetMinutes;
        if (signedOffsetDiff !== 0) return signedOffsetDiff;
        return a.time.localeCompare(b.time);
    })[0];
}

function getPresentTransitData(c: CandidateDataPackage, currentEph: any, now: Date) {
    if (!c) {
        logger.warn('🔱 [STAGE-6] Missing rawVimshottari in candidate for transit calculation');
        return {
            dashaAtNow: 'Unknown',
            jupiter: 'Unknown',
            saturn: 'Unknown',
            rahu: 'Unknown',
        };
    }
    let dashaAtNowText = 'Unknown';
    if (Array.isArray(c.rawVimshottari) && c.rawVimshottari.length > 0) {
        const dashaAtNow = getDashaForDate(c.rawVimshottari as any, now);
        dashaAtNowText = dashaAtNow
            ? `${dashaAtNow.mahadasha}-${dashaAtNow.antardasha}-${dashaAtNow.pratyantardasha}`
            : 'Unknown';
    } else if (Array.isArray(c.vimshottariDasha) && c.vimshottariDasha.length > 0) {
        const best = pickDashaAtNowFromVimshottari(c.vimshottariDasha as Array<{ maha: string; antar: string; pratyantar: string; startEnd: string }>, now);
        if (best) {
            dashaAtNowText = `${best.maha}-${best.antar}-${best.pratyantar}`;
        }
    }
    return {
        dashaAtNow: dashaAtNowText,
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
        const batches = splitIntoBatches(finalists, batchSize, `${input.sessionId}:stage6:r${roundNumber}`);
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
                    maxTokens: config.ai.stage6MaxTokens, // Driven by AI_STAGE6_MAX_TOKENS
                    model: config.ai.reasonerModel,
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
            const resolved = resolveCandidateByVerdictTime(verdict?.time, batchTimes, BATCH_VERDICT_MATCH_THRESHOLD_SECONDS);
            const selectedWinner = resolved.match;

            if (verdict?.time && !selectedWinner) {
                logger.warn(`🔱 [STAGE-6] Batch ${i + 1} verdict time "${verdict.time}" not in finalists. Ignoring verdict and using deterministic fallback.`);
            } else if (selectedWinner && verdict?.time !== selectedWinner.time) {
                logger.info(`🔱 [STAGE-6] Batch ${i + 1} mapped verdict "${verdict?.time}" -> "${selectedWinner.time}" (${resolved.diffSeconds}s)`);
            }

            const fallbackWinner = !selectedWinner && batchTimes.length > 0
                ? pickDeterministicFallbackWinner(batchTimes)
                : null;

            for (let j = 0; j < fullBatchData.length; j++) {
                const candidate = fullBatchData[j];
                const originalTimeInfo = batchTimes[j];
                const winnerTime = selectedWinner?.time || fallbackWinner?.time;
                const isWinner = !!winnerTime && candidate.time === winnerTime;
                const score = isWinner
                    ? (selectedWinner ? (verdict?.accuracy || 90) : config.btr.fallbackPromotedScore)
                    : 60;

                if (isWinner) {
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

            if (!selectedWinner && fallbackWinner) {
                logger.warn(`🔱 [STAGE-6] Batch ${i + 1} fallback winner selected deterministically: ${fallbackWinner.time}`);
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
            maxTokens: config.ai.stage6MaxTokens, // Driven by AI_STAGE6_MAX_TOKENS
            model: config.ai.reasonerModel,
        }
    );

    const aiContent = response.success ? (response.content || response.thinking || '') : '';
    const verdict = extractFinalVerdict(aiContent);

    const resolvedFinalWinner = resolveCandidateByVerdictTime(
        verdict?.time,
        finalists,
        FINAL_VERDICT_MATCH_THRESHOLD_SECONDS
    );

    const usedFallbackWinner = !resolvedFinalWinner.match;
    const fallbackWinner = usedFallbackWinner ? pickDeterministicFallbackWinner(finalists) : null;

    if (verdict?.time && !resolvedFinalWinner.match) {
        logger.warn('🔱 [STAGE-6] Final verdict time not found in finalists. Enforcing finalists-only winner selection.', {
            verdictTime: verdict.time,
            finalists: finalists.map(f => f.time)
        });
    } else if (resolvedFinalWinner.match && verdict?.time !== resolvedFinalWinner.match.time) {
        logger.info('🔱 [STAGE-6] Final verdict mapped to nearest finalist', {
            verdictTime: verdict?.time,
            matchedTime: resolvedFinalWinner.match.time,
            diffSeconds: resolvedFinalWinner.diffSeconds
        });
    }

    const finalTime = resolvedFinalWinner.match?.time || fallbackWinner?.time;
    if (!finalTime) {
        throw new Error('AI_ANALYSIS_INCOMPLETE: Unable to determine final birth time. No finalists available for fallback winner selection.');
    }

    const accuracy = usedFallbackWinner
        ? config.btr.fallbackPromotedScore
        : (verdict?.accuracy ?? 85);
    const confidence = usedFallbackWinner
        ? 'LOW'
        : (verdict?.confidence ?? 'MEDIUM');
    const margin = usedFallbackWinner
        ? 60
        : (verdict?.margin ?? 5);

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
        aiReasoning: usedFallbackWinner
            ? `${aiContent}\n\n[Fallback] Final verdict was not usable. Deterministic finalist fallback winner selected: ${finalTime}.`
            : aiContent,
        thinking: response.thinking,
        finalists: finalBatch.map(c => ({
            time: c.time,
            score: c.time === finalTime ? accuracy : config.btr.fallbackRejectedScore + 30, // Basic score for runner-ups if not specified
            ephemeris: getMinifiedEphemerisInline(c)
        })),
        stageResult: {
            stageNumber: 6,
            stageName: usedFallbackWinner ? 'Final Precision (Fallback)' : 'Final Precision',
            candidatesIn: candidates.length,
            candidatesOut: 1,
            aiReasoning: allReasoning
        }
    };
}
