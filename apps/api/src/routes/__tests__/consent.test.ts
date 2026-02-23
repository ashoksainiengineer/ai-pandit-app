/**
 * 🔱 EXHAUSTIVE CONSENT ROUTE TESTS
 * Tests consent recording and checking with full ownership verification.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @ai-pandit/db
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();

vi.mock('@ai-pandit/db', () => ({
    db: {
        select: () => ({ from: mockFrom }),
        update: () => ({ set: mockSet }),
    },
    executeWithRetry: vi.fn(),
}));

vi.mock('@ai-pandit/db/schema', () => ({
    sessions: {
        id: 'id',
        clerkId: 'clerkId',
        aiConsentGiven: 'aiConsentGiven',
        aiConsentGivenAt: 'aiConsentGivenAt',
    },
    users: {},
}));

// Mock auth middleware to always pass
vi.mock('../../middleware/auth.js', () => ({
    authMiddleware: (req: any, _res: any, next: any) => {
        req.clerkId = req.headers['x-test-clerk-id'] || 'test_clerk_id';
        next();
    },
    AuthenticatedRequest: {},
}));

// Mock logger
vi.mock('../../lib/logger.js', () => ({
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import express from 'express';
import request from 'supertest';
import consentRoutes from '../../routes/consent.js';

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/consent', consentRoutes);
    return app;
}

describe('Consent Routes - POST /api/consent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: session found and belongs to user
        mockFrom.mockReturnValue({ where: mockWhere });
        mockWhere.mockReturnValue({ limit: mockLimit });
        mockLimit.mockResolvedValue([{ clerkId: 'test_clerk_id' }]);
        mockSet.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    });

    it('should return 400 when sessionId is missing', async () => {
        const app = createApp();
        const res = await request(app)
            .post('/api/consent')
            .send({ consent: true });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Session ID and consent required');
    });

    it('should return 400 when consent is missing', async () => {
        const app = createApp();
        const res = await request(app)
            .post('/api/consent')
            .send({ sessionId: 'sess-123' });

        expect(res.status).toBe(400);
    });

    it('should return 404 when session not found in DB', async () => {
        mockLimit.mockResolvedValue([]); // No session

        const app = createApp();
        const res = await request(app)
            .post('/api/consent')
            .send({ sessionId: 'nonexistent', consent: true });

        expect(res.status).toBe(404);
    });

    it('should return 403 when session belongs to another user', async () => {
        mockLimit.mockResolvedValue([{ clerkId: 'different_user' }]);

        const app = createApp();
        const res = await request(app)
            .post('/api/consent')
            .send({ sessionId: 'sess-123', consent: true });

        expect(res.status).toBe(403);
        expect(res.body.error).toContain('Unauthorized');
    });

    it('should return 200 on valid consent acceptance', async () => {
        const app = createApp();
        const res = await request(app)
            .post('/api/consent')
            .send({ sessionId: 'sess-123', consent: true });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 200 on valid consent rejection (consent=false)', async () => {
        const app = createApp();
        const res = await request(app)
            .post('/api/consent')
            .send({ sessionId: 'sess-123', consent: false });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

describe('Consent Routes - GET /api/consent/:sessionId', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFrom.mockReturnValue({ where: mockWhere });
        mockWhere.mockReturnValue({ limit: mockLimit });
    });

    it('should return consent status for valid owned session', async () => {
        mockLimit.mockResolvedValue([{
            aiConsentGiven: true,
            aiConsentGivenAt: '2024-01-01T12:00:00Z',
            clerkId: 'test_clerk_id',
        }]);

        const app = createApp();
        const res = await request(app).get('/api/consent/sess-123');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.hasConsented).toBe(true);
    });

    it('should return 404 for non-existent session', async () => {
        mockLimit.mockResolvedValue([]);

        const app = createApp();
        const res = await request(app).get('/api/consent/nonexistent');

        expect(res.status).toBe(404);
    });

    it('should return 403 when session belongs to another user', async () => {
        mockLimit.mockResolvedValue([{
            aiConsentGiven: true,
            clerkId: 'other_user',
        }]);

        const app = createApp();
        const res = await request(app).get('/api/consent/sess-123');

        expect(res.status).toBe(403);
    });
});
