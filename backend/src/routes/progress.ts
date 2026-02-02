import { Router, Request, Response } from 'express';
import { getSessionProgress } from '../lib/progress-tracker.js';
import { getQueueStatus } from '../lib/queue-manager.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { db, executeWithRetry } from '../database/drizzle.js';
import { sessions } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { safeDecrypt } from '../lib/crypto.js';
import { logger } from '../lib/logger.js';

const router = Router();

console.log('✅ Progress Route Loaded');

/**
 * GET /api/queue/progress/:sessionId - Get detailed progress for a session
 */
router.get('/:sessionId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { sessionId } = req.params;
        const userId = req.userId!;
        await handleProgressRequest(sessionId, userId, res);
    } catch (error) {
        logger.error('Progress fetch failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/queue/progress/?sessionId=... - Get detailed progress (Query Param Support)
 */
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const sessionId = req.query.sessionId as string;
        const userId = req.userId!;
        await handleProgressRequest(sessionId, userId, res);
    } catch (error) {
        logger.error('Progress fetch failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Handle progress request with ownership verification
 */
async function handleProgressRequest(sessionId: string, userId: string, res: Response) {
    if (!sessionId) {
        res.status(400).json({ error: 'Session ID is required' });
        return;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECURITY: Verify session ownership
    // ═══════════════════════════════════════════════════════════════════════════════
    try {
        const sessionCheck = await executeWithRetry(() =>
            db.select({
                id: sessions.id,
                userId: sessions.userId,
            })
                .from(sessions)
                .where(eq(sessions.id, sessionId))
                .limit(1)
        );

        if (sessionCheck.length === 0) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        if (sessionCheck[0].userId !== userId) {
            logger.warn(`[IDOR] Unauthorized progress access attempt: user ${userId.slice(0, 8)} tried to access session ${sessionId}`);
            res.status(403).json({ error: 'Access denied' });
            return;
        }
    } catch (error) {
        logger.error('Error verifying session ownership:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        // Include session metadata for frontend "Blueprint" display
        metadata: {
            fullName: queueStatus.session?.fullName
                ? safeDecrypt(queueStatus.session.fullName, userId)
                : undefined,
            dateOfBirth: queueStatus.session?.dateOfBirth,
            tentativeTime: queueStatus.session?.tentativeTime,
            birthPlace: queueStatus.session?.birthPlace,
            offsetConfig: queueStatus.session?.offsetConfig
                ? (typeof queueStatus.session.offsetConfig === 'string'
                    ? JSON.parse(queueStatus.session.offsetConfig)
                    : queueStatus.session.offsetConfig)
                : undefined,
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

export default router;
