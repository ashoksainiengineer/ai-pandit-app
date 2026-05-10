// backend/src/routes/sessions.ts
// Session CRUD endpoints - replaces Vercel serverless routes

import { Router, Response } from 'express';
import { db, executeWithRetry } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq, desc, or, and } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { getApiEncryption } from '../lib/encryption/index.js';
import { randomUUID } from 'crypto';
import { isSessionOwnedByContext, resolveSessionOwnershipContext } from '../lib/session-ownership.js';
import { validateBody, SessionUpdateSchema } from '../middleware/validation.js';
const crypto = getApiEncryption();

const router = Router();

// BUG-013 fix: Never expose raw error messages to clients
function getErrorMessage(error: unknown): string {
    logger.error('Internal error in sessions route', { error: error instanceof Error ? error.message : String(error) });
    return 'An internal error occurred. Please try again later.';
}

function normalizeTimezoneValue(rawTimezone: string): number | string {
    const numericTimezone = Number(rawTimezone);
    return Number.isFinite(numericTimezone) ? numericTimezone : rawTimezone;
}

/**
 * GET /api/sessions - List all user sessions
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const externalId = req.externalId!;
        const ownershipContext = await resolveSessionOwnershipContext(externalId);

        // Get sessions
        const userSessions = await executeWithRetry(() =>
            db.select()
                .from(sessions)
                .where(
                    ownershipContext.internalUserId
                        ? or(
                            eq(sessions.externalId, ownershipContext.externalId),
                            eq(sessions.userId, ownershipContext.internalUserId)
                        )
                        : eq(sessions.externalId, ownershipContext.externalId)
                )
                .orderBy(desc(sessions.createdAt))
                .limit(50)
        );

        // Decrypt fields
        const decryptedSessions = userSessions.map(session => ({
            ...session,
            fullName: crypto.parseField(session.fullName, session.userId),
            dateOfBirth: crypto.parseField(session.dateOfBirth, session.userId),
            tentativeTime: crypto.parseField(session.tentativeTime, session.userId),
            birthPlace: crypto.parseField(session.birthPlace, session.userId),
            offsetConfig: crypto.parseField(session.offsetConfig, session.userId),
            lifeEvents: crypto.parseField(session.lifeEvents, session.userId, []),
            spouseData: crypto.parseField(session.spouseData, session.userId),
        }));

        res.json({ success: true, data: decryptedSessions });
    } catch (error: unknown) {
        logger.error('List sessions error', error);
        res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
});

/**
 * GET /api/sessions/:id - Get single session
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const externalId = req.externalId!;
        const ownershipContext = await resolveSessionOwnershipContext(externalId);
        const sessionId = req.params.id;

        if (!sessionId) {
            res.status(400).json({ success: false, error: 'Session ID required' });
            return;
        }

        const session = await executeWithRetry(() =>
            db.query.sessions.findFirst({
                where: eq(sessions.id, sessionId)
            })
        );

        if (!session || !isSessionOwnedByContext(session, ownershipContext)) {
            res.status(404).json({ success: false, error: 'Session not found' });
            return;
        }

        // Decrypt fields
        const decryptedSession = {
            ...session,
            fullName: crypto.parseField(session.fullName, session.userId),
            dateOfBirth: crypto.parseField(session.dateOfBirth, session.userId),
            tentativeTime: crypto.parseField(session.tentativeTime, session.userId),
            birthPlace: crypto.parseField(session.birthPlace, session.userId),
            offsetConfig: crypto.parseField(session.offsetConfig, session.userId),
            lifeEvents: crypto.parseField(session.lifeEvents, session.userId, []),
            spouseData: crypto.parseField(session.spouseData, session.userId),
            analysisResult: crypto.parseField(session.analysisResult as string, session.userId),
            progressData: crypto.parseField(session.progressData as string, session.userId),
        };

        // Reconstruct birthData for frontend compatibility
        const response = {
            ...decryptedSession,
            birthData: {
                fullName: decryptedSession.fullName,
                dateOfBirth: decryptedSession.dateOfBirth,
                tentativeTime: decryptedSession.tentativeTime,
                birthPlace: decryptedSession.birthPlace,
                latitude: session.latitude,
                longitude: session.longitude,
                timezone: normalizeTimezoneValue(session.timezone),
                gender: session.gender
            }
        };

        res.json({ success: true, data: response });
    } catch (error: unknown) {
        logger.error('Get session error', error);
        res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
});

/**
 * PUT /api/sessions/:id - Update session (draft save)
 */
