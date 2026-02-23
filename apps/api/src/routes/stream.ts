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
    const clerkId = req.clerkId;

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
        if (session[0].clerkId !== clerkId) {
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

    // Send initial connection event
    sendEvent(res, { type: 'connected', sessionId, timestamp: new Date().toISOString() });

    // ═══════════════════════════════════════════════════════════════════════════════
    // Send current progress asynchronously
    // ═══════════════════════════════════════════════════════════════════════════════
    (async () => {
        try {
            logger.info(`[SSE] Fetching initial progress for ${sessionId}`);
            const currentProgress = await getSessionProgress(sessionId);

            // Warmup hint for fresh connections
            if (!currentProgress || currentProgress.currentStep === 0) {
                sendEvent(res, {
                    type: 'ai_thinking',
                    chunk: "[SYSTEM] Initializing God-Tier Rectification Engine... Establishing mathematical grid connection.\n",
                    stage: 1,
                });
            }

            if (currentProgress) {
                logger.info(`[SSE] Sending initial state for ${sessionId}`);
                sendEvent(res, {
                    type: 'initial_state',
                    progress: currentProgress,
                });
            }

            const queueStatus = await getQueueStatus(sessionId);
            if (queueStatus) {
                logger.info(`[SSE] Sending initial metadata for ${sessionId}`);

                // 🔐 Decrypt fields for the frontend using robust helper
                const fullName = parseSensitiveField(queueStatus.session.fullName, clerkId, queueStatus.session.userId);
                const offsetConfig = parseSensitiveField(queueStatus.session.offsetConfig, clerkId, queueStatus.session.userId);

                sendEvent(res, {
                    type: 'metadata',
                    data: {
                        ...queueStatus.session,
                        fullName, // Send decrypted name
                        offsetConfig, // Send decrypted config
                        status: queueStatus.status,
                        aiModel: aiConfig.model, // Send current AI model from config
                    }
                });
            }

            // Send cached AI Context if exists
            const lastContext = sessionEvents.getLastContext(sessionId);
            if (lastContext) {
                sendEvent(res, lastContext);
            }

            // Send cached Thinking Buffers (Multi-Stage Replay)
            const thinkingBuffers = sessionEvents.getThinkingBuffers(sessionId);
            if (thinkingBuffers && thinkingBuffers.length > 0) {
                logger.info(`[SSE] Replaying ${thinkingBuffers.length} thinking streams for ${sessionId}`);
                thinkingBuffers.forEach(buf => {
                    sendEvent(res, {
                        type: 'ai_thinking',
                        chunk: buf.text,
                        stage: buf.stage,
                        candidateTime: buf.candidateTime,
                    });
                });
            }

            // Send cached Calculation Logs
            const calcLogs = sessionEvents.getCalculationBuffer(sessionId);
            if (calcLogs && calcLogs.length > 0) {
                logger.info(`[SSE] Replaying ${calcLogs.length} calc logs for ${sessionId}`);
                calcLogs.forEach(log => sendEvent(res, log));
            }

            // Send cached Candidate Scores
            const scoreHistory = sessionEvents.getCandidateScoreBuffer(sessionId);
            if (scoreHistory && scoreHistory.length > 0) {
                logger.info(`[SSE] Replaying ${scoreHistory.length} candidate scores for ${sessionId}`);
                scoreHistory.forEach(score => sendEvent(res, score));
            }

            // Send cached Decisions
            const decisions = sessionEvents.getDecisionBuffer(sessionId);
            if (decisions && decisions.length > 0) {
                logger.info(`[SSE] Replaying ${decisions.length} decisions for ${sessionId}`);
                decisions.forEach(decision => sendEvent(res, decision));
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
        sendEvent(res, event);

        // 🛑 CRITICAL: Signal client to stop retrying on terminal states
        if (event.type === 'complete' || event.type === 'error' || (event as any).status === 'cancelled') {
            logger.info(`[SSE] Terminal event reached: ${event.type}. Closing stream.`);
            // Send one last explicit close-signal event if needed
            // But usually the typed event is enough for the frontend es.close()
            setTimeout(() => {
                if (!res.writableEnded) res.end();
            }, 2000); // Give client 2s to receive and call .close()
        }
    };

    emitter.on('event', eventHandler);

    // Keep-alive ping every 15 seconds
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
 * Send SSE event to client
 */
function sendEvent(res: Response, data: unknown): void {
    try {
        // Debug logging for specific event types
        if (typeof data === 'object' && data !== null) {
            const eventData = data as { type?: string; candidateTime?: string; chunk?: string };

            if (eventData.type === 'ai_thinking') {
                logger.debug('SSE ai_thinking:', {
                    candidateTime: eventData.candidateTime || '[General]',
                    chunkLength: eventData.chunk?.length,
                });
            }
            if (eventData.type === 'candidate_score') {
                logger.debug('Sending Candidate Score:', data);
            }
        }

        const jsonData = JSON.stringify(data);
        res.write(`data: ${jsonData}\n\n`);

        // Aggressive flush for real-time tokens
        if (typeof (res as any).flush === 'function') {
            (res as any).flush();
        }
    } catch (error) {
        logger.error('Failed to send SSE event:', error);
    }
}

export default router;
