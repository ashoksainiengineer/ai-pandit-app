// backend/src/routes/stream.ts
// Server-Sent Events endpoint for real-time BTR progress streaming
// SECURITY: Authenticated and authorized access only

import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { sendError, sendUnauthorized, sendForbidden, sendNotFound, sendValidationError } from '../utils/response.js';
import { db, getLatestJobForSession } from '@ai-pandit/db';
import { sessions, type Session } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { aiConfig, config } from '../config/index.js';
import { sessionEvents, SessionEvent } from '../lib/session-events.js';
import { getSessionProgress } from '../lib/progress-tracker.js';
import { getQueueStatus } from '../lib/queue-manager.js';
import { logger } from '../utils/logger.js';
import { safeDecryptWithFallback, parseSensitiveField } from '../lib/encryption/index.js';
import { createStreamTicket } from '../lib/stream-ticket-manager.js';
import { isSessionOwnedByContext, resolveSessionOwnershipContext } from '../lib/session-ownership.js';
import {
    getPersistedSessionEvents,
    getPersistedSessionEventsSince,
} from '../lib/jobs/job-event-stream.js';

const router = Router();
type SseResponse = Response & {
    flush?: () => void;
    flushHeaders?: () => void;
};
type SequencedSessionEvent = SessionEvent & { seq?: number; status?: string };

// Track active SSE connections for observability
let activeSseConnections = 0;

export function getActiveSseCount(): number {
    return activeSseConnections;
}

function flushHeaders(res: SseResponse): void {
    res.flushHeaders?.();
}

function flushBody(res: SseResponse): void {
    res.flush?.();
}

function isWritable(res: SseResponse): boolean {
    return !res.writableEnded && !res.destroyed;
}

function safeWrite(res: SseResponse, payload: string): void {
    if (!isWritable(res)) return;
    res.write(payload);
}

/**
 * OPTIONS /api/stream
 * Handle CORS preflight requests for both path-param and query-param variants
 */
router.options(['/', '/:sessionId'], (req, res) => {
    const requestOrigin = req.headers.origin;
    if (requestOrigin) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Last-Event-ID, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(204).end();
});

/**
 * POST /api/stream/ticket/:sessionId
 *
 * Creates a short-lived, single-use ticket for EventSource authentication.
 *
 * WHY THIS EXISTS:
 * The browser-native EventSource API does not support custom HTTP headers,
 * so it cannot send an Authorization: Bearer <token> header. This endpoint
 * provides a secure workaround by exchanging a Clerk Bearer token for a
 * temporary UUID ticket that can be passed as a ?ticket query parameter
 * to the SSE endpoint.
 *
 * FLOW:
 * 1. Frontend calls this endpoint with a Clerk Bearer token + session ID.
 * 2. This handler verifies auth (via authMiddleware) and session ownership.
 * 3. createStreamTicket() mints a single-use ticket bound to (clerkId, sessionId).
 * 4. Frontend opens EventSource at GET /api/stream/:sessionId?ticket=<ticket>.
 * 5. Auth middleware detects the ticket, calls consumeStreamTicket(), and
 *    authenticates the SSE connection without requiring an Authorization header.
 *
 * SECURITY:
 * - Requires valid Clerk Bearer token (authMiddleware).
 * - Verifies session ownership before minting the ticket.
 * - Tickets are single-use and expire after 2 minutes.
 * - See lib/stream-ticket-manager.ts for the full ticket lifecycle.
 */
router.post('/ticket/:sessionId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const sessionId = req.params.sessionId;
    const clerkId = req.clerkId;
    if (!sessionId) {
        sendValidationError(res, 'Session ID required');
        return;
    }

    if (!clerkId) {
        sendUnauthorized(res);
        return;
    }

    try {
        const ownershipContext = await resolveSessionOwnershipContext(clerkId);
        const found = await db.select({
            id: sessions.id,
            clerkId: sessions.clerkId,
            userId: sessions.userId,
        })
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

        if (found.length === 0) {
            sendNotFound(res, 'Session not found');
            return;
        }

        if (!isSessionOwnedByContext(found[0], ownershipContext)) {
            sendForbidden(res, 'Access denied');
            return;
        }

        const ticket = createStreamTicket(clerkId, sessionId);
        res.json({
            success: true,
            ticket,
            expiresInSeconds: 120,
        });
    } catch (error) {
        logger.error('[SSE] Failed to create stream ticket', { sessionId, error });
        sendError(res, error);
    }
});

