import { Router, Request, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { db } from '../database/drizzle.js';
import { sessions } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { addToQueue, getQueueStatus, startQueueProcessor } from '../lib/queue-manager.js';
import { validateOffsetConfig, TimeOffsetConfig } from '../lib/time-offset-manager.js';
import { BirthData, LifeEvent } from '../lib/types.js';
import { encryptData } from '../lib/crypto.js';

const router = Router();

interface SubmitRequest {
    birthData: BirthData;
    lifeEvents: LifeEvent[];
    physicalTraits?: {
        height?: string;
        build?: string;
        complexion?: string;
    };
    offsetConfig: TimeOffsetConfig;
}

/**
 * POST /api/queue - Submit new analysis request to queue
 */
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const body: SubmitRequest = req.body;
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
        const offsetValidation = validateOffsetConfig(offsetConfig);
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
            if (!birthData[field as keyof BirthData]) {
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

        const encryptedFullName = encryptData(birthData.fullName, userId);
        const encryptedLifeEvents = encryptData(JSON.stringify(lifeEvents), userId);
        const encryptedPhysicalTraits = physicalTraits
            ? encryptData(JSON.stringify(physicalTraits), userId)
            : null;

        await db.insert(sessions).values({
            id: sessionId,
            userId,
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

        logger.info('Session created', { sessionId, userId });

        // Add to queue
        const queueResult = await addToQueue(sessionId);

        if (!queueResult.success) {
            await db
                .update(sessions)
                .set({ status: 'failed', errorMessage: queueResult.error })
                .where(eq(sessions.id, sessionId));

            res.status(503).json({ success: false, error: queueResult.error });
            return;
        }

        // Start queue processor
        startQueueProcessor();

        res.json({
            success: true,
            data: {
                sessionId,
                position: queueResult.position,
                estimatedWaitSeconds: queueResult.estimatedWaitSeconds,
                message: `Your request is in queue at position ${queueResult.position}`,
            },
        });
    } catch (error) {
        logger.error('Queue submit error', error);
        res.status(500).json({ success: false, error: 'Failed to submit request' });
    }
});

/**
 * GET /api/queue - Poll queue status
 */
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const sessionId = req.query.sessionId as string;

        if (!sessionId) {
            res.status(400).json({ success: false, error: 'sessionId is required' });
            return;
        }

        // Verify session belongs to user
        const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

        if (session.length === 0) {
            res.status(404).json({ success: false, error: 'Session not found' });
            return;
        }

        if (session[0].userId !== userId) {
            res.status(403).json({ success: false, error: 'Unauthorized' });
            return;
        }

        // Get queue status
        const queueStatus = await getQueueStatus(sessionId);

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
    } catch (error) {
        logger.error('Queue poll error', error);
        res.status(500).json({ success: false, error: 'Failed to get status' });
    }
});

export default router;
