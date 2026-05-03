import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
    mockUsersFindFirst,
    mockSelectRows,
    mockDeleteWhere,
} = vi.hoisted(() => ({
    mockUsersFindFirst: vi.fn(),
    mockSelectRows: vi.fn(),
    mockDeleteWhere: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
    auth: vi.fn(async () => ({ userId: 'clerk_batch_user' })),
}));

vi.mock('@/lib/crypto', () => ({
    parseSensitiveField: vi.fn((value: unknown) => value),
}));

vi.mock('@ai-pandit/db', () => ({
    db: {
        query: {
            users: {
                findFirst: mockUsersFindFirst,
            },
        },
        select: vi.fn(() => ({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn(async () => mockSelectRows()),
            then: (resolve: (value: unknown) => void) => resolve(mockSelectRows()),
        })),
        delete: vi.fn(() => ({
            where: mockDeleteWhere,
        })),
    },
}));

vi.mock('@ai-pandit/db/schema', () => ({
    sessions: {
        id: 'id',
        clerkId: 'clerkId',
        userId: 'userId',
        createdAt: 'createdAt',
    },
    users: {
        id: 'id',
        clerkId: 'clerkId',
    },
}));

vi.mock('drizzle-orm', () => ({
    and: vi.fn((...args: unknown[]) => args),
    eq: vi.fn((...args: unknown[]) => args),
    inArray: vi.fn((...args: unknown[]) => args),
    gte: vi.fn((...args: unknown[]) => args),
    lte: vi.fn((...args: unknown[]) => args),
    desc: vi.fn((x: unknown) => x),
}));

vi.mock('@/lib/server/favorite-store', () => ({
    setFavorite: vi.fn((_clerkId: string, _sessionId: string, value: boolean) => value),
    toggleFavorite: vi.fn(() => true),
}));

import { POST as batchPOST } from '@/app/api/sessions/batch/route';
import { POST as exportPOST } from '@/app/api/sessions/export/route';

function makeRequest(body: Record<string, unknown>): any {
    return {
        json: async () => body,
    } as unknown as Request;
}

describe('sessions batch/export routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDeleteWhere.mockResolvedValue(undefined);
    });

    it('should process batch delete for owned sessions', async () => {
        mockSelectRows.mockReturnValueOnce([{ id: 's1' }, { id: 's2' }]);

        const res = await batchPOST(makeRequest({
            type: 'delete',
            sessionIds: ['s1', 's2', 's3'],
        }));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data.processed).toBe(2);
        expect(json.data.skipped).toBe(1);
        expect(mockDeleteWhere).toHaveBeenCalled();
    });

    it('should return json export payload for owned user sessions', async () => {
        mockUsersFindFirst.mockResolvedValueOnce({ id: 'user_1' });
        mockSelectRows.mockReturnValueOnce([
            {
                id: 's1',
                status: 'complete',
                createdAt: '2026-03-09T00:00:00.000Z',
                updatedAt: '2026-03-09T00:10:00.000Z',
                fullName: 'John Doe',
                dateOfBirth: '1990-01-01',
                tentativeTime: '10:30',
                birthPlace: 'Delhi',
                rectifiedTime: '10:32:10',
                accuracy: 92,
                confidence: 'high',
                analysisResult: '{"ok":true}',
                reasoningLogs: '[]',
            },
        ]);

        const res = await exportPOST(makeRequest({
            format: 'json',
            includeResults: true,
            includeLogs: false,
        }));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(Array.isArray(json)).toBe(true);
        expect(json[0].id).toBe('s1');
    });
});
