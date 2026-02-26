// backend/src/routes/sessions.ts
// Session CRUD endpoints - replaces Vercel serverless routes

import { Router, Response } from 'express';
import { db, executeWithRetry } from '@ai-pandit/db';
import { sessions, users } from '@ai-pandit/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';
import { encryptData, safeDecrypt, safeDecryptWithFallback, parseSensitiveField } from '../lib/encryption/index.js';
import { syncUser } from '../lib/user-sync.js';

const router = Router();

/**
 * GET /api/sessions - List all user sessions
 */
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const clerkId = req.clerkId!;

        // Get user
        const user = await executeWithRetry(() =>
            db.query.users.findFirst({
                where: eq(users.clerkId, clerkId)
            })
        );

        if (!user) {
            res.json({ success: true, data: [] });
            return;
        }

        // Get sessions
        const userSessions = await executeWithRetry(() =>
            db.select()
                .from(sessions)
                .where(eq(sessions.clerkId, clerkId))
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
            forensicTraits: parseSensitiveField(session.forensicTraits, clerkId, session.userId),
            spouseData: parseSensitiveField(session.spouseData, clerkId, session.userId),
        }));

        res.json({ success: true, data: decryptedSessions });
    } catch (error: any) {
        logger.error('List sessions error', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/sessions/:id - Get single session
 */
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const clerkId = req.clerkId!;
        const sessionId = req.params.id;

        if (!sessionId) {
            res.status(400).json({ success: false, error: 'Session ID required' });
            return;
        }

        const session = await executeWithRetry(() =>
            db.query.sessions.findFirst({
                where: and(eq(sessions.id, sessionId), eq(sessions.clerkId, clerkId))
            })
        );

        if (!session) {
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
            forensicTraits: parseSensitiveField(session.forensicTraits, clerkId, session.userId),
            physicalTraits: parseSensitiveField(session.physicalTraits, clerkId, session.userId),
            spouseData: parseSensitiveField(session.spouseData, clerkId, session.userId),
            analysisResult: parseSensitiveField(session.analysisResult, clerkId, session.userId),
            progressData: parseSensitiveField(session.progressData, clerkId, session.userId),
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
                timezone: Number(session.timezone),
                gender: session.gender
            }
        };

        res.json({ success: true, data: response });
    } catch (error: any) {
        logger.error('Get session error', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/sessions/:id - Update session (draft save)
 */
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const clerkId = req.clerkId!;
        const sessionId = req.params.id;
        const body = req.body;

        if (!sessionId) {
            res.status(400).json({ success: false, error: 'Session ID required' });
            return;
        }

        // Verify ownership
        const existing = await executeWithRetry(() =>
            db.query.sessions.findFirst({
                where: and(eq(sessions.id, sessionId), eq(sessions.clerkId, clerkId))
            })
        );

        if (!existing) {
            res.status(404).json({ success: false, error: 'Session not found' });
            return;
        }

        // Build update object
        const updateData: any = {
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
        if (body.physicalTraits !== undefined) {
            updateData.physicalTraits = encryptData(JSON.stringify(body.physicalTraits), clerkId);
        }
        if (body.forensicTraits !== undefined) {
            updateData.forensicTraits = encryptData(JSON.stringify(body.forensicTraits), clerkId);
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
                .where(and(eq(sessions.id, sessionId), eq(sessions.clerkId, clerkId)))
        );

        res.json({ success: true, message: 'Session updated' });
    } catch (error: any) {
        logger.error('Update session error', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/sessions/:id - Delete session
 */
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const clerkId = req.clerkId!;
        const sessionId = req.params.id;

        if (!sessionId) {
            res.status(400).json({ success: false, error: 'Session ID required' });
            return;
        }

        // Delete with ownership check
        const result = await executeWithRetry(() =>
            db.delete(sessions)
                .where(and(eq(sessions.id, sessionId), eq(sessions.clerkId, clerkId)))
                .returning({ id: sessions.id })
        );

        if (result.length === 0) {
            res.status(404).json({ success: false, error: 'Session not found' });
            return;
        }

        res.json({ success: true, message: 'Session deleted' });
    } catch (error: any) {
        logger.error('Delete session error', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
