"use strict";
// backend/src/routes/stream.ts
// Server-Sent Events endpoint for real-time BTR progress streaming
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const session_events_js_1 = require("../lib/session-events.js");
const progress_tracker_js_1 = require("../lib/progress-tracker.js");
const logger_js_1 = require("../lib/logger.js");
const router = (0, express_1.Router)();
/**
 * GET /api/stream/:sessionId
 * Server-Sent Events endpoint for real-time progress updates
 */
router.get('/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId) {
        res.status(400).json({ error: 'Session ID required' });
        return;
    }
    logger_js_1.logger.info('SSE connection requested', { sessionId });
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
        const currentProgress = await (0, progress_tracker_js_1.getSessionProgress)(sessionId);
        if (currentProgress) {
            sendEvent(res, {
                type: 'initial_state',
                progress: currentProgress
            });
        }
    }
    catch (error) {
        logger_js_1.logger.error('Failed to get initial progress', { sessionId, error });
    }
    // Get emitter for this session
    const emitter = session_events_js_1.sessionEvents.getEmitter(sessionId);
    // Event handler
    const eventHandler = (event) => {
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
        logger_js_1.logger.info('SSE connection closed', { sessionId });
        emitter.off('event', eventHandler);
        clearInterval(pingInterval);
    });
    req.on('error', (error) => {
        logger_js_1.logger.error('SSE connection error', { sessionId, error });
        emitter.off('event', eventHandler);
        clearInterval(pingInterval);
    });
});
/**
 * Send SSE event
 */
function sendEvent(res, data) {
    try {
        const eventData = JSON.stringify(data);
        res.write(`data: ${eventData}\n\n`);
    }
    catch (error) {
        console.error('Failed to send SSE event:', error);
    }
}
exports.default = router;
//# sourceMappingURL=stream.js.map