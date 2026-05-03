/**
 * Candidate Detail API — Tiered Data Loading
 *
 * Serves heavy candidate data (ephemeris, AI reasoning) on demand
 * instead of including it in the main progress/SSE stream.
 * Uses lazy-loading pattern for performance.
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { ProgressTracker, getSessionProgress } from '../lib/progress-tracker.js';
import { db, executeWithRetry } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const router = Router();

type OwnershipSession = Pick<
    typeof sessions.$inferSelect,
    'id' | 'clerkId' | 'tentativeTime' | 'dateOfBirth' | 'latitude' | 'longitude' | 'timezone'
>;

/**
 * Verify session ownership (reusable helper)
 */
async function verifyOwnership(sessionId: string, clerkId: string): Promise<{ ok: boolean; session?: OwnershipSession }> {
    try {
        const result = await executeWithRetry(() =>
            db.select({
                id: sessions.id,
                clerkId: sessions.clerkId,
                tentativeTime: sessions.tentativeTime,
                dateOfBirth: sessions.dateOfBirth,
                latitude: sessions.latitude,
                longitude: sessions.longitude,
                timezone: sessions.timezone,
            })
                .from(sessions)
                .where(eq(sessions.id, sessionId))
                .limit(1)
        );

        if (result.length === 0) return { ok: false };
        if (result[0].clerkId !== clerkId) return { ok: false };
        return { ok: true, session: result[0] };
    } catch {
        return { ok: false };
    }
}

/**
 * GET /api/candidate/:sessionId/:time/ephemeris
 * 
 * Tier 2: Returns full planetary ephemeris for a candidate time.
 * Called when user expands a leaderboard card.
 */
router.get('/:sessionId/:time/ephemeris', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { sessionId, time } = req.params;
        const clerkId = req.clerkId!;

        const { ok } = await verifyOwnership(sessionId, clerkId);
        if (!ok) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // 1. Try in-memory ProgressTracker first (active session)
        const tracker = ProgressTracker.getInstance(sessionId);
        if (tracker) {
            const score = tracker.getCandidateScoreByTime(time);
            if (score?.fullEph) {
                res.json({ time, fullEph: score.fullEph, source: 'memory' });
                return;
            }
        }

        // 2. Try fetching from DB progress data
        const progress = await getSessionProgress(sessionId);
        if (progress?.candidateScores) {
            const dbScore = progress.candidateScores.find(s => s.time === time);
            if (dbScore?.fullEph) {
                res.json({ time, fullEph: dbScore.fullEph, source: 'database' });
                return;
            }
        }

        // 3. If no cached fullEph, return what we have (minifiedEph)
        const anyScore = tracker?.getCandidateScoreByTime(time) ||
            progress?.candidateScores?.find(s => s.time === time);

        if (anyScore?.minifiedEph) {
            res.json({ time, minifiedEph: anyScore.minifiedEph, fullEph: null, source: 'partial' });
            return;
        }

        res.status(404).json({ error: 'Candidate not found' });
    } catch (error) {
        logger.error('Ephemeris fetch failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/candidate/:sessionId/:time/reasoning?stage=N
 * 
 * Tier 3: Returns AI thinking/reasoning text for a candidate.
 * Called when user clicks "View Reasoning" on a card.
 */
router.get('/:sessionId/:time/reasoning', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { sessionId, time } = req.params;
        const stage = req.query.stage ? parseInt(req.query.stage as string) : undefined;
        const clerkId = req.clerkId!;

        const { ok } = await verifyOwnership(sessionId, clerkId);
        if (!ok) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // 1. Try in-memory ProgressTracker (active or recently completed session)
        const tracker = ProgressTracker.getInstance(sessionId);
        if (tracker) {
            const log = tracker.getCandidateLog(time);
            if (log) {
                res.json({
                    time,
                    stage,
                    reasoning: log,
                    source: 'memory',
                    charCount: log.length,
                });
                return;
            }
        }

        // 2. Try stageHistory from DB progress (completed sessions)
        const progress = await getSessionProgress(sessionId);
        if (progress?.stageHistory && stage !== undefined) {
            const history = progress.stageHistory[stage];
            if (history) {
                // stageHistory is concatenated, try to extract relevant section
                res.json({
                    time,
                    stage,
                    reasoning: history,
                    source: 'database-stage-history',
                    charCount: history.length,
                    note: 'Full stage history (contains all candidates for this stage)',
                });
                return;
            }
        }

        // 3. No reasoning available
        res.json({
            time,
            stage,
            reasoning: null,
            source: 'none',
            message: 'No AI reasoning available for this candidate. Reasoning is only available during or shortly after analysis.',
        });
    } catch (error) {
        logger.error('Reasoning fetch failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
