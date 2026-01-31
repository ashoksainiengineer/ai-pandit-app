// backend/src/routes/stream.ts
// Server-Sent Events endpoint for real-time BTR progress streaming
// SECURITY: Authenticated and authorized access only

import { Router, Response } from 'express';
import { db } from '../database/drizzle.js';
import { sessions } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { sessionEvents, SessionEvent } from '../lib/session-events.js';
import { getSessionProgress } from '../lib/progress-tracker.js';
import { logger } from '../lib/logger.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/stream/:sessionId
 * Server-Sent Events endpoint for real-time progress updates
 *
 * SECURITY: Requires authentication and session ownership verification
 */
router.get('/:sessionId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;
    const userId = req.userId;

    if (!sessionId) {
        res.status(400).json({ error: 'Session ID required' });
        return;
    }

    if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    logger.info(`[SSE] Connection requested for session ${sessionId} by user ${userId.slice(0, 8)}`);

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECURITY: Verify session ownership
    // ═══════════════════════════════════════════════════════════════════════════════
    let currentStatus = 'pending';
    let isOwner = false;

    try {
        const session = await db.select({
            status: sessions.status,
            userId: sessions.userId,
        })
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

        if (session.length === 0) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        // Verify ownership
        if (session[0].userId !== userId) {
            logger.warn(`[SSE] Unauthorized access attempt: user ${userId.slice(0, 8)} tried to access session ${sessionId}`);
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        isOwner = true;
        currentStatus = session[0].status || 'pending';

        // Handle terminal states
        if (currentStatus === 'cancelled' || currentStatus === 'error') {
            logger.info(`[SSE] Session ${sessionId} is in terminal state: ${currentStatus}`);
            res.status(200).json({
                status: currentStatus,
                message: `Session is in terminal state: ${currentStatus}`,
            });
            return;
        }
    } catch (error) {
        logger.error(`[SSE] Error checking session for ${sessionId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
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

    // CORS for SSE
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Last-Event-ID, Authorization');
    res.flushHeaders();

    logger.info(`[SSE] Headers flushed for ${sessionId}`);

    // Proxy-Buffering Bypass: Send a 2KB preamble
    res.write(':' + ' '.repeat(1024) + '\n');
    res.write(':' + ' '.repeat(1024) + '\n\n');

    if ((res as any).flush) (res as any).flush();
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

            // Send cached AI Context if exists
            const lastContext = sessionEvents.getLastContext(sessionId);
            if (lastContext) {
                sendEvent(res, lastContext);
            }

            // Send cached Thinking Buffer
            let thinkingBuffer = sessionEvents.getThinkingBuffer(sessionId);

            // DB fallback for thinking buffer
            if (!thinkingBuffer && currentProgress?.lastAIThinking) {
                logger.info(`[SSE] Thinking buffer missing in memory, using DB fallback for ${sessionId}`);
                thinkingBuffer = {
                    stage: currentProgress.lastAIThinking.stage,
                    text: currentProgress.lastAIThinking.fullText,
                    candidateTime: currentProgress.lastAIThinking.candidateTime,
                };
            }

            if (thinkingBuffer) {
                sendEvent(res, {
                    type: 'ai_thinking',
                    chunk: thinkingBuffer.text,
                    stage: thinkingBuffer.stage,
                    candidateTime: thinkingBuffer.candidateTime,
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

        // Close connection on complete or error
        if (event.type === 'complete' || event.type === 'error') {
            setTimeout(() => {
                res.end();
            }, 1000);
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
        logger.info('SSE connection closed', { sessionId, userId: userId.slice(0, 8) });
        emitter.off('event', eventHandler);
        clearInterval(pingInterval);
    });

    req.on('error', (error) => {
        logger.error('SSE connection error', { sessionId, userId: userId.slice(0, 8), error });
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
        if ((res as any).flush) {
            (res as any).flush();
        }
    } catch (error) {
        logger.error('Failed to send SSE event:', error);
    }
}

export default router;
