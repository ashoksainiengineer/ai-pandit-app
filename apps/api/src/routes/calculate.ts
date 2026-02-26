import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { AuthenticatedRequest, authMiddleware, clerk } from '../middleware/auth.js';
import { db, executeWithRetry } from '@ai-pandit/db';
import { sessions, users } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { addToQueue } from '../lib/queue-manager.js';
import { encryptData } from '../lib/encryption/index.js';
import { syncUser } from '../lib/user-sync.js';
import { CalculateRequestSchema } from '@ai-pandit/shared';

const router = Router();

// ═════════════════════════════════════════════════════════════════════════════
// ROUTE HANDLER
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/calculate - Submit birth time rectification for processing
 * 
 * Flow:
 * 1. Accept and validate the request
 * 2. Create a session record
 * 3. Add to processing queue
 * 4. Return immediately with sessionId for polling
 * 
 * The client should poll /api/queue/progress/:sessionId for results.
 */
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const startTime = Date.now();

    try {
        const clerkId = req.clerkId!;
        const body = req.body;

        // ═════════════════════════════════════════════════════════════════════
        // Step 1: Validate Input
        // ═════════════════════════════════════════════════════════════════════
        const validationResult = CalculateRequestSchema.safeParse(body);

        if (!validationResult.success) {
            const errors = validationResult.error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
            }));

            logger.warn('Validation Failed - Invalid input rejected', {
                clerkId: clerkId?.slice(0, 8),
                errors,
            });

            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors,
            });
            return;
        }

        const { birthData, lifeEvents, physicalTraits, forensicTraits, offsetConfig } = validationResult.data;

        logger.info('Birth time rectification request received', {
            clerkId,
            dateOfBirth: birthData.dateOfBirth,
            eventCount: lifeEvents.length,
            offsetConfig,
        });

        // ═════════════════════════════════════════════════════════════════════
        // Step 1.5: Self-Healing User Sync
        // ═════════════════════════════════════════════════════════════════════
        let internalUserId: string;
        try {
            internalUserId = await syncUser(clerkId);
        } catch (syncError) {
            res.status(500).json({ success: false, error: 'User synchronization failed' });
            return;
        }

        // ═════════════════════════════════════════════════════════════════════
        // Step 2: Create Database Session
        // ═════════════════════════════════════════════════════════════════════
        const sessionId = crypto.randomUUID();
        const now = new Date().toISOString();

        // Encrypt sensitive data using clerkId (consistent with frontend expectations)
        const encryptedFullName = encryptData(birthData.fullName, clerkId);

        // 🔒 CORE DATA ENCRYPTION (God-Tier Security)
        // Encrypting birth details matches queue-manager expectations
        const encryptedDateOfBirth = encryptData(birthData.dateOfBirth, clerkId);
        const encryptedTentativeTime = encryptData(birthData.tentativeTime, clerkId);

        const encryptedLifeEvents = encryptData(JSON.stringify(lifeEvents), clerkId);
        const encryptedPhysicalTraits = physicalTraits
            ? encryptData(JSON.stringify(physicalTraits), clerkId)
            : null;
        const encryptedForensicTraits = forensicTraits
            ? encryptData(JSON.stringify(forensicTraits), clerkId)
            : null;

        await db.insert(sessions).values({
            id: sessionId,
            userId: internalUserId,
            clerkId: clerkId,
            fullName: encryptedFullName,
            dateOfBirth: encryptedDateOfBirth, // 🔒 Encrypted
            tentativeTime: encryptedTentativeTime, // 🔒 Encrypted
            birthPlace: encryptData(birthData.birthPlace, clerkId),
            latitude: birthData.latitude,
            longitude: birthData.longitude,
            timezone: birthData.timezone.toString(),
            gender: birthData.gender,
            physicalTraits: encryptedPhysicalTraits,
            forensicTraits: encryptedForensicTraits,
            lifeEvents: encryptedLifeEvents,
            offsetConfig: encryptData(JSON.stringify(offsetConfig), clerkId),
            status: 'pending',
            createdAt: now,
            updatedAt: now,
        });

        logger.info('Database session created', { sessionId });

        // ═════════════════════════════════════════════════════════════════════
        // Step 3: Add to Processing Queue
        // ═════════════════════════════════════════════════════════════════════
        const queueResult = await addToQueue(sessionId);

        if (!queueResult.success) {
            res.status(503).json({
                success: false,
                error: queueResult.error || 'Failed to queue request',
            });
            return;
        }

        logger.info('Request queued for processing', {
            sessionId,
            position: queueResult.position,
            estimatedWait: queueResult.estimatedWaitSeconds,
        });

        const totalProcessingTime = Date.now() - startTime;

        // ═════════════════════════════════════════════════════════════════════
        // Step 4: Return Immediately with SessionId
        // ═════════════════════════════════════════════════════════════════════
        res.json({
            success: true,
            data: {
                sessionId,
                position: queueResult.position || 0,
                estimatedWaitSeconds: queueResult.estimatedWaitSeconds || 0,
                status: 'queued',
            },
        });

    } catch (error) {
        console.error('DEBUG: Calculate endpoint error caught:', error);
        logger.error('Calculate endpoint error', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error',
            stack: error instanceof Error ? error.stack : undefined,
        });
    }
});

export default router;
