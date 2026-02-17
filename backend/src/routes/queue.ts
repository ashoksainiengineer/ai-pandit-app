import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { AuthenticatedRequest, authMiddleware, clerk } from '../middleware/auth.js';
import { db, executeWithRetry } from '../database/drizzle.js';
import { sessions, users } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { addToQueue, getQueueStatus, startQueueProcessor, cancelSession } from '../lib/queue-manager.js';
import { validateOffsetConfig, TimeOffsetConfig } from '../lib/time-offset-manager.js';
import { BirthData, LifeEvent } from '../lib/types.js';
import { encryptData, safeDecrypt, safeDecryptWithFallback } from '../lib/encryption/index.js';
import { syncUser } from '../lib/user-sync.js';
import { cleanupSession } from '../lib/session-events.js';

const router = Router();

interface SubmitRequest {
    birthData: BirthData;
    lifeEvents: LifeEvent[];
    physicalTraits?: any;
    forensicTraits: any;
    offsetConfig: TimeOffsetConfig;
}

/**
 * POST /api/queue - Submit new analysis request to queue
 */
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const clerkId = req.clerkId!;
        const body: SubmitRequest = req.body;
        const { birthData, lifeEvents, physicalTraits, forensicTraits, offsetConfig, consentConfirmed, existingSessionId } = req.body;

        // Validate input
        if (!birthData) {
            res.status(400).json({ success: false, error: 'Birth data is required' });
            return;
        }

        if (!lifeEvents || lifeEvents.length < 3) {
            res.status(400).json({ success: false, error: 'At least 3 life events are required' });
            return;
        }

        if (!forensicTraits) {
            res.status(400).json({ success: false, error: 'Forensic Traits are required for high-precision BTR.' });
            return;
        }

        // 🔴 Check AI consent if session exists
        if (existingSessionId && !consentConfirmed) {
            const session = await executeWithRetry(() =>
                db.select({ aiConsentGiven: sessions.aiConsentGiven })
                    .from(sessions)
                    .where(eq(sessions.id, existingSessionId))
                    .limit(1)
            );

            if (session.length > 0 && !session[0].aiConsentGiven) {
                res.status(403).json({
                    success: false,
                    error: 'AI processing consent required',
                    code: 'CONSENT_REQUIRED',
                });
                return;
            }
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

        // SELF-HEALING USER SYNC
        // Ensures user exists in DB and gets internal UUID
        // ═════════════════════════════════════════════════════════════════════════════
        let internalUserId: string;
        try {
            internalUserId = await syncUser(clerkId);
        } catch (syncError) {
            res.status(500).json({ success: false, error: 'User synchronization failed' });
            return;
        }

        // Create session with encrypted data
        const sessionId = crypto.randomUUID();
        const now = new Date().toISOString();

        // 🔍 DIAGNOSTIC: Log migration info
        logger.info('🔍 SESSION SUBMISSION: Mapping IDs', {
            clerkId: clerkId.slice(0, 12) + '...',
            internalUserId: internalUserId.slice(0, 8),
            sessionId: sessionId.slice(0, 8)
        });

        const encryptedFullName = encryptData(birthData.fullName, clerkId);
        const encryptedLifeEvents = encryptData(JSON.stringify(lifeEvents), clerkId);
        const encryptedPhysicalTraits = physicalTraits
            ? encryptData(JSON.stringify(physicalTraits), clerkId)
            : null;
        const encryptedForensicTraits = forensicTraits
            ? encryptData(JSON.stringify(forensicTraits), clerkId)
            : null;

        await executeWithRetry(() =>
            db.insert(sessions).values({
                id: sessionId,
                userId: internalUserId,
                clerkId: clerkId,
                fullName: encryptedFullName,
                dateOfBirth: birthData.dateOfBirth,
                tentativeTime: birthData.tentativeTime,
                birthPlace: birthData.birthPlace,
                latitude: birthData.latitude,
                longitude: birthData.longitude,
                timezone: birthData.timezone.toString(),
                gender: birthData.gender || 'other',
                physicalTraits: encryptedPhysicalTraits,
                forensicTraits: encryptedForensicTraits,
                lifeEvents: encryptedLifeEvents,
                offsetConfig: JSON.stringify(offsetConfig),
                status: 'pending',
                createdAt: now,
                updatedAt: now,
            })
        );

        logger.info('Session created', { sessionId, clerkId, internalUserId });

        // Add to queue
        const queueResult = await addToQueue(sessionId);

        if (!queueResult.success) {
            await executeWithRetry(() =>
                db.update(sessions)
                    .set({ status: 'failed', errorMessage: queueResult.error })
                    .where(eq(sessions.id, sessionId))
            );

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
        const clerkId = req.clerkId!;
        const sessionId = req.query.sessionId as string;

        if (!sessionId) {
            res.status(400).json({ success: false, error: 'sessionId is required' });
            return;
        }

        // Verify session belongs to user
        const session = await executeWithRetry(() =>
            db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1)
        );

        if (session.length === 0) {
            res.status(404).json({ success: false, error: 'Session not found' });
            return;
        }

        if (session[0].clerkId !== clerkId) {
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
            let analysisResult = null;
            try {
                analysisResult = session[0].analysisResult ? JSON.parse(session[0].analysisResult) : null;
            } catch (e) {
                logger.error('Failed to parse analysis result', e);
            }

            let reasoningLogs = null;
            try {
                reasoningLogs = session[0].reasoningLogs ? JSON.parse(session[0].reasoningLogs) : null;
            } catch (e) {
                logger.error('Failed to parse reasoning logs', e);
            }

            res.json({
                success: true,
                data: {
                    status: 'complete',
                    rectifiedTime: session[0].rectifiedTime,
                    accuracy: session[0].accuracy,
                    confidence: session[0].confidence,
                    analysisResult,
                    reasoningLogs,
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

/**
 * POST /api/queue/cancel - Cancel a session
 */
router.post('/cancel', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const clerkId = req.clerkId!;
        const { sessionId } = req.body;

        if (!sessionId) {
            res.status(400).json({ success: false, error: 'sessionId is required' });
            return;
        }

        // Verify session belongs to user
        const session = await executeWithRetry(() =>
            db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1)
        );

        if (session.length === 0) {
            res.status(404).json({ success: false, error: 'Session not found' });
            return;
        }

        // Verify using clerkId (which matches the auth token), not internal userId
        if (session[0].clerkId !== clerkId) {
            logger.warn(`Cancel unauthorized: Session ${sessionId} owned by ${session[0].clerkId}, requested by ${clerkId}`);
            res.status(403).json({ success: false, error: 'Unauthorized' });
            return;
        }


        const success = await cancelSession(sessionId);

        if (success) {
            res.json({ success: true, message: 'Session cancelled' });
        } else {
            res.status(400).json({ success: false, error: 'Could not cancel session (may be already complete or failed)' });
        }
    } catch (error) {
        logger.error('Cancel session error', error);
        res.status(500).json({ success: false, error: 'Failed to cancel session' });
    }
});

/**
 * REUSABLE REQUEUE HANDLER
 */
async function handleRequeue(req: AuthenticatedRequest, res: Response, sessionIdFromPath?: string) {
    try {
        const clerkId = req.clerkId!;
        const sessionId = sessionIdFromPath || req.body.sessionId;

        if (!sessionId) {
            res.status(400).json({ success: false, error: 'sessionId is required' });
            return;
        }

        // Verify session belongs to user
        const session = await executeWithRetry(() =>
            db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1)
        );

        if (session.length === 0) {
            res.status(404).json({ success: false, error: 'Session not found' });
            return;
        }

        if (session[0].clerkId !== clerkId) {
            res.status(403).json({ success: false, error: 'Unauthorized' });
            return;
        }

        const now = new Date().toISOString();

        // 1. Reset session state
        await executeWithRetry(() =>
            db.update(sessions)
                .set({
                    status: 'pending',
                    analysisResult: null,
                    progressData: null,
                    reasoningLogs: null,
                    errorMessage: null,
                    accuracy: null,
                    confidence: null,
                    rectifiedTime: null,
                    updatedAt: now,
                } as any)
                .where(eq(sessions.id, sessionId))
        );

        // 2. Clear event buffers 
        cleanupSession(sessionId);

        // 3. Add back to queue
        const queueResult = await addToQueue(sessionId);

        if (!queueResult.success) {
            await executeWithRetry(() =>
                db.update(sessions)
                    .set({ status: 'failed', errorMessage: queueResult.error })
                    .where(eq(sessions.id, sessionId))
            );
            res.status(503).json({ success: false, error: queueResult.error });
            return;
        }

        // 4. Kick off processor
        startQueueProcessor();

        logger.info('Session requeued successfully', { sessionId, clerkId, legacy: !!sessionIdFromPath });

        res.json({
            success: true,
            data: {
                sessionId,
                position: queueResult.position,
                estimatedWaitSeconds: queueResult.estimatedWaitSeconds,
            },
        });
    } catch (error) {
        logger.error('Requeue error', error);
        res.status(500).json({ success: false, error: 'Failed to restart analysis' });
    }
}

/**
 * POST /api/queue/requeue - Modern endpoint
 */
router.post('/requeue', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    return handleRequeue(req, res);
});

/**
 * POST /api/sessions/:id/requeue - LEGACY BRIDGE
 * Used by older frontend builds that haven't been redeployed yet.
 */
router.post('/:sessionId/requeue', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    return handleRequeue(req, res, req.params.sessionId);
});

export default router;
