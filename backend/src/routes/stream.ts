// backend/src/routes/stream.ts
// Server-Sent Events endpoint for real-time BTR progress streaming
// Deployment Trigger: SSE Status Check & Terminal State Handling

import { Router, Request, Response } from 'express';
import { db } from '../database/drizzle.js';
import { sessions } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { sessionEvents, SessionEvent } from '../lib/session-events.js';
import { getSessionProgress } from '../lib/progress-tracker.js';
import { logger } from '../lib/logger.js';

const router = Router();

/**
 * GET /api/stream/:sessionId
 * Server-Sent Events endpoint for real-time progress updates
 */
router.get('/:sessionId', async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    if (!sessionId) {
        res.status(400).json({ error: 'Session ID required' });
        return;
    }

    console.log(`[SSE] >>> Connection requested for ${sessionId}`);

    // 🛡️ SECURITY & STATUS CHECK: Fetch session status first
    let currentStatus = 'pending';
    try {
        const session = await db.select({ status: sessions.status })
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

        if (session.length === 0) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }
        currentStatus = session[0].status || 'pending';

        // Handle terminal states immediately
        if (currentStatus === 'cancelled' || currentStatus === 'error') {
            console.log(`[SSE] Session ${sessionId} is in terminal state: ${currentStatus}. Refusing connection.`);
            res.status(200).json({ status: currentStatus, message: `Session is in terminal state: ${currentStatus}` });
            return;
        }
    } catch (error) {
        console.error(`[SSE] Error checking session status for ${sessionId}:`, error);
    }

    // console.log(`[SSE] Incoming headers: ${JSON.stringify(req.headers)}`);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform, no-store, must-revalidate, private');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Transfer-Encoding', 'chunked'); // Explicitly request chunked encoding

    // 🛡️ Explicit CORS for SSE (Crucial for HF Public Space)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Last-Event-ID, Authorization');
    res.flushHeaders();

    console.log(`[SSE] Headers flushed for ${sessionId}`);

    // 🚀 Proxy-Buffering Bypass: Send a 2KB preamble
    res.write(':' + ' '.repeat(1024) + '\n');
    res.write(':' + ' '.repeat(1024) + '\n\n');

    if ((res as any).flush) (res as any).flush();
    console.log(`[SSE] 🚀 2KB Preamble sent for ${sessionId}`);

    // Send initial connection event
    sendEvent(res, { type: 'connected', sessionId, timestamp: new Date().toISOString() });

    // Send current progress if exists (ASYNC - DON'T AWAIT to prevent blocking)
    (async () => {
        try {
            console.log(`[SSE] Fetching initial progress for ${sessionId}`);
            const currentProgress = await getSessionProgress(sessionId);

            // 🚀 IMMEDIATE FEEDBACK: If this is a fresh connection and no progress yet, send a warmup hint
            if (!currentProgress || currentProgress.currentStep === 0) {
                sendEvent(res, {
                    type: 'ai_thinking',
                    chunk: "[SYSTEM] Initializing God-Tier Rectification Engine... Establishing mathematical grid connection.\n",
                    stage: 1
                });
            }

            if (currentProgress) {
                console.log(`[SSE] Sending initial state for ${sessionId}`);
                sendEvent(res, {
                    type: 'initial_state',
                    progress: currentProgress
                });
            }

            // 🔮 Send cached AI Context if exists
            const lastContext = sessionEvents.getLastContext(sessionId);
            if (lastContext) {
                sendEvent(res, lastContext);
            }

            // 🧠 Send cached Thinking Buffer
            let thinkingBuffer = sessionEvents.getThinkingBuffer(sessionId);

            // 🔄 FALLBACK: If memory buffer is empty (e.g. server restart), check DB-cached progress
            if (!thinkingBuffer && currentProgress?.lastAIThinking) {
                console.log(`[SSE] 🔄 Thinking buffer missing in memory, using DB fallback for ${sessionId}`);
                thinkingBuffer = {
                    stage: currentProgress.lastAIThinking.stage,
                    text: currentProgress.lastAIThinking.fullText,
                    candidateTime: currentProgress.lastAIThinking.candidateTime
                };
            }

            if (thinkingBuffer) {
                sendEvent(res, {
                    type: 'ai_thinking',
                    chunk: thinkingBuffer.text,
                    stage: thinkingBuffer.stage,
                    candidateTime: thinkingBuffer.candidateTime
                });
            }

            // 🧮 Send cached Calculation Logs (Immediate "Matrix" Effect)
            const calcLogs = sessionEvents.getCalculationBuffer(sessionId);
            if (calcLogs && calcLogs.length > 0) {
                console.log(`[SSE] Replaying ${calcLogs.length} calc logs for ${sessionId}`);
                calcLogs.forEach(log => sendEvent(res, log));
            }

            // 📊 Send cached Candidate Scores (Persistence/Sync)
            const scoreHistory = sessionEvents.getCandidateScoreBuffer(sessionId);
            if (scoreHistory && scoreHistory.length > 0) {
                console.log(`[SSE] Replaying ${scoreHistory.length} candidate scores for ${sessionId}`);
                scoreHistory.forEach(score => sendEvent(res, score));
            }
        } catch (error) {
            console.error(`[SSE] Error in initial async sync for ${sessionId}:`, error);
        }
    })();

    // Get emitter for this session
    const emitter = sessionEvents.getEmitter(sessionId);

    // Event handler
    const eventHandler = (event: SessionEvent) => {
        sendEvent(res, event);

        // Close connection on complete or error
        if (event.type === 'complete' || event.type === 'error') {
            setTimeout(() => {
                res.end();
            }, 1000);
        }
    };

    // Subscribe to events
    emitter.on('event', eventHandler);

    // Keep-alive ping every 15 seconds (more frequent for Cloud/Vercel proxies)
    const pingInterval = setInterval(() => {
        // Send a comment ping to keep connection alive without parsing overhead
        res.write(': ping\n\n');
        sendEvent(res, { type: 'ping', timestamp: new Date().toISOString() });
    }, 15000);

    // Cleanup on disconnect
    req.on('close', () => {
        logger.info('SSE connection closed', { sessionId });
        emitter.off('event', eventHandler);
        clearInterval(pingInterval);
    });

    req.on('error', (error) => {
        logger.error('SSE connection error', { sessionId, error });
        emitter.off('event', eventHandler);
        clearInterval(pingInterval);
    });
});

/**
 * Send SSE event
 */
function sendEvent(res: Response, data: any): void {
    try {
        // Debug outgoing AI thinking events
        if (data.type === 'ai_thinking') {
            console.log('🧠 SSE ai_thinking:', data.candidateTime, 'chunk:', data.chunk?.length, 'chars');
        }
        if (data.type === 'candidate_score') console.log('📊 Sending Candidate Score:', data);


        const eventData = JSON.stringify(data);
        res.write(`data: ${eventData}\n\n`);

        // 🚀 Aggressive Flush for Real-time tokens
        if ((res as any).flush) {
            (res as any).flush();
        }
    } catch (error) {
        console.error('Failed to send SSE event:', error);
    }
}

export default router;
