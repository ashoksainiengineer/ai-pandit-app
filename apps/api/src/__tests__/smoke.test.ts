import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ═══════════════════════════════════════════════════════════════════════════
// SMOKE TESTS — Critical path validation for the Express API
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('@ai-pandit/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
    },
    executeWithRetry: vi.fn((fn: any) => fn()),
    checkDatabaseHealth: vi.fn().mockResolvedValue({ healthy: true, latencyMs: 5 }),
}));

vi.mock('@ai-pandit/db/jobs', () => ({
    listActiveJobs: vi.fn().mockResolvedValue([]),
}));

vi.mock('@ai-pandit/db/schema', () => ({
    jobs: {
        status: 'status',
        retryCount: 'retryCount',
    },
}));

vi.mock('drizzle-orm', () => ({
    count: vi.fn(() => ({ kind: 'count' })),
    eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
    sql: Object.assign(
        (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
        { raw: vi.fn((value: string) => value) }
    ),
}));

vi.mock('../config/index.js', () => ({
    config: {
        app: { nodeEnv: 'test' },
        performance: {
            rssThresholdGB: 2,
            heapThresholdGB: 1.5,
            maxConcurrentSessions: 4,
        },
        ai: { model: 'test-model' },
    },
}));

vi.mock('../middleware/auth.js', () => ({
    authMiddleware: vi.fn((req: any, _res: any, next: any) => {
        req.clerkId = 'smoke_test_user';
        next();
    }),
    clerk: {
        users: { getUser: vi.fn().mockResolvedValue({ emailAddresses: [{ emailAddress: 'smoke@test.com' }], firstName: 'Smoke', lastName: 'Test' }) },
    },
}));

vi.mock('../lib/logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../lib/user-sync.js', () => ({
    syncUser: vi.fn().mockResolvedValue('internal-smoke-uuid'),
}));

vi.mock('../lib/crypto-adapter.js', () => ({
    encryptData: vi.fn((data: string) => `ENC_${data}`),
    safeDecrypt: vi.fn((data: string) => data?.replace('ENC_', '') || null),
}));

vi.mock('../errors/index.js', () => ({
    AppError: class extends Error { constructor(m: string) { super(m); } },
    ValidationError: class extends Error { constructor(m: string) { super(m); } },
    CalculationError: class extends Error { constructor(m: string) { super(m); } },
    ErrorCodes: {},
}));

import healthRouter from '../routes/health.js';

function createSmokeApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/health', healthRouter);
    return app;
}

describe('🔺 E2E Smoke Tests — Critical Path', () => {
    let app: ReturnType<typeof createSmokeApp>;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createSmokeApp();
    });

    // ═════ STEP 1: Liveness — No dependencies ═════

    it('Step 1: GET /api/health/live should confirm app is alive', async () => {
        const res = await request(app).get('/api/health/live');
        expect(res.status).toBe(200);
        expect(res.body.alive).toBe(true);
        expect(res.body).toHaveProperty('uptime');
        expect(res.body).toHaveProperty('version');
    });

    // ═════ STEP 2: Full Health Check ═════

    it('Step 2: GET /api/health should return structured health status', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status');
        expect(res.body).toHaveProperty('checks');
        expect(res.body.checks).toHaveProperty('database');
        expect(res.body.checks).toHaveProperty('memory');
    });

    // ═════ STEP 3: Readiness — DB dependency ═════

    it('Step 3: GET /api/health/ready should confirm readiness', async () => {
        const res = await request(app).get('/api/health/ready');
        expect(res.status).toBe(200);
        expect(res.body.ready).toBe(true);
    });

    // ═════ STEP 4: Metrics — System overview ═════

    it('Step 4: GET /api/health/metrics should return system metrics', async () => {
        const res = await request(app).get('/api/health/metrics');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('memory');
        expect(res.body).toHaveProperty('cpu');
        expect(res.body).toHaveProperty('database');
    });
});
