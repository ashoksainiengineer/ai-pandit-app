import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../database/drizzle.js';
import { sessions } from '../database/schema.js';
import { logger } from '../lib/logger.js';
import { validateOffsetConfig, } from '../lib/time-offset-manager.js';
import { addToQueue } from '../lib/queue-manager.js';
import { encryptData } from '../lib/crypto.js';
const router = Router();
/**
 * POST /api/calculate - Submit birth time rectification for processing
 *
 * This endpoint creates a session and queues it for async processing.
 * The client should poll /api/queue/progress/:sessionId for results.
 */
router.post('/', authMiddleware, async (req, res) => {
    const startTime = Date.now();
    try {
        const userId = req.userId;
        const body = req.body;
        const { birthData, lifeEvents, physicalTraits, forensicTraits, offsetConfig } = body;
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
        // Encrypt sensitive data
        const encryptedLifeEvents = encryptData(JSON.stringify(lifeEvents), userId);
        const encryptedPhysicalTraits = physicalTraits
            ? encryptData(JSON.stringify(physicalTraits), userId)
            : null;
        const encryptedForensicTraits = forensicTraits
            ? encryptData(JSON.stringify(forensicTraits), userId)
            : null;
        await db.insert(sessions).values({
            id: sessionId,
            userId,
            clerkId: userId,
            fullName: birthData.fullName,
            dateOfBirth: birthData.dateOfBirth,
            tentativeTime: birthData.tentativeTime,
            birthPlace: birthData.birthPlace,
            latitude: birthData.latitude,
            longitude: birthData.longitude,
            timezone: birthData.timezone.toString(),
            gender: birthData.gender,
            physicalTraits: encryptedPhysicalTraits,
            forensicTraits: encryptedForensicTraits,
            lifeEvents: encryptedLifeEvents,
            offsetConfig: JSON.stringify(offsetConfig),
            status: 'pending',
            createdAt: now,
            updatedAt: now,
        });
        logger.info('Database session created', { sessionId });
        // Add to processing queue
        const queueResult = await addToQueue(sessionId);
        if (!queueResult.success) {
            res.status(503).json({
                success: false,
                error: queueResult.error || 'Failed to queue request',
            });
            return;
        }
        logger.info('Request queued for processing', {
            sessionId,
            position: queueResult.position,
            estimatedWait: queueResult.estimatedWaitSeconds,
        });
        const totalProcessingTime = Date.now() - startTime;
        res.json({
            success: true,
            data: {
                sessionId,
                position: queueResult.position || 0,
                estimatedWaitSeconds: queueResult.estimatedWaitSeconds || 0,
                status: 'queued',
            },
        });
    }
    catch (error) {
        logger.error('Calculate endpoint error', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error',
        });
    }
});
export default router;
//# sourceMappingURL=calculate.js.map