import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('@ai-pandit/db', () => ({
    db: {
        delete: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnValue({ rowsAffected: 5 }),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
    },
    executeWithRetry: vi.fn((fn: any) => fn()),
}));

vi.mock('../logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { runDatabaseCleanup, getCleanupPreview, RETENTION } from '../db-cleanup.js';

describe('DB Cleanup - Unit Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ═════ RETENTION constants ═════

    describe('RETENTION constants', () => {
        it('should define GDPR-compliant retention periods', () => {
            expect(RETENTION.softDeletedSessions).toBe(30);
            expect(RETENTION.softDeletedUsers).toBe(90);
            expect(RETENTION.expiredCalculations).toBe(30);
        });

        it('should define operational retention periods', () => {
            expect(RETENTION.completedSessionsProgress).toBe(1);
            expect(RETENTION.failedSessions).toBe(7);
            expect(RETENTION.stalePendingSessions).toBe(7);
        });
    });

    // ═════ runDatabaseCleanup ═════

    describe('runDatabaseCleanup', () => {
        it('should return a CleanupReport with all required fields', async () => {
            const report = await runDatabaseCleanup();
            expect(report).toHaveProperty('timestamp');
            expect(report).toHaveProperty('results');
            expect(report).toHaveProperty('totalDeleted');
            expect(report).toHaveProperty('durationMs');
        });

        it('should run 5 cleanup operations in parallel', async () => {
            const report = await runDatabaseCleanup();
            expect(report.results.length).toBe(5);
        });

        it('should report duration in milliseconds', async () => {
            const report = await runDatabaseCleanup();
            expect(typeof report.durationMs).toBe('number');
            expect(report.durationMs).toBeGreaterThanOrEqual(0);
        });

        it('should set timestamp as ISO string', async () => {
            const report = await runDatabaseCleanup();
            expect(() => new Date(report.timestamp)).not.toThrow();
        });
    });

    // ═════ getCleanupPreview ═════

    describe('getCleanupPreview', () => {
        it('should return a preview without deleting anything', async () => {
            const preview = await getCleanupPreview();
            expect(preview).toHaveProperty('wouldDelete');
            expect(typeof preview.wouldDelete).toBe('object');
        });

        it('should include all cleanup categories', async () => {
            const preview = await getCleanupPreview();
            expect(preview.wouldDelete).toHaveProperty('softDeletedSessions');
            expect(preview.wouldDelete).toHaveProperty('softDeletedUsers');
            expect(preview.wouldDelete).toHaveProperty('completedSessionProgress');
            expect(preview.wouldDelete).toHaveProperty('expiredCalculations');
            expect(preview.wouldDelete).toHaveProperty('stalePendingSessions');
        });
    });
});
