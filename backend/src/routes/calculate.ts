import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { AuthenticatedRequest, authMiddleware, clerk } from '../middleware/auth.js';
import { db, executeWithRetry } from '../database/drizzle.js';
import { sessions, users } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { addToQueue } from '../lib/queue-manager.js';
import { encryptData } from '../lib/encryption/index.js';
import { syncUser } from '../lib/user-sync.js';
import type { BirthData, LifeEvent, TimeOffsetConfig } from '../types/index.js';

const router = Router();

// ═════════════════════════════════════════════════════════════════════════════
// INPUT VALIDATION SCHEMAS (C3 Security - XSS/Injection Prevention)
// ═════════════════════════════════════════════════════════════════════════════

// Sanitize string to prevent XSS
const sanitizeString = (val: string) => {
    return val
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
};

// Life Event validation schema with sanitization
const LifeEventSchema = z.object({
    id: z.string().uuid().optional(),
    eventType: z.string()
        .min(1, "Event type is required")
        .max(100, "Event type must be less than 100 characters")
        .transform(sanitizeString),
    category: z.string(), // String instead of enum to support custom Categories
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD required)"),
    eventTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM required)").optional().nullable(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format").optional().nullable(),
    datePrecision: z.enum(['exact_date_time', 'exact_date', 'month_year', 'month_range', 'year_range', 'date_range']),
    description: z.string()
        .max(2000, "Description must be less than 2000 characters")
        .transform(sanitizeString)
        .optional()
        .nullable(),
    importance: z.enum(['high', 'medium', 'low', 'critical']).default('medium'),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
}).passthrough();

// Birth Data validation schema
const BirthDataSchema = z.object({
    fullName: z.string()
        .min(1, "Full name is required")
        .max(100, "Name must be less than 100 characters")
        .transform(sanitizeString),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD required)"),
    tentativeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, "Invalid time format (HH:MM:SS required)"),
    birthPlace: z.string()
        .min(1, "Birth place is required")
        .max(200, "Birth place must be less than 200 characters")
        .transform(sanitizeString),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    timezone: z.number().min(-12).max(14),
    gender: z.enum(['male', 'female', 'other']).optional(),
});

// Offset Config validation schema
const OffsetConfigSchema = z.object({
    preset: z.enum(['30min', '1hour', '2hours', '4hours', '6hours', '12hours', 'seconds-30', 'seconds-6']),
    customMinutes: z.number().min(1).max(720).optional(),
    description: z.string().default(''),
});

// Main request validation schema
const CalculateRequestSchema = z.object({
    birthData: BirthDataSchema,
    lifeEvents: z.array(LifeEventSchema)
        .min(3, "At least 3 life events are required")
        .max(100, "Maximum 100 life events allowed"),
    physicalTraits: z.record(z.any()).optional().nullable(),
    forensicTraits: z.record(z.any()).optional().nullable(),
    offsetConfig: OffsetConfigSchema,
});

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
            birthPlace: birthData.birthPlace,
            latitude: birthData.latitude,
            longitude: birthData.longitude,
            timezone: birthData.timezone.toString(),
            gender: birthData.gender,
            physicalTraits: encryptedPhysicalTraits,
            forensicTraits: encryptedForensicTraits,
            lifeEvents: encryptedLifeEvents,
            offsetConfig: JSON.stringify(offsetConfig),
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
        logger.error('Calculate endpoint error', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error',
        });
    }
});

export default router;
