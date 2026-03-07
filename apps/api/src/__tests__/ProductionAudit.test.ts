import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../server';

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
});
