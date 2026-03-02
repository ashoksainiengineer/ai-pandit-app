import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import sessionRouter from '../sessions.js';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { encryptData, safeDecrypt } from '../../lib/encryption/index.js';

// Mock Auth Middleware specifically BEFORE importing the router
vi.mock('../../middleware/auth.js', () => ({
    authMiddleware: (req: any, res: any, next: any) => {
        req.clerkId = 'test_user_123';
        req.userId = 1;
        next();
    }
}));

import sessionRouter from '../sessions.js';

// Setup Mock Express App
const app = express();
app.use(express.json());
app.use('/api/sessions', sessionRouter);

// Mock DB
vi.mock('@ai-pandit/db', () => ({
    db: {
        query: {
            sessions: {
                findFirst: vi.fn(),
            },
            users: {
                findFirst: vi.fn(),
            }
        },
        insert: vi.fn(() => ({
            values: vi.fn().mockResolvedValue([{ id: 'mocked-id' }])
        })),
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => ({
                    orderBy: vi.fn(() => ({
                        limit: vi.fn().mockResolvedValue([])
                    }))
                }))
            }))
        })),
        delete: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([{ id: 'mocked-id' }])
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn().mockResolvedValue([{ id: 'mocked-id' }])
            }))
        })),
    },
    executeWithRetry: vi.fn(async (cb) => {
        try {
            return await cb();
        } catch (e) {
            throw e;
        }
    })
}));

describe('Session Duplication / Clone API', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully clone a completed session into a fresh draft session', async () => {

        const mockClerkId = 'test_user_123';

        // Mock existing completed session
        const existingSession = {
            id: 'original-session-123',
            clerkId: mockClerkId,
            userId: 1,
            fullName: encryptData('John Doe', mockClerkId),
            dateOfBirth: encryptData('1990-01-01', mockClerkId),
            tentativeTime: encryptData('12:00:00', mockClerkId),
            status: 'completed',
            rectifiedTime: '12:05:00',
            accuracy: 98,
            analysisResult: encryptData(JSON.stringify({ some: 'analysis' }), mockClerkId),
            progressData: encryptData(JSON.stringify({ stage: 6 }), mockClerkId)
        };

        (db.query.sessions.findFirst as any).mockResolvedValueOnce(existingSession);

        // Capture db.insert call to verify clone payload
        let capturedInsertValues: any = null;
        (db.insert as any).mockImplementationOnce(() => ({
            values: vi.fn().mockImplementation((val) => {
                capturedInsertValues = val;
                return Promise.resolve([{ id: 'new-session-id' }]);
            })
        }));

        const response = await request(app)
            .post('/api/sessions/original-session-123/clone')
            .send();

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Session cloned successfully');
        expect(response.body.data.id).toBeDefined();

        // 🛡️ CRITICAL VERIFICATIONS 🛡️

        // 1. Ensure original encrypted input data is copied over exactly
        expect(capturedInsertValues).toBeDefined();
        expect(capturedInsertValues.fullName).toBe(existingSession.fullName);
        expect(capturedInsertValues.dateOfBirth).toBe(existingSession.dateOfBirth);
        expect(capturedInsertValues.tentativeTime).toBe(existingSession.tentativeTime);

        // 2. Ensure the state is reset to DRAFT mode
        expect(capturedInsertValues.status).toBe('draft');

        // 3. Ensure previous results and AI reasoning are completely wiped out
        expect(capturedInsertValues.rectifiedTime).toBeNull();
        expect(capturedInsertValues.accuracy).toBeNull();
        expect(capturedInsertValues.analysisResult).toBeNull();
        expect(capturedInsertValues.progressData).toBeNull();
    });

    it('should return 404 if the original session does not belong to the user', async () => {
        // Mock findFirst returning null (session not found for user)
        (db.query.sessions.findFirst as any).mockResolvedValueOnce(null);

        const response = await request(app)
            .post('/api/sessions/unknown-session-123/clone')
            .send();

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });
});
