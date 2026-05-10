import { Router, Response } from 'express';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { isSessionOwnedByContext, resolveSessionOwnershipContext } from '../lib/session-ownership.js';

import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validation.js';

const ConsentSchema = z.object({
  sessionId: z.string().uuid(),
  consent: z.boolean(),
});

const SessionIdParamSchema = z.object({
  sessionId: z.string().uuid(),
});

const router = Router();

/**
 * POST /api/consent - Record user consent for AI processing
 */
router.post('/', validateBody(ConsentSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const externalId = req.externalId!;
    const { sessionId, consent } = req.body;

    if (!sessionId || consent === undefined) {
      res.status(400).json({ success: false, error: 'Session ID and consent required' });
      return;
    }

    // Verify session belongs to user
    const session = await db
      .select({
        externalId: sessions.externalId,
        userId: sessions.userId,
      })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    const ownershipContext = await resolveSessionOwnershipContext(externalId);
    if (!isSessionOwnedByContext(session[0], ownershipContext)) {
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
router.get('/:sessionId', validateParams(SessionIdParamSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const externalId = req.externalId!;

    // SELF-HEALING USER SYNC
    // Ensures user exists in DB and gets internal UUID
    // ═════════════════════════════════════════════════════════════════════════════
    // Verify ownership
    const session = await db
      .select({
        aiConsentGiven: sessions.aiConsentGiven,
        aiConsentGivenAt: sessions.aiConsentGivenAt,
        externalId: sessions.externalId,
        userId: sessions.userId,
      })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    const ownershipContext = await resolveSessionOwnershipContext(externalId);
    if (!isSessionOwnedByContext(session[0], ownershipContext)) {
      res.status(403).json({ success: false, error: 'Unauthorized' });
      return;
    }

    res.json({
      success: true,
      data: {
        hasConsented: session[0].aiConsentGiven ?? false, // BUG-FIX: null → false for boolean safety
        consentedAt: session[0].aiConsentGivenAt,
      },
    });

  } catch (error) {
    logger.error('Consent check error:', error);
    res.status(500).json({ success: false, error: 'Failed to check consent' });
  }
});

export default router;
