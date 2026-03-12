import { Router, Response } from 'express';
import { getSessionProgress } from '../lib/progress-tracker.js';
import { getQueueStatus } from '../lib/queue-manager.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { db, executeWithRetry, getLatestJobForSession } from '@ai-pandit/db';
import { sessions, type Session } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { parseSensitiveField } from '../lib/encryption/index.js';
import { logger } from '../lib/logger.js';
import { isSessionOwnedByContext, resolveSessionOwnershipContext } from '../lib/session-ownership.js';
import { getPersistedSessionEvents } from '../lib/jobs/job-event-stream.js';

const router = Router();
logger.info('Progress route initialized');

/**
 * GET /api/queue/progress/:sessionId - Get detailed progress for a session
 */
router.get('/:sessionId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { sessionId } = req.params;
        const clerkId = req.clerkId!;
        await handleProgressRequest(sessionId, clerkId, res);
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
        const clerkId = req.clerkId!;
        await handleProgressRequest(sessionId, clerkId, res);
    } catch (error) {
        logger.error('Progress fetch failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Handle progress request with ownership verification
 */
async function handleProgressRequest(sessionId: string, clerkId: string, res: Response) {
    if (!sessionId) {
        res.status(400).json({ error: 'Session ID is required' });
        return;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECURITY: Verify session ownership
    // ═══════════════════════════════════════════════════════════════════════════════
    let internalUserId: string | undefined;
    try {
        const ownershipContext = await resolveSessionOwnershipContext(clerkId);
        const sessionCheck = await executeWithRetry(() =>
            db.select({
                id: sessions.id,
                clerkId: sessions.clerkId,
                userId: sessions.userId, // Include userId for safeDecryptWithFallback
            })
                .from(sessions)
                .where(eq(sessions.id, sessionId))
                .limit(1)
        );

        if (sessionCheck.length === 0) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        if (!isSessionOwnedByContext(sessionCheck[0], ownershipContext)) {
            logger.warn(`[IDOR] Unauthorized progress access attempt: clerkId ${clerkId.slice(0, 12)}... tried to access session ${sessionId}`);
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        internalUserId = sessionCheck[0].userId;
    } catch (error) {
        logger.error('Error verifying session ownership:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }

    // Get queue status
    let queueStatus = await getQueueStatus(sessionId);
    if (!queueStatus) {
        logger.warn('Queue status unavailable, falling back to DB session row', { sessionId });
        const fallbackSession = await executeWithRetry(() =>
            db.select()
                .from(sessions)
                .where(eq(sessions.id, sessionId))
                .limit(1)
        );

        if (fallbackSession.length === 0) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        const fallback = fallbackSession[0];
        queueStatus = {
            sessionId,
            status: fallback.status as any,
            position: 0,
            estimatedWaitSeconds: 0,
            totalInQueue: 0,
            createdAt: fallback.createdAt || '',
            session: fallback,
        };
    }

    // Get detailed progress
    const progress = await getSessionProgress(sessionId);
    const sessionSnapshot = queueStatus.session as Partial<Session> | undefined;
    const jobSnapshot = await getLatestJobForSession(sessionId);
    const persistedEvents = await getPersistedSessionEvents(sessionId);
    const terminalResult = extractTerminalResult(
        sessionSnapshot?.analysisResult,
        clerkId,
        internalUserId!
    );
    const isCompleteStatus = ['complete', 'success', 'finished'].includes(queueStatus.status);

    res.json({
        sessionId,
        status: queueStatus.status,
        position: queueStatus.position,
        estimatedWaitSeconds: queueStatus.estimatedWaitSeconds,
        jobId: jobSnapshot?.id,
        jobStatus: jobSnapshot?.status,
        errorMessage: sessionSnapshot?.errorMessage || undefined,
        result: isCompleteStatus ? terminalResult ?? undefined : undefined,
        rectifiedTime: isCompleteStatus && typeof terminalResult?.rectifiedTime === 'string' ? terminalResult.rectifiedTime : undefined,
        accuracy: isCompleteStatus && typeof terminalResult?.accuracy === 'number' ? terminalResult.accuracy : undefined,
        confidence: isCompleteStatus && typeof terminalResult?.confidence === 'string' ? terminalResult.confidence : undefined,
        // Include session metadata for frontend "Blueprint" display
        metadata: {
            fullName: parseSensitiveField(sessionSnapshot?.fullName, clerkId, internalUserId!),
            dateOfBirth: parseSensitiveField(sessionSnapshot?.dateOfBirth, clerkId, internalUserId!),
            tentativeTime: parseSensitiveField(sessionSnapshot?.tentativeTime, clerkId, internalUserId!),
            birthPlace: parseSensitiveField(sessionSnapshot?.birthPlace, clerkId, internalUserId!),
            offsetConfig: parseSensitiveField(sessionSnapshot?.offsetConfig, clerkId, internalUserId!),
            timezone: sessionSnapshot?.timezone,
            status: queueStatus.status,
            errorMessage: sessionSnapshot?.errorMessage || undefined,
            updatedAt: sessionSnapshot?.updatedAt || undefined,
        },
        progress: progress || {
            currentStep: 0,
            totalSteps: 10,
            percentage: 0,
            steps: [],
            lastUpdate: new Date().toISOString(),
            liveMessage: 'Waiting in queue...',
        },
        recentEvents: persistedEvents.slice(-10),
    });
}

function extractTerminalResult(
    rawResult: unknown,
    clerkId: string,
    internalUserId: string
): Record<string, unknown> | null {
    if (!rawResult) return null;
    if (typeof rawResult === 'object') {
        return rawResult as Record<string, unknown>;
    }
    if (typeof rawResult !== 'string') return null;

    const decrypted = parseSensitiveField(rawResult, clerkId, internalUserId);
    if (!decrypted) return null;

    if (typeof decrypted === 'string') {
        try {
            const parsed = JSON.parse(decrypted);
            return typeof parsed === 'object' && parsed !== null
                ? (parsed as Record<string, unknown>)
                : null;
        } catch {
            return null;
        }
    }

    return typeof decrypted === 'object'
        ? (decrypted as Record<string, unknown>)
        : null;
}

export default router;
