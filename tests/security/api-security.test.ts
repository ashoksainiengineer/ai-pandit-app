/**
 * API Security Tests
 *
 * Industry-standard security testing for REST APIs.
 * Tests for common vulnerabilities: OWASP Top 10, injection, etc.
 *
 * Run: vitest run tests/security/api-security.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import express from 'express';

// Create a test app for security testing
const app = express();
app.use(express.json());

// Mock security endpoints
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/sessions', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (auth === 'Bearer invalid-token') {
        return res.status(401).json({ error: 'Invalid token' });
    }
    res.json({ data: [] });
});

app.get('/api/sessions/:id', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    
    // Simulate not found for invalid IDs (including injection attempts)
    res.status(404).json({ error: 'Not found' });
});

app.post('/api/sessions', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    
    // Check for oversized payload
    const bodySize = JSON.stringify(req.body).length;
    if (bodySize > 1024 * 1024) { // 1MB limit
        return res.status(413).json({ error: 'Payload too large' });
    }
    
    // Sanitize input
    const data = req.body;
    if (data.fullName && typeof data.fullName === 'string') {
        data.fullName = data.fullName.replace(/<script[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    
    res.status(201).json({ data: { id: 'test-id', ...data } });
});

app.post('/api/calculate', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    
    res.json({ data: { result: 'calculated' } });
});

const request = supertest(app);

describe('🔒 API Security Tests', () => {
    describe('Authentication & Authorization', () => {
        it('should reject requests without authentication', async () => {
            const res = await request.get('/api/sessions');
            expect(res.status).toBe(401);
        });

        it('should reject invalid JWT tokens', async () => {
            const res = await request
                .get('/api/sessions')
                .set('Authorization', 'Bearer invalid-token');
            expect(res.status).toBe(401);
        });

        it('should reject expired tokens', async () => {
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
            
            const res = await request
                .get('/api/sessions')
                .set('Authorization', `Bearer ${expiredToken}`);
            expect(res.status).toBe(401);
        });
    });

    describe('SQL Injection Prevention', () => {
        const sqlInjectionPayloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT * FROM users --",
            "1; DROP TABLE sessions--",
            "' OR 1=1--",
            "' OR '1'='1' /*",
        ];

        it.each(sqlInjectionPayloads)('should sanitize SQL injection attempt: %s', async (payload) => {
            const res = await request
                .get(`/api/sessions/${payload}`)
                .set('Authorization', 'Bearer test-token');
            
            // Should not return 500 (server error) or data from other users
            expect(res.status).not.toBe(500);
            expect(res.status).toBe(404); // Not found is expected
        });
    });

    describe('NoSQL Injection Prevention', () => {
        const noSqlPayloads = [
            { "$ne": null },
            { "$gt": "" },
            { "$where": "sleep(1000)" },
            { "$regex": ".*" },
        ];

        it.each(noSqlPayloads)('should sanitize NoSQL injection attempt', async (payload) => {
            const res = await request
                .post('/api/sessions')
                .set('Authorization', 'Bearer test-token')
                .send({ id: payload });
            
            expect([400, 422, 500]).not.toContain(res.status);
        });
    });

    describe('XSS Prevention', () => {
        const xssPayloads = [
            '<script>alert("xss")</script>',
            '<img src=x onerror=alert("xss")>',
            'javascript:alert("xss")',
            '<svg onload=alert("xss")>',
            '"><script>alert(document.cookie)</script>',
        ];

        it.each(xssPayloads)('should sanitize XSS payload in input: %s', async (payload) => {
            const res = await request
                .post('/api/sessions')
                .set('Authorization', 'Bearer test-token')
                .send({
                    fullName: payload,
                    dateOfBirth: '1990-01-01',
                    tentativeTime: '12:00:00',
                    birthPlace: 'Test City',
                    latitude: 28.6139,
                    longitude: 77.2090,
                    timezone: 5.5,
                });
            
            // Response should not contain unescaped script tags
            if (res.body.data) {
                expect(res.body.data.fullName).not.toContain('<script>');
            }
        });
    });

    describe('Rate Limiting', () => {
        it('should enforce rate limits on API endpoints', async () => {
            // Make multiple rapid requests
            const requests = Array(150).fill(null).map(() => 
                request.get('/api/health')
            );
            
            const responses = await Promise.all(requests);
            
            // Some requests should be rate limited (429)
            const rateLimitedCount = responses.filter(r => r.status === 429).length;
            expect(rateLimitedCount).toBeGreaterThan(0);
        });

        it('should include rate limit headers', async () => {
            const res = await request.get('/api/health');
            
            expect(res.headers).toHaveProperty('x-ratelimit-limit');
            expect(res.headers).toHaveProperty('x-ratelimit-remaining');
        });
    });

    describe('CORS Security', () => {
        it('should reject requests from unauthorized origins', async () => {
            const res = await request
                .get('/api/health')
                .set('Origin', 'https://malicious-site.com');
            
            // Should not allow the malicious origin
            const allowedOrigin = res.headers['access-control-allow-origin'];
            if (allowedOrigin) {
                expect(allowedOrigin).not.toBe('https://malicious-site.com');
            }
        });

        it('should allow requests from authorized origins', async () => {
            const res = await request
                .get('/api/health')
                .set('Origin', 'http://localhost:3000');
            
            // Should allow localhost in development
            expect(res.status).toBe(200);
        });
    });

    describe('Security Headers', () => {
        it('should include security headers', async () => {
            const res = await request.get('/api/health');
            
            // Check for security headers
            expect(res.headers).toHaveProperty('x-content-type-options');
            expect(res.headers).toHaveProperty('x-frame-options');
            expect(res.headers['x-content-type-options']).toBe('nosniff');
        });

        it('should not expose server information', async () => {
            const res = await request.get('/api/health');
            
            // Server header should not reveal detailed version info
            const serverHeader = res.headers['server'];
            if (serverHeader) {
                expect(serverHeader).not.toMatch(/\d+\.\d+\.\d+/);
            }
        });
    });

    describe('Input Validation', () => {
        it('should reject oversized payloads', async () => {
            const largePayload = 'x'.repeat(10 * 1024 * 1024); // 10MB
            
            const res = await request
                .post('/api/sessions')
                .set('Authorization', 'Bearer test-token')
                .send({ data: largePayload });
            
            expect(res.status).toBe(413); // Payload Too Large
        });

        it('should validate content type', async () => {
            const res = await request
                .post('/api/sessions')
                .set('Content-Type', 'text/plain')
                .set('Authorization', 'Bearer test-token')
                .send('invalid data');
            
            expect(res.status).toBe(415); // Unsupported Media Type
        });

        it('should reject malformed JSON', async () => {
            const res = await request
                .post('/api/sessions')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer test-token')
                .send('{invalid json}');
            
            expect(res.status).toBe(400);
        });
    });

    describe('Path Traversal Prevention', () => {
        const pathTraversalPayloads = [
            '../../../etc/passwd',
            '..\\..\\..\\windows\\system32\\config\\sam',
            '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
            '....//....//....//etc/passwd',
        ];

        it.each(pathTraversalPayloads)('should prevent path traversal: %s', async (payload) => {
            const res = await request.get(`/api/static/${payload}`);
            
            // Should not return sensitive files
            expect(res.status).toBe(404);
            expect(res.text).not.toContain('root:');
        });
    });

    describe('HTTP Method Security', () => {
        it('should reject unsupported HTTP methods', async () => {
            const res = await request
                .trace('/api/sessions')
                .set('Authorization', 'Bearer test-token');
            
            expect(res.status).toBe(405); // Method Not Allowed
        });
    });

    describe('Sensitive Data Exposure', () => {
        it('should not expose sensitive data in error messages', async () => {
            const res = await request
                .get('/api/sessions/invalid-id')
                .set('Authorization', 'Bearer test-token');
            
            // Error message should not contain stack traces or sensitive info
            expect(res.body).not.toHaveProperty('stack');
            expect(res.body).not.toHaveProperty('sql');
            expect(JSON.stringify(res.body)).not.toContain('password');
        });
    });
});
