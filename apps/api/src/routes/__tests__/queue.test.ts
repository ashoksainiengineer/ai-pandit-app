/**
 * 🔱 EXHAUSTIVE QUEUE ROUTE TESTS
 * Tests POST /api/queue (submit), GET /api/queue (poll),
 * POST /api/queue/cancel, POST /api/queue/requeue
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('@ai-pandit/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
    },
    executeWithRetry: vi.fn((fn: any) => fn()),
}));

vi.mock('@ai-pandit/db/schema', () => ({
    sessions: { id: 'id', clerkId: 'clerkId', status: 'status', createdAt: 'createdAt', aiConsentGiven: 'aiConsentGiven' },
    users: {},
    calculations: {},
}));

vi.mock('drizzle-orm', () => ({
    eq: vi.fn((...args: any[]) => args),
    and: vi.fn((...args: any[]) => args),
    or: vi.fn((...args: any[]) => args),
    desc: vi.fn((col: any) => col),
    asc: vi.fn((col: any) => col),
    lt: vi.fn((...args: any[]) => args),
    gte: vi.fn((...args: any[]) => args),
}));

vi.mock('../../middleware/auth.js', () => ({
    authMiddleware: (req: any, _res: any, next: any) => {
        req.clerkId = 'test_clerk_id';
        req.sessionId = 'test_session_id';
        next();
    },
    clerk: {},
    AuthenticatedRequest: {},
}));

vi.mock('../../lib/logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/queue-manager.js', () => ({
    addToQueue: vi.fn().mockResolvedValue({ success: true, sessionId: 'test-session', position: 1, estimatedWaitSeconds: 60 }),
    getQueueStatus: vi.fn().mockResolvedValue({ status: 'queued', position: 1, estimatedWaitSeconds: 60, totalInQueue: 1 }),
    startQueueProcessor: vi.fn(),
    cancelSession: vi.fn().mockResolvedValue(true),
    flushSessionTrash: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../lib/time-offset-manager.js', () => ({
    validateOffsetConfig: vi.fn().mockReturnValue({ valid: true }),
}));

vi.mock('../../lib/encryption/index.js', () => ({
    encryptData: vi.fn((data: string) => `encrypted_${data}`),
    safeDecrypt: vi.fn((data: string) => data),
    safeDecryptWithFallback: vi.fn((data: string) => data),
}));

vi.mock('../../lib/user-sync.js', () => ({
    syncUser: vi.fn().mockResolvedValue('internal_user_id_123'),
}));

vi.mock('../../lib/session-events.js', () => ({
    cleanupSession: vi.fn(),
}));

vi.mock('../../lib/session-ownership.js', () => ({
    resolveSessionOwnershipContext: vi.fn(async (clerkId: string) => ({
        clerkId,
        internalUserId: clerkId === 'test_clerk_id' ? 'internal_user_id_123' : null,
    })),
    isSessionOwnedByContext: vi.fn((session: { clerkId?: string | null; userId?: string | null }, context: { clerkId: string; internalUserId: string | null }) => {
        if (session?.clerkId === context.clerkId) return true;
        if (!context.internalUserId) return false;
        return session?.userId === context.internalUserId;
    }),
}));

vi.mock('../../config/index.js', () => ({
    config: {
        security: { rateLimitWindowMs: 60000, rateLimitMaxRequests: 100, calculateRateLimitWindowMs: 60000, calculateRateLimitMaxRequests: 5 },
        queue: { maxConcurrent: 3, pollIntervalMs: 2000, maxSize: 50, staleTimeoutMs: 7200000, baseAnalysisTime: 240, contentionMultiplier: 0.15 },
        memory: { pressureThresholdGB: 12, criticalThresholdGB: 14, gcThresholdGB: 10, heapThresholdGB: 8 },
        app: { nodeEnv: 'test' },
    },
}));

import queueRouter from '../../routes/queue.js';
import { addToQueue, cancelSession } from '../../lib/queue-manager.js';
import { db, executeWithRetry } from '@ai-pandit/db';

// ═══════════════════════════════════════════════════════════════════════════
// APP SETUP
// ═══════════════════════════════════════════════════════════════════════════

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/queue', queueRouter);
    return app;
}

const validSubmitBody = {
    birthData: {
        fullName: 'Test User',
        dateOfBirth: '1990-05-15',
        tentativeTime: '14:30:00',
        birthPlace: 'Delhi',
        latitude: 28.6,
        longitude: 77.2,
        timezone: 5.5,
        gender: 'male',
    },
    lifeEvents: [
        { eventType: 'marriage', category: 'relationship', eventDate: '2015-01-01', datePrecision: 'exact_date', description: 'Got married' },
        { eventType: 'career', category: 'work', eventDate: '2012-06-01', datePrecision: 'exact_date', description: 'First job' },
        { eventType: 'health', category: 'health', eventDate: '2018-03-15', datePrecision: 'exact_date', description: 'Surgery' },
    ],
    forensicTraits: { facial: { foreheadSize: 'broad' } },
    offsetConfig: { preset: '2hours' },
};

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/queue — SUBMIT
// ═══════════════════════════════════════════════════════════════════════════

describe('Queue Route - POST /api/queue (Submit)', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createApp();
    });

    it('should return 400 if birthData is missing', async () => {
        const res = await request(app).post('/api/queue').send({ lifeEvents: [], forensicTraits: {} });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
        expect(Array.isArray(res.body.details)).toBe(true);
    });

    it('should return 400 if lifeEvents < 3', async () => {
        const res = await request(app).post('/api/queue').send({
            birthData: validSubmitBody.birthData,
            lifeEvents: [{ eventType: 'test' }],
            forensicTraits: {},
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 if forensicTraits missing', async () => {
        const res = await request(app).post('/api/queue').send({
            birthData: validSubmitBody.birthData,
            lifeEvents: validSubmitBody.lifeEvents,
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid latitude > 90', async () => {
        const body = {
            ...validSubmitBody,
            birthData: { ...validSubmitBody.birthData, latitude: 91 },
        };
        const res = await request(app).post('/api/queue').send(body);
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid longitude > 180', async () => {
        const body = {
            ...validSubmitBody,
            birthData: { ...validSubmitBody.birthData, longitude: 181 },
        };
        const res = await request(app).post('/api/queue').send(body);
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid dateOfBirth', async () => {
        const body = {
            ...validSubmitBody,
            birthData: { ...validSubmitBody.birthData, dateOfBirth: 'not-a-date' },
        };
        const res = await request(app).post('/api/queue').send(body);
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 for missing required field (fullName)', async () => {
        const body = {
            ...validSubmitBody,
            birthData: { ...validSubmitBody.birthData, fullName: '' },
        };
        const res = await request(app).post('/api/queue').send(body);
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
    });

    it('should return 200 with sessionId on valid submission', async () => {
        vi.mocked(executeWithRetry)
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce([{ clerkId: 'test_clerk_id', userId: 'internal_user_id_123', status: 'pending' }]);

        const res = await request(app).post('/api/queue').send(validSubmitBody);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.sessionId).toBeDefined();
        expect(res.body.data.position).toBe(1);
    });

    it('should return 503 when queue fails to add', async () => {
        vi.mocked(executeWithRetry)
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce([{ clerkId: 'test_clerk_id', userId: 'internal_user_id_123', status: 'pending' }]);
        vi.mocked(addToQueue).mockResolvedValueOnce({ success: false, error: 'Queue is full' });
        const res = await request(app).post('/api/queue').send(validSubmitBody);
        expect(res.status).toBe(503);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/queue — POLL
// ═══════════════════════════════════════════════════════════════════════════

describe('Queue Route - GET /api/queue (Poll)', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createApp();
    });

    it('should return 400 if sessionId missing', async () => {
        const res = await request(app).get('/api/queue');
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('sessionId');
    });

    it('should return 404 if session not found', async () => {
        vi.mocked(executeWithRetry).mockResolvedValueOnce([]);
        const res = await request(app).get('/api/queue?sessionId=nonexistent');
        expect(res.status).toBe(404);
    });

    it('should return 403 if session belongs to another user', async () => {
        vi.mocked(executeWithRetry).mockResolvedValueOnce([{ clerkId: 'other_user', status: 'queued' }]);
        const res = await request(app).get('/api/queue?sessionId=test-session-id');
        expect(res.status).toBe(403);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/queue/cancel
// ═══════════════════════════════════════════════════════════════════════════

describe('Queue Route - POST /api/queue/cancel', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createApp();
    });

    it('should return 400 if sessionId missing', async () => {
        const res = await request(app).post('/api/queue/cancel').send({});
        expect(res.status).toBe(400);
    });

    it('should return 404 if session not found', async () => {
        vi.mocked(executeWithRetry).mockResolvedValueOnce([]);
        const res = await request(app).post('/api/queue/cancel').send({ sessionId: 'nonexistent' });
        expect(res.status).toBe(404);
    });

    it('should return 403 if session belongs to another user', async () => {
        vi.mocked(executeWithRetry).mockResolvedValueOnce([{ clerkId: 'other_user' }]);
        const res = await request(app).post('/api/queue/cancel').send({ sessionId: 'test' });
        expect(res.status).toBe(403);
    });

    it('should return 200 on successful cancel', async () => {
        vi.mocked(executeWithRetry).mockResolvedValueOnce([{ clerkId: 'test_clerk_id' }]);
        vi.mocked(cancelSession).mockResolvedValueOnce(true);
        const res = await request(app).post('/api/queue/cancel').send({ sessionId: 'test' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 400 if session cannot be cancelled', async () => {
        vi.mocked(executeWithRetry).mockResolvedValueOnce([{ clerkId: 'test_clerk_id' }]);
        vi.mocked(cancelSession).mockResolvedValueOnce(false);
        const res = await request(app).post('/api/queue/cancel').send({ sessionId: 'test' });
        expect(res.status).toBe(400);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/queue/requeue
// ═══════════════════════════════════════════════════════════════════════════

describe('Queue Route - POST /api/queue/requeue', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createApp();
    });

    it('should return 400 if sessionId missing', async () => {
        const res = await request(app).post('/api/queue/requeue').send({});
        expect(res.status).toBe(400);
    });

    it('should return 404 if session not found', async () => {
        vi.mocked(executeWithRetry).mockResolvedValueOnce([]);
        const res = await request(app).post('/api/queue/requeue').send({ sessionId: 'nonexistent' });
        expect(res.status).toBe(404);
    });

    it('should return 403 if session belongs to another user', async () => {
        vi.mocked(executeWithRetry).mockResolvedValueOnce([{ clerkId: 'other_user' }]);
        const res = await request(app).post('/api/queue/requeue').send({ sessionId: 'test' });
        expect(res.status).toBe(403);
    });

    it('should allow requeue when legacy row matches internal userId even if clerkId differs', async () => {
        vi.mocked(addToQueue).mockResolvedValueOnce({
            success: true,
            sessionId: 'legacy-session',
            position: 1,
            estimatedWaitSeconds: 60,
        });
        vi.mocked(executeWithRetry)
            .mockResolvedValueOnce([{ clerkId: 'legacy_clerk', userId: 'internal_user_id_123', status: 'failed' }])
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce([{ status: 'pending', errorMessage: null }]);

        const res = await request(app).post('/api/queue/requeue').send({ sessionId: 'legacy-session' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data?.sessionId).toBe('legacy-session');
    });
});
