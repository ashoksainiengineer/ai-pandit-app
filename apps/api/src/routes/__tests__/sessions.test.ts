/**
 * 🔱 EXHAUSTIVE SESSIONS ROUTE TESTS
 * Tests GET /api/sessions (list), GET /api/sessions/:id (single),
 * PUT /api/sessions/:id (update), DELETE /api/sessions/:id (delete)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('@ai-pandit/db', () => {
    const mockDb: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
        query: {
            users: { findFirst: vi.fn().mockResolvedValue({ id: 'internal_id', clerkId: 'test_clerk_id' }) },
            sessions: { findFirst: vi.fn().mockResolvedValue(null) },
        },
    };
    return {
        db: mockDb,
        executeWithRetry: vi.fn((fn: any) => fn()),
    };
});

vi.mock('@ai-pandit/db/schema', () => ({
    sessions: { id: 'id', clerkId: 'clerkId', status: 'status', createdAt: 'createdAt', userId: 'userId' },
    users: { clerkId: 'clerkId' },
}));

vi.mock('drizzle-orm', () => ({
    eq: vi.fn((...args: any[]) => args),
    and: vi.fn((...args: any[]) => args),
    or: vi.fn((...args: any[]) => args),
    desc: vi.fn((col: any) => col),
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

vi.mock('../../lib/encryption/index.js', () => ({
    encryptData: vi.fn((data: string) => `encrypted_${data}`),
    safeDecrypt: vi.fn((data: string) => data),
    safeDecryptWithFallback: vi.fn((data: string) => data),
    parseSensitiveField: vi.fn((field: any) => field || ''),
}));

vi.mock('../../lib/user-sync.js', () => ({
    syncUser: vi.fn().mockResolvedValue('internal_user_id'),
}));

vi.mock('../../lib/session-ownership.js', () => ({
    resolveSessionOwnershipContext: vi.fn(async (clerkId: string) => ({
        clerkId,
        internalUserId: clerkId === 'test_clerk_id' ? 'internal_id' : null,
    })),
    isSessionOwnedByContext: vi.fn((session: { clerkId?: string | null; userId?: string | null }, context: { clerkId: string; internalUserId: string | null }) => {
        if (session?.clerkId === context.clerkId) return true;
        if (!context.internalUserId) return false;
        return session?.userId === context.internalUserId;
    }),
}));

vi.mock('uuid', () => ({
    v4: vi.fn(() => 'mock-uuid-1234'),
}));

import sessionsRouter from '../../routes/sessions.js';
import { db, executeWithRetry } from '@ai-pandit/db';

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/sessions', sessionsRouter);
    return app;
}

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/sessions — LIST
// ═══════════════════════════════════════════════════════════════════════════

describe('Sessions Route - GET /api/sessions (List)', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createApp();
    });

    it('should return empty array if user has no sessions', async () => {
        // Mock: user exists but no sessions
        (db.query.users.findFirst as any).mockResolvedValueOnce({ id: 'uid', clerkId: 'test_clerk_id' });
        vi.mocked(executeWithRetry).mockImplementation(async (fn: any) => fn());
        const res = await request(app).get('/api/sessions');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return empty array if user not found', async () => {
        (db.limit as any).mockResolvedValueOnce([]);
        const res = await request(app).get('/api/sessions');
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/sessions/:id — SINGLE
// ═══════════════════════════════════════════════════════════════════════════

describe('Sessions Route - GET /api/sessions/:id (Single)', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createApp();
    });

    it('should return 404 if session not found', async () => {
        (db.query.sessions.findFirst as any).mockResolvedValueOnce(null);
        const res = await request(app).get('/api/sessions/nonexistent-id');
        expect(res.status).toBe(404);
    });

    it('should return session data with birthData reconstruction', async () => {
        (db.query.sessions.findFirst as any).mockResolvedValueOnce({
            id: 'session-1',
            clerkId: 'test_clerk_id',
            userId: 'internal_id',
            fullName: 'Test User',
            dateOfBirth: '1990-01-01',
            tentativeTime: '14:30',
            birthPlace: 'Delhi',
            latitude: 28.6,
            longitude: 77.2,
            timezone: '5.5',
            gender: 'male',
            status: 'complete',
            offsetConfig: '{}',
            lifeEvents: '[]',
            forensicTraits: '{}',
            physicalTraits: null,
            spouseData: null,
            analysisResult: null,
            progressData: null,
        });
        const res = await request(app).get('/api/sessions/session-1');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.birthData).toBeDefined();
        expect(res.body.data.birthData.latitude).toBe(28.6);
        expect(res.body.data.birthData.timezone).toBe(5.5); // Number conversion
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/sessions/:id — UPDATE
// ═══════════════════════════════════════════════════════════════════════════

describe('Sessions Route - PUT /api/sessions/:id (Update)', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createApp();
    });

    it('should return 404 if session not found', async () => {
        (db.query.sessions.findFirst as any).mockResolvedValueOnce(null);
        const res = await request(app).put('/api/sessions/nonexistent-id').send({ birthData: { fullName: 'Test' } });
        expect(res.status).toBe(404);
    });

    it('should update session successfully', async () => {
        (db.query.sessions.findFirst as any).mockResolvedValueOnce({ id: 'session-1', clerkId: 'test_clerk_id' });
        const res = await request(app).put('/api/sessions/session-1').send({
            birthData: { fullName: 'Updated Name', latitude: 28.6 },
            lifeEvents: [{ eventType: 'job' }],
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/sessions/:id
// ═══════════════════════════════════════════════════════════════════════════

describe('Sessions Route - DELETE /api/sessions/:id', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createApp();
    });

    it('should return 404 if session not found', async () => {
        (db.query.sessions.findFirst as any).mockResolvedValueOnce(null);
        const res = await request(app).delete('/api/sessions/nonexistent-id');
        expect(res.status).toBe(404);
    });

    it('should delete session successfully', async () => {
        (db.query.sessions.findFirst as any).mockResolvedValueOnce({
            id: 'session-1',
            clerkId: 'test_clerk_id',
            userId: 'internal_id',
        });
        (db.returning as any).mockResolvedValueOnce([{ id: 'session-1' }]);
        const res = await request(app).delete('/api/sessions/session-1');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/sessions/:id/clone - CLONE
// ═══════════════════════════════════════════════════════════════════════════

describe('Sessions Route - POST /api/sessions/:id/clone', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createApp();
    });

    it('should return 404 if original session not found', async () => {
        (db.query.sessions.findFirst as any).mockResolvedValueOnce(null);
        const res = await request(app).post('/api/sessions/nonexistent-id/clone');
        expect(res.status).toBe(404);
    });

    it('should clone session successfully omitting result fields', async () => {
        const mockOriginal = {
            id: 'original-id',
            userId: 'user-id',
            clerkId: 'test_clerk_id',
            fullName: 'encrypted_Ashok',
            dateOfBirth: 'encrypted_1990',
            tentativeTime: 'encrypted_10:00',
            birthPlace: 'encrypted_Delhi',
            latitude: 28.6,
            longitude: 77.2,
            timezone: '5.5',
            gender: 'male',
            status: 'completed',
            rectifiedTime: '10:05:00',
            accuracy: 95,
            confidence: 'HIGH'
        };
        (db.query.sessions.findFirst as any).mockResolvedValueOnce(mockOriginal);

        const res = await request(app).post('/api/sessions/original-id/clone');

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe('mock-uuid-1234');

        // Check if insert was called with status 'draft' and null results
        expect(db.insert).toHaveBeenCalled();
        expect(db.values).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'internal_id',
            status: 'draft',
            rectifiedTime: null,
            accuracy: null,
            confidence: null,
            fullName: 'encrypted_Ashok'
        }));
    });
});
