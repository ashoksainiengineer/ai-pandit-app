import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// 🔱 MOCK WORKSPACE DEPENDENCIES
// We mock these to avoid build issues with @ai-pandit/db and @ai-pandit/shared
// while still testing the logic of our server and middleware.

vi.mock('@ai-pandit/db', () => ({
    checkDatabaseHealth: vi.fn().mockResolvedValue({ healthy: true, latencyMs: 5 }),
    db: {
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn().mockResolvedValue([{ count: 0 }]),
            })),
        })),
    }
}));

vi.mock('@ai-pandit/db/jobs', () => ({
    listActiveJobs: vi.fn().mockResolvedValue([]),
}));

vi.mock('@clerk/backend', () => ({
    createClerkClient: vi.fn(() => ({
        users: { getUser: vi.fn() }
    }))
}));

// We need to mock the ephemeris initialization as well
vi.mock('../lib/ephemeris.js', () => ({
    initEphemerisProvider: vi.fn().mockResolvedValue(undefined),
    getEphemerisProviderStatus: vi.fn().mockReturnValue({
        configuredProvider: 'skyfield',
        activeMode: 'skyfield',
        ready: true,
        highPrecision: true,
    }),
}));

import app from '../server.js';

describe('Production Readiness Audit', () => {
    it('should return 200 and detailed metrics from /api/health', async () => {
        const res = await request(app).get('/api/health');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('healthy');
        expect(res.body.checks.database).toBeDefined();
        expect(res.body.checks.memory).toBeDefined();
    });

    it('should return realtime metrics including SSE and Queue counts', async () => {
        const res = await request(app).get('/api/health/metrics');

        expect(res.status).toBe(200);
        expect(res.body.realtime).toBeDefined();
        expect(typeof res.body.realtime.activeSseConnections).toBe('number');
        expect(typeof res.body.realtime.activeQueueProcessing).toBe('number');
        expect(res.body.cpu).toBeDefined();
    });

    it('should have strict CORS configuration with maxAge of 24h', async () => {
        const res = await request(app)
            .options('/api/health')
            .set('Origin', 'http://localhost:3000')
            .set('Access-Control-Request-Method', 'GET');

        expect(res.headers['access-control-max-age']).toBe('86400');
        expect(res.headers['access-control-allow-methods']).toContain('PATCH');
    });

    it('should include production security headers (Helmet)', async () => {
        const res = await request(app).get('/api/health');

        expect(res.headers['x-dns-prefetch-control']).toBe('off');
        expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
        expect(res.headers['strict-transport-security']).toBeDefined();
        expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include request-id and performance headers', async () => {
        const res = await request(app).get('/api/health');

        expect(res.headers['x-request-id']).toBeDefined();
    });

    it('should include rate-limit headers for API routes', async () => {
        // We use /api/health as it uses healthRateLimiter
        const res = await request(app).get('/api/health');

        const limitHeader = res.headers['x-ratelimit-limit'] ?? res.headers['ratelimit-limit'];
        const remainingHeader = res.headers['x-ratelimit-remaining'] ?? res.headers['ratelimit-remaining'];

        expect(limitHeader).toBeDefined();
        expect(remainingHeader).toBeDefined();
    });
});
