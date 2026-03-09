import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
    mockFindFirst,
    mockWhere,
    mockSet,
    mockUpdate,
    mockDeleteWhere,
    mockDeleteReturning,
    mockDelete,
    mockResolveSessionOwnershipContext,
    mockBuildOwnedSessionWhereClause,
} = vi.hoisted(() => {
    const findFirst = vi.fn();
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn(() => ({ where }));
    const update = vi.fn(() => ({ set }));
    const deleteReturning = vi.fn();
    const deleteWhere = vi.fn(() => ({ returning: deleteReturning }));
    const deleteFn = vi.fn(() => ({ where: deleteWhere }));
    const resolveSessionOwnershipContext = vi.fn();
    const buildOwnedSessionWhereClause = vi.fn(() => ({ owned: true }));
    return {
        mockFindFirst: findFirst,
        mockWhere: where,
        mockSet: set,
        mockUpdate: update,
        mockDeleteWhere: deleteWhere,
        mockDeleteReturning: deleteReturning,
        mockDelete: deleteFn,
        mockResolveSessionOwnershipContext: resolveSessionOwnershipContext,
        mockBuildOwnedSessionWhereClause: buildOwnedSessionWhereClause,
    };
});

vi.mock('@clerk/nextjs/server', () => ({
    auth: vi.fn(async () => ({ userId: 'clerk_test_user' })),
}));

vi.mock('@ai-pandit/db', () => ({
    db: {
        query: {
            sessions: {
                findFirst: mockFindFirst,
            },
        },
        update: mockUpdate,
        delete: mockDelete,
    },
}));

vi.mock('@ai-pandit/db/schema', () => ({
    sessions: {
        id: 'id',
        clerkId: 'clerkId',
        status: 'status',
    },
}));

vi.mock('drizzle-orm', () => ({
    and: vi.fn((...args: unknown[]) => args),
    eq: vi.fn((...args: unknown[]) => args),
}));

vi.mock('@/lib/server/session-ownership', () => ({
    resolveSessionOwnershipContext: mockResolveSessionOwnershipContext,
    buildOwnedSessionWhereClause: mockBuildOwnedSessionWhereClause,
}));

vi.mock('@/lib/crypto', () => ({
    initializeEncryption: vi.fn(),
    encrypt: vi.fn((value: string) => `enc:${value}`),
    isEncrypted: vi.fn(() => false),
    parseSensitiveField: vi.fn((value: unknown) => value),
}));

import { PUT, DELETE } from '@/app/api/sessions/[id]/route';

function makeRequest(body: Record<string, unknown>): Request {
    return {
        json: async () => body,
    } as unknown as Request;
}

describe('PUT /api/sessions/[id] - ownership and lifecycle guards', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockWhere.mockResolvedValue(undefined);
        mockResolveSessionOwnershipContext.mockResolvedValue({
            clerkId: 'clerk_test_user',
            internalUserId: 'internal_user_id',
        });
        mockDeleteReturning.mockResolvedValue([{ id: 'sess_del' }]);
    });

    it('should reject backend-owned fields from frontend payload', async () => {
        const req = makeRequest({
            analysisResult: { forbidden: true },
        });

        const res = await PUT(req as any, { params: Promise.resolve({ id: 'sess_1' }) });
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error).toContain('Protected fields are backend-owned');
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should block updates for processing sessions', async () => {
        mockFindFirst.mockResolvedValueOnce({ id: 'sess_2', status: 'processing' });

        const req = makeRequest({
            birthData: { fullName: 'Test User' },
        });

        const res = await PUT(req as any, { params: Promise.resolve({ id: 'sess_2' }) });
        const json = await res.json();

        expect(res.status).toBe(409);
        expect(json.error).toContain('locked');
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should allow updates for draft session with non-protected fields', async () => {
        mockFindFirst.mockResolvedValueOnce({ id: 'sess_3', status: 'draft' });

        const req = makeRequest({
            birthData: {
                fullName: 'Jane Doe',
                dateOfBirth: '1990-01-01',
                tentativeTime: '10:30',
                birthPlace: 'Delhi',
                latitude: 28.6,
                longitude: 77.2,
                timezone: 5.5,
                gender: 'female',
            },
            lifeEvents: [{ eventType: 'job' }],
        });

        const res = await PUT(req as any, { params: Promise.resolve({ id: 'sess_3' }) });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(mockUpdate).toHaveBeenCalled();
        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
            fullName: 'enc:Jane Doe',
            lifeEvents: 'enc:[{"eventType":"job"}]',
        }));
    });

    it('should return 404 when delete removes zero rows', async () => {
        mockDeleteReturning.mockResolvedValueOnce([]);

        const req = makeRequest({});
        const res = await DELETE(req as any, { params: Promise.resolve({ id: 'sess_missing' }) });
        const json = await res.json();

        expect(res.status).toBe(404);
        expect(json.error).toContain('Session not found');
    });

    it('should return success when delete removes an owned row', async () => {
        const req = makeRequest({});
        const res = await DELETE(req as any, { params: Promise.resolve({ id: 'sess_4' }) });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(mockDelete).toHaveBeenCalled();
        expect(mockDeleteWhere).toHaveBeenCalledWith({ owned: true });
    });
});
