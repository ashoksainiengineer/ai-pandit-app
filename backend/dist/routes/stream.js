"use strict";
// backend/src/routes/stream.ts
// Server-Sent Events endpoint for real-time BTR progress streaming
// Deployment Trigger: SSE Stability Fix Finalized
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
    console.log(`[SSE] >>> Connection requested for ${sessionId}`);
    console.log(`[SSE] Incoming headers: ${JSON.stringify(req.headers)}`);
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform, no-store, must-revalidate');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    // 🛡️ Explicit CORS for SSE (Crucial for HF Public Space)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Last-Event-ID');
    res.flushHeaders();
    console.log(`[SSE] Headers flushed for ${sessionId}`);
    // 🚀 Proxy-Buffering Bypass: Send a HEAVY 8KB preamble
    // Hugging Face/Cloudflare/Vercel can be aggressive with buffering.
    // We send 8KB specifically to clear most edge caches and proxies.
    res.write(':' + ' '.repeat(2048) + '\n');
    res.write(':' + ' '.repeat(2048) + '\n');
    res.write(':' + ' '.repeat(2048) + '\n');
    res.write(':' + ' '.repeat(2048) + '\n\n');
    res.write(': initial god-tier keepalive\n\n');
    if (res.flush)
        res.flush();
    console.log(`[SSE] 🚀 8KB Preamble sent for ${sessionId} to clear proxies`);
    // Send initial connection event
    sendEvent(res, { type: 'connected', sessionId, timestamp: new Date().toISOString() });
    // Send current progress if exists (ASYNC - DON'T AWAIT to prevent blocking)
    (async () => {
        try {
            console.log(`[SSE] Fetching initial progress for ${sessionId}`);
            const currentProgress = await (0, progress_tracker_js_1.getSessionProgress)(sessionId);
            if (currentProgress) {
                console.log(`[SSE] Sending initial state for ${sessionId}`);
                sendEvent(res, {
                    type: 'initial_state',
                    progress: currentProgress
                });
            }
            // 🔮 Send cached AI Context if exists
            const lastContext = session_events_js_1.sessionEvents.getLastContext(sessionId);
            if (lastContext) {
                sendEvent(res, lastContext);
            }
            // 🧠 Send cached Thinking Buffer
            const thinkingBuffer = session_events_js_1.sessionEvents.getThinkingBuffer(sessionId);
            if (thinkingBuffer) {
                sendEvent(res, {
                    type: 'ai_thinking',
                    chunk: thinkingBuffer.text,
                    stage: thinkingBuffer.stage,
                    candidateTime: thinkingBuffer.candidateTime
                });
            }
            // 🧮 Send cached Calculation Logs (Immediate "Matrix" Effect)
            const calcLogs = session_events_js_1.sessionEvents.getCalculationBuffer(sessionId);
            if (calcLogs && calcLogs.length > 0) {
                console.log(`[SSE] Replaying ${calcLogs.length} calc logs for ${sessionId}`);
                calcLogs.forEach(log => sendEvent(res, log));
            }
        }
        catch (error) {
            console.error(`[SSE] Error in initial async sync for ${sessionId}:`, error);
        }
    })();
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
    // Keep-alive ping every 15 seconds (more frequent for Cloud/Vercel proxies)
    const pingInterval = setInterval(() => {
        // Send a comment ping to keep connection alive without parsing overhead
        res.write(': ping\n\n');
        sendEvent(res, { type: 'ping', timestamp: new Date().toISOString() });
    }, 15000);
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
        // Debug outgoing AI thinking events
        if (data.type === 'ai_thinking') {
            console.log('🧠 SSE ai_thinking:', data.candidateTime, 'chunk:', data.chunk?.length, 'chars');
        }
        if (data.type === 'candidate_score')
            console.log('📊 Sending Candidate Score:', data);
        const eventData = JSON.stringify(data);
        res.write(`data: ${eventData}\n\n`);
        // 🚀 Aggressive Flush for Real-time tokens
        if (res.flush) {
            res.flush();
        }
        else if (res.socket) {
            // Internal Node.js socket flush attempt + Nudge
            res.socket._handle?.setNoDelay?.(true);
            res.socket.write(': \n');
        }
    }
    catch (error) {
        console.error('Failed to send SSE event:', error);
    }
}
exports.default = router;
//# sourceMappingURL=stream.js.map