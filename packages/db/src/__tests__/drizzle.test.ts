import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

const { mockExecute, mockClose } = vi.hoisted(() => ({
    mockExecute: vi.fn(),
    mockClose: vi.fn(),
}));

vi.mock('@libsql/client', () => ({
    createClient: vi.fn(() => ({
        execute: mockExecute,
        close: mockClose,
    })),
}));

vi.mock('drizzle-orm/libsql', () => ({
    drizzle: vi.fn(() => ({
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    })),
}));

import { checkDatabaseHealth, executeWithTimeout, executeWithRetry, closeDatabaseConnection } from '../drizzle.js';

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Database Resiliency & Health Helpers', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('checkDatabaseHealth', () => {
        it('should return healthy true if query succeeds', async () => {
            mockExecute.mockResolvedValueOnce({ rows: [] });

            const health = await checkDatabaseHealth();
            expect(health.healthy).toBe(true);
            expect(health.latencyMs).toBeDefined();
            expect(health.error).toBeUndefined();
        });

        it('should return healthy false if query fails', async () => {
            mockExecute.mockRejectedValueOnce(new Error('Connection failed'));

            const health = await checkDatabaseHealth();
            expect(health.healthy).toBe(false);
            expect(health.error).toBe('Connection failed');
        });
    });

    describe('executeWithTimeout', () => {
        it('should resolve if operation completes within timeout', async () => {
            const operation = vi.fn().mockResolvedValue('success');

            const resultPromise = executeWithTimeout(operation, 1000);
            await vi.runAllTimersAsync();

            const result = await resultPromise;
            expect(result).toBe('success');
        });

        it('should reject if operation exceeds timeout', async () => {
            const operation = vi.fn(() => new Promise((resolve) => setTimeout(() => resolve('success'), 2000)));

            let caughtError: Error | null = null;
            const resultPromise = executeWithTimeout(operation, 1000).catch((e: Error) => {
                caughtError = e;
            });

            await vi.advanceTimersByTimeAsync(1500);
            await resultPromise;

            expect((caughtError as any)?.message).toBe('Query timeout after 1000ms');
        });
    });

    describe('executeWithRetry', () => {
        it('should resolve immediately if operation succeeds', async () => {
            const operation = vi.fn().mockResolvedValue('success');

            const result = await executeWithRetry(operation, 3);
            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it('should not retry on non-transient errors (e.g., syntax error)', async () => {
            const operation = vi.fn().mockRejectedValue(new Error('Syntax Error in SQL'));

            await expect(executeWithRetry(operation, 3)).rejects.toThrow('Syntax Error in SQL');
            expect(operation).toHaveBeenCalledTimes(1); // Should fail immediately without retry
        });

        it('should retry on transient errors until success', async () => {
            const operation = vi.fn()
                .mockRejectedValueOnce(new Error('network timeout'))
                .mockRejectedValueOnce(new Error('econnreset'))
                .mockResolvedValueOnce('success');

            const resultPromise = executeWithRetry(operation, 3);

            // Advance past the backoff periods
            await vi.advanceTimersByTimeAsync(1000); // 1st retry delay
            await vi.advanceTimersByTimeAsync(2000); // 2nd retry delay

            const result = await resultPromise;
            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(3);
        });

        it('should throw after max retries even with transient errors', async () => {
            const operation = vi.fn().mockRejectedValue(new Error('network timeout'));

            let caughtError: Error | null = null;
            const resultPromise = executeWithRetry(operation, 2).catch((e: Error) => {
                caughtError = e;
            });

            await vi.advanceTimersByTimeAsync(1000); // 1st retry
            await vi.advanceTimersByTimeAsync(2000); // 2nd retry (fails)

            expect((caughtError as unknown as Error)?.message).toBe('network timeout');
            expect(operation).toHaveBeenCalledTimes(2); // Max retries
        });
    });

    describe('closeDatabaseConnection', () => {
        it('should call client.close()', async () => {
            await closeDatabaseConnection();
            expect(mockClose).toHaveBeenCalledTimes(1);
        });
    });
});
