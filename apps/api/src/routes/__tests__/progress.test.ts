/**
 * Progress Route Tests
 * Tests GET /api/queue/progress/:sessionId and GET /api/queue/progress/?sessionId=...
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const { mockDb } = vi.hoisted(() => ({
    mockDb: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn(),
    },
}));

vi.mock('@ai-pandit/db', () => ({
    db: mockDb,
    executeWithRetry: vi.fn((fn: () => unknown) => fn()),
    getLatestJobForSession: vi.fn().mockResolvedValue(null),
}));

vi.mock('@ai-pandit/db/schema', () => ({
    sessions: { id: 'id', externalId: 'externalId', userId: 'userId' },
}));

vi.mock('drizzle-orm', () => ({
    eq: vi.fn((...args: unknown[]) => args),
}));

vi.mock('../../middleware/auth.js', () => ({
    authMiddleware: (req: { externalId?: string }, _res: unknown, next: () => void) => {
        req.externalId = 'test_clerk_id';
        next();
    },
}));

vi.mock('../../lib/logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/progress-tracker.js', () => ({
    getSessionProgress: vi.fn().mockResolvedValue({
        currentStep: 3, totalSteps: 10, percentage: 30, steps: [],
        lastUpdate: new Date().toISOString(), liveMessage: 'Analyzing...',
    }),
}));

vi.mock('../../lib/queue-manager.js', () => ({}));

vi.mock('../../lib/encryption/index.js', () => ({
    getApiEncryption: vi.fn(() => ({
        parseField: vi.fn((field: unknown) => field || ''),
    })),
}));

vi.mock('../../lib/session-ownership.js', () => ({
    resolveSessionOwnershipContext: vi.fn(async (externalId: string) => ({
        externalId, internalUserId: externalId === 'test_clerk_id' ? 'internal_id' : null,
    })),
    isSessionOwnedByContext: vi.fn((session: Record<string, unknown>, context: Record<string, unknown>) => {
        if (session?.externalId === context.externalId) return true;
        return session?.userId === context.internalUserId;
    }),
}));

vi.mock('../../lib/jobs/job-event-stream.js', () => ({}));

vi.mock('@ai-pandit/db/jobs', () => ({
    listJobEventsSince: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../utils/response.js', async () => {
    const actual = await vi.importActual('../../utils/response.js');
    return actual;
});

import progressRouter from '../../routes/progress.js';

function makeSession(overrides: Record<string, unknown> = {}) {
    return {
        id: 'session-1', externalId: 'test_clerk_id', userId: 'internal_id',
        fullName: 'Test User', dateOfBirth: '1990-01-01', tentativeTime: '14:30',
        birthPlace: 'Delhi', latitude: 28.6, longitude: 77.2, timezone: '5.5',
        gender: 'male', status: 'processing', errorMessage: null, analysisResult: null,
        lifeEvents: null, spouseData: null, offsetConfig: '{}',
        rectifiedTime: null, accuracy: null, confidence: null,
        progressData: null, reasoningLogs: null, errorCode: null,
        submittedAt: null, startedProcessingAt: null, completedAt: null,
        deletedAt: null, retentionUntil: null, aiConsentGiven: false,
        aiConsentGivenAt: null, aiConsentIp: null, isEncrypted: false,
        createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-03-09T00:00:00.000Z',
        ...overrides,
    };
}

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/queue/progress', progressRouter);
    return app;
}

describe('Progress Route', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        mockDb.limit.mockResolvedValue([]);
        app = createApp();
    });

    it('returns 400 if sessionId missing from query', async () => {
        const res = await request(app).get('/api/queue/progress/');
        expect(res.status).toBe(400);
    });

    it('returns 404 if session not found', async () => {
        mockDb.limit.mockResolvedValue([]);
        const res = await request(app).get('/api/queue/progress/nonexistent-session');
        expect(res.status).toBe(404);
    });

    it('returns 401 if session belongs to another user', async () => {
        mockDb.limit
            .mockResolvedValueOnce([makeSession({ externalId: 'other_user', userId: 'uid' })]);
        const res = await request(app).get('/api/queue/progress/session-1');
        expect(res.status).toBe(401);
    });

    it('returns progress data for owned session', async () => {
        mockDb.limit.mockResolvedValue([makeSession({ externalId: 'test_clerk_id', userId: 'internal_id' })]);
        const res = await request(app).get('/api/queue/progress/session-1');
        expect(res.status).toBe(200);
        expect(res.body.data.sessionId).toBe('session-1');
        expect(res.body.data.status).toBe('processing');
    });

    it('returns progress via query param', async () => {
        mockDb.limit.mockResolvedValue([makeSession({ externalId: 'test_clerk_id', userId: 'internal_id' })]);
        const res = await request(app).get('/api/queue/progress/?sessionId=session-1');
        expect(res.status).toBe(200);
        expect(res.body.data.sessionId).toBe('session-1');
    });

    it('returns default progress if none exists', async () => {
        mockDb.limit.mockResolvedValue([makeSession({ externalId: 'test_clerk_id', userId: 'internal_id' })]);
        const res = await request(app).get('/api/queue/progress/session-1');
        expect(res.status).toBe(200);
        expect(res.body.data.progress).toBeDefined();
    });

    it('returns terminal result for completed sessions', async () => {
        mockDb.limit.mockResolvedValue([makeSession({
            externalId: 'test_clerk_id', userId: 'internal_id',
            status: 'complete',
            analysisResult: { rectifiedTime: '14:35:22', accuracy: 95, confidence: 'HIGH' } as unknown,
        })]);
        const res = await request(app).get('/api/queue/progress/session-1');
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('complete');
    });

    it('allows progress access for legacy row matched by userId', async () => {
        mockDb.limit.mockResolvedValue([makeSession({ externalId: 'other', userId: 'internal_id' })]);
        const res = await request(app).get('/api/queue/progress/session-1');
        expect(res.status).toBe(200);
    });

    it('returns 404 for non-existent session via query param', async () => {
        mockDb.limit.mockResolvedValue([]);
        const res = await request(app).get('/api/queue/progress/?sessionId=nonexistent');
        expect(res.status).toBe(404);
    });
});
