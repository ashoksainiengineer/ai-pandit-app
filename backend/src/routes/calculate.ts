import { Router, Request, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { db } from '../database/drizzle.js';
import { sessions } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import {
    generateCandidateTimes,
    validateOffsetConfig,
    TimeOffsetConfig,
} from '../lib/time-offset-manager.js';
import analyzeAndFilterCandidates from '../lib/candidate-analyzer.js';
import { analyzeTopCandidatesWithAI } from '../lib/ai-thinking-client.js';
import { BirthData, LifeEvent, RankedCandidates } from '../lib/types.js';

const router = Router();

interface CalculateRequest {
    birthData: BirthData;
    lifeEvents: LifeEvent[];
    physicalTraits?: any;
    offsetConfig: TimeOffsetConfig;
}

interface CalculateResponse {
    success: boolean;
    data?: {
        sessionId: string;
        rectifiedTime: string;
        accuracy: number;
        confidence: string;
        topRecommendation: any;
        alternativeOptions: any[];
        statistics: any;
    };
    error?: string;
}

/**
 * POST /api/calculate - Perform birth time rectification
 */
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const startTime = Date.now();

    try {
        const userId = req.userId!;
        const body = req.body as CalculateRequest;
        const { birthData, lifeEvents, physicalTraits, offsetConfig } = body;

        // Validate input
        if (!birthData || !lifeEvents || lifeEvents.length < 3) {
            res.status(400).json({
                success: false,
                error: 'Invalid input: need birthData and minimum 3 life events',
            });
            return;
        }

        // Validate offset configuration
        const offsetValidation = validateOffsetConfig(offsetConfig);
        if (!offsetValidation.valid) {
            res.status(400).json({
                success: false,
                error: offsetValidation.error || 'Invalid offset configuration',
            });
            return;
        }

        logger.info('Birth time rectification request', {
            userId,
            dateOfBirth: birthData.dateOfBirth,
            eventCount: lifeEvents.length,
            offsetConfig,
        });

        // Create database session
        const sessionId = crypto.randomUUID();
        const now = new Date().toISOString();

        await db.insert(sessions).values({
            id: sessionId,
            userId,
            clerkId: userId, // Clerk user ID - same as userId from auth
            fullName: birthData.fullName,
            dateOfBirth: birthData.dateOfBirth,
            tentativeTime: birthData.tentativeTime,
            birthPlace: birthData.birthPlace,
            latitude: birthData.latitude,
            longitude: birthData.longitude,
            timezone: birthData.timezone.toString(),
            gender: birthData.gender,
            physicalTraits: physicalTraits ? JSON.stringify(physicalTraits) : null,
            lifeEvents: JSON.stringify(lifeEvents),
            offsetConfig: JSON.stringify(offsetConfig),
            status: 'processing',
            createdAt: now,
            updatedAt: now,
        });

        logger.info('Database session created', { sessionId });

        // Generate candidate times
        const candidates = generateCandidateTimes(birthData.tentativeTime, offsetConfig);

        logger.info('Generated candidate times', {
            count: candidates.length,
            sessionId,
        });

        // Analyze candidates
        const rankedCandidates: RankedCandidates = await analyzeAndFilterCandidates(
            birthData.dateOfBirth,
            candidates,
            birthData.latitude,
            birthData.longitude,
            birthData.timezone,
            lifeEvents
        );

        logger.info('Candidates analyzed and filtered', {
            topCandidates: rankedCandidates.topCandidates.length,
            allCandidates: rankedCandidates.allCandidates.length,
            sessionId,
        });

        // Deep analysis with AI
        const aiResults = await analyzeTopCandidatesWithAI(
            rankedCandidates.topCandidates,
            lifeEvents
        );

        logger.info('AI deep analysis complete', {
            topTime: aiResults.topRecommendation.time,
            topScore: aiResults.topRecommendation.score,
            sessionId,
        });

        // Save results to database
        const updateNow = new Date().toISOString();

        await db
            .update(sessions)
            .set({
                rectifiedTime: aiResults.topRecommendation.time,
                accuracy: aiResults.topRecommendation.score,
                confidence: aiResults.topRecommendation.confidence,
                analysisResult: JSON.stringify({
                    topRecommendation: aiResults.topRecommendation,
                    alternativeOptions: aiResults.alternativeOptions,
                    allCandidates: rankedCandidates.allCandidates.map((c) => ({
                        time: c.time,
                        offsetDescription: c.offsetDescription,
                        quickScore: c.quickScore,
                        eventMatches: c.eventMatches,
                    })),
                    totalCandidatesAnalyzed: rankedCandidates.totalAnalyzed,
                    totalCandidatesWithAI: aiResults.candidates.length,
                    processingTime: aiResults.processingTime,
                }),
                status: 'complete',
                updatedAt: updateNow,
            })
            .where(eq(sessions.id, sessionId));

        logger.info('Results saved to database', { sessionId });

        // Return response
        const totalProcessingTime = Date.now() - startTime;

        res.json({
            success: true,
            data: {
                sessionId,
                rectifiedTime: aiResults.topRecommendation.time,
                accuracy: aiResults.topRecommendation.score,
                confidence: aiResults.topRecommendation.confidence,
                topRecommendation: {
                    time: aiResults.topRecommendation.time,
                    offsetMinutes: aiResults.topRecommendation.offsetMinutes,
                    offsetDescription: aiResults.topRecommendation.offsetDescription,
                    score: aiResults.topRecommendation.score,
                    confidence: aiResults.topRecommendation.confidence,
                    analysis: aiResults.topRecommendation.analysis.substring(0, 2000),
                    recommendation: aiResults.topRecommendation.recommendation,
                },
                alternativeOptions: aiResults.alternativeOptions.slice(0, 4).map((c) => ({
                    time: c.time,
                    offsetMinutes: c.offsetMinutes,
                    offsetDescription: c.offsetDescription,
                    score: c.score,
                    confidence: c.confidence,
                })),
                statistics: {
                    totalCandidatesGenerated: candidates.length,
                    topCandidatesAnalyzed: rankedCandidates.topCandidates.length,
                    deepAnalysisCount: aiResults.candidates.length,
                    allCandidateScores: rankedCandidates.allCandidates.map((c) => ({
                        time: c.time,
                        quickScore: c.quickScore,
                        offsetDescription: c.offsetDescription,
                    })),
                    processingTime: {
                        totalMs: totalProcessingTime,
                        totalSeconds: (totalProcessingTime / 1000).toFixed(2),
                    },
                },
            },
        } as CalculateResponse);
    } catch (error) {
        logger.error('Calculate endpoint error', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error',
        } as CalculateResponse);
    }
});

export default router;
