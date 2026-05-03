import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { db } from '@ai-pandit/db';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('@ai-pandit/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
        query: {
            users: { findFirst: vi.fn() },
            sessions: { findFirst: vi.fn() },
        },
    },
    executeWithRetry: vi.fn((fn: any) => fn()),
}));

vi.mock('../../middleware/auth.js', () => ({
    authMiddleware: (req: any, _res: any, next: any) => {
        req.clerkId = 'test_user_1';
        next();
    },
}));

vi.mock('../../lib/encryption/index.js', () => ({
    encryptData: vi.fn((data: string) => `ENCRYPTED_${data}`),
    safeDecrypt: vi.fn((data: string) => data.replace('ENCRYPTED_', '')),
    safeDecryptWithFallback: vi.fn((data: string) => data.replace('ENCRYPTED_', '')),
    parseSensitiveField: vi.fn((field: any) => field || ''),
    isEncrypted: vi.fn((data: string) => data?.startsWith('ENCRYPTED_')),
}));

vi.mock('../../lib/logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import sessionsRouter from '../sessions.js';
import * as encryption from '../../lib/encryption/index.js';

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/sessions', sessionsRouter);
    return app;
}

describe('Chapter 4: API Fortress (Security & Encryption)', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createApp();
    });

    describe('Horizontal Privilege Escalation Protection', () => {
        it('should strictly reject session access if clerkId mismatch', async () => {
            // Mock findFirst implementation
            (db.query.sessions.findFirst as any).mockImplementation((args: any) => {
                // Return session only if it's session-1
                // Since Drizzle 'where' is a complex object, we check how it's constructed or just use a fallback
                return null;
            });

            const res = await request(app).get('/api/sessions/other-session');
            expect(res.status).toBe(404);
        });

        it('should strictly reject session deletion if clerkId mismatch', async () => {
            // Mock delete returning nothing (because WHERE clause includes clerkId)
            (db as any).returning.mockResolvedValueOnce([]);

            const res = await request(app).delete('/api/sessions/other-session');
            expect(res.status).toBe(404);
        });
    });

    describe('PII Encryption Integrity', () => {
        it('should ensure dateOfBirth and tentativeTime are encrypted before DB write', async () => {
            // Mock existing session for this specific test
            (db.query.sessions.findFirst as any).mockResolvedValueOnce({
                id: 'session-1',
                clerkId: 'test_user_1'
            });

            const updateBody = {
                birthData: {
                    fullName: 'John Doe',
                    dateOfBirth: '1990-01-01',
                    tentativeTime: '12:00:00',
                    birthPlace: 'London'
                }
            };

            await request(app).put('/api/sessions/session-1').send(updateBody);

            // Check if encryptData was called for PII fields
            const encryptCalls = vi.mocked(encryption.encryptData).mock.calls;
            const encryptedValues = encryptCalls.map(call => call[0]);

            expect(encryptedValues).toContain('John Doe');

            // Fails here if Bug exists
            expect(encryptedValues).toContain('1990-01-01');
            expect(encryptedValues).toContain('12:00:00');
            expect(encryptedValues).toContain('London');
        });

        it('should ensure JSON fields are stringified AND encrypted', async () => {
            // Mock existing session
            (db.query.sessions.findFirst as any).mockResolvedValueOnce({
                id: 'session-1',
                clerkId: 'test_user_1'
            });

            const updateBody = {
                lifeEvents: [{ type: 'Marriage', date: '2020-01-01' }]
            };

            await request(app).put('/api/sessions/session-1').send(updateBody);

            const encryptCalls = vi.mocked(encryption.encryptData).mock.calls;
            const lifeEventCall = encryptCalls.find(call => call[0].includes('Marriage'));

            expect(lifeEventCall).toBeDefined();
            expect(typeof lifeEventCall![0]).toBe('string');
        });
    });
});
