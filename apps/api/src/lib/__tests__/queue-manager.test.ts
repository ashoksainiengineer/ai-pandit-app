/**
 * 🔱 EXHAUSTIVE QUEUE MANAGER TESTS
 * Tests addToQueue, getQueuePosition, getQueueStatus,
 * markAsComplete, markAsFailed, flushSessionTrash,
 * cancelSession, heartbeat.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

let mockQueryResults: any[] = [];
let queryResultIndex = 0;

function setMockResults(results: any[]) {
    mockQueryResults = results;
    queryResultIndex = 0;
}

vi.mock('@ai-pandit/db', () => {
    const createQueryBuilder = () => {
        const qb: any = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
        };
        qb.then = function (resolve: any) {
            const res = mockQueryResults[queryResultIndex];
            queryResultIndex = Math.min(queryResultIndex + 1, mockQueryResults.length - 1);
            resolve(res || []);
        };
        return qb;
    };

    return {
        db: {
            select: vi.fn(() => createQueryBuilder()),
            update: vi.fn(() => createQueryBuilder()),
            delete: vi.fn(() => createQueryBuilder()),
        },
        executeWithRetry: vi.fn(async (fn) => fn()),
    };
});

vi.mock('drizzle-orm', () => ({
    eq: vi.fn((col, val) => ({ op: 'eq', col, val })),
    and: vi.fn((...args) => ({ op: 'and', args })),
    or: vi.fn((...args) => ({ op: 'or', args })),
    desc: vi.fn((val) => val),
    asc: vi.fn((val) => val),
    lt: vi.fn((col, val) => ({ op: 'lt', col, val })),
    gte: vi.fn((col, val) => ({ op: 'gte', col, val })),
}));

vi.mock('@ai-pandit/db/schema', () => ({
    sessions: { id: 'id', status: 'status', createdAt: 'createdAt', updatedAt: 'updatedAt' },
    calculations: { sessionId: 'sessionId' },
}));

vi.mock('../logger.js', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

vi.mock('../cancellation-manager.js', () => ({
    createAbortController: vi.fn(() => ({ signal: {} })),
    abortSession: vi.fn(),
    cleanupController: vi.fn(),
    isCancellationError: vi.fn(() => false),
}));

vi.mock('../session-events.js', () => ({
    emitComplete: vi.fn(),
}));

vi.mock('../progress-tracker.js', () => ({
    ProgressTracker: {
        clearInstance: vi.fn(),
        getInstance: vi.fn(),
    },
}));

vi.mock('../encryption/index.js', () => ({
    safeDecryptWithFallback: vi.fn(() => JSON.stringify({})),
    parseSensitiveField: vi.fn((val) => val ? val + '-decrypted' : null),
}));

vi.mock('../../config/index.js', () => ({
    config: {
        queue: { maxConcurrent: 3, pollIntervalMs: 1000, maxSize: 100, staleTimeoutMs: 7200000, baseAnalysisTime: 240, contentionMultiplier: 0.2 },
        memory: { pressureThresholdGB: 10, criticalThresholdGB: 14, gcThresholdGB: 8, heapThresholdGB: 4 },
        ai: { baseUrl: 'http://localhost', apiKey: 'key', model: 'model' },
    },
}));

vi.mock('./seconds-precision-btr.js', () => ({
    processSecondsPrecisionBTR: vi.fn(),
}));

import {
    addToQueue,
    getQueuePosition,
    getQueueStatus,
    markAsComplete,
    markAsFailed,
    flushSessionTrash,
    cancelSession,
    heartbeat,
    stopQueueProcessor,
} from '../../lib/queue-manager.js';
import { db, executeWithRetry } from '@ai-pandit/db';
import * as cancellationManager from '../cancellation-manager.js';
import { emitComplete } from '../session-events.js';

describe('Queue Manager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        stopQueueProcessor();
        vi.clearAllTimers();
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // QUEUE POSITION
    // ═══════════════════════════════════════════════════════════════════════════

    describe('getQueuePosition', () => {
        it('should return 0 if session is already processing', async () => {
            setMockResults([
                [{ id: 'sess-1', status: 'processing' }]
            ]);
            const pos = await getQueuePosition('sess-1');
            expect(pos).toBe(0);
        });

        it('should calculate position based on concurrent limit', async () => {
            setMockResults([
                [
                    { id: 's1', status: 'processing' }, // index 0
                    { id: 's2', status: 'processing' }, // index 1
                    { id: 's3', status: 'processing' }, // index 2
                    { id: 's4', status: 'queued' },     // index 3
                    { id: 'sess-1', status: 'queued' }, // index 4
                ]
            ]);
            // maxConcurrent = 3. index = 4. Math.max(1, 4 - 3 + 1) = 2.
            const pos = await getQueuePosition('sess-1');
            expect(pos).toBe(2);
        });

        it('should return 0 if session not found in active list', async () => {
            setMockResults([[]]);
            const pos = await getQueuePosition('missing');
            expect(pos).toBe(0);
        });
    });

    describe('getQueueStatus', () => {
        it('should return null if session does not exist', async () => {
            setMockResults([[]]);
            const status = await getQueueStatus('nonexistent');
            expect(status).toBeNull();
        });

        it('should return full status payload for queued session', async () => {
            setMockResults([
                [{ id: 'sess-1', status: 'queued', createdAt: '2020' }], // session lookup
                [{ id: 'sess-1', status: 'queued' }], // queue position active list
                [{ id: 'sess-1' }] // total queued count
            ]);

            const status = await getQueueStatus('sess-1');
            expect(status).toBeDefined();
            expect(status?.status).toBe('queued');
            expect(status?.position).toBe(1);
            expect(status?.totalInQueue).toBe(1);
            expect(status?.createdAt).toBe('2020');
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // COMPLETION & FAILURE
    // ═══════════════════════════════════════════════════════════════════════════

    describe('markAsComplete', () => {
        it('should update db with results and emit event', async () => {
            setMockResults([[]]); // For the update call
            await markAsComplete('sess-1', {
                rectifiedTime: '12:00',
                accuracy: 95,
                confidence: 'High',
                analysisResult: '{}',
                reasoningLogs: 'some-logs',
            });

            const updateCall = (db.update as any).mock.results[0].value.set.mock.calls[0][0];
            expect(updateCall.status).toBe('complete');
            expect(updateCall.rectifiedTime).toBe('12:00');
            expect(updateCall.reasoningLogs).toBe('"some-logs"');

            expect(emitComplete).toHaveBeenCalledWith('sess-1', '12:00', 95, 'High');
        });
    });

    describe('markAsFailed', () => {
        it('should flush trash and update db with error', async () => {
            // flushSessionTrash makes an update and a delete.
            // markAsFailed then makes another update.
            setMockResults([[], [], []]); // For the update, delete, and final update calls
            await markAsFailed('sess-1', 'Random failure');

            // flushSessionTrash behavior
            expect(cancellationManager.abortSession).toHaveBeenCalledWith('sess-1');

            // update behavior
            // Since markAsFailed calls flushSessionTrash (which updates DB once)
            // It then updates DB again to set 'failed'
            const calls = (db.update as any).mock.results.map((r: any) => r.value.set.mock.calls[0][0]);

            // Find the one that sets status to failed
            const failedCall = calls.find((c: any) => c.status === 'failed');
            expect(failedCall).toBeDefined();
            expect(failedCall.errorMessage).toBe('Random failure');
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // TECHNICAL TRASH & CANCELLATION
    // ═══════════════════════════════════════════════════════════════════════════

    describe('flushSessionTrash', () => {
        it('should abort, clear progress, clear cache, and cleanup memory', async () => {
            setMockResults([[], []]); // For the update and delete calls
            await flushSessionTrash('trash-sess');

            expect(cancellationManager.abortSession).toHaveBeenCalledWith('trash-sess');

            // clear heavy columns
            const updateCall = (db.update as any).mock.results[0].value.set.mock.calls[0][0];
            expect(updateCall.progressData).toBeNull();
            expect(updateCall.analysisResult).toBeNull();

            // delete cache
            expect(db.delete).toHaveBeenCalled();

            // memory cleanup
            expect(cancellationManager.cleanupController).toHaveBeenCalledWith('trash-sess');
        });
    });

    describe('cancelSession', () => {
        it('should return false if session not found', async () => {
            setMockResults([[]]); // For the initial select call
            const res = await cancelSession('sess-missing');
            expect(res).toBe(false);
        });

        it('should return false if session already complete', async () => {
            setMockResults([[{ status: 'complete' }]]); // For the initial select call
            const res = await cancelSession('sess-done');
            expect(res).toBe(false);
        });

        it('should flush trash and mark failed for valid session', async () => {
            // Initial select, then flushSessionTrash (update, delete), then final update
            setMockResults([[{ status: 'processing' }], [], []]);
            const res = await cancelSession('sess-active');

            expect(res).toBe(true);
            expect(cancellationManager.abortSession).toHaveBeenCalledWith('sess-active');

            const calls = (db.update as any).mock.results.map((r: any) => r.value.set.mock.calls[0][0]);
            const failedCall = calls.find((c: any) => c.status === 'failed');
            expect(failedCall.errorMessage).toBe('Cancelled by user');
        });
    });

    describe('heartbeat', () => {
        it('should update updatedAt timestamp', async () => {
            setMockResults([[]]); // For the update call
            await heartbeat('heart-sess');
            const updateCall = (db.update as any).mock.results[0].value.set.mock.calls[0][0];
            expect(updateCall.updatedAt).toBeDefined();
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // QUEUE ADDITION (RUN LAST TO AVOID BACKGROUND LOOP INTERFERENCE)
    // ═══════════════════════════════════════════════════════════════════════════

    describe('addToQueue', () => {
        it('should completely reject if queue is full', async () => {
            setMockResults([new Array(100).fill({ id: 'dummy' })]);
            const res = await addToQueue('sess-1');
            expect(res.success).toBe(false);
            expect(res.error).toContain('Queue is full');
        });

        it('should update status to queued and return position', async () => {
            setMockResults([
                new Array(5).fill({ id: 'dummy' }), // getQueuedCount
                [], // update
                [{ id: 'sess-1', status: 'queued' }], // getQueueStatus -> session
                [{ id: 'sess-1', status: 'queued' }], // getQueuePosition -> active
                new Array(6).fill({ id: 'dummy' }) // getQueueStatus -> getQueuedCount
            ]);

            const res = await addToQueue('sess-1');
            expect(res.success).toBe(true);
            expect(res.sessionId).toBe('sess-1');

            const updateCall = (db.update as any).mock.results[0].value.set.mock.calls[0][0];
            expect(updateCall.status).toBe('queued');
        });
    });
});