/**
 * GET /api/stream (Support Query Params: sessionId)
 * GET /api/stream/:sessionId
 * Server-Sent Events endpoint for real-time progress updates
 *
 * SECURITY: Requires authentication and session ownership verification
 */
router.get(['/', '/:sessionId'], authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const sseRes = res as SseResponse;
    // Robust session ID extraction
    const sessionId = req.params.sessionId ||
        (req.query.sessionId as string);

    const isTestScript = false;
    const clerkId = req.clerkId;

    if (!sessionId) {
        res.setHeader('Content-Type', 'text/event-stream');
        sendEvent(res, { type: 'error', message: 'Session ID required (path param or ?sessionId=)', code: 'BAD_REQUEST' });
        res.end();
        return;
    }

    if (!clerkId) {
        res.setHeader('Content-Type', 'text/event-stream');
        sendEvent(res, { type: 'error', message: 'Authentication required', code: 'UNAUTHORIZED' });
        res.end();
        return;
    }

    const trackSseConnection = () => {
        activeSseConnections++;
        logger.info(`[SSE] Connection requested for session ${sessionId} by clerkId ${clerkId.slice(0, 12)}... | Active: ${activeSseConnections}`);
    };

    // SECURITY: Verify session ownership

    let currentStatus = 'pending';
    try {
        const ownershipContext = await resolveSessionOwnershipContext(clerkId);
        const session = await db.select({
            status: sessions.status,
            userId: sessions.userId,
            clerkId: sessions.clerkId,
            errorMessage: sessions.errorMessage,
            updatedAt: sessions.updatedAt,
            analysisResult: sessions.analysisResult,
        })
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

        if (session.length === 0) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('X-Accel-Buffering', 'no');
            flushHeaders(sseRes);
            safeWrite(sseRes, ': ping\n\n');
            sendEvent(sseRes, { type: 'error', message: 'Session not found', code: 'NOT_FOUND' });
            flushBody(sseRes);
            res.end();
            return;
        }

        // Verify ownership
        if (!isSessionOwnedByContext(session[0], ownershipContext) && !isTestScript) {
            logger.warn(`[SSE] Unauthorized access attempt: clerkId ${clerkId.slice(0, 12)}... tried to access session ${sessionId}`);
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('X-Accel-Buffering', 'no');
            flushHeaders(sseRes);
            safeWrite(sseRes, ': ping\n\n');
            sendEvent(sseRes, { type: 'error', message: 'Access denied', code: 'FORBIDDEN' });
            flushBody(sseRes);
            res.end();
            return;
        }

        const userId = session[0].userId; // Internal DB ID needed elsewhere

        currentStatus = session[0].status || 'pending';

        // Handle terminal states — do NOT open SSE for sessions that are done
        // NOTE: cancelSession() sets status to 'failed' with errorMessage 'Cancelled by user'
        const terminalStates = ['cancelled', 'error', 'failed', 'complete'];
        if (terminalStates.includes(currentStatus)) {
            logger.info(`[SSE] Session ${sessionId} is in terminal state: ${currentStatus}`, {
                errorMessage: session[0].errorMessage?.substring(0, 200),
                updatedAt: session[0].updatedAt
            });

            let terminalResult: Record<string, unknown> | null = null;
            if (currentStatus === 'complete') {
                const decryptedResult = safeDecryptWithFallback(session[0].analysisResult, clerkId, userId);
                if (decryptedResult) {
                    if (typeof decryptedResult === 'string') {
                        try {
                            const parsed = JSON.parse(decryptedResult) as Record<string, unknown>;
                            terminalResult = parsed;
                        } catch {
                            terminalResult = null;
                        }
                    } else if (typeof decryptedResult === 'object') {
                        terminalResult = decryptedResult as Record<string, unknown>;
                    }
                }
            }

            // Set all SSE headers for proper EventSource handling
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache, no-transform, no-store, must-revalidate, private');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            flushHeaders(sseRes);

            // Send preamble to ensure event is delivered through proxies
            safeWrite(sseRes, ':' + ' '.repeat(1024) + '\n\n');
            flushBody(sseRes);

            sendEvent(sseRes, {
                type: 'terminal_state',
                status: currentStatus,
                message: currentStatus === 'complete'
                    ? 'Session already completed'
                    : `Session is in terminal state: ${currentStatus}`,
                errorMessage: session[0].errorMessage || undefined,
                result: terminalResult ?? undefined,
                rectifiedTime: typeof terminalResult?.rectifiedTime === 'string' ? terminalResult.rectifiedTime : undefined,
                accuracy: typeof terminalResult?.accuracy === 'number' ? terminalResult.accuracy : undefined,
                confidence: typeof terminalResult?.confidence === 'string' ? terminalResult.confidence : undefined,
                data: {
                    status: currentStatus,
                    updatedAt: session[0].updatedAt,
                    errorMessage: session[0].errorMessage || undefined,
                    result: terminalResult ?? undefined,
                },
            });

            flushBody(sseRes);
            res.end();
            return;
        }
    } catch (error) {
        logger.error(`[SSE] Error checking session for ${sessionId}:`, error);
        res.setHeader('Content-Type', 'text/event-stream');
        sendEvent(res, { type: 'error', message: 'Internal server error', code: 'INTERNAL_ERROR' });
        res.end();
        return;
    }

    // SSE Setup

    trackSseConnection();

    // Read Last-Event-ID for reconnection support
    const lastEventId = req.headers['last-event-id'] as string | undefined;
    const lastSeq = lastEventId ? parseInt(lastEventId, 10) : 0;
    const isReconnect = lastSeq > 0;

    if (isReconnect) {
        logger.info(`[SSE] ♻️ RECONNECT detected for ${sessionId} | Last-Event-ID: ${lastSeq}`);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform, no-store, must-revalidate, private');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Transfer-Encoding', 'chunked');

    // CORS for SSE - Use request origin for credentials support
    // NOTE: Cannot use wildcard (*) with credentials mode
    const requestOrigin = req.headers.origin;
    if (requestOrigin) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Last-Event-ID, Authorization');
    flushHeaders(sseRes);

    logger.info(`[SSE] Headers flushed for ${sessionId}`);

    // Proxy-buffering bypass: send a 2KB preamble so upstream proxies flush early.
    safeWrite(sseRes, ':' + ' '.repeat(2048) + '\n\n');

    flushBody(sseRes);
    logger.info(`[SSE] 2KB Preamble sent for ${sessionId}`);

    // Send initial connection event (unsequenced — lightweight)
    sendEvent(sseRes, { type: 'connected', sessionId, timestamp: new Date().toISOString() });

    // Reconnect or Fresh: Smart replay strategy

    (async () => {
        try {
            if (isReconnect) {
                // Reconnect path: replay only missed events

                // FIX: Merge both DB-persisted (durable) and memory (all events) sources
                // DB has low-volume durable events (progress, complete, error, job.*)
                // Memory has all events including high-volume (ai_thinking, candidate_scores)
                const dbEvents = config.features.useNewStreamPath
                    ? await getPersistedSessionEventsSince(sessionId, lastSeq)
                    : [];
                const memoryEvents = sessionEvents.getEventsSince(sessionId, lastSeq);

                // Merge and deduplicate by sequence number (memory events take precedence for same seq)
                const eventMap = new Map<number, { seq: number; event: SessionEvent }>();
                dbEvents.forEach(e => eventMap.set(e.seq, e));
                memoryEvents.forEach(e => eventMap.set(e.seq, e)); // Overwrite with memory if duplicate

                // Sort by sequence number for ordered replay
                const replayEvents = Array.from(eventMap.values()).sort((a, b) => a.seq - b.seq);
                logger.info(`[SSE] ♻️ Replaying ${replayEvents.length} missed events (DB: ${dbEvents.length}, Memory: ${memoryEvents.length}) since seq ${lastSeq} for ${sessionId}`);

                for (const { seq, event } of replayEvents) {
                    sendSequencedEvent(res, sessionId, event, seq);
                }

                // Also send current metadata for status sync
                const queueStatus = await getQueueStatus(sessionId);
                if (queueStatus) {
                    const session = queueStatus.session as Partial<Session> | undefined;
                    if (!session || !session.userId) {
                        return;
                    }
                    const job = await getLatestJobForSession(sessionId);
                    sendSequencedEvent(sseRes, sessionId, {
                        type: 'metadata',
                        data: {
                            ...session,
                            jobId: job?.id,
                            jobStatus: job?.status,
                            fullName: parseSensitiveField(session.fullName, clerkId, session.userId),
                            dateOfBirth: parseSensitiveField(session.dateOfBirth, clerkId, session.userId),
                            tentativeTime: parseSensitiveField(session.tentativeTime, clerkId, session.userId),
                            birthPlace: parseSensitiveField(session.birthPlace, clerkId, session.userId),
                            offsetConfig: parseSensitiveField(session.offsetConfig, clerkId, session.userId),
                            lifeEvents: parseSensitiveField(session.lifeEvents, clerkId, session.userId, []),
                            physicalTraits: parseSensitiveField(session.physicalTraits, clerkId, session.userId),
                            forensicTraits: parseSensitiveField(session.forensicTraits, clerkId, session.userId),
                            status: queueStatus.status,
                            aiModel: aiConfig.model,
                        }
                    } as unknown as SessionEvent);
                }
            } else {
                // Fresh connection: No Last-Event-ID → full replay

                logger.info(`[SSE] Fetching initial progress for ${sessionId}`);
                const currentProgress = await getSessionProgress(sessionId);

                // Warmup hint for fresh connections
                if (!currentProgress || currentProgress.currentStep === 0) {
                    sendSequencedEvent(sseRes, sessionId, {
                        type: 'ai_thinking',
                        chunk: "[SYSTEM] Initializing analysis engine... Establishing mathematical grid connection.\n",
                        stage: 1,
                    } as unknown as SessionEvent);
                }

                if (currentProgress) {
                    logger.info(`[SSE] Sending initial state for ${sessionId}`);
                    sendSequencedEvent(sseRes, sessionId, {
                        type: 'initial_state',
                        progress: currentProgress,
                    } as unknown as SessionEvent);
                }

                const queueStatus = await getQueueStatus(sessionId);
                if (queueStatus) {
                    logger.info(`[SSE] Sending initial metadata for ${sessionId}`);

                    const session = queueStatus.session as Partial<Session> | undefined;
                    if (!session || !session.userId) {
                        return;
                    }
                    const job = await getLatestJobForSession(sessionId);

                    sendSequencedEvent(sseRes, sessionId, {
                        type: 'metadata',
                        data: {
                            ...session,
                            jobId: job?.id,
                            jobStatus: job?.status,
                            fullName: parseSensitiveField(session.fullName, clerkId, session.userId),
                            dateOfBirth: parseSensitiveField(session.dateOfBirth, clerkId, session.userId),
                            tentativeTime: parseSensitiveField(session.tentativeTime, clerkId, session.userId),
                            birthPlace: parseSensitiveField(session.birthPlace, clerkId, session.userId),
                            offsetConfig: parseSensitiveField(session.offsetConfig, clerkId, session.userId),
                            lifeEvents: parseSensitiveField(session.lifeEvents, clerkId, session.userId, []),
                            physicalTraits: parseSensitiveField(session.physicalTraits, clerkId, session.userId),
                            forensicTraits: parseSensitiveField(session.forensicTraits, clerkId, session.userId),
                            status: queueStatus.status,
                            aiModel: aiConfig.model,
                        }
                    } as unknown as SessionEvent);
                }

                const persistedEvents = config.features.useNewStreamPath
                    ? await getPersistedSessionEvents(sessionId)
                    : [];
                if (persistedEvents.length > 0) {
                    logger.info(`[SSE] Replaying ${persistedEvents.length} persisted job events for ${sessionId}`);
                    persistedEvents.forEach(({ seq, event }) => sendSequencedEvent(sseRes, sessionId, event, seq));
                    return;
                }

                // Send cached AI Context if exists
                const lastContext = sessionEvents.getLastContext(sessionId);
                if (lastContext) {
                    sendSequencedEvent(sseRes, sessionId, lastContext);
                }

                // Send cached Thinking Buffers (Multi-Stage Replay)
                const thinkingBuffers = sessionEvents.getThinkingBuffers(sessionId);
                if (thinkingBuffers && thinkingBuffers.length > 0) {
                    logger.info(`[SSE] Replaying ${thinkingBuffers.length} thinking streams for ${sessionId}`);
                    thinkingBuffers.forEach(buf => {
                        sendSequencedEvent(sseRes, sessionId, {
                            type: 'ai_thinking',
                            chunk: buf.text,
                            stage: buf.stage,
                            candidateTime: buf.candidateTime,
                        } as SessionEvent);
                    });
                }

                // Send cached Calculation Logs
                const calcLogs = sessionEvents.getCalculationBuffer(sessionId);
                if (calcLogs && calcLogs.length > 0) {
                    logger.info(`[SSE] Replaying ${calcLogs.length} calc logs for ${sessionId}`);
                    calcLogs.forEach(log => sendSequencedEvent(sseRes, sessionId, log));
                }

                // Send cached Candidate Scores
                const scoreHistory = sessionEvents.getCandidateScoreBuffer(sessionId);
                if (scoreHistory && scoreHistory.length > 0) {
                    logger.info(`[SSE] Replaying ${scoreHistory.length} candidate scores for ${sessionId}`);
                    scoreHistory.forEach(score => sendSequencedEvent(sseRes, sessionId, score));
                }

                // Send cached Decisions
                const decisions = sessionEvents.getDecisionBuffer(sessionId);
                if (decisions && decisions.length > 0) {
                    logger.info(`[SSE] Replaying ${decisions.length} decisions for ${sessionId}`);
                    decisions.forEach(decision => sendSequencedEvent(sseRes, sessionId, decision));
                }
            }
        } catch (error) {
            logger.error(`[SSE] Error in initial async sync for ${sessionId}:`, error);
        }
    })();

    // Event Subscription


    const emitter = sessionEvents.getEmitter(sessionId);

    const eventHandler = (event: SessionEvent) => {
        sendSequencedEvent(sseRes, sessionId, event);

        // Signal client to stop retrying on terminal states
        if (event.type === 'complete' || event.type === 'error' || (event as SequencedSessionEvent).status === 'cancelled') {
            logger.info(`[SSE] Terminal event reached: ${event.type}. Closing stream.`);
            setTimeout(() => {
                if (!res.writableEnded) res.end();
            }, 2000); // Give client 2s to receive and call .close()
        }
    };

    emitter.on('event', eventHandler);

    // Keep-alive ping every 15 seconds (unsequenced — pings don't need replay)
    const pingInterval = setInterval(() => {
        safeWrite(sseRes, ': ping\n\n');
        sendEvent(sseRes, { type: 'ping', timestamp: new Date().toISOString() });
    }, 15000);

    let cleanedUp = false;
    const cleanupConnection = (reason: 'close' | 'error', error?: unknown) => {
        if (cleanedUp) return;
        cleanedUp = true;
        activeSseConnections = Math.max(0, activeSseConnections - 1);
        if (reason === 'error') {
            logger.error('SSE connection error', {
                sessionId,
                clerkId: clerkId.slice(0, 12) + '...',
                error,
                activeConnections: activeSseConnections
            });
        } else {
            logger.info('SSE connection closed', {
                sessionId,
                clerkId: clerkId.slice(0, 12) + '...',
                activeConnections: activeSseConnections
            });
        }
        emitter.off('event', eventHandler);
        clearInterval(pingInterval);
    };

    // Cleanup on disconnect
    req.on('close', () => {
        cleanupConnection('close');
    });

    req.on('error', (error) => {
        cleanupConnection('error', error);
    });
});

