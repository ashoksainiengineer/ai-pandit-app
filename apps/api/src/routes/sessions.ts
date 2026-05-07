// backend/src/routes/sessions.ts
// Session CRUD endpoints - replaces Vercel serverless routes

import { Router, Response } from 'express';
import { db, executeWithRetry } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq, desc, or } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { encryptData, parseSensitiveField } from '../lib/encryption/index.js';
import { randomUUID } from 'crypto';
import { isSessionOwnedByContext, resolveSessionOwnershipContext } from '../lib/session-ownership.js';
import { validateBody, SessionUpdateSchema, UuidParamSchema } from '../middleware/validation.js';
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
        const clerkId = req.clerkId!;
        const ownershipContext = await resolveSessionOwnershipContext(clerkId);

        // Get sessions
        const userSessions = await executeWithRetry(() =>
            db.select()
                .from(sessions)
                .where(
                    ownershipContext.internalUserId
                        ? or(
                            eq(sessions.clerkId, ownershipContext.clerkId),
                            eq(sessions.userId, ownershipContext.internalUserId)
                        )
                        : eq(sessions.clerkId, ownershipContext.clerkId)
                )
                .orderBy(desc(sessions.createdAt))
                .limit(50)
        );

        // Decrypt fields
        const decryptedSessions = userSessions.map(session => ({
            ...session,
            fullName: parseSensitiveField(session.fullName, clerkId, session.userId),
            dateOfBirth: parseSensitiveField(session.dateOfBirth, clerkId, session.userId),
            tentativeTime: parseSensitiveField(session.tentativeTime, clerkId, session.userId),
            birthPlace: parseSensitiveField(session.birthPlace, clerkId, session.userId),
            offsetConfig: parseSensitiveField(session.offsetConfig, clerkId, session.userId),
            lifeEvents: parseSensitiveField(session.lifeEvents, clerkId, session.userId, []),
            spouseData: parseSensitiveField(session.spouseData, clerkId, session.userId),
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
        const clerkId = req.clerkId!;
        const ownershipContext = await resolveSessionOwnershipContext(clerkId);
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
            fullName: parseSensitiveField(session.fullName, clerkId, session.userId),
            dateOfBirth: parseSensitiveField(session.dateOfBirth, clerkId, session.userId),
            tentativeTime: parseSensitiveField(session.tentativeTime, clerkId, session.userId),
            birthPlace: parseSensitiveField(session.birthPlace, clerkId, session.userId),
            offsetConfig: parseSensitiveField(session.offsetConfig, clerkId, session.userId),
            lifeEvents: parseSensitiveField(session.lifeEvents, clerkId, session.userId, []),
            spouseData: parseSensitiveField(session.spouseData, clerkId, session.userId),
            analysisResult: parseSensitiveField(session.analysisResult as string, clerkId, session.userId),
            progressData: parseSensitiveField(session.progressData as string, clerkId, session.userId),
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
        const clerkId = req.clerkId!;
        const ownershipContext = await resolveSessionOwnershipContext(clerkId);
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
            if (bd.fullName) updateData.fullName = encryptData(bd.fullName, clerkId);
            if (bd.dateOfBirth) updateData.dateOfBirth = encryptData(bd.dateOfBirth, clerkId);
            if (bd.tentativeTime) updateData.tentativeTime = encryptData(bd.tentativeTime, clerkId);
            if (bd.birthPlace) updateData.birthPlace = encryptData(bd.birthPlace, clerkId);
            if (bd.latitude !== undefined) updateData.latitude = bd.latitude;
            if (bd.longitude !== undefined) updateData.longitude = bd.longitude;
            if (bd.timezone !== undefined) updateData.timezone = String(bd.timezone);
            if (bd.gender) updateData.gender = bd.gender;
        }

        // Encrypt JSON fields
        if (body.lifeEvents !== undefined) {
            updateData.lifeEvents = encryptData(JSON.stringify(body.lifeEvents), clerkId);
        }
        if (body.lifeEvents !== undefined) {
            updateData.lifeEvents = encryptData(JSON.stringify(body.lifeEvents), clerkId);
        }
        if (body.spouseData !== undefined) {
            updateData.spouseData = encryptData(JSON.stringify(body.spouseData), clerkId);
        }
        if (body.spouseData !== undefined) {
            updateData.spouseData = encryptData(JSON.stringify(body.spouseData), clerkId);
        }
        if (body.offsetConfig !== undefined) {
            updateData.offsetConfig = encryptData(JSON.stringify(body.offsetConfig), clerkId);
        }

        // Update
        await executeWithRetry(() =>
            db.update(sessions)
                .set(updateData)
                .where(eq(sessions.id, sessionId))
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
        const clerkId = req.clerkId!;
        const ownershipContext = await resolveSessionOwnershipContext(clerkId);
        const sessionId = req.params.id;

        if (!sessionId) {
            res.status(400).json({ success: false, error: 'Session ID required' });
            return;
        }

        const existing = await executeWithRetry(() =>
            db.query.sessions.findFirst({
                where: eq(sessions.id, sessionId),
                columns: { id: true, clerkId: true, userId: true },
            })
        );

        if (!existing || !isSessionOwnedByContext(existing, ownershipContext)) {
            res.status(404).json({ success: false, error: 'Session not found' });
            return;
        }

        // Delete with ownership check
        const result = await executeWithRetry(() =>
            db.delete(sessions)
                .where(eq(sessions.id, sessionId))
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
        const clerkId = req.clerkId!;
        const ownershipContext = await resolveSessionOwnershipContext(clerkId);
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
            clerkId: clerkId,

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
