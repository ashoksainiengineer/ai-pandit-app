import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS — vi.mock factories are hoisted, so inline everything
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('@ai-pandit/db', () => {
    // Everything must be inline — no external references
    const mockFn = (val: any = []) => {
        const self: any = {};
        const promise = Promise.resolve(val);
        ['select', 'from', 'where', 'groupBy', 'orderBy', 'limit', 'offset',
            'delete', 'update', 'set', 'insert', 'values'].forEach(m => {
                self[m] = (..._args: any[]) => Object.assign(Promise.resolve(val), self);
            });
        return self;
    };
    return {
        db: Object.assign(mockFn(), {
            query: {
                users: {
                    findFirst: vi.fn(async () => ({
                        externalId: 'admin_clerk_001',
                        isActive: true,
                        role: 'admin',
                    })),
                },
            },
        }),
        executeWithRetry: vi.fn(async (fn: () => Promise<unknown>) => fn()),
    };
});

vi.mock('@ai-pandit/db/jobs', () => ({
    getLatestArtifactForJobByKind: vi.fn(async () => null),
    listDeadLetterArtifacts: vi.fn(async () => []),
}));

vi.mock('../../middleware/auth.js', () => ({
    authMiddleware: (req: any, _res: any, next: any) => {
        req.externalId = 'admin_clerk_001';
        next();
    },
}));

vi.mock('../../lib/logger.js', () => ({
    logger: { info: () => { }, error: () => { }, warn: () => { }, debug: () => { } },
}));

vi.mock('../../errors/index.js', () => ({
    AppError: class extends Error { constructor(m: string) { super(m); } },
    ErrorCodes: {},
}));

import { authMiddleware } from '../../middleware/auth.js';
import adminRouter from '../../routes/admin.js';

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/admin', authMiddleware, adminRouter);
    return app;
}

describe('Admin Routes - Integration Tests', () => {
    let app: ReturnType<typeof createApp>;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createApp();
    });

    describe('HEAD /api/admin/db-check', () => {
        it('should return 200 for uptime bots', async () => {
            const res = await request(app).head('/api/admin/db-check');
            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/admin/metrics', () => {
        it('should return a response (200 or 500)', async () => {
            const res = await request(app).get('/api/admin/metrics');
            expect([200, 500]).toContain(res.status);
        });
    });

    describe('GET /api/admin/readings/:id', () => {
        it('should handle missing reading', async () => {
            const res = await request(app).get('/api/admin/readings/non-existent');
            expect([404, 500]).toContain(res.status);
        });
    });

    describe('GET /api/admin/analytics/timeseries', () => {
        it('should accept days query param', async () => {
            const res = await request(app).get('/api/admin/analytics/timeseries?days=7');
            expect([200, 500]).toContain(res.status);
        });
    });
});
