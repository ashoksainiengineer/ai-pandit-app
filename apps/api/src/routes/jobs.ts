import { Router, type Response } from 'express';
import { listJobEvents, listJobEventsSince } from '@ai-pandit/db/jobs';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.js';
import { sendCreated, sendError, sendSuccess } from '../utils/response.js';
import {
  cancelJobById,
  createQueuedBirthRectificationJob,
  getJobDetailById,
  getJobIdempotencyKey,
} from '../lib/jobs/job-service.js';
import { resolveSessionOwnershipContext } from '../lib/session-ownership.js';
import { UnauthorizedError } from '../errors/index.js';
import { config } from '../config/index.js';

const router = Router();

function mapEventRecord(event: {
  id: string;
  jobId: string;
  sessionId: string;
  sequenceNo: number;
  eventType: string;
  stage: string | null;
  payloadJson: unknown;
  createdAt: string;
}) {
  return {
    id: event.id,
    jobId: event.jobId,
    sessionId: event.sessionId,
    sequenceNo: event.sequenceNo,
    eventType: event.eventType,
    stage: event.stage,
    payload:
      typeof event.payloadJson === 'object' && event.payloadJson !== null
        ? (event.payloadJson as Record<string, unknown>)
        : {},
    createdAt: event.createdAt,
  };
}

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clerkId = req.clerkId;
    if (!clerkId) {
      throw new UnauthorizedError();
    }

    const ownershipContext = await resolveSessionOwnershipContext(clerkId);
    const result = await createQueuedBirthRectificationJob({
      clerkId,
      ownershipContext,
      body: req.body as Record<string, unknown>,
      idempotencyKey: getJobIdempotencyKey(req),
    });

    sendCreated(res, {
      job: result.job,
      idempotentReplay: result.idempotentReplay,
      queue: result.queue,
    });
  } catch (error) {
    sendError(res, error, (req as AuthenticatedRequest & { requestId?: string }).requestId);
  }
});

router.get('/:jobId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clerkId = req.clerkId;
    if (!clerkId) {
      throw new UnauthorizedError();
    }

    const ownershipContext = await resolveSessionOwnershipContext(clerkId);
    const job = await getJobDetailById(req.params.jobId, ownershipContext);
    sendSuccess(res, job);
  } catch (error) {
    sendError(res, error, (req as AuthenticatedRequest & { requestId?: string }).requestId);
  }
});

router.get('/:jobId/events', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clerkId = req.clerkId;
    if (!clerkId) {
      throw new UnauthorizedError();
    }

    const ownershipContext = await resolveSessionOwnershipContext(clerkId);
    const job = await getJobDetailById(req.params.jobId, ownershipContext);
    const sinceParam = Array.isArray(req.query.since) ? req.query.since[0] : req.query.since;
    const since = typeof sinceParam === 'string' ? Number.parseInt(sinceParam, 10) : 0;
    const events = Number.isFinite(since) && since > 0
      ? await listJobEventsSince(job.id, since)
      : await listJobEvents(job.id);

    sendSuccess(res, {
      jobId: job.id,
      sessionId: job.sessionId,
      since: Number.isFinite(since) && since > 0 ? since : 0,
      events: events.map(mapEventRecord),
    });
  } catch (error) {
    sendError(res, error, (req as AuthenticatedRequest & { requestId?: string }).requestId);
  }
});

router.get('/:jobId/sync', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clerkId = req.clerkId;
    if (!clerkId) {
      throw new UnauthorizedError();
    }

    const ownershipContext = await resolveSessionOwnershipContext(clerkId);
    const job = await getJobDetailById(req.params.jobId, ownershipContext);
    const sinceParam = Array.isArray(req.query.since) ? req.query.since[0] : req.query.since;
    const since = typeof sinceParam === 'string' ? Number.parseInt(sinceParam, 10) : 0;
    const safeSince = Number.isFinite(since) && since > 0 ? since : 0;
    const events = safeSince > 0 ? await listJobEventsSince(job.id, safeSince) : await listJobEvents(job.id);

    sendSuccess(res, {
      job,
      since: safeSince,
      latestSequenceNo: events.at(-1)?.sequenceNo ?? safeSince,
      events: events.map(mapEventRecord),
      recommendedPollIntervalMs: config.queue.syncPollIntervalMs,
      replayMode: safeSince > 0 ? 'incremental' : 'snapshot',
    });
  } catch (error) {
    sendError(res, error, (req as AuthenticatedRequest & { requestId?: string }).requestId);
  }
});

router.post('/:jobId/cancel', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clerkId = req.clerkId;
    if (!clerkId) {
      throw new UnauthorizedError();
    }

    const ownershipContext = await resolveSessionOwnershipContext(clerkId);
    const result = await cancelJobById(req.params.jobId, ownershipContext);
    sendSuccess(res, result);
  } catch (error) {
    sendError(res, error, (req as AuthenticatedRequest & { requestId?: string }).requestId);
  }
});

export default router;
