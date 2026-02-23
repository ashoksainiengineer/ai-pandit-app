/**
 * 🔱 EXHAUSTIVE PROGRESS ROUTE TESTS
 * Tests GET /api/queue/progress/:sessionId and GET /api/queue/progress/?sessionId=...
 * Covers ownership verification, IDOR protection, missing session, queue status
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
    },
    executeWithRetry: vi.fn((fn: any) => fn()),
}));

vi.mock('@ai-pandit/db/schema', () => ({
    sessions: { id: 'id', clerkId: 'clerkId', userId: 'userId' },
}));

vi.mock('drizzle-orm', () => ({
    eq: vi.fn((...args: any[]) => args),
}));

vi.mock('../../middleware/auth.js', () => ({
    authMiddleware: (req: any, _res: any, next: any) => {
        req.clerkId = 'test_clerk_id';
        next();
    },
}));

vi.mock('../../lib/logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/progress-tracker.js', () => ({
    getSessionProgress: vi.fn().mockResolvedValue({
        currentStep: 3,
        totalSteps: 10,
        percentage: 30,
        steps: [],
        lastUpdate: new Date().toISOString(),
        liveMessage: 'Analyzing...',
    }),
}));

vi.mock('../../lib/queue-manager.js', () => ({
    getQueueStatus: vi.fn().mockResolvedValue({
        status: 'processing',
        position: 0,
        estimatedWaitSeconds: 120,
        session: {
            fullName: 'Test User',
            dateOfBirth: '1990-01-01',
            tentativeTime: '14:30',
            birthPlace: 'Delhi',
            offsetConfig: '{}',
            timezone: '5.5',
            userId: 'internal_id',
        },
    }),
}));

vi.mock('../../lib/encryption/index.js', () => ({
    safeDecrypt: vi.fn((d: string) => d),
    safeDecryptWithFallback: vi.fn((d: string) => d),
    parseSensitiveField: vi.fn((field: any) => field || ''),
}));

import progressRouter from '../../routes/progress.js';
import { db, executeWithRetry } from '@ai-pandit/db';
import { getQueueStatus } from '../../lib/queue-manager.js';

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/queue/progress', progressRouter);
    return app;
}

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/queue/progress/:sessionId
// ═══════════════════════════════════════════════════════════════════════════

describe('Progress Route - GET /:sessionId', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createApp();
    });

    it('should return 400 if sessionId is missing (query param route)', async () => {
        const res = await request(app).get('/api/queue/progress/');
        // Route "/" with no query param
        expect(res.status).toBe(400);
    });

    it('should return 404 if session not found in DB', async () => {
        (db.limit as any).mockResolvedValueOnce([]);
        const res = await request(app).get('/api/queue/progress/nonexistent-session');
        expect(res.status).toBe(404);
    });

    it('should return 403 if session belongs to another user (IDOR protection)', async () => {
        (db.limit as any).mockResolvedValueOnce([{ id: 'session-1', clerkId: 'other_user', userId: 'uid' }]);
        const res = await request(app).get('/api/queue/progress/session-1');
        expect(res.status).toBe(403);
    });

    it('should return 404 if queue status not found', async () => {
        (db.limit as any).mockResolvedValueOnce([{ id: 'session-1', clerkId: 'test_clerk_id', userId: 'uid' }]);
        vi.mocked(getQueueStatus).mockResolvedValueOnce(null);
        const res = await request(app).get('/api/queue/progress/session-1');
        expect(res.status).toBe(404);
    });

    it('should return progress data for owned session', async () => {
        (db.limit as any).mockResolvedValueOnce([{ id: 'session-1', clerkId: 'test_clerk_id', userId: 'internal_id' }]);
        const res = await request(app).get('/api/queue/progress/session-1');
        expect(res.status).toBe(200);
        expect(res.body.sessionId).toBe('session-1');
        expect(res.body.status).toBe('processing');
        expect(res.body.progress).toBeDefined();
        expect(res.body.metadata).toBeDefined();
        expect(res.body.metadata.fullName).toBeDefined();
    });

    it('should return default progress if none exists', async () => {
        (db.limit as any).mockResolvedValueOnce([{ id: 'session-2', clerkId: 'test_clerk_id', userId: 'internal_id' }]);
        const { getSessionProgress } = await import('../../lib/progress-tracker.js');
        vi.mocked(getSessionProgress).mockResolvedValueOnce(null);
        const res = await request(app).get('/api/queue/progress/session-2');
        expect(res.status).toBe(200);
        expect(res.body.progress.currentStep).toBe(0);
        expect(res.body.progress.liveMessage).toContain('queue');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/queue/progress/?sessionId=...
// ═══════════════════════════════════════════════════════════════════════════

describe('Progress Route - GET /?sessionId=... (Query Param)', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createApp();
    });

    it('should return 404 if session not found via query param', async () => {
        (db.limit as any).mockResolvedValueOnce([]);
        const res = await request(app).get('/api/queue/progress/?sessionId=nonexistent');
        expect(res.status).toBe(404);
    });

    it('should return progress via query param', async () => {
        (db.limit as any).mockResolvedValueOnce([{ id: 'session-1', clerkId: 'test_clerk_id', userId: 'uid' }]);
        const res = await request(app).get('/api/queue/progress/?sessionId=session-1');
        expect(res.status).toBe(200);
        expect(res.body.sessionId).toBe('session-1');
    });
});
