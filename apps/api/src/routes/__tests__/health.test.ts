/**
 * 🔱 EXHAUSTIVE HEALTH ROUTE TESTS
 * Tests the /health, /health/ready, /health/live, /health/metrics endpoints.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @ai-pandit/db
vi.mock('@ai-pandit/db', () => ({
    checkDatabaseHealth: vi.fn(),
    db: {},
    executeWithRetry: vi.fn(),
}));

// Mock config
vi.mock('../../config/index.js', () => ({
    config: {
        performance: {
            rssThresholdGB: 1.5,
            heapThresholdGB: 1.0,
            maxConcurrentSessions: 5,
        },
        app: { nodeEnv: 'test', isTest: true },
        ai: { model: 'test-model' },
        security: {
            clerkSecretKey: 'test_secret_key',
            rateLimitWindowMs: 60000,
            rateLimitMaxRequests: 100,
        },
        queue: {
            maxConcurrent: 3,
            pollIntervalMs: 2000,
            maxSize: 100,
            staleTimeoutMs: 7200000,
            baseAnalysisTime: 240,
            contentionMultiplier: 0.1,
        },
        memory: {
            heapThresholdGB: 1,
            pressureThresholdGB: 0.8,
            criticalThresholdGB: 0.95,
            gcThresholdGB: 1,
        },
    },
}));

// Mock logger
vi.mock('../../lib/logger.js', () => ({
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { checkDatabaseHealth } from '@ai-pandit/db';
import express from 'express';
import request from 'supertest';
import healthRoutes from '../../routes/health.js';

function createApp() {
    const app = express();
    app.use('/health', healthRoutes);
    return app;
}

describe('Health Routes - GET /health (Main Health Check)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 200 with healthy status when DB is up', async () => {
        vi.mocked(checkDatabaseHealth).mockResolvedValue({ healthy: true, latencyMs: 5 });

        const app = createApp();
        const res = await request(app).get('/health');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('healthy');
        expect(res.body.checks.database.status).toBe('up');
        expect(res.body.checks.memory.status).toBe('up');
        expect(res.body.uptime).toBeGreaterThan(0);
        expect(res.body.version).toBeDefined();
        expect(res.body.timestamp).toBeDefined();
    });

    it('should return 503 when DB is down', async () => {
        vi.mocked(checkDatabaseHealth).mockResolvedValue({ healthy: false, error: 'Connection refused', latencyMs: 0 });

        const app = createApp();
        const res = await request(app).get('/health');

        expect(res.status).toBe(503);
        expect(res.body.status).toBe('unhealthy');
        expect(res.body.checks.database.status).toBe('down');
    });

    it('should return 503 when checkDatabaseHealth throws', async () => {
        vi.mocked(checkDatabaseHealth).mockRejectedValue(new Error('Timeout'));

        const app = createApp();
        const res = await request(app).get('/health');

        expect(res.status).toBe(503);
    });
});

describe('Health Routes - GET /health/ready (Readiness)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return ready: true when DB is healthy', async () => {
        vi.mocked(checkDatabaseHealth).mockResolvedValue({ healthy: true, latencyMs: 3 });

        const app = createApp();
        const res = await request(app).get('/health/ready');

        expect(res.status).toBe(200);
        expect(res.body.ready).toBe(true);
        expect(res.body.dbLatencyMs).toBe(3);
    });

    it('should return 503 ready: false when DB is unhealthy', async () => {
        vi.mocked(checkDatabaseHealth).mockResolvedValue({ healthy: false, latencyMs: 0 });

        const app = createApp();
        const res = await request(app).get('/health/ready');

        expect(res.status).toBe(503);
        expect(res.body.ready).toBe(false);
    });

    it('should return 503 when checkDatabaseHealth throws', async () => {
        vi.mocked(checkDatabaseHealth).mockRejectedValue(new Error('Network error'));

        const app = createApp();
        const res = await request(app).get('/health/ready');

        expect(res.status).toBe(503);
        expect(res.body.ready).toBe(false);
    });
});

describe('Health Routes - GET /health/live (Liveness)', () => {
    it('should always return alive: true (liveness probe)', async () => {
        const app = createApp();
        const res = await request(app).get('/health/live');

        expect(res.status).toBe(200);
        expect(res.body.alive).toBe(true);
        expect(res.body.uptime).toBeGreaterThan(0);
        expect(res.body.version).toBe('2.0.0');
        expect(res.body.timestamp).toBeDefined();
    });
});

describe('Health Routes - GET /health/metrics', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return system metrics when DB is healthy', async () => {
        vi.mocked(checkDatabaseHealth).mockResolvedValue({ healthy: true, latencyMs: 2 });

        const app = createApp();
        const res = await request(app).get('/health/metrics');

        expect(res.status).toBe(200);
        expect(res.body.database).toBeDefined();
        expect(res.body.database.healthy).toBe(true);
        expect(res.body.memory).toBeDefined();
        expect(res.body.memory.rssMB).toBeGreaterThan(0);
        expect(res.body.memory.heapUsedMB).toBeGreaterThan(0);
        expect(res.body.cpu).toBeDefined();
        expect(res.body.config).toBeDefined();
        expect(res.body.config.nodeEnv).toBe('test');
    });

    it('should return 503 when metrics collection fails', async () => {
        vi.mocked(checkDatabaseHealth).mockRejectedValue(new Error('Metrics fail'));

        const app = createApp();
        const res = await request(app).get('/health/metrics');

        expect(res.status).toBe(503);
    });
});
