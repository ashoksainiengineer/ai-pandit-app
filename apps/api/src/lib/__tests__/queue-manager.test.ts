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
            leftJoin: vi.fn().mockReturnThis(),
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
    jobs: { id: 'id', sessionId: 'sessionId', status: 'status', retryCount: 'retryCount', updatedAt: 'updatedAt' },
    jobAttempts: { id: 'id', jobId: 'jobId', outcome: 'outcome' },
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

vi.mock('@ai-pandit/db/jobs', () => ({
    createJob: vi.fn(),
    getJobById: vi.fn(),
    getLatestJobForSession: vi.fn(),
    listActiveJobs: vi.fn(),
    countQueuedJobs: vi.fn(),
    countActiveJobs: vi.fn(async () => 0),
    claimNextQueuedJob: vi.fn(),
    completeJobAttempt: vi.fn(),
    scheduleJobRetry: vi.fn(),
    failJob: vi.fn(),
    getJobHistory: vi.fn(),
    cancelJob: vi.fn(),
    appendJobEvent: vi.fn(),
    createJobAttempt: vi.fn(async () => ({ id: 'attempt-mock-id' })),
    incrementJobAttempt: vi.fn(async () => ({ attempt: 1 })),
    listJobEvents: vi.fn(async () => []),
    markJobRunning: vi.fn(),
    requestJobCancellation: vi.fn(),
    updateJobAttemptHeartbeat: vi.fn(),
    updateJobProgress: vi.fn(),
}));

vi.mock('../session-events.js', () => ({
    emitComplete: vi.fn(),
    emitError: vi.fn(),
}));

vi.mock('../progress-tracker.js', () => ({
    ProgressTracker: {
        clearInstance: vi.fn(),
        getInstance: vi.fn(),
    },
    getSessionProgress: vi.fn(async () => null),
}));

vi.mock('../encryption/index.js', () => ({
    getApiEncryption: vi.fn(() => ({
        encrypt: vi.fn((val: string) => val),
        decrypt: vi.fn((val: string) => {
            // Return valid JSON for encrypted-looking values (matches old safeDecryptWithFallback)
            if (val && typeof val === 'string' && val.startsWith('encrypted-')) {
                return JSON.stringify({});
            }
            return val;
        }),
        parseField: vi.fn((val: any) => {
            if (val && typeof val === 'string' && val.startsWith('encrypted-')) {
                return JSON.stringify({});
            }
            return val ? val + '-decrypted' : null;
        }),
        isEncrypted: vi.fn(() => false),
    })),
}));

vi.mock('../../config/index.js', () => ({
    config: {
        queue: { maxConcurrent: 3, pollIntervalMs: 1000, syncPollIntervalMs: 2000, maxSize: 100, staleTimeoutMs: 7200000, baseAnalysisTime: 240, contentionMultiplier: 0.2, architecture: 'db_polling' },
        memory: { pressureThresholdGB: 10, criticalThresholdGB: 14, gcThresholdGB: 8, heapThresholdGB: 4 },
        ai: { baseUrl: 'http://localhost', apiKey: 'key', model: 'model' },
        storage: { gcsBucket: undefined, artifactPrefix: 'analysis-artifacts', artifactRetentionDays: 30 },
    },
}));

vi.mock('../../lib/seconds-precision-btr.js', () => ({
    executeSecondsPrecisionRectification: vi.fn(),
}));

