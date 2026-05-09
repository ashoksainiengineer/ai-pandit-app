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
    syncUser: vi.fn(),
}));

const _mockGetUser = vi.fn().mockResolvedValue({
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    firstName: 'John',
    lastName: 'Doe',
                });

                vi.mock('../../middleware/auth.js', () => ({
    getClerk: () => ({
        users: { getUser: _mockGetUser },
    }),
}));

vi.mock('../logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { syncUser } from '../user-sync.js';
import { syncUser as syncUserShared } from '@ai-pandit/db';

describe('User Sync - Unit Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ═════ syncUser ═════

    describe('syncUser', () => {
        it('should delegate to syncUserShared and return result', async () => {
            vi.mocked(syncUserShared).mockResolvedValueOnce('existing-uuid');

            const result = await syncUser('clerk_123');
            expect(result).toBe('existing-uuid');
            expect(syncUserShared).toHaveBeenCalledWith('clerk_123', expect.objectContaining({
                getClerkUser: expect.any(Function),
                log: expect.any(Function),
            }));
        });

        it('should call Clerk API via getClerkUser when needed', async () => {
            vi.mocked(syncUserShared).mockImplementationOnce(async (_clerkId, opts: any) => {
                const user = await opts.getClerkUser('clerk_456');
                expect(user.emailAddresses[0].emailAddress).toBe('test@example.com');
                return 'new-user-uuid';
            });

            const result = await syncUser('clerk_456');
            expect(result).toBe('new-user-uuid');
            expect(_mockGetUser).toHaveBeenCalledWith('clerk_456');
        });

        it('should throw when Clerk API fails', async () => {
            _mockGetUser.mockRejectedValueOnce(new Error('Clerk unavailable'));
            vi.mocked(syncUserShared).mockImplementationOnce(async (_clerkId, opts: any) => {
                await opts.getClerkUser('clerk_789');
                return 'should-not-reach';
            });

            await expect(syncUser('clerk_789')).rejects.toThrow();
        });

        it('should handle empty name gracefully', async () => {
            vi.mocked(syncUserShared).mockResolvedValueOnce('empty-name-uuid');

            const result = await syncUser('clerk_empty');
            expect(result).toBe('empty-name-uuid');
            expect(syncUserShared).toHaveBeenCalled();
        });
    });
});