router.put('/:id', validateBody(SessionUpdateSchema), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const externalId = req.externalId!;
        const ownershipContext = await resolveSessionOwnershipContext(externalId);
        const sessionId = req.params.id;
        const body = req.body;

        if (!sessionId) {
            res.status(400).json({ success: false, error: 'Session ID required' });
            return;
        }

        // Verify ownership
        const existing = await executeWithRetry(() =>
            db.query.sessions.findFirst({
                where: eq(sessions.id, sessionId)
            })
        );

        if (!existing || !isSessionOwnedByContext(existing, ownershipContext)) {
            res.status(404).json({ success: false, error: 'Session not found' });
            return;
        }

        // Build update object
        const updateData: Record<string, unknown> = {
            updatedAt: new Date().toISOString()
        };

        // Flatten birthData if present
        if (body.birthData) {
            const bd = body.birthData;
            if (bd.fullName) updateData.fullName = crypto.encrypt(bd.fullName, existing.userId);
            if (bd.dateOfBirth) updateData.dateOfBirth = crypto.encrypt(bd.dateOfBirth, existing.userId);
            if (bd.tentativeTime) updateData.tentativeTime = crypto.encrypt(bd.tentativeTime, existing.userId);
            if (bd.birthPlace) updateData.birthPlace = crypto.encrypt(bd.birthPlace, existing.userId);
            if (bd.latitude !== undefined) updateData.latitude = bd.latitude;
            if (bd.longitude !== undefined) updateData.longitude = bd.longitude;
            if (bd.timezone !== undefined) updateData.timezone = String(bd.timezone);
            if (bd.gender) updateData.gender = bd.gender;
        }

        // Encrypt JSON fields
        if (body.lifeEvents !== undefined) {
            updateData.lifeEvents = crypto.encrypt(JSON.stringify(body.lifeEvents), existing.userId);
        }
        if (body.spouseData !== undefined) {
            updateData.spouseData = crypto.encrypt(JSON.stringify(body.spouseData), existing.userId);
        }
        if (body.offsetConfig !== undefined) {
            updateData.offsetConfig = crypto.encrypt(JSON.stringify(body.offsetConfig), existing.userId);
        }

        // Update with ownership check (TOCTOU-safe: externalId in WHERE)
        await executeWithRetry(() =>
            db.update(sessions)
                .set(updateData)
                .where(and(eq(sessions.id, sessionId), eq(sessions.externalId, externalId)))
        );

        res.json({ success: true, message: 'Session updated' });
    } catch (error: unknown) {
        logger.error('Update session error', error);
        res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
});

/**
 * DELETE /api/sessions/:id - Delete session
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const externalId = req.externalId!;
        const ownershipContext = await resolveSessionOwnershipContext(externalId);
        const sessionId = req.params.id;

        if (!sessionId) {
            res.status(400).json({ success: false, error: 'Session ID required' });
            return;
        }

        const existing = await executeWithRetry(() =>
            db.query.sessions.findFirst({
                where: eq(sessions.id, sessionId),
                columns: { id: true, externalId: true, userId: true },
            })
        );

        if (!existing || !isSessionOwnedByContext(existing, ownershipContext)) {
            res.status(404).json({ success: false, error: 'Session not found' });
            return;
        }

        // Delete with ownership check
        const result = await executeWithRetry(() =>
            db.delete(sessions)
                .where(and(eq(sessions.id, sessionId), eq(sessions.externalId, externalId)))
                .returning({ id: sessions.id })
        );

        if (result.length === 0) {
            res.status(404).json({ success: false, error: 'Session not found' });
            return;
        }

        res.json({ success: true, message: 'Session deleted' });
    } catch (error: unknown) {
        logger.error('Delete session error', error);
        res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
});

/**
 * POST /api/sessions/:id/clone - Duplicate an existing session (inputs only)
 */
router.post('/:id/clone', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const externalId = req.externalId!;
        const ownershipContext = await resolveSessionOwnershipContext(externalId);
        const sessionId = req.params.id;

        if (!sessionId) {
            res.status(400).json({ success: false, error: 'Session ID required' });
            return;
        }

        // 1. Fetch original session
        const originalSession = await executeWithRetry(() =>
            db.query.sessions.findFirst({
                where: eq(sessions.id, sessionId)
            })
        );

        if (!originalSession || !isSessionOwnedByContext(originalSession, ownershipContext)) {
            res.status(404).json({ success: false, error: 'Session not found' });
            return;
        }

        // 2. Generate new ID
        const newSessionId = randomUUID();

        // 3. Create clone payload omitting results
        const clonePayload = {
            id: newSessionId,
            userId: ownershipContext.internalUserId ?? originalSession.userId,
            externalId: externalId,

            // Core Date (Encrypted)
            fullName: originalSession.fullName,
            dateOfBirth: originalSession.dateOfBirth,
            tentativeTime: originalSession.tentativeTime,
            birthPlace: originalSession.birthPlace,
            latitude: originalSession.latitude,
            longitude: originalSession.longitude,
            timezone: originalSession.timezone,
            gender: originalSession.gender,

            // Traits (Encrypted)
            lifeEvents: originalSession.lifeEvents,
            spouseData: originalSession.spouseData,

            // Configuration
            offsetConfig: originalSession.offsetConfig,

            // AI Consent & Data Integrity (Preserve from original)
            aiConsentGiven: originalSession.aiConsentGiven,
            aiConsentGivenAt: originalSession.aiConsentGivenAt,
            isEncrypted: originalSession.isEncrypted,

            // Status and Reset fields
            status: 'draft' as const,
            rectifiedTime: null,
            accuracy: null,
            confidence: null,
            analysisResult: null,
            progressData: null,
            reasoningLogs: null,
            errorMessage: null,
            errorCode: null,

            // Audit/Timestamps
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // 4. Insert clone
        await executeWithRetry(() => db.insert(sessions).values(clonePayload));

        res.status(201).json({
            success: true,
            message: 'Session cloned successfully',
            data: { id: newSessionId }
        });
    } catch (error: unknown) {
        logger.error('Clone session error', error);
        res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
});

export default router;