vi.mock('../../lib/jobs/artifact-storage.js', () => ({
    persistArtifactReference: vi.fn(),
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
    runQueueIteration,
    stopQueueProcessor,
} from '../../lib/queue-manager.js';
import { recoverInterruptedJobsOnStartup as _recoverInterruptedJobsOnStartup } from '../../lib/metrics-reporter.js';
import { db } from '@ai-pandit/db';
import * as jobRepo from '@ai-pandit/db/jobs';
import * as cancellationManager from '../cancellation-manager.js';
import { executeSecondsPrecisionRectification } from '../../lib/seconds-precision-btr.js';
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
            vi.mocked(jobRepo.listActiveJobs).mockResolvedValueOnce([
                { sessionId: 'sess-1', status: 'running' } as any,
            ]);
            const pos = await getQueuePosition('sess-1');
            expect(pos).toBe(0);
        });

        it('should calculate position based on concurrent limit', async () => {
            vi.mocked(jobRepo.listActiveJobs).mockResolvedValueOnce([
                { sessionId: 's1', status: 'running' } as any,
                { sessionId: 's2', status: 'running' } as any,
                { sessionId: 's3', status: 'running' } as any,
                { sessionId: 's4', status: 'queued' } as any,
                { sessionId: 'sess-1', status: 'queued' } as any,
            ]);
            // maxConcurrent = 3. index = 4. Math.max(1, 4 - 3 + 1) = 2.
            const pos = await getQueuePosition('sess-1');
            expect(pos).toBe(2);
        });

        it('should return 0 if session not found in active list', async () => {
            vi.mocked(jobRepo.listActiveJobs).mockResolvedValueOnce([]);
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
            ]);
            vi.mocked(jobRepo.listActiveJobs).mockResolvedValueOnce([
                { sessionId: 'sess-1', status: 'queued' } as any,
            ]);
            vi.mocked(jobRepo.countActiveJobs).mockResolvedValueOnce(1);

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

        it('should not emit complete when CAS guard blocks transition', async () => {
            setMockResults([{ rowsAffected: 0 }]); // guarded update did not match processing state

            await markAsComplete('sess-race', {
                rectifiedTime: '12:01',
                accuracy: 90,
                confidence: 'Medium',
                analysisResult: '{}',
            });

            expect(emitComplete).not.toHaveBeenCalled();
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
            vi.mocked(jobRepo.getLatestJobForSession).mockResolvedValueOnce({
                status: 'completed',
            } as any);
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

        it('should return false when cancel CAS update is blocked by race', async () => {
            // select -> cancel update (rowsAffected=0) -> flush not reached
            setMockResults([[{ status: 'processing' }], { rowsAffected: 0 }]);
            const res = await cancelSession('sess-race-cancel');
            expect(res).toBe(false);
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

    describe('worker recovery', () => {
        it('should recover running jobs after worker restart using checkpoint state', async () => {
            setMockResults([
                [{
                    jobId: 'job-running-1',
                    sessionId: 'sess-running-1',
                    retryCount: 1,
                    checkpointJson: { status: 'running', progress: { currentStep: 4 } },
                    attemptId: 'attempt-running-1',
                }],
                [],
            ]);

            const result = await _recoverInterruptedJobsOnStartup();

            expect(result).toEqual({
                recoveredJobs: 1,
                abandonedAttempts: 1,
            });
            expect(jobRepo.completeJobAttempt).toHaveBeenCalledWith(
                expect.objectContaining({
                    attemptId: 'attempt-running-1',
                    outcome: 'abandoned',
                    failureCode: 'worker_restart',
                })
            );
            expect(jobRepo.scheduleJobRetry).toHaveBeenCalledWith(
                expect.objectContaining({
                    jobId: 'job-running-1',
                    retryCount: 2,
                    retryReasonCode: 'worker_restart',
                })
            );
        });
    });

    describe('poison job handling', () => {
        it('should land non-retryable failures in a safe terminal failed state', async () => {
            vi.mocked(jobRepo.claimNextQueuedJob).mockResolvedValueOnce({
                id: 'job-poison-1',
                sessionId: 'sess-poison-1',
                status: 'queued',
            } as any);
            vi.mocked(jobRepo.getLatestJobForSession).mockResolvedValue({
                id: 'job-poison-1',
                sessionId: 'sess-poison-1',
                attempt: 1,
                progressPercent: 0,
                currentStage: null,
                retryCount: 0,
                maxAttempts: 3,
                status: 'running',
                checkpointJson: null,
                cursorJson: null,
            } as any);

            setMockResults([
                [], // purgeExpiredQueueEntries
                { rowsAffected: 1 }, // claimNextQueuedSession -> session processing update
                [{
                    id: 'sess-poison-1',
                    externalId: 'valid-clerk',
                    userId: '1',
                    lifeEvents: 'encrypted-events',
                    dateOfBirth: '1990-01-01',
                    tentativeTime: '12:00:00',
                    latitude: 12.34,
                    longitude: 56.78,
                    timezone: '5.5',
                    offsetConfig: null,
                    spouseData: null,
                }],
                [], // flushSessionTrash update
                [], // flushSessionTrash delete
                { rowsAffected: 1 }, // final failed status update
            ]);
            vi.mocked(executeSecondsPrecisionRectification).mockRejectedValueOnce(new Error('invalid birth data payload'));

            await runQueueIteration();
            await vi.waitFor(() => {
                expect(jobRepo.failJob).toHaveBeenCalledWith(
                    expect.objectContaining({
                        jobId: 'job-poison-1',
                        status: 'failed',
                        errorCode: 'processing_error',
                    })
                );
            });

            expect(jobRepo.scheduleJobRetry).not.toHaveBeenCalled();
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // QUEUE ADDITION (RUN LAST TO AVOID BACKGROUND LOOP INTERFERENCE)
    // ═══════════════════════════════════════════════════════════════════════════

    describe('addToQueue', () => {
        it('should completely reject if queue is full', async () => {
            vi.mocked(jobRepo.countActiveJobs).mockResolvedValueOnce(100);
            const res = await addToQueue('sess-1');
            expect(res.success).toBe(false);
            expect(res.error).toContain('Queue is full');
        });

        it('should update status to queued and return position', async () => {
            setMockResults([
                [], // update
                [{ id: 'sess-1', status: 'queued' }], // getQueueStatus -> session
            ]);
            vi.mocked(jobRepo.countActiveJobs)
                .mockResolvedValueOnce(5)
                .mockResolvedValueOnce(6);
            vi.mocked(jobRepo.listActiveJobs).mockResolvedValueOnce([
                { sessionId: 'sess-1', status: 'queued' } as any,
            ]);

            const res = await addToQueue('sess-1');
            expect(res.success).toBe(true);
            expect(res.sessionId).toBe('sess-1');

            const updateCall = (db.update as any).mock.results[0].value.set.mock.calls[0][0];
            expect(updateCall.status).toBe('queued');
        });
    });
});
