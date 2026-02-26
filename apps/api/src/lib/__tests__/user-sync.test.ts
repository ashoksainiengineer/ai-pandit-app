import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('@ai-pandit/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue(undefined),
    },
    executeWithRetry: vi.fn((fn: any) => fn()),
}));

vi.mock('../../middleware/auth.js', () => ({
    clerk: {
        users: {
            getUser: vi.fn().mockResolvedValue({
                emailAddresses: [{ emailAddress: 'test@example.com' }],
                firstName: 'John',
                lastName: 'Doe',
            }),
        },
    },
}));

vi.mock('../logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { syncUser } from '../user-sync.js';
import { db } from '@ai-pandit/db';
import { clerk } from '../../middleware/auth.js';

describe('User Sync - Unit Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ═════ syncUser ═════

    describe('syncUser', () => {
        it('should return existing user ID if user found in DB', async () => {
            vi.mocked(db.limit).mockResolvedValueOnce([{ id: 'existing-uuid' }]);

            const result = await syncUser('clerk_123');
            expect(result).toBe('existing-uuid');
            // Should NOT call Clerk API since user exists
            expect(clerk.users.getUser).not.toHaveBeenCalled();
        });

        it('should create user from Clerk when not found in DB', async () => {
            vi.mocked(db.limit).mockResolvedValueOnce([]); // user not found

            const result = await syncUser('clerk_456');
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            // Should call Clerk to fetch user data
            expect(clerk.users.getUser).toHaveBeenCalledWith('clerk_456');
            // Should insert into DB
            expect(db.insert).toHaveBeenCalled();
        });

        it('should throw when Clerk API fails', async () => {
            vi.mocked(db.limit).mockResolvedValueOnce([]); // user not found
            vi.mocked(clerk.users.getUser).mockRejectedValueOnce(new Error('Clerk unavailable'));

            await expect(syncUser('clerk_789')).rejects.toThrow('User synchronization failed');
        });

        it('should handle empty name gracefully', async () => {
            vi.mocked(db.limit).mockResolvedValueOnce([]);
            vi.mocked(clerk.users.getUser).mockResolvedValueOnce({
                emailAddresses: [{ emailAddress: 'noname@test.com' }],
                firstName: null,
                lastName: null,
            } as any);

            const result = await syncUser('clerk_empty');
            expect(typeof result).toBe('string');
            expect(db.insert).toHaveBeenCalled();
        });
    });
});
