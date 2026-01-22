"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const drizzle_js_1 = require("../database/drizzle.js");
const schema_js_1 = require("../database/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const logger_js_1 = require("../lib/logger.js");
const time_offset_manager_js_1 = require("../lib/time-offset-manager.js");
const candidate_analyzer_js_1 = __importDefault(require("../lib/candidate-analyzer.js"));
const ai_thinking_client_js_1 = require("../lib/ai-thinking-client.js");
const router = (0, express_1.Router)();
/**
 * POST /api/calculate - Perform birth time rectification
 */
router.post('/', auth_js_1.authMiddleware, async (req, res) => {
    const startTime = Date.now();
    try {
        const userId = req.userId;
        const body = req.body;
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
        const offsetValidation = (0, time_offset_manager_js_1.validateOffsetConfig)(offsetConfig);
        if (!offsetValidation.valid) {
            res.status(400).json({
                success: false,
                error: offsetValidation.error || 'Invalid offset configuration',
            });
            return;
        }
        logger_js_1.logger.info('Birth time rectification request', {
            userId,
            dateOfBirth: birthData.dateOfBirth,
            eventCount: lifeEvents.length,
            offsetConfig,
        });
        // Create database session
        const sessionId = crypto.randomUUID();
        const now = new Date().toISOString();
        await drizzle_js_1.db.insert(schema_js_1.sessions).values({
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
        logger_js_1.logger.info('Database session created', { sessionId });
        // Generate candidate times
        const candidates = (0, time_offset_manager_js_1.generateCandidateTimes)(birthData.tentativeTime, offsetConfig);
        logger_js_1.logger.info('Generated candidate times', {
            count: candidates.length,
            sessionId,
        });
        // Analyze candidates
        const rankedCandidates = await (0, candidate_analyzer_js_1.default)(birthData.dateOfBirth, candidates, birthData.latitude, birthData.longitude, birthData.timezone, lifeEvents);
        logger_js_1.logger.info('Candidates analyzed and filtered', {
            topCandidates: rankedCandidates.topCandidates.length,
            allCandidates: rankedCandidates.allCandidates.length,
            sessionId,
        });
        // Deep analysis with AI
        const aiResults = await (0, ai_thinking_client_js_1.analyzeTopCandidatesWithAI)(rankedCandidates.topCandidates, lifeEvents);
        logger_js_1.logger.info('AI deep analysis complete', {
            topTime: aiResults.topRecommendation.time,
            topScore: aiResults.topRecommendation.score,
            sessionId,
        });
        // Save results to database
        const updateNow = new Date().toISOString();
        await drizzle_js_1.db
            .update(schema_js_1.sessions)
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
            .where((0, drizzle_orm_1.eq)(schema_js_1.sessions.id, sessionId));
        logger_js_1.logger.info('Results saved to database', { sessionId });
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
        });
    }
    catch (error) {
        logger_js_1.logger.error('Calculate endpoint error', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=calculate.js.map