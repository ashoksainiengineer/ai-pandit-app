import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { db, executeWithRetry } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { addToQueue, getQueueStatus, startQueueProcessor, cancelSession, flushSessionTrash } from '../lib/queue-manager.js';
import { isSessionOwnedByContext, resolveSessionOwnershipContext } from '../lib/session-ownership.js';
import {
    createQueuedBirthRectificationJob,
    getJobIdempotencyKey,
} from '../lib/jobs/job-service.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();

const SESSION_VISIBILITY_MAX_ATTEMPTS = 12;
const SESSION_VISIBILITY_DELAY_MS = 250;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForSessionVisibility(
    sessionId: string,
    ownershipContext: Awaited<ReturnType<typeof resolveSessionOwnershipContext>>
): Promise<boolean> {
    for (let attempt = 1; attempt <= SESSION_VISIBILITY_MAX_ATTEMPTS; attempt++) {
        const found = await executeWithRetry(() =>
            db.select({
                id: sessions.id,
                clerkId: sessions.clerkId,
                userId: sessions.userId,
                status: sessions.status,
            })
                .from(sessions)
                .where(eq(sessions.id, sessionId))
                .limit(1)
        );

        if (found.length > 0 && isSessionOwnedByContext(found[0], ownershipContext)) {
            if (attempt > 1) {
                logger.info('[QUEUE] Session became visible after retry', { sessionId, attempt });
            }
            return true;
        }

        await sleep(SESSION_VISIBILITY_DELAY_MS);
    }

    logger.warn('[QUEUE] Session visibility timed out after submit', { sessionId });
    return false;
}

/**
 * POST /api/queue - Submit new analysis request to queue
 */
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const clerkId = req.clerkId!;
        const ownershipContext = await resolveSessionOwnershipContext(clerkId);
        const result = await createQueuedBirthRectificationJob({
            clerkId,
            ownershipContext,
            body: req.body as Record<string, unknown>,
            idempotencyKey: getJobIdempotencyKey(req),
        });

        const isVisible = await waitForSessionVisibility(result.job.sessionId, ownershipContext);
        if (!isVisible) {
            sendError(res, new Error('Session initialization delayed. Please try again.'));
            return;
        }

        sendSuccess(res, {
            sessionId: result.job.sessionId,
            jobId: result.job.id,
            position: result.queue.position,
            estimatedWaitSeconds: result.queue.estimatedWaitSeconds,
            status: result.job.status,
            idempotentReplay: result.idempotentReplay,
            message: `Your request is in queue at position ${result.queue.position}`,
        });
    } catch (error) {
        logger.error('Queue submit error', error);
        sendError(res, error);
    }
});

/**
 * GET /api/queue - Poll queue status
 */
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const clerkId = req.clerkId!;
        const ownershipContext = await resolveSessionOwnershipContext(clerkId);
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

        if (!isSessionOwnedByContext(session[0], ownershipContext)) {
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
        const ownershipContext = await resolveSessionOwnershipContext(clerkId);
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

        if (!isSessionOwnedByContext(session[0], ownershipContext)) {
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
        const ownershipContext = await resolveSessionOwnershipContext(clerkId);
        const sessionId = sessionIdFromPath ||
            req.body.sessionId ||
            (req.query.sessionId as string);

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

        if (!isSessionOwnedByContext(session[0], ownershipContext)) {
            res.status(403).json({ success: false, error: 'Unauthorized' });
            return;
        }

        const now = new Date().toISOString();

        const previousStatus = session[0].status;
        const previousError = session[0].errorMessage;
        logger.info('[REQUEUE] Starting requeue', {
            sessionId,
            previousStatus,
            previousError: previousError?.substring(0, 100)
        });

        // 1. Reset session state
        const resetPayload: Partial<typeof sessions.$inferInsert> = {
            status: 'pending',
            analysisResult: null,
            progressData: null,
            reasoningLogs: null,
            errorMessage: null,
            accuracy: null,
            confidence: null,
            rectifiedTime: null,
            updatedAt: now,
        };

        await executeWithRetry(() =>
            db.update(sessions)
                .set(resetPayload)
                .where(eq(sessions.id, sessionId))
        );

        // 2. Clear event buffers and abort zombie engine
        await flushSessionTrash(sessionId);

        // 3. Verify the status was updated before adding to queue
        const verifySession = await executeWithRetry(() =>
            db.select({ status: sessions.status, errorMessage: sessions.errorMessage })
                .from(sessions)
                .where(eq(sessions.id, sessionId))
                .limit(1)
        );

        if (verifySession.length === 0 || verifySession[0].status !== 'pending') {
            logger.error('[REQUEUE] Status verification failed', {
                sessionId,
                expectedStatus: 'pending',
                actualStatus: verifySession[0]?.status
            });
            res.status(500).json({ success: false, error: 'Failed to reset session state' });
            return;
        }

        logger.info('[REQUEUE] Status verified as pending', { sessionId });

        // 4. Add back to queue
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
