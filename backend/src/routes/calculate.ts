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
import { addToQueue } from '../lib/queue-manager.js';
import { encryptData } from '../lib/crypto.js';
import { BirthData, LifeEvent } from '../lib/types.js';

const router = Router();

interface CalculateRequest {
    birthData: BirthData;
    lifeEvents: LifeEvent[];
    physicalTraits?: any;
    forensicTraits?: any;
    offsetConfig: TimeOffsetConfig;
}

interface CalculateResponse {
    success: boolean;
    data?: {
        sessionId: string;
        position: number;
        estimatedWaitSeconds: number;
        status: string;
    };
    error?: string;
}

/**
 * POST /api/calculate - Submit birth time rectification for processing
 * 
 * This endpoint creates a session and queues it for async processing.
 * The client should poll /api/queue/progress/:sessionId for results.
 */
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const startTime = Date.now();

    try {
        const userId = req.userId!;
        const body = req.body as CalculateRequest;
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

        // 🔍 DIAGNOSTIC: Log encryption key info
        logger.info('🔍 DIAGNOSTIC: Encrypting session data', {
            userIdPrefix: userId.slice(0, 8),
            userIdLength: userId.length,
        });

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
