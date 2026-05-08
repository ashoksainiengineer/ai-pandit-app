import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { db, executeWithRetry } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { addToQueue, getQueueStatus, startQueueProcessor, cancelSession, flushSessionTrash } from '../lib/queue-manager.js';
import { isSessionOwnedByContext, resolveSessionOwnershipContext } from '../lib/session-ownership.js';
import {
    createQueuedBirthRectificationJob,
    getJobIdempotencyKey,
} from '../lib/jobs/job-service.js';
import { sendError, sendSuccess, sendValidationError, sendNotFound, sendForbidden } from '../utils/response.js';
import { validateBody, QueueSubmitSchema } from '../middleware/validation.js';
import { sleep } from '../lib/ai-helpers.js';

const router = Router();

const SESSION_VISIBILITY_MAX_ATTEMPTS = 20;
const SESSION_VISIBILITY_DELAY_MS = 300;


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

        // Exponential backoff: 300ms, 600ms, 1200ms, ... capped at 5s
        const delay = Math.min(SESSION_VISIBILITY_DELAY_MS * Math.pow(2, attempt - 1), 5000);
        await sleep(delay);
    }

    logger.warn('[QUEUE] Session visibility timed out — session may become visible shortly', { sessionId });
    return false;
}

/**
 * POST /api/queue - Submit new analysis request to queue
 */
router.post('/', authMiddleware, validateBody(QueueSubmitSchema), async (req: AuthenticatedRequest, res: Response) => {
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
            logger.warn('[QUEUE] Session created but not immediately visible — returning sessionId anyway', { sessionId: result.job.sessionId });
            // Return the sessionId anyway — the frontend can poll for readiness
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
            sendValidationError(res, 'sessionId is required');
            return;
        }

        // Verify session belongs to user
        const session = await executeWithRetry(() =>
            db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1)
        );

        if (session.length === 0) {
            sendNotFound(res, 'Session');
            return;
        }

        if (!isSessionOwnedByContext(session[0], ownershipContext)) {
            sendForbidden(res, 'Unauthorized');
            return;
        }

        // Get queue status
        const queueStatus = await getQueueStatus(sessionId);

        if (!queueStatus) {
            sendError(res, new Error('Failed to get queue status'));
            return;
        }

        // If complete, return results
        if (queueStatus.status === 'complete') {
            let analysisResult: Record<string, unknown> | null = null;
            try {
                analysisResult = session[0].analysisResult ? JSON.parse(session[0].analysisResult as string) as Record<string, unknown> : null;
            } catch (e) {
                logger.error('Failed to parse analysis result', e);
            }

            let reasoningLogs: Record<string, unknown>[] | null = null;
            try {
                reasoningLogs = session[0].reasoningLogs ? JSON.parse(session[0].reasoningLogs as string) as Record<string, unknown>[] : null;
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
        sendError(res, error);
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
            sendValidationError(res, 'sessionId is required');
            return;
        }

        // Verify session belongs to user
        const session = await executeWithRetry(() =>
            db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1)
        );

        if (session.length === 0) {
            sendNotFound(res, 'Session');
            return;
        }

        if (!isSessionOwnedByContext(session[0], ownershipContext)) {
            logger.warn(`Cancel unauthorized: Session ${sessionId} owned by ${session[0].clerkId}, requested by ${clerkId}`);
            sendForbidden(res, 'Unauthorized');
            return;
        }


        const success = await cancelSession(sessionId);

        if (success) {
            res.json({ success: true, message: 'Session cancelled' });
        } else {
            sendError(res, new Error('Could not cancel session (may be already complete or failed)'));
        }
    } catch (error) {
        logger.error('Cancel session error', error);
        sendError(res, error);
    }
});

/**
 * REUSABLE REQUEUE HANDLER
 */
async function requeueAnalysisSession(req: AuthenticatedRequest, res: Response, sessionIdFromPath?: string) {
    try {
        const clerkId = req.clerkId!;
        const ownershipContext = await resolveSessionOwnershipContext(clerkId);
        const sessionId = sessionIdFromPath ||
            req.body.sessionId ||
            (req.query.sessionId as string);

        if (!sessionId) {
            sendValidationError(res, 'sessionId is required');
            return;
        }

        // Verify session belongs to user
        const session = await executeWithRetry(() =>
            db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1)
        );

        if (session.length === 0) {
            sendNotFound(res, 'Session');
            return;
        }

        if (!isSessionOwnedByContext(session[0], ownershipContext)) {
            sendForbidden(res, 'Unauthorized');
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
            sendError(res, new Error('Failed to reset session state'));
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
            sendError(res, new Error(queueResult.error || 'Failed to queue'));
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
        sendError(res, error);
    }
}

/**
 * POST /api/queue/requeue - Modern endpoint
 */
router.post('/requeue', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    return requeueAnalysisSession(req, res);
});

/**
 * POST /api/sessions/:id/requeue - LEGACY BRIDGE
 * @deprecated Use POST /api/queue/requeue instead. Remove after verifying zero traffic for 3+ months.
 * Last deprecated: May 2026. Monitored via structured logger key: [LEGACY_REQUEUE].
 * Used by older frontend builds that haven't been redeployed yet.
 */
router.post('/:sessionId/requeue', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    logger.info('[LEGACY_REQUEUE] Legacy requeue bridge used', { sessionId: req.params.sessionId, clerkId: req.clerkId?.slice(0, 12) });
    return requeueAnalysisSession(req, res, req.params.sessionId);
});

export default router;
