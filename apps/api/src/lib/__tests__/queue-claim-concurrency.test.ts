import { describe, it, expect, vi, beforeEach } from 'vitest';

let selectQueue: Array<Array<{ id: string }>> = [];
let updateRowsById: Record<string, number> = {};

function setSelectQueue(values: Array<Array<{ id: string }>>) {
    selectQueue = values;
}

function setUpdateRowsById(values: Record<string, number>) {
    updateRowsById = values;
}

function extractSessionId(condition: any): string | null {
    if (!condition || typeof condition !== 'object') return null;
    if (condition.op === 'eq' && condition.col === 'id') return condition.val as string;
    if (Array.isArray(condition.args)) {
        for (const child of condition.args) {
            const id = extractSessionId(child);
            if (id) return id;
        }
    }
    return null;
}

vi.mock('@ai-pandit/db', () => {
    const createSelectBuilder = () => {
        const qb: any = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
        };
        qb.then = (resolve: (value: unknown) => void) => {
            const next = selectQueue.shift() ?? [];
            resolve(next);
        };
        return qb;
    };

    const createUpdateBuilder = () => {
        const state: { whereArg?: unknown } = {};
        const qb: any = {
            set: vi.fn().mockReturnThis(),
            where: vi.fn((arg: unknown) => {
                state.whereArg = arg;
                const sessionId = extractSessionId(arg);
                const rowsAffected = sessionId ? (updateRowsById[sessionId] ?? 0) : 0;
                return Promise.resolve({ rowsAffected });
            }),
        };
        return qb;
    };

    return {
        db: {
            select: vi.fn(() => createSelectBuilder()),
            update: vi.fn(() => createUpdateBuilder()),
        },
        executeWithRetry: vi.fn(async (fn: () => Promise<unknown>) => fn()),
    };
});

vi.mock('drizzle-orm', () => ({
    eq: vi.fn((col, val) => ({ op: 'eq', col, val })),
    and: vi.fn((...args) => ({ op: 'and', args })),
    or: vi.fn((...args) => ({ op: 'or', args })),
    asc: vi.fn((x) => x),
    desc: vi.fn((x) => x),
    lt: vi.fn((col, val) => ({ op: 'lt', col, val })),
    gte: vi.fn((col, val) => ({ op: 'gte', col, val })),
}));

vi.mock('@ai-pandit/db/schema', () => ({
    sessions: {
        id: 'id',
        status: 'status',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        startedProcessingAt: 'startedProcessingAt',
    },
    calculations: { sessionId: 'sessionId' },
}));

vi.mock('../logger.js', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
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
    emitError: vi.fn(),
}));

vi.mock('../progress-tracker.js', () => ({
    ProgressTracker: {
        clearInstance: vi.fn(),
        getInstance: vi.fn(),
    },
}));

vi.mock('../encryption/index.js', () => ({
    safeDecryptWithFallback: vi.fn(),
    parseSensitiveField: vi.fn((value) => value),
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

import { __queueInternals, __resetQueueStateForTests } from '../queue-manager.js';

describe('queue-manager atomic claim concurrency', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        __resetQueueStateForTests();
        setSelectQueue([]);
        setUpdateRowsById({});
    });

    it('should skip contenders that lose CAS and claim first winner', async () => {
        setSelectQueue([[{ id: 's1' }, { id: 's2' }, { id: 's3' }]]);
        setUpdateRowsById({
            s1: 0,
            s2: 1,
            s3: 1,
        });

        const claimed = await __queueInternals.claimNextQueuedSession();
        expect(claimed).toBe('s2');
    });

    it('should return null when all contenders lose CAS', async () => {
        setSelectQueue([[{ id: 's1' }, { id: 's2' }]]);
        setUpdateRowsById({
            s1: 0,
            s2: 0,
        });

        const claimed = await __queueInternals.claimNextQueuedSession();
        expect(claimed).toBeNull();
    });

    it('should remain deterministic under randomized contention across many runs', async () => {
        const iterations = 250;

        for (let i = 0; i < iterations; i++) {
            const contenders = Array.from({ length: 8 }, (_, idx) => ({ id: `sess_${i}_${idx}` }));
            const winnerIndex = Math.floor(Math.random() * contenders.length);

            const updateMap: Record<string, number> = {};
            contenders.forEach((candidate, idx) => {
                updateMap[candidate.id] = idx === winnerIndex ? 1 : 0;
            });

            setSelectQueue([contenders]);
            setUpdateRowsById(updateMap);

            const claimed = await __queueInternals.claimNextQueuedSession();
            expect(claimed).toBe(contenders[winnerIndex].id);
        }
    });
});
