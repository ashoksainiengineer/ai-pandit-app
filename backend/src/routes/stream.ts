// backend/src/routes/stream.ts
// Server-Sent Events endpoint for real-time BTR progress streaming
// Deployment Trigger: SSE Stability Fix Finalized

import { Router, Request, Response } from 'express';
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

    logger.info('SSE connection requested', { sessionId });

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    // 🚀 High-speed keep-alive preamble
    res.write(': initial keepalive\n\n');

    // Send initial connection event
    sendEvent(res, { type: 'connected', sessionId, timestamp: new Date().toISOString() });

    // Send current progress if exists
    try {
        const currentProgress = await getSessionProgress(sessionId);
        if (currentProgress) {
            sendEvent(res, {
                type: 'initial_state',
                progress: currentProgress
            });
        }

        // 🔮 Send cached AI Context if exists (Transparency Fix)
        const lastContext = sessionEvents.getLastContext(sessionId);
        if (lastContext) {
            console.log(`🔮 Sending cached AI Context for ${sessionId}`);
            sendEvent(res, lastContext);
        }

        // 🧠 Send cached Thinking Buffer (Refresh Fix)
        const thinkingBuffer = sessionEvents.getThinkingBuffer(sessionId);
        if (thinkingBuffer) {
            console.log(`🧠 Sending cached AI Thinking for ${sessionId} (len=${thinkingBuffer.text.length})`);
            sendEvent(res, {
                type: 'ai_thinking',
                chunk: thinkingBuffer.text, // Send full history as one chunk
                stage: thinkingBuffer.stage,
                candidateTime: thinkingBuffer.candidateTime
            });
        } else {
            console.log(`⚠️ No thinking buffer found for ${sessionId} on connection`);
        }

    } catch (error) {
        logger.error('Failed to get initial progress', { sessionId, error });
    }

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
    } catch (error) {
        console.error('Failed to send SSE event:', error);
    }
}

export default router;
