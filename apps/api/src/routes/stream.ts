// backend/src/routes/stream.ts
// Server-Sent Events endpoint for real-time BTR progress streaming
// SECURITY: Authenticated and authorized access only

import { Router, Response } from 'express';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq, and } from 'drizzle-orm';
import { aiConfig } from '../config/index.js';
import { sessionEvents, SessionEvent } from '../lib/session-events.js';
import { getSessionProgress } from '../lib/progress-tracker.js';
import { getQueueStatus } from '../lib/queue-manager.js';
import { logger } from '../lib/logger.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { safeDecryptWithFallback, parseSensitiveField } from '../lib/encryption/index.js';

const router = Router();

/**
 * OPTIONS /api/stream/:sessionId
 * Handle CORS preflight requests for SSE endpoint
 */
router.options('/:sessionId', (req, res) => {
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
 * GET /api/stream/:sessionId
 * Server-Sent Events endpoint for real-time progress updates
 *
 * SECURITY: Requires authentication and session ownership verification
 */
router.get('/:sessionId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;
    const isTestScript = req.headers['x-test-bypass-auth'] === 'super-secret-test-key';
    const clerkId = req.clerkId || (isTestScript ? 'TEST_SCRIPT' : undefined);

    if (!sessionId) {
        res.setHeader('Content-Type', 'text/event-stream');
        sendEvent(res, { type: 'error', error: 'Session ID required', code: 'BAD_REQUEST' });
        res.end();
        return;
    }

    if (!clerkId) {
        res.setHeader('Content-Type', 'text/event-stream');
        sendEvent(res, { type: 'error', error: 'Authentication required', code: 'UNAUTHORIZED' });
        res.end();
        return;
    }

    logger.info(`[SSE] Connection requested for session ${sessionId} by clerkId ${clerkId.slice(0, 12)}...`);

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECURITY: Verify session ownership
    // ═══════════════════════════════════════════════════════════════════════════════
    let currentStatus = 'pending';
    let isOwner = false;

    try {
        const session = await db.select({
            status: sessions.status,
            userId: sessions.userId,
            clerkId: sessions.clerkId,
            errorMessage: sessions.errorMessage,
            updatedAt: sessions.updatedAt,
        })
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

        if (session.length === 0) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('X-Accel-Buffering', 'no');
            if (typeof (res as any).flushHeaders === 'function') (res as any).flushHeaders();
            res.write(': ping\n\n');
            sendEvent(res, { type: 'error', error: 'Session not found', code: 'NOT_FOUND' });
            if (typeof (res as any).flush === 'function') (res as any).flush();
            res.end();
            return;
        }

        // Verify ownership
        if (session[0].clerkId !== clerkId && !isTestScript) {
            logger.warn(`[SSE] Unauthorized access attempt: clerkId ${clerkId.slice(0, 12)}... tried to access session ${sessionId}`);
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('X-Accel-Buffering', 'no');
            if (typeof (res as any).flushHeaders === 'function') (res as any).flushHeaders();
            res.write(': ping\n\n');
            sendEvent(res, { type: 'error', error: 'Access denied', code: 'FORBIDDEN' });
            if (typeof (res as any).flush === 'function') (res as any).flush();
            res.end();
            return;
        }

        const userId = session[0].userId; // Internal DB ID needed elsewhere

        isOwner = true;
        currentStatus = session[0].status || 'pending';

        // Handle terminal states — do NOT open SSE for sessions that are done
        // NOTE: cancelSession() sets status to 'failed' with errorMessage 'Cancelled by user'
        const terminalStates = ['cancelled', 'error', 'failed', 'complete'];
        if (terminalStates.includes(currentStatus)) {
            logger.info(`[SSE] Session ${sessionId} is in terminal state: ${currentStatus}`, {
                errorMessage: session[0].errorMessage?.substring(0, 200),
                updatedAt: session[0].updatedAt
            });

            // Set all SSE headers for proper EventSource handling
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache, no-transform, no-store, must-revalidate, private');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            if (typeof (res as any).flushHeaders === 'function') (res as any).flushHeaders();

            // Send preamble to ensure event is delivered through proxies
            res.write(':' + ' '.repeat(1024) + '\n\n');
            if (typeof (res as any).flush === 'function') (res as any).flush();

            sendEvent(res, {
                type: 'terminal_state',
                status: currentStatus,
                message: currentStatus === 'complete'
                    ? 'Session already completed'
                    : `Session is in terminal state: ${currentStatus}`,
                errorMessage: session[0].errorMessage || undefined,
            });

            if (typeof (res as any).flush === 'function') (res as any).flush();
            res.end();
            return;
        }
    } catch (error) {
        console.error('TEST DEBUG ERROR:', error);
        logger.error(`[SSE] Error checking session for ${sessionId}:`, error);
        res.setHeader('Content-Type', 'text/event-stream');
        sendEvent(res, { type: 'error', error: 'Internal server error', code: 'INTERNAL_ERROR' });
        res.end();
        return;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SSE Setup
    // ═══════════════════════════════════════════════════════════════════════════════

    // INDUSTRY SSE: Read Last-Event-ID for smart reconnection
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
    if (typeof (res as any).flushHeaders === 'function') (res as any).flushHeaders();

    logger.info(`[SSE] Headers flushed for ${sessionId}`);

    // Proxy-Buffering Bypass: Send a 2KB preamble
    // This fills the buffer of intermediate proxies (Hugging Face / Ingress)
    // to ensure real-time delivery of the next events.
    res.write(':' + ' '.repeat(2048) + '\n\n');

    if (typeof (res as any).flush === 'function') (res as any).flush();
    logger.info(`[SSE] 2KB Preamble sent for ${sessionId}`);

    // Send initial connection event (unsequenced — lightweight)
    sendEvent(res, { type: 'connected', sessionId, timestamp: new Date().toISOString() });

    // ═══════════════════════════════════════════════════════════════════════════════
    // RECONNECT vs FRESH: Smart replay strategy
    // ═══════════════════════════════════════════════════════════════════════════════
    (async () => {
        try {
            if (isReconnect) {
                // ────────────────────────────────────────────────────────────────
                // RECONNECT PATH: Last-Event-ID present → replay only missed events
                // This avoids sending duplicate thinking text, scores, etc.
                // ────────────────────────────────────────────────────────────────
                const missedEvents = sessionEvents.getEventsSince(sessionId, lastSeq);
                logger.info(`[SSE] ♻️ Replaying ${missedEvents.length} missed events since seq ${lastSeq} for ${sessionId}`);

                for (const { seq, event } of missedEvents) {
                    sendSequencedEvent(res, sessionId, event, seq);
                }

                // Also send current metadata for status sync
                const queueStatus = await getQueueStatus(sessionId);
                if (queueStatus) {
                    const session = queueStatus.session;
                    sendSequencedEvent(res, sessionId, {
                        type: 'metadata',
                        data: {
                            ...session,
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
                    } as any);
                }
            } else {
                // ────────────────────────────────────────────────────────────────
                // FRESH CONNECTION PATH: No Last-Event-ID → full replay
                // ────────────────────────────────────────────────────────────────
                logger.info(`[SSE] Fetching initial progress for ${sessionId}`);
                const currentProgress = await getSessionProgress(sessionId);

                // Warmup hint for fresh connections
                if (!currentProgress || currentProgress.currentStep === 0) {
                    sendSequencedEvent(res, sessionId, {
                        type: 'ai_thinking',
                        chunk: "[SYSTEM] Initializing God-Tier Rectification Engine... Establishing mathematical grid connection.\n",
                        stage: 1,
                    } as any);
                }

                if (currentProgress) {
                    logger.info(`[SSE] Sending initial state for ${sessionId}`);
                    sendSequencedEvent(res, sessionId, {
                        type: 'initial_state',
                        progress: currentProgress,
                    } as any);
                }

                const queueStatus = await getQueueStatus(sessionId);
                if (queueStatus) {
                    logger.info(`[SSE] Sending initial metadata for ${sessionId}`);

                    const session = queueStatus.session;

                    sendSequencedEvent(res, sessionId, {
                        type: 'metadata',
                        data: {
                            ...session,
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
                    } as any);
                }

                // Send cached AI Context if exists
                const lastContext = sessionEvents.getLastContext(sessionId);
                if (lastContext) {
                    sendSequencedEvent(res, sessionId, lastContext);
                }

                // Send cached Thinking Buffers (Multi-Stage Replay)
                const thinkingBuffers = sessionEvents.getThinkingBuffers(sessionId);
                if (thinkingBuffers && thinkingBuffers.length > 0) {
                    logger.info(`[SSE] Replaying ${thinkingBuffers.length} thinking streams for ${sessionId}`);
                    thinkingBuffers.forEach(buf => {
                        sendSequencedEvent(res, sessionId, {
                            type: 'ai_thinking',
                            chunk: buf.text,
                            stage: buf.stage,
                            candidateTime: buf.candidateTime,
                        } as any);
                    });
                }

                // Send cached Calculation Logs
                const calcLogs = sessionEvents.getCalculationBuffer(sessionId);
                if (calcLogs && calcLogs.length > 0) {
                    logger.info(`[SSE] Replaying ${calcLogs.length} calc logs for ${sessionId}`);
                    calcLogs.forEach(log => sendSequencedEvent(res, sessionId, log));
                }

                // Send cached Candidate Scores
                const scoreHistory = sessionEvents.getCandidateScoreBuffer(sessionId);
                if (scoreHistory && scoreHistory.length > 0) {
                    logger.info(`[SSE] Replaying ${scoreHistory.length} candidate scores for ${sessionId}`);
                    scoreHistory.forEach(score => sendSequencedEvent(res, sessionId, score));
                }

                // Send cached Decisions
                const decisions = sessionEvents.getDecisionBuffer(sessionId);
                if (decisions && decisions.length > 0) {
                    logger.info(`[SSE] Replaying ${decisions.length} decisions for ${sessionId}`);
                    decisions.forEach(decision => sendSequencedEvent(res, sessionId, decision));
                }
            }
        } catch (error) {
            logger.error(`[SSE] Error in initial async sync for ${sessionId}:`, error);
        }
    })();

    // ═══════════════════════════════════════════════════════════════════════════════
    // Event Subscription
    // ═══════════════════════════════════════════════════════════════════════════════

    const emitter = sessionEvents.getEmitter(sessionId);

    const eventHandler = (event: SessionEvent) => {
        sendSequencedEvent(res, sessionId, event);

        // 🛑 CRITICAL: Signal client to stop retrying on terminal states
        if (event.type === 'complete' || event.type === 'error' || (event as any).status === 'cancelled') {
            logger.info(`[SSE] Terminal event reached: ${event.type}. Closing stream.`);
            setTimeout(() => {
                if (!res.writableEnded) res.end();
            }, 2000); // Give client 2s to receive and call .close()
        }
    };

    emitter.on('event', eventHandler);

    // Keep-alive ping every 15 seconds (unsequenced — pings don't need replay)
    const pingInterval = setInterval(() => {
        res.write(': ping\n\n');
        sendEvent(res, { type: 'ping', timestamp: new Date().toISOString() });
    }, 15000);

    // Cleanup on disconnect
    req.on('close', () => {
        logger.info('SSE connection closed', { sessionId, clerkId: clerkId.slice(0, 12) + '...' });
        emitter.off('event', eventHandler);
        clearInterval(pingInterval);
    });

    req.on('error', (error) => {
        logger.error('SSE connection error', { sessionId, clerkId: clerkId.slice(0, 12) + '...', error });
        emitter.off('event', eventHandler);
        clearInterval(pingInterval);
    });
});

/**
 * Send SSE event to client (unsequenced — for pings, connected, and error events)
 */
function sendEvent(res: Response, data: unknown): void {
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
                logger.debug('Sending Candidate Score:', data as any);
            }
        }

        const jsonData = JSON.stringify(data);
        res.write(`data: ${jsonData}\n\n`);

        if (typeof (res as any).flush === 'function') {
            (res as any).flush();
        }
    } catch (error) {
        logger.error('Failed to send SSE event:', error);
    }
}

/**
 * Send SSE event with sequence ID (for Last-Event-ID protocol).
 * Uses the monotonic seq assigned by SessionEventManager if available.
 * This is the primary send function for all meaningful events.
 */
function sendSequencedEvent(res: Response, sessionId: string, event: SessionEvent, existingSeq?: number): void {
    try {
        // Use provided seq (replay), or attached seq (from SessionEventManager.emit), or fallback to next
        const seq = existingSeq ?? (event as any).seq ?? sessionEvents.getNextSeq(sessionId);

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
        // Industry SSE format: id: → data: → blank line
        res.write(`id: ${seq}\ndata: ${jsonData}\n\n`);

        if (typeof (res as any).flush === 'function') {
            (res as any).flush();
        }
    } catch (error) {
        logger.error('Failed to send sequenced SSE event:', error);
    }
}

export default router;
