"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const drizzle_js_1 = require("../database/drizzle.js");
const schema_js_1 = require("../database/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const logger_js_1 = require("../lib/logger.js");
const queue_manager_js_1 = require("../lib/queue-manager.js");
const time_offset_manager_js_1 = require("../lib/time-offset-manager.js");
const crypto_js_1 = require("../lib/crypto.js");
const router = (0, express_1.Router)();
/**
 * POST /api/queue - Submit new analysis request to queue
 */
router.post('/', auth_js_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const body = req.body;
        const { birthData, lifeEvents, physicalTraits, offsetConfig } = body;
        // Validate input
        if (!birthData) {
            res.status(400).json({ success: false, error: 'Birth data is required' });
            return;
        }
        if (!lifeEvents || lifeEvents.length < 3) {
            res.status(400).json({ success: false, error: 'At least 3 life events are required' });
            return;
        }
        // Validate offset config
        const offsetValidation = (0, time_offset_manager_js_1.validateOffsetConfig)(offsetConfig);
        if (!offsetValidation.valid) {
            res.status(400).json({ success: false, error: offsetValidation.error });
            return;
        }
        // Validate birth data fields
        const requiredFields = [
            'fullName',
            'dateOfBirth',
            'tentativeTime',
            'birthPlace',
            'latitude',
            'longitude',
            'timezone',
        ];
        for (const field of requiredFields) {
            if (!birthData[field]) {
                res.status(400).json({ success: false, error: `${field} is required` });
                return;
            }
        }
        // Validate date
        const birthDate = new Date(birthData.dateOfBirth);
        if (isNaN(birthDate.getTime())) {
            res.status(400).json({ success: false, error: 'Invalid date of birth' });
            return;
        }
        // Validate coordinates
        if (birthData.latitude < -90 || birthData.latitude > 90) {
            res.status(400).json({ success: false, error: 'Invalid latitude' });
            return;
        }
        if (birthData.longitude < -180 || birthData.longitude > 180) {
            res.status(400).json({ success: false, error: 'Invalid longitude' });
            return;
        }
        // Create session with encrypted data
        const sessionId = crypto.randomUUID();
        const now = new Date().toISOString();
        const encryptedFullName = (0, crypto_js_1.encryptData)(birthData.fullName, userId);
        const encryptedLifeEvents = (0, crypto_js_1.encryptData)(JSON.stringify(lifeEvents), userId);
        const encryptedPhysicalTraits = physicalTraits
            ? (0, crypto_js_1.encryptData)(JSON.stringify(physicalTraits), userId)
            : null;
        await drizzle_js_1.db.insert(schema_js_1.sessions).values({
            id: sessionId,
            userId,
            clerkId: userId, // Use userId as clerkId (same for Clerk auth)
            fullName: encryptedFullName,
            dateOfBirth: birthData.dateOfBirth,
            tentativeTime: birthData.tentativeTime,
            birthPlace: birthData.birthPlace,
            latitude: birthData.latitude,
            longitude: birthData.longitude,
            timezone: birthData.timezone.toString(),
            gender: birthData.gender || 'other',
            physicalTraits: encryptedPhysicalTraits,
            lifeEvents: encryptedLifeEvents,
            offsetConfig: JSON.stringify(offsetConfig),
            status: 'pending',
            createdAt: now,
            updatedAt: now,
        });
        logger_js_1.logger.info('Session created', { sessionId, userId });
        // Add to queue
        const queueResult = await (0, queue_manager_js_1.addToQueue)(sessionId);
        if (!queueResult.success) {
            await drizzle_js_1.db
                .update(schema_js_1.sessions)
                .set({ status: 'failed', errorMessage: queueResult.error })
                .where((0, drizzle_orm_1.eq)(schema_js_1.sessions.id, sessionId));
            res.status(503).json({ success: false, error: queueResult.error });
            return;
        }
        // Start queue processor
        (0, queue_manager_js_1.startQueueProcessor)();
        res.json({
            success: true,
            data: {
                sessionId,
                position: queueResult.position,
                estimatedWaitSeconds: queueResult.estimatedWaitSeconds,
                message: `Your request is in queue at position ${queueResult.position}`,
            },
        });
    }
    catch (error) {
        logger_js_1.logger.error('Queue submit error', error);
        res.status(500).json({ success: false, error: 'Failed to submit request' });
    }
});
/**
 * GET /api/queue - Poll queue status
 */
