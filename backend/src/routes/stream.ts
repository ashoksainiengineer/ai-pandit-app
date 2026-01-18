// backend/src/routes/stream.ts
// Server-Sent Events endpoint for real-time BTR progress streaming

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

    // Keep-alive ping every 30 seconds
    const pingInterval = setInterval(() => {
        sendEvent(res, { type: 'ping', timestamp: new Date().toISOString() });
    }, 30000);

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
        const eventData = JSON.stringify(data);
        res.write(`data: ${eventData}\n\n`);
    } catch (error) {
        console.error('Failed to send SSE event:', error);
    }
}

export default router;
