import { Router, Request, Response } from 'express';
import { getSessionProgress } from '../lib/progress-tracker.js';
import { getQueueStatus } from '../lib/queue-manager.js';

const router = Router();

/**
 * GET /api/queue/progress/:sessionId - Get detailed progress for a session
 */
router.get('/:sessionId', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            res.status(400).json({ error: 'Session ID is required' });
            return;
        }

        // Get queue status
        const queueStatus = await getQueueStatus(sessionId);

        if (!queueStatus) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        // Get detailed progress
        const progress = await getSessionProgress(sessionId);

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
    } catch (error) {
        console.error('Progress fetch failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
