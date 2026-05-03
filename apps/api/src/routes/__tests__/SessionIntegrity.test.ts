import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import { db } from '@ai-pandit/db';

// Mock auth middleware for route testing
vi.mock('../../middleware/auth.js', () => ({
    authMiddleware: (req: any, res: any, next: any) => {
        req.clerkId = 'user_abc';
        req.sessionId = 'clerk_sess_123';
        next();
    },
    clerk: {
        sessions: { getSession: vi.fn() }
    }
}));

vi.mock('../../lib/session-ownership.js', () => ({
    resolveSessionOwnershipContext: vi.fn(async (clerkId: string) => ({
        clerkId,
        internalUserId: 'db-user-id',
    })),
    isSessionOwnedByContext: vi.fn((session: { clerkId?: string | null; userId?: string | null }, context: { clerkId: string; internalUserId: string | null }) => {
        if (session?.clerkId === context.clerkId) return true;
        if (!context.internalUserId) return false;
        return session?.userId === context.internalUserId;
    }),
}));

// Mock DB with captured calls
const valuesMock = vi.fn().mockResolvedValue([{ id: 'new-session-uuid' }]);

vi.mock('@ai-pandit/db', () => ({
    db: {
        query: {
            sessions: {
                findFirst: vi.fn(),
            },
        },
        insert: (table: any) => ({
            values: (data: any) => {
                valuesMock(data);
                return valuesMock;
            }
        }),
        update: vi.fn(() => ({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue({ id: 'updated-id' }),
        })),
    },
    executeWithRetry: vi.fn((cb) => cb()),
    sessions: {},
}));

describe('SessionIntegrity: Cloning & Duplication', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should clone session data while preserving encrypted fields as-is', async () => {
        const originalSession = {
            id: 'old-session-id',
            clerkId: 'user_abc',
            userId: 'db-user-id',
            fullName: 'ENCRYPTED_NAME_BLOB',
            dateOfBirth: 'ENCRYPTED_DOB_BLOB',
            status: 'complete',
            analysisResult: 'OLD_RESULT_BLOB',
            createdAt: '2024-01-01T00:00:00Z',
        };

        (db.query.sessions.findFirst as any).mockResolvedValue(originalSession);

        const res = await request(app)
            .post('/api/sessions/old-session-id/clone')
            .send();

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);

        expect(valuesMock).toHaveBeenCalledWith(expect.objectContaining({
            fullName: 'ENCRYPTED_NAME_BLOB',
            dateOfBirth: 'ENCRYPTED_DOB_BLOB',
            status: 'draft',
            analysisResult: null
        }));
    });

    it('should block cloning if the user does not own the original session', async () => {
        // Mock findFirst should return null to simulate "not found for this user"
        vi.mocked(db.query.sessions.findFirst).mockResolvedValue(undefined);

        const res = await request(app)
            .post('/api/sessions/victim-session-id/clone')
            .send();

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Session not found');
    });

    it('should correctly reset progress and error fields on clone', async () => {
        (db.query.sessions.findFirst as any).mockResolvedValue({
            id: 'failed-session',
            clerkId: 'user_abc',
            status: 'failed',
            errorMessage: 'Old error',
            progressData: '{"last": "step"}',
        });

        const res = await request(app)
            .post('/api/sessions/failed-session/clone')
            .send();

        expect(res.status).toBe(201);
        expect(valuesMock).toHaveBeenCalledWith(expect.objectContaining({
            status: 'draft',
            errorMessage: null,
            progressData: null
        }));
    });
});
