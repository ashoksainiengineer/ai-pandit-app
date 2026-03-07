import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, executeWithRetry } from '../drizzle.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';

// Mocking the db object methods
vi.mock('../drizzle.js', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        db: {
            select: vi.fn(),
            insert: vi.fn(),
            delete: vi.fn(),
        }
    };
});

describe('Turso DB Concurrency & Atomic Operations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should handle "database is locked" errors with multi-stage retry', async () => {
        let attempts = 0;
        const mockOperation = vi.fn().mockImplementation(async () => {
            attempts++;
            if (attempts < 3) {
                throw new Error('database is locked');
            }
            return { success: true };
        });

        const result = await executeWithRetry(mockOperation, 5) as any;

        expect(result.success).toBe(true);
        expect(attempts).toBe(3);
    });

    it('should fail after max retries for persistent lock errors', async () => {
        const mockOperation = vi.fn().mockImplementation(async () => {
            throw new Error('database is locked');
        });

        await expect(executeWithRetry(mockOperation, 3)).rejects.toThrow('database is locked');
    });

    it('should not retry on non-transient errors (e.g. syntax error)', async () => {
        const mockOperation = vi.fn().mockImplementation(async () => {
            throw new Error('SQLITE_ERROR: no such column: invalid_col');
        });

        await expect(executeWithRetry(mockOperation, 3)).rejects.toThrow('SQLITE_ERROR');
        expect(mockOperation).toHaveBeenCalledTimes(1);
    });
});