/**
 * Send SSE event to client (unsequenced — for pings, connected, and error events)
 */
function sendEvent(res: SseResponse, data: unknown): void {
    try {
        if (typeof data === 'object' && data !== null) {
            const eventData = data as { type?: string; candidateTime?: string; chunk?: string };

            if (eventData.type === 'ai_thinking') {
                logger.debug('SSE ai_thinking:', {
                    candidateTime: eventData.candidateTime || '[General]',
                    chunkLength: eventData.chunk?.length,
                });
            }
            if (eventData.type === 'candidate_score') {
                logger.debug('Sending Candidate Score:', data as Record<string, unknown>);
            }
        }

        const jsonData = JSON.stringify(data);
        safeWrite(res, `data: ${jsonData}\n\n`);

        flushBody(res);
    } catch (error) {
        logger.error('Failed to send SSE event:', error);
    }
}

/**
 * Send SSE event with sequence ID (for Last-Event-ID protocol).
 * Uses the monotonic seq assigned by SessionEventManager if available.
 * This is the primary send function for all meaningful events.
 */
function sendSequencedEvent(res: SseResponse, sessionId: string, event: SessionEvent, existingSeq?: number): void {
    try {
        // Use provided seq (replay), or attached seq (from SessionEventManager.emit), or fallback to next
        const seq = existingSeq ?? (event as SequencedSessionEvent).seq ?? sessionEvents.getNextSeq(sessionId);

        // Debug logging
        if (typeof event === 'object' && event !== null) {
            const eventData = event as { type?: string; candidateTime?: string; chunk?: string };
            if (eventData.type === 'ai_thinking') {
                logger.debug('SSE ai_thinking:', {
                    seq,
                    candidateTime: eventData.candidateTime || '[General]',
                    chunkLength: eventData.chunk?.length,
                });
            }
            if (eventData.type === 'candidate_score') {
                logger.debug('Sending Candidate Score:', { seq, data: event });
            }
        }

        const jsonData = JSON.stringify(event);
        // Standard SSE format: id: → data: → blank line
        safeWrite(res, `id: ${seq}\ndata: ${jsonData}\n\n`);

        flushBody(res);
    } catch (error) {
        logger.error('Failed to send sequenced SSE event:', error);
    }
}

export default router;
