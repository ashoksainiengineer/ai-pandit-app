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
import { analyzeTopCandidatesWithKimi } from '../lib/kimi-k2-thinking-client.js';
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

        // Deep analysis with Kimi K2
        const kimiResults = await analyzeTopCandidatesWithKimi(
            rankedCandidates.topCandidates,
            lifeEvents
        );

        logger.info('Kimi K2 analysis complete', {
            topTime: kimiResults.topRecommendation.time,
            topScore: kimiResults.topRecommendation.score,
            sessionId,
        });

        // Save results to database
        const updateNow = new Date().toISOString();

        await db
            .update(sessions)
            .set({
                rectifiedTime: kimiResults.topRecommendation.time,
                accuracy: kimiResults.topRecommendation.score,
                confidence: kimiResults.topRecommendation.confidence,
                analysisResult: JSON.stringify({
                    topRecommendation: kimiResults.topRecommendation,
                    alternativeOptions: kimiResults.alternativeOptions,
                    allCandidates: rankedCandidates.allCandidates.map((c) => ({
                        time: c.time,
                        offsetDescription: c.offsetDescription,
                        quickScore: c.quickScore,
                        eventMatches: c.eventMatches,
                    })),
                    totalCandidatesAnalyzed: rankedCandidates.totalAnalyzed,
                    totalCandidatesWithKimi: kimiResults.candidates.length,
                    processingTime: kimiResults.processingTime,
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
                rectifiedTime: kimiResults.topRecommendation.time,
                accuracy: kimiResults.topRecommendation.score,
                confidence: kimiResults.topRecommendation.confidence,
                topRecommendation: {
                    time: kimiResults.topRecommendation.time,
                    offsetMinutes: kimiResults.topRecommendation.offsetMinutes,
                    offsetDescription: kimiResults.topRecommendation.offsetDescription,
                    score: kimiResults.topRecommendation.score,
                    confidence: kimiResults.topRecommendation.confidence,
                    analysis: kimiResults.topRecommendation.analysis.substring(0, 2000),
                    recommendation: kimiResults.topRecommendation.recommendation,
                },
                alternativeOptions: kimiResults.alternativeOptions.slice(0, 4).map((c) => ({
                    time: c.time,
                    offsetMinutes: c.offsetMinutes,
                    offsetDescription: c.offsetDescription,
                    score: c.score,
                    confidence: c.confidence,
                })),
                statistics: {
                    totalCandidatesGenerated: candidates.length,
                    topCandidatesAnalyzed: rankedCandidates.topCandidates.length,
                    deepAnalysisCount: kimiResults.candidates.length,
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
