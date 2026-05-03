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
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockReturnThis(),
    },
    executeWithRetry: vi.fn((fn: any) => fn()),
}));

vi.mock('./logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import {
  generateCacheKey,
  lookupCalculation,
  storeCalculation,
  clearSessionCache
} from '../calculation-cache.js';
import { db } from '@ai-pandit/db';

describe('Calculation Cache - Unit Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ═════ generateCacheKey ═════

    describe('generateCacheKey', () => {
        it('should produce a deterministic key from the same inputs', () => {
            const key1 = generateCacheKey('2000-01-01T12:00:00', 28.6139, 77.2090, 'Asia/Kolkata');
            const key2 = generateCacheKey('2000-01-01T12:00:00', 28.6139, 77.2090, 'Asia/Kolkata');
            expect(key1).toBe(key2);
        });

        it('should normalize coordinates to 4 decimal places', () => {
            const key1 = generateCacheKey('2000-01-01T12:00:00', 28.61394999, 77.20901111, 'Asia/Kolkata');
            const key2 = generateCacheKey('2000-01-01T12:00:00', 28.6139, 77.209, 'Asia/Kolkata');
            expect(key1).toBe(key2);
        });

        it('should produce different keys for different birth times', () => {
            const key1 = generateCacheKey('2000-01-01T12:00:00', 28.6139, 77.2090, 'Asia/Kolkata');
            const key2 = generateCacheKey('2000-01-01T12:01:00', 28.6139, 77.2090, 'Asia/Kolkata');
            expect(key1).not.toBe(key2);
        });

        it('should produce different keys for different timezones', () => {
            const key1 = generateCacheKey('2000-01-01T12:00:00', 28.6139, 77.2090, 'Asia/Kolkata');
            const key2 = generateCacheKey('2000-01-01T12:00:00', 28.6139, 77.2090, 'America/New_York');
            expect(key1).not.toBe(key2);
        });

        it('should return a non-empty string', () => {
            const key = generateCacheKey('2000-01-01T12:00:00', 0, 0, 'UTC');
            expect(key.length).toBeGreaterThan(0);
        });
    });

    // ═════ lookupCalculation ═════

    describe('lookupCalculation', () => {
        it('should return { found: false } when no cache entry exists', async () => {
            (db as any).limit.mockResolvedValueOnce([]);
            const result = await lookupCalculation('2000-01-01T12:00:00', 28.6139, 77.2090, 'Asia/Kolkata');
            expect(result.found).toBe(false);
            expect(result.data).toBeUndefined();
        });

        it('should return { found: true, data } when cache hit', async () => {
            const mockEntry = {
                id: 'cache-1',
                sessionId: 'sess-1',
                birthDateTime: '2000-01-01T12:00:00',
                latitude: 28.6139,
                longitude: 77.2090,
                timezone: 'Asia/Kolkata',
                ephemerisData: '{"planets":["Sun","Moon"]}',
                cacheHitCount: 3,
                expiresAt: new Date(Date.now() + 86400000).toISOString(),
                createdAt: new Date().toISOString(),
            };
            (db as any).limit.mockResolvedValueOnce([mockEntry]);

            const result = await lookupCalculation('2000-01-01T12:00:00', 28.6139, 77.2090, 'Asia/Kolkata');
            expect(result.found).toBe(true);
            expect(result.data).toEqual({ planets: ['Sun', 'Moon'] });
        });

        it('should increment hit count on cache hit', async () => {
            const mockEntry = {
                id: 'cache-1',
                sessionId: 'sess-1',
                birthDateTime: '2000-01-01T12:00:00',
                latitude: 28.6139,
                longitude: 77.2090,
                timezone: 'Asia/Kolkata',
                ephemerisData: '{"test": true}',
                cacheHitCount: 5,
                expiresAt: null,
                createdAt: new Date().toISOString(),
            };
            (db as any).limit.mockResolvedValueOnce([mockEntry]);

            await lookupCalculation('2000-01-01T12:00:00', 28.6139, 77.2090, 'Asia/Kolkata');

            // Verify db.update was called (to increment hit count)
            expect(db.update).toHaveBeenCalled();
        });

        it('should return { found: false } on database error', async () => {
            (db as any).limit.mockRejectedValueOnce(new Error('DB connection lost'));

            const result = await lookupCalculation('2000-01-01T12:00:00', 28.6139, 77.2090, 'Asia/Kolkata');
            expect(result.found).toBe(false);
        });
    });

    // ═════ storeCalculation ═════

    describe('storeCalculation', () => {
        it('should not throw when storing valid data', async () => {
            await expect(
                storeCalculation('sess-1', '2000-01-01T12:00:00', 28.6139, 77.209, 'Asia/Kolkata', { planets: [] })
            ).resolves.not.toThrow();
        });

        it('should call db.insert with serialized ephemeris data', async () => {
            await storeCalculation('sess-1', '2000-01-01T12:00:00', 28.6139, 77.209, 'Asia/Kolkata', { test: true });
            expect(db.insert).toHaveBeenCalled();
        });

        it('should not throw on insert failure (non-critical)', async () => {
            vi.mocked((db as any).values).mockRejectedValueOnce(new Error('Insert failed'));
            await expect(
                storeCalculation('sess-1', '2000-01-01T12:00:00', 28.6139, 77.209, 'Asia/Kolkata', {})
            ).resolves.not.toThrow();
        });
    });

    // ═════ clearSessionCache ═════

    describe('clearSessionCache', () => {
        it('should not throw on valid session ID', async () => {
            await expect(clearSessionCache('sess-1')).resolves.not.toThrow();
        });

        it('should call db.delete', async () => {
            await clearSessionCache('sess-1');
            expect(db.delete).toHaveBeenCalled();
        });
    });
});
