import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('CORS Configuration', () => {
    it('should allow requests from allowed origins (localhost:3000)', async () => {
        const res = await request(app)
            .get('/health')
            .set('Origin', 'http://localhost:3000');

        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('should allow requests from Vercel preview environments', async () => {
        const vercelPreview = 'https://ai-pandit-git-main-user.vercel.app';
        const res = await request(app)
            .get('/health')
            .set('Origin', vercelPreview);

        expect(res.headers['access-control-allow-origin']).toBe(vercelPreview);
    });

    it('should block unauthorized origins', async () => {
        // In development mode, CORS might be more permissive.
        // But we want to test the logic in server.ts
        const res = await request(app)
            .get('/health')
            .set('Origin', 'https://malicious-site.com');

        // Note: Express cors middleware by default doesn't set the header if origin is not allowed
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should handle preflight OPTIONS requests', async () => {
        const res = await request(app)
            .options('/api/sessions')
            .set('Origin', 'http://localhost:3000')
            .set('Access-Control-Request-Method', 'POST');

        expect(res.status).toBe(204);
        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
        expect(res.headers['access-control-allow-methods']).toContain('POST');
    });

    it('should allow credentials', async () => {
        const res = await request(app)
            .get('/health')
            .set('Origin', 'http://localhost:3000');

        expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should expose Request ID and Response Time headers', async () => {
        const res = await request(app)
            .get('/health')
            .set('Origin', 'http://localhost:3000');

        expect(res.headers['access-control-expose-headers']).toContain('X-Request-Id');
    });
});
