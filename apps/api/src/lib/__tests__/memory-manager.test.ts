import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS — Isolate from Node process.memoryUsage
// ═══════════════════════════════════════════════════════════════════════════

import {
    getMemoryStats,
    checkMemory,
    logMemory,
    triggerGC,
    withMemoryCheck,
    withConcurrencyLimit,
    getActiveCalculations,
} from '../memory-manager.js';

describe('Memory Manager - Unit Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ═════ getMemoryStats ═════

    describe('getMemoryStats', () => {
        it('should return all required fields', () => {
            const stats = getMemoryStats();
            expect(stats).toHaveProperty('heapUsed');
            expect(stats).toHaveProperty('heapTotal');
            expect(stats).toHaveProperty('external');
            expect(stats).toHaveProperty('rss');
            expect(stats).toHaveProperty('percentUsed');
        });

        it('should return numeric values', () => {
            const stats = getMemoryStats();
            expect(typeof stats.heapUsed).toBe('number');
            expect(typeof stats.percentUsed).toBe('number');
        });

        it('should return positive heap usage', () => {
            const stats = getMemoryStats();
            expect(stats.heapUsed).toBeGreaterThan(0);
        });

        it('should compute percentUsed as a ratio against MAX_HEAP', () => {
            const stats = getMemoryStats();
            // percentUsed should be between 0 and 1 under normal conditions
            expect(stats.percentUsed).toBeGreaterThan(0);
            expect(stats.percentUsed).toBeLessThan(1);
        });
    });

    // ═════ checkMemory ═════

    describe('checkMemory', () => {
        it('should return true when memory is below critical threshold', () => {
            // Under normal test conditions, memory usage should be well below 95%
            expect(checkMemory()).toBe(true);
        });
    });

    // ═════ logMemory ═════

    describe('logMemory', () => {
        it('should not throw when logging memory', () => {
            expect(() => logMemory('test-label')).not.toThrow();
        });
    });

    // ═════ triggerGC ═════

    describe('triggerGC', () => {
        it('should not throw even when global.gc is not available', () => {
            expect(() => triggerGC()).not.toThrow();
        });
    });

    // ═════ withMemoryCheck ═════

    describe('withMemoryCheck', () => {
        it('should execute the provided function and return its result', async () => {
            const result = await withMemoryCheck('test-op', async () => 42);
            expect(result).toBe(42);
        });

        it('should propagate errors from the provided function', async () => {
            await expect(
                withMemoryCheck('test-op', async () => { throw new Error('boom'); })
            ).rejects.toThrow('boom');
        });
    });

    // ═════ withConcurrencyLimit ═════

    describe('withConcurrencyLimit', () => {
        it('should execute function and return result', async () => {
            const result = await withConcurrencyLimit(async () => 'hello');
            expect(result).toBe('hello');
        });

        it('should track active calculations', async () => {
            let capturedCount = 0;
            await withConcurrencyLimit(async () => {
                capturedCount = getActiveCalculations();
                return null;
            });
            expect(capturedCount).toBeGreaterThanOrEqual(1);
            // After completion, count should be decremented
            expect(getActiveCalculations()).toBe(0);
        });

        it('should decrement active count even on error', async () => {
            try {
                await withConcurrencyLimit(async () => { throw new Error('fail'); });
            } catch { /* expected */ }
            expect(getActiveCalculations()).toBe(0);
        });
    });
});
