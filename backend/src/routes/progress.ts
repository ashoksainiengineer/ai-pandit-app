import { Router, Request, Response } from 'express';
import { getSessionProgress } from '../lib/progress-tracker.js';
import { getQueueStatus } from '../lib/queue-manager.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

console.log('✅ Progress Route Loaded');

/**
 * GET /api/queue/progress/:sessionId - Get detailed progress for a session
 */
router.get('/:sessionId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { sessionId } = req.params;
        await handleProgressRequest(sessionId, res);
    } catch (error) {
        console.error('Progress fetch failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/queue/progress/?sessionId=... - Get detailed progress (Query Param Support)
 */
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const sessionId = req.query.sessionId as string;
        await handleProgressRequest(sessionId, res);
    } catch (error) {
        console.error('Progress fetch failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function handleProgressRequest(sessionId: string, res: Response) {
    // console.log(`[DEBUG] Progress route hit for ID: ${sessionId}`);

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
}

export default router;
