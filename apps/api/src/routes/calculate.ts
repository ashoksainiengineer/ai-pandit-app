import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import {
    createQueuedBirthRectificationJob,
    getJobIdempotencyKey,
} from '../lib/jobs/job-service.js';
import { resolveSessionOwnershipContext } from '../lib/session-ownership.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { validateBody, QueueSubmitSchema } from '../middleware/validation.js';

const router = Router();

/**
 * POST /api/calculate - Submit birth time rectification for processing
 * @deprecated Use POST /api/queue instead. This endpoint is maintained for backward compatibility.
 *
 * Flow:
 * 1. Accept and validate the request
 * 2. Create a session record
 * 3. Add to processing queue
 * 4. Return immediately with sessionId for polling
 *
 * The client should poll /api/queue/progress/:sessionId for results.
 */
router.post('/', validateBody(QueueSubmitSchema), async (req: AuthenticatedRequest, res: Response) => {
    const startTime = Date.now();

    try {
        const clerkId = req.clerkId!;
        const ownershipContext = await resolveSessionOwnershipContext(clerkId);
        const result = await createQueuedBirthRectificationJob({
            clerkId,
            ownershipContext,
            body: req.body as Record<string, unknown>,
            idempotencyKey: getJobIdempotencyKey(req),
        });

        const totalProcessingTime = Date.now() - startTime;
        logger.info('Birth time rectification request queued', {
            clerkId,
            sessionId: result.job.sessionId,
            jobId: result.job.id,
            processingTimeMs: totalProcessingTime,
            idempotentReplay: result.idempotentReplay,
        });

        sendSuccess(res, {
            sessionId: result.job.sessionId,
            jobId: result.job.id,
            position: result.queue.position,
            estimatedWaitSeconds: result.queue.estimatedWaitSeconds,
            status: result.job.status,
            idempotentReplay: result.idempotentReplay,
        });

    } catch (error) {
        logger.error('Calculate endpoint error', error);
        sendError(res, error);
    }
});

export default router;
