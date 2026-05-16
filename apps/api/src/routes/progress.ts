import { Router, Response } from 'express';
import { getSessionProgress } from '../lib/progress-tracker.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { db, executeWithRetry, getLatestJobForSession } from '@ai-pandit/db';
import { sessions, type Session } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { getApiEncryption } from '../lib/encryption/index.js';
const crypto = getApiEncryption();

import { logger } from '../utils/logger.js';
import { isSessionOwnedByContext, resolveSessionOwnershipContext } from '../lib/session-ownership.js';
import { getPersistedSessionEvents, type PersistedSessionEvent } from '../lib/jobs/job-event-stream.js';
import { listJobEventsSince, listJobEventsSinceTime } from '@ai-pandit/db/jobs';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError, ErrorCodes } from '../errors/index.js';

const router = Router();

router.get('/:sessionId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { sessionId } = req.params;
        const externalId = req.externalId!;
        const since = Number(req.query.since) || 0;
        const sinceTime = req.query.sinceTime as string | undefined;
        await handleProgressRequest(sessionId, externalId, since, sinceTime, res);
    } catch (error) {
        logger.error('Progress fetch failed:', error);
        sendError(res, error);
    }
});

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const sessionId = req.query.sessionId as string;
        const externalId = req.externalId!;
        const since = Number(req.query.since) || 0;
        const sinceTime = req.query.sinceTime as string | undefined;
        await handleProgressRequest(sessionId, externalId, since, sinceTime, res);
    } catch (error) {
        logger.error('Progress fetch failed:', error);
        sendError(res, error);
    }
});

async function handleProgressRequest(
    sessionId: string,
    externalId: string,
    sinceSeq: number,
    sinceTime: string | undefined,
    res: Response
) {
    if (!sessionId) {
        sendError(res, new AppError(ErrorCodes.INVALID_INPUT, 'Session ID is required'));
        return;
    }

    // Verify session ownership
    let internalUserId: string | undefined;
    try {
        const ownershipContext = await resolveSessionOwnershipContext(externalId);
        const sessionCheck = await executeWithRetry(() =>
            db.select({
                id: sessions.id,
                externalId: sessions.externalId,
                userId: sessions.userId,
            })
                .from(sessions)
                .where(eq(sessions.id, sessionId))
                .limit(1)
        );

        if (sessionCheck.length === 0) {
            sendError(res, new AppError(ErrorCodes.SESSION_NOT_FOUND, 'Session not found'));
            return;
        }

        if (!isSessionOwnedByContext(sessionCheck[0], ownershipContext)) {
            sendError(res, new AppError(ErrorCodes.UNAUTHORIZED, 'Access denied'));
            return;
        }

        internalUserId = sessionCheck[0].userId;
    } catch (error) {
        logger.error('Error verifying session ownership:', error);
        sendError(res, error);
        return;
    }

    // Read from DB directly — no Redis
    const sessionRow = await executeWithRetry(() =>
        db.select()
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1)
    );

    if (sessionRow.length === 0) {
        sendError(res, new AppError(ErrorCodes.SESSION_NOT_FOUND, 'Session not found'));
        return;
    }

    const session = sessionRow[0];
    const sessionStatus = session.status || 'pending';
    const job = await getLatestJobForSession(sessionId);

    // Get NEW events since last sequence number (incremental polling)
    let newEvents: PersistedSessionEvent[] = [];
    let lastSeq = sinceSeq;
    let lastEventTime = sinceTime || '';

    if (job) {
        const rawEvents = sinceTime
            ? await listJobEventsSinceTime(job.id, sinceTime, 500)
            : await listJobEventsSince(job.id, sinceSeq, 500);
        for (const eventRow of rawEvents) {
            try {
                const payload = eventRow.payloadJson;
                if (payload && typeof payload === 'object' && 'type' in payload) {
                    newEvents.push({
                        seq: eventRow.sequenceNo,
                        event: payload as PersistedSessionEvent['event'],
                    });
                    lastEventTime = eventRow.createdAt;
                }
            } catch {
                // Skip unparseable events
            }
        }
        if (newEvents.length > 0) {
            lastSeq = newEvents[newEvents.length - 1].seq;
        }
    }

    // Get progress from DB (reads sessions.progressData)
    const progress = await getSessionProgress(sessionId);
    const terminalResult = extractTerminalResult(session.analysisResult, internalUserId!);
    const isComplete = ['complete', 'success', 'finished'].includes(sessionStatus);

    sendSuccess(res, {
        sessionId,
        status: sessionStatus,
        jobId: job?.id,
        jobStatus: job?.status,
        errorMessage: session.errorMessage || undefined,
        result: isComplete ? terminalResult ?? undefined : undefined,
        rectifiedTime: isComplete && typeof terminalResult?.rectifiedTime === 'string' ? terminalResult.rectifiedTime : undefined,
        accuracy: isComplete && typeof terminalResult?.accuracy === 'number' ? terminalResult.accuracy : undefined,
        confidence: isComplete && typeof terminalResult?.confidence === 'string' ? terminalResult.confidence : undefined,
        metadata: {
            fullName: crypto.parseField(session.fullName, internalUserId!),
            dateOfBirth: crypto.parseField(session.dateOfBirth, internalUserId!),
            tentativeTime: crypto.parseField(session.tentativeTime, internalUserId!),
            birthPlace: crypto.parseField(session.birthPlace, internalUserId!),
            offsetConfig: crypto.parseField(session.offsetConfig, internalUserId!),
            timezone: session.timezone,
            status: sessionStatus,
            errorMessage: session.errorMessage || undefined,
            updatedAt: session.updatedAt || undefined,
        },
        progress: progress || {
            currentStep: 0,
            totalSteps: 10,
            percentage: 0,
            steps: [],
            lastUpdate: new Date().toISOString(),
            liveMessage: 'Waiting in queue...',
        },
        events: newEvents,
        lastSeq,
        lastEventTime,
    });
}

function extractTerminalResult(
    rawResult: unknown,
    internalUserId: string
): Record<string, unknown> | null {
    if (!rawResult) return null;
    if (typeof rawResult === 'object') {
        return rawResult as Record<string, unknown>;
    }
    if (typeof rawResult !== 'string') return null;

    const decrypted = crypto.parseField(rawResult, internalUserId);
    if (!decrypted) return null;

    if (typeof decrypted === 'string') {
        try {
            const parsed = JSON.parse(decrypted);
            return typeof parsed === 'object' && parsed !== null
                ? (parsed as Record<string, unknown>)
                : null;
        } catch {
            return null;
        }
    }

    return typeof decrypted === 'object'
        ? (decrypted as Record<string, unknown>)
        : null;
}

export default router;
