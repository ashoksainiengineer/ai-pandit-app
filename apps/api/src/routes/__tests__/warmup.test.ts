import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import warmupRouter from '../../routes/warmup.js';

function createApp() {
    const app = express();
    app.use('/api/warmup', warmupRouter);
    return app;
}

describe('Warmup Route - Integration Tests', () => {
    let app: ReturnType<typeof createApp>;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createApp();
    });

    it('should return 500 when AI endpoint is not configured', async () => {
        delete process.env.ANTHROPIC_BASE_URL;

        const res = await request(app).get('/api/warmup');

        expect(res.status).toBe(500);
        expect(res.body.error).toContain('not configured');
    });

    it('should return pulsing status when AI responds', async () => {
        process.env.ANTHROPIC_BASE_URL = 'https://test-ai.example.com';
        mockFetch.mockResolvedValueOnce({
            status: 200,
            ok: true,
        });

        const res = await request(app).get('/api/warmup');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('pulsing');
        expect(res.body.waking).toBe(true);
    });

    it('should handle fetch timeout gracefully', async () => {
        process.env.ANTHROPIC_BASE_URL = 'https://test-ai.example.com';
        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';
        mockFetch.mockRejectedValueOnce(abortError);

        const res = await request(app).get('/api/warmup');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('pulsing');
        expect(res.body.message).toContain('waking');
    });

    it('should handle non-abort errors with 202 status', async () => {
        process.env.ANTHROPIC_BASE_URL = 'https://test-ai.example.com';
        mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

        const res = await request(app).get('/api/warmup');

        expect(res.status).toBe(202);
        expect(res.body.status).toBe('uncertain');
    });
});
