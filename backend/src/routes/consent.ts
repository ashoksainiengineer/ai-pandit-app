import { Router, Request, Response } from 'express';
import { db, executeWithRetry } from '../database/drizzle.js';
import { sessions } from '../database/schema.js';
import { eq, and } from 'drizzle-orm';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

const router = Router();

/**
 * POST /api/consent - Record user consent for AI processing
 */
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clerkId = req.clerkId!;
    const { sessionId, consent } = req.body;

    if (!sessionId || consent === undefined) {
      res.status(400).json({ success: false, error: 'Session ID and consent required' });
      return;
    }

    // Verify session belongs to user
    const session = await db
      .select({ clerkId: sessions.clerkId })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    if (session[0].clerkId !== clerkId) {
      res.status(403).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Update consent
    await db
      .update(sessions)
      .set({
        aiConsentGiven: consent,
        aiConsentGivenAt: new Date().toISOString(),
        aiConsentIp: req.ip,
      })
      .where(eq(sessions.id, sessionId));

    res.json({ success: true, message: 'Consent recorded' });

  } catch (error) {
    logger.error('Consent recording error:', error);
    res.status(500).json({ success: false, error: 'Failed to record consent' });
  }
});

/**
 * GET /api/consent/:sessionId - Check consent status
 */
router.get('/:sessionId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const clerkId = req.clerkId!;

    // SELF-HEALING USER SYNC
    // Ensures user exists in DB and gets internal UUID
    // ═════════════════════════════════════════════════════════════════════════════
    const session = await db
      .select({
        aiConsentGiven: sessions.aiConsentGiven,
        aiConsentGivenAt: sessions.aiConsentGivenAt,
        clerkId: sessions.clerkId,
      })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    // Verify ownership
    if (session[0].clerkId !== clerkId) {
      res.status(403).json({ success: false, error: 'Unauthorized' });
      return;
    }

    res.json({
      success: true,
      data: {
        hasConsented: session[0].aiConsentGiven,
        consentedAt: session[0].aiConsentGivenAt,
      },
    });

  } catch (error) {
    logger.error('Consent check error:', error);
    res.status(500).json({ success: false, error: 'Failed to check consent' });
  }
});

export default router;