router.get('/', auth_js_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const sessionId = req.query.sessionId;
        if (!sessionId) {
            res.status(400).json({ success: false, error: 'sessionId is required' });
            return;
        }
        // Verify session belongs to user
        const session = await drizzle_js_1.db.select().from(schema_js_1.sessions).where((0, drizzle_orm_1.eq)(schema_js_1.sessions.id, sessionId)).limit(1);
        if (session.length === 0) {
            res.status(404).json({ success: false, error: 'Session not found' });
            return;
        }
        if (session[0].userId !== userId) {
            res.status(403).json({ success: false, error: 'Unauthorized' });
            return;
        }
        // Get queue status
        const queueStatus = await (0, queue_manager_js_1.getQueueStatus)(sessionId);
        if (!queueStatus) {
            res.status(500).json({ success: false, error: 'Failed to get queue status' });
            return;
        }
        // If complete, return results
        if (queueStatus.status === 'complete') {
            const analysisResult = session[0].analysisResult
                ? JSON.parse(session[0].analysisResult)
                : null;
            res.json({
                success: true,
                data: {
                    status: 'complete',
                    rectifiedTime: session[0].rectifiedTime,
                    accuracy: session[0].accuracy,
                    confidence: session[0].confidence,
                    analysisResult,
                },
            });
            return;
        }
        // If failed, return error
        if (queueStatus.status === 'failed') {
            res.json({
                success: true,
                data: {
                    status: 'failed',
                    error: session[0].errorMessage || 'Analysis failed',
                },
            });
            return;
        }
        // Still processing or queued
        res.json({
            success: true,
            data: {
                status: queueStatus.status,
                position: queueStatus.position,
                estimatedWaitSeconds: queueStatus.estimatedWaitSeconds,
                totalInQueue: queueStatus.totalInQueue,
            },
        });
    }
    catch (error) {
        logger_js_1.logger.error('Queue poll error', error);
        res.status(500).json({ success: false, error: 'Failed to get status' });
    }
});
/**
 * POST /api/queue/cancel - Cancel a session
 */
router.post('/cancel', auth_js_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { sessionId } = req.body;
        if (!sessionId) {
            res.status(400).json({ success: false, error: 'sessionId is required' });
            return;
        }
        // Verify session belongs to user
        const session = await drizzle_js_1.db.select().from(schema_js_1.sessions).where((0, drizzle_orm_1.eq)(schema_js_1.sessions.id, sessionId)).limit(1);
        if (session.length === 0) {
            res.status(404).json({ success: false, error: 'Session not found' });
            return;
        }
        // Verify using clerkId (which matches the auth token), not internal userId
        if (session[0].clerkId !== userId) {
            logger_js_1.logger.warn(`Cancel unauthorized: Session ${sessionId} owned by ${session[0].clerkId}, requested by ${userId}`);
            res.status(403).json({ success: false, error: 'Unauthorized' });
            return;
        }
        const success = await (0, queue_manager_js_1.cancelSession)(sessionId);
        if (success) {
            res.json({ success: true, message: 'Session cancelled' });
        }
        else {
            res.status(400).json({ success: false, error: 'Could not cancel session (may be already complete or failed)' });
        }
    }
    catch (error) {
        logger_js_1.logger.error('Cancel session error', error);
        res.status(500).json({ success: false, error: 'Failed to cancel session' });
    }
});
exports.default = router;
//# sourceMappingURL=queue.js.map