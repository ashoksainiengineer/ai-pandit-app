"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const progress_tracker_js_1 = require("../lib/progress-tracker.js");
const queue_manager_js_1 = require("../lib/queue-manager.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
console.log('✅ Progress Route Loaded');
/**
 * GET /api/queue/progress/:sessionId - Get detailed progress for a session
 */
router.get('/:sessionId', auth_js_1.authMiddleware, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.userId;
        await handleProgressRequest(sessionId, userId, res);
    }
    catch (error) {
        console.error('Progress fetch failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /api/queue/progress/?sessionId=... - Get detailed progress (Query Param Support)
 */
router.get('/', auth_js_1.authMiddleware, async (req, res) => {
    try {
        const sessionId = req.query.sessionId;
        const userId = req.userId;
        await handleProgressRequest(sessionId, userId, res);
    }
    catch (error) {
        console.error('Progress fetch failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
const crypto_js_1 = require("../lib/crypto.js");
async function handleProgressRequest(sessionId, userId, res) {
    // console.log(`[DEBUG] Progress route hit for ID: ${sessionId}`);
    if (!sessionId) {
        res.status(400).json({ error: 'Session ID is required' });
        return;
    }
    // Get queue status
    const queueStatus = await (0, queue_manager_js_1.getQueueStatus)(sessionId);
    if (!queueStatus) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }
    // Get detailed progress
    const progress = await (0, progress_tracker_js_1.getSessionProgress)(sessionId);
    res.json({
        sessionId,
        status: queueStatus.status,
        position: queueStatus.position,
        estimatedWaitSeconds: queueStatus.estimatedWaitSeconds,
        // Include session metadata for frontend "Blueprint" display
        metadata: {
            fullName: queueStatus.session?.fullName
                ? (0, crypto_js_1.safeDecrypt)(queueStatus.session.fullName, userId)
                : undefined,
            dateOfBirth: queueStatus.session?.dateOfBirth,
            tentativeTime: queueStatus.session?.tentativeTime,
            birthPlace: queueStatus.session?.birthPlace,
            offsetConfig: queueStatus.session?.offsetConfig ? (typeof queueStatus.session.offsetConfig === 'string' ? JSON.parse(queueStatus.session.offsetConfig) : queueStatus.session.offsetConfig) : undefined,
            timezone: queueStatus.session?.timezone,
        },
        progress: progress || {
            currentStep: 0,
            totalSteps: 10,
            percentage: 0,
            steps: [],
            lastUpdate: new Date().toISOString(),
            liveMessage: 'Waiting in queue...',
        },
    });
}
exports.default = router;
//# sourceMappingURL=progress.js.map