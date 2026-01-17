"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const progress_tracker_js_1 = require("../lib/progress-tracker.js");
const queue_manager_js_1 = require("../lib/queue-manager.js");
const router = (0, express_1.Router)();
/**
 * GET /api/queue/progress - Get detailed progress for a session
 */
router.get('/', async (req, res) => {
    try {
        const sessionId = req.query.sessionId;
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
    catch (error) {
        console.error('Progress fetch failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=progress.js.map