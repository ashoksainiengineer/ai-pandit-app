import { Router, Request, Response } from 'express';
import { db } from '../database/drizzle.js';
import { sessions } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/consent - Record user consent for AI processing
 */
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { sessionId, consent } = req.body;

    if (!sessionId || consent === undefined) {
      res.status(400).json({ success: false, error: 'Session ID and consent required' });
      return;
    }

    // Verify session belongs to user
    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    if (session[0].userId !== userId) {
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
    console.error('Consent recording error:', error);
    res.status(500).json({ success: false, error: 'Failed to record consent' });
  }
});

/**
 * GET /api/consent/:sessionId - Check consent status
 */
router.get('/:sessionId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId!;

    const session = await db
      .select({
        aiConsentGiven: sessions.aiConsentGiven,
        aiConsentGivenAt: sessions.aiConsentGivenAt,
      })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    // Verify ownership
    const fullSession = await db
      .select({ userId: sessions.userId })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (fullSession[0]?.userId !== userId) {
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
    console.error('Consent check error:', error);
    res.status(500).json({ success: false, error: 'Failed to check consent' });
  }
});

export default router;
