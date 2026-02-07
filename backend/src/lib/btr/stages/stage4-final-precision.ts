
/**
 * Stage 4: Final Precision & Verification
 *
 * Performs a deep, exhaustive analysis of the top few candidates.
 * This stage uses the most detailed data package and a specialized AI prompt
 * to make the final determination of the most likely birth time.
 */

import { SecondsPrecisionInput, ForensicTraits, AIResponse } from '../../../types/index.js';
import { CandidateTime } from '../../time-offset-manager.js';
import { ProgressTracker } from '../../progress-tracker.js';
import { callAIWithStream, executeAIInParallel } from '../../ai-client.js';
import { emitCandidateScore } from '../../session-events.js';
import { buildCandidateDataPackage, PackageBuildOptions } from '../data-package-builder.js';
import { getFinalPrecisionPrompt } from '../prompts/index.js';
import { extractFinalVerdict } from '../extractors/index.js';
import { CandidateDataPackage, StageResult, FinalVerdict } from '../types.js';
import { logger } from '../../logger.js';

/**
 * Stage 4: Final deep analysis of top candidates.
 *
 * @param input - BTR input parameters
 * @param candidates - Survivor candidates from the previous stage
 * @param progress - Progress tracker
 * @param forensicTraits - User's forensic traits
 * @param globalLifecycle - Pre-calculated lifecycle shifts
 * @returns The final rectified birth time and analysis results.
 */
export async function stage4FinalPrecision(
    input: SecondsPrecisionInput,
    candidates: CandidateTime[],
    progress: ProgressTracker,
    forensicTraits: ForensicTraits,
    globalLifecycle: any[] = []
): Promise<{
    rectifiedTime: string;
    confidence: string;
    accuracy: number;
    stageResult: StageResult;
}> {
    await progress.startStep('final', 'Stage 4: Final Precision Analysis...');

    logger.info('🔬 [STAGE-4] Starting final precision analysis', {
        candidateCount: candidates.length,
        candidateTimes: candidates.map(c => c.time),
    });

    const finalScores: { time: string; score: number; verdict: string }[] = [];

    const getMinifiedEphemerisInline = (c: CandidateDataPackage) => ({
        sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
        moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
        ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`,
    });

    const tasks = candidates.map((candidate, i) => async (): Promise<AIResponse> => {
        await progress.updateMessage(`Analyzing finalist ${i + 1}/${candidates.length}: ${candidate.time}`);

        // Build the most detailed data package, including deep Dasha analysis.
        const buildOptions: PackageBuildOptions = {
            includeFullData: true,
            dashaDepth: 5, // CRITICAL: Use deep Dasha analysis
            lifecycleShifts: globalLifecycle,
            includeDivisionalCharts: ['D9', 'D10', 'D60'],
        };
        const candidateData = await buildCandidateDataPackage(candidate.time, candidate.offsetMinutes, input, buildOptions);

        // Call AI with a specialized final analysis prompt
        const aiResponse = await callAIWithStream(
            input.sessionId,
            4,
            'You are the ULTIMATE VEDIC ASTROLOGER. Your task is to make the final, definitive judgment on the most likely birth time.',
            getFinalPrecisionPrompt([candidateData], input.lifeEvents, forensicTraits, input.spouseData),
            {
                candidateTime: candidate.time,
                progressTracker: progress,
            }
        );

        const aiContent = aiResponse.success ? (aiResponse.content || aiResponse.thinking || '') : '';
        const finalVerdict: FinalVerdict | null = extractFinalVerdict(aiContent);

        const score = finalVerdict ? finalVerdict.accuracy : 0;
        const verdict = finalVerdict ? finalVerdict.confidence : "Error in analysis";


        // Store and emit the final score
        finalScores.push({ time: candidate.time, score, verdict });
        emitCandidateScore(input.sessionId, candidate.time, score, 4, undefined, getMinifiedEphemerisInline(candidateData));

        logger.info('🔬 [STAGE-4] Analyzed candidate', {
            time: candidate.time,
            score,
            verdict,
        });
        return aiResponse;
    });

    // Execute analysis in parallel for efficiency
    await executeAIInParallel(tasks, 3, 50);

    // Determine the winning candidate
    if (finalScores.length === 0) {
        logger.error('🔬 [STAGE-4] Final analysis yielded no scores. Aborting.');
        throw new Error('Final analysis failed to produce any results.');
    }

    const sortedResults = [...finalScores].sort((a, b) => b.score - a.score);
    const winner = sortedResults[0];

    // Simple confidence mapping
    const confidence = winner.score > 95 ? 'Very High' : winner.score > 85 ? 'High' : 'Medium';
    const accuracy = Math.round(winner.score);

    logger.info('🏆 [BTR-COMPLETE] Final rectified time selected', {
        rectifiedTime: winner.time,
        score: winner.score,
        confidence,
        verdict: winner.verdict,
    });

    await progress.completeStep('final', [
        `Rectification complete. Most likely time: ${winner.time}`,
        `Confidence: ${confidence} (${accuracy}%)`,
    ]);

    return {
        rectifiedTime: winner.time,
        confidence,
        accuracy,
        stageResult: {
            stageNumber: 4,
            stageName: 'Final Precision',
            candidatesIn: candidates.length,
            candidatesOut: 1,
        },
    };
}
