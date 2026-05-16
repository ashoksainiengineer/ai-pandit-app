import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { db, executeWithRetry } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { sessionEvents } from '../lib/session-events.js';
import { isSessionOwnedByContext, resolveSessionOwnershipContext } from '../lib/session-ownership.js';
import { getPersistedSessionEventsSince, type PersistedSessionEvent } from '../lib/jobs/job-event-stream.js';
import { getApiEncryption } from '../lib/encryption/index.js';
import { sendError } from '../utils/response.js';
import { AppError, ErrorCodes } from '../errors/index.js';
import { logger } from '../utils/logger.js';

const crypto = getApiEncryption();

const SSE_HEARTBEAT_MS = 15_000;
const CONNECTION_CLOSE_DELAY_MS = 3_000;

const router = Router();

router.get('/:sessionId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const sessionId = req.params.sessionId;
    const externalId = req.externalId!;
    const lastSeqParam = Number(req.query.lastSeq) || 0;

    if (!sessionId) {
        sendError(res, new AppError(ErrorCodes.INVALID_INPUT, 'Session ID is required'));
        return;
    }

    let internalUserId: string | undefined;
    let sessionMetadata: Record<string, unknown> = {};
    try {
        const ownershipContext = await resolveSessionOwnershipContext(externalId);
        const sessionRow = await executeWithRetry(() =>
            db.select({
                id: sessions.id,
                userId: sessions.userId,
                externalId: sessions.externalId,
                fullName: sessions.fullName,
                dateOfBirth: sessions.dateOfBirth,
                tentativeTime: sessions.tentativeTime,
                birthPlace: sessions.birthPlace,
                timezone: sessions.timezone,
                status: sessions.status,
                errorMessage: sessions.errorMessage,
                offsetConfig: sessions.offsetConfig,
                updatedAt: sessions.updatedAt,
            })
                .from(sessions)
                .where(eq(sessions.id, sessionId))
                .limit(1)
        );

        if (sessionRow.length === 0) {
            sendError(res, new AppError(ErrorCodes.SESSION_NOT_FOUND, 'Session not found'));
            return;
        }

        if (!isSessionOwnedByContext(sessionRow[0], ownershipContext)) {
            sendError(res, new AppError(ErrorCodes.UNAUTHORIZED, 'Access denied'));
            return;
        }

        internalUserId = sessionRow[0].userId;

        sessionMetadata = {
            fullName: crypto.parseField(sessionRow[0].fullName, internalUserId!),
            dateOfBirth: crypto.parseField(sessionRow[0].dateOfBirth, internalUserId!),
            tentativeTime: crypto.parseField(sessionRow[0].tentativeTime, internalUserId!),
            birthPlace: crypto.parseField(sessionRow[0].birthPlace, internalUserId!),
            timezone: sessionRow[0].timezone,
            status: sessionRow[0].status,
            errorMessage: sessionRow[0].errorMessage || undefined,
            offsetConfig: crypto.parseField(sessionRow[0].offsetConfig, internalUserId!),
            updatedAt: sessionRow[0].updatedAt || undefined,
        };
    } catch (error) {
        logger.error('SSE: session ownership verification failed', { sessionId, error });
        sendError(res, error);
        return;
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    res.write(': connected\n\n');

    let lastSentSeq = lastSeqParam;
    let connectionClosed = false;

    const cleanup = () => {
        if (connectionClosed) return;
        connectionClosed = true;
        clearInterval(heartbeatTimer);
        try {
            const emitter = sessionEvents.getEmitter(sessionId);
            emitter.removeListener('event', onEvent);
        } catch { /* emitter already cleaned up */ }
        try { res.end(); } catch { /* already closed */ }
    };

    const writeSSE = (id: number, data: unknown) => {
        if (connectionClosed) return;
        try {
            res.write(`id: ${id}\ndata: ${JSON.stringify(data)}\n\n`);
        } catch {
            cleanup();
        }
    };

    // Send session metadata as the very first event so the frontend
    // has birth details and status immediately — no need for a separate REST call.
    writeSSE(0, { type: 'metadata', ...sessionMetadata });

    const heartbeatTimer = setInterval(() => {
        try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeatTimer); }
    }, SSE_HEARTBEAT_MS);

    req.on('close', () => {
        logger.info('SSE: client disconnected', { sessionId: sessionId.slice(0, 8) });
        cleanup();
    });

    function onEvent(event: { type: string; seq?: number }) {
        if (connectionClosed) return;
        const seq = typeof event.seq === 'number' ? event.seq : lastSentSeq + 1;
        writeSSE(seq, event);
        if (typeof event.seq === 'number') {
            lastSentSeq = event.seq;
        }

        if (event.type === 'complete' || event.type === 'error') {
            logger.info('SSE: terminal event received, scheduling close', {
                sessionId: sessionId.slice(0, 8),
                type: event.type,
            });
            setTimeout(() => cleanup(), CONNECTION_CLOSE_DELAY_MS);
        }
    }

    // SUBSCRIBE FIRST — then replay. This prevents the race condition where
    // events emitted between the replay query and the subscription are lost.
    const emitter = sessionEvents.getEmitter(sessionId);
    emitter.on('event', onEvent);

    // Always replay missed events. lastSeq=0 means "from the beginning"
    // (first-time connection, new device, or page refresh with no cached state).
    try {
        const missedEvents: PersistedSessionEvent[] = await getPersistedSessionEventsSince(sessionId, lastSeqParam);
        for (const evt of missedEvents) {
            if (evt.seq > lastSentSeq) {
                writeSSE(evt.seq, evt.event);
                lastSentSeq = evt.seq;
            }
        }
        if (missedEvents.length > 0) {
            logger.info('SSE: replayed missed events', {
                sessionId: sessionId.slice(0, 8),
                count: missedEvents.length,
                fromSeq: lastSeqParam,
                toSeq: lastSentSeq,
            });
        }
    } catch (err) {
        logger.error('SSE: failed to replay missed events', { sessionId, error: err });
    }

    logger.info('SSE: connection established', { sessionId: sessionId.slice(0, 8), lastSeq: lastSeqParam });
});

export default router;
