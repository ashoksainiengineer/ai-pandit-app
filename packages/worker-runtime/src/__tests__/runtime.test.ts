import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWorkerRuntime } from '../index.js';
import type {
    WorkerDependencies,
    WorkerRuntime,
    WorkerInitializationResult,
    WorkerStopResult,
    WorkerRuntimeStatus,
    RecoveryResult,
} from '../index.js';

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DEPENDENCIES FACTORY
// ═══════════════════════════════════════════════════════════════════════════

function createMockDeps(overrides: Partial<WorkerDependencies> = {}): WorkerDependencies {
    return {
        pollIntervalMs: 50,
        processJob: vi.fn().mockResolvedValue(undefined),
        getActiveCount: vi.fn().mockReturnValue(0),
        recover: vi.fn().mockResolvedValue({ recoveredJobs: 0, abandonedAttempts: 0 } satisfies RecoveryResult),
        ...overrides,
    };
}

function createRuntime(overrides: Partial<WorkerDependencies> = {}): WorkerRuntime {
    return createWorkerRuntime(createMockDeps(overrides));
}

// ═══════════════════════════════════════════════════════════════════════════
// createWorkerRuntime() — interface shape tests
// ═══════════════════════════════════════════════════════════════════════════

describe('createWorkerRuntime', () => {
    it('returns an object with all expected methods', () => {
        const rt = createRuntime();

        expect(typeof rt.initialize).toBe('function');
        expect(typeof rt.runLoop).toBe('function');
        expect(typeof rt.stop).toBe('function');
        expect(typeof rt.getStatus).toBe('function');
    });

    it('returns distinct instances across multiple calls', () => {
        const rt1 = createRuntime();
        const rt2 = createRuntime();

        expect(rt1).not.toBe(rt2);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// initialize()
// ═══════════════════════════════════════════════════════════════════════════

describe('initialize()', () => {
    let rt: WorkerRuntime;
    let deps: WorkerDependencies;

    beforeEach(() => {
        deps = createMockDeps();
        rt = createWorkerRuntime(deps);
    });

    it('returns pollIntervalMs and recoveredJobs', async () => {
        const result: WorkerInitializationResult = await rt.initialize();

        expect(result).toHaveProperty('pollIntervalMs');
        expect(typeof result.pollIntervalMs).toBe('number');
        expect(result).toHaveProperty('recoveredJobs');
        expect(typeof result.recoveredJobs).toBe('number');
    });

    it('uses default pollIntervalMs when no option provided', async () => {
        // Create deps WITHOUT pollIntervalMs override to use the built-in default
        const depsNoPoll = createMockDeps();
        delete depsNoPoll.pollIntervalMs;
        const localRt = createWorkerRuntime(depsNoPoll);

        const result = await localRt.initialize();

        // Default from DEFAULT_POLL_INTERVAL_MS = 2000
        expect(result.pollIntervalMs).toBe(2000);
    });

    it('respects custom pollIntervalMs from dependencies', async () => {
        const customDeps = createMockDeps({ pollIntervalMs: 5000 });
        const customRt = createWorkerRuntime(customDeps);

        const result = await customRt.initialize();

        expect(result.pollIntervalMs).toBe(5000);
    });

    it('overrides pollIntervalMs from options', async () => {
        const result = await rt.initialize({ pollIntervalMs: 3000 });

        expect(result.pollIntervalMs).toBe(3000);
    });

    it('calls deps.initialize() when provided', async () => {
        const initFn = vi.fn().mockResolvedValue(undefined);
        const customRt = createWorkerRuntime(createMockDeps({ initialize: initFn }));

        await customRt.initialize();

        expect(initFn).toHaveBeenCalledOnce();
    });

    it('calls deps.recover() and returns recovered count', async () => {
        const recoverFn = vi.fn().mockResolvedValue({
            recoveredJobs: 3,
            abandonedAttempts: 1,
        } satisfies RecoveryResult);
        const customRt = createWorkerRuntime(createMockDeps({ recover: recoverFn }));

        const result = await customRt.initialize();

        expect(recoverFn).toHaveBeenCalledOnce();
        expect(result.recoveredJobs).toBe(3);
    });

    it('sets initialized state to true after initialize()', async () => {
        // Before initialize
        const statusBefore = rt.getStatus();
        expect(statusBefore.initialized).toBe(false);

        await rt.initialize();

        const statusAfter = rt.getStatus();
        expect(statusAfter.initialized).toBe(true);
    });

    it('resets shouldRunLoop / shutdownRequested on re-initialize', async () => {
        // First: initialize, stop (which sets shutdownRequested), then re-init
        await rt.initialize();
        await rt.stop();

        const statusAfterStop = rt.getStatus();
        expect(statusAfterStop.shutdownRequested).toBe(true);

        await rt.initialize();

        const statusAfterReinit = rt.getStatus();
        expect(statusAfterReinit.initialized).toBe(true);
        expect(statusAfterReinit.shutdownRequested).toBe(false);
        expect(statusAfterReinit.running).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// runLoop()
// ═══════════════════════════════════════════════════════════════════════════

describe('runLoop()', () => {
    it('calls processJob repeatedly', async () => {
        let callCount = 0;
        const processJob = vi.fn().mockImplementation(async () => {
            callCount++;
        });
        const getActiveCount = vi.fn().mockReturnValue(0);
        const deps = createMockDeps({ processJob, getActiveCount, pollIntervalMs: 10 });
        const rt = createWorkerRuntime(deps);

        await rt.initialize();

        // Start runLoop
        const loopPromise = rt.runLoop();

        // Let it run a few iterations, then stop
        await new Promise((resolve) => setTimeout(resolve, 150));

        await rt.stop();
        await loopPromise;

        // Should have been called multiple times (at least 2-3)
        expect(callCount).toBeGreaterThanOrEqual(2);
    });

    it('does not crash when processJob throws', async () => {
        const processJob = vi
            .fn()
            .mockRejectedValueOnce(new Error('Transient failure'))
            .mockRejectedValueOnce(new Error('Another failure'))
            .mockResolvedValue(undefined);
        const getActiveCount = vi.fn().mockReturnValue(0);
        const deps = createMockDeps({ processJob, getActiveCount, pollIntervalMs: 10 });
        const rt = createWorkerRuntime(deps);

        await rt.initialize();

        const loopPromise = rt.runLoop();

        // Let enough time for a few iterations (including failures)
        await new Promise((resolve) => setTimeout(resolve, 60));

        await rt.stop();
        await loopPromise;

        // The loop should have completed without throwing
        // processJob should have been called (counting the successful ones too)
        expect(processJob).toHaveBeenCalled();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// stop()
// ═══════════════════════════════════════════════════════════════════════════

describe('stop()', () => {
    it('returns WorkerStopResult with drained, activeJobs, waitedMs', async () => {
        const rt = createRuntime();

        await rt.initialize();
        const result: WorkerStopResult = await rt.stop();

        expect(result).toHaveProperty('drained');
        expect(typeof result.drained).toBe('boolean');
        expect(result).toHaveProperty('activeJobs');
        expect(typeof result.activeJobs).toBe('number');
        expect(result).toHaveProperty('waitedMs');
        expect(typeof result.waitedMs).toBe('number');
    });

    it('sets drained to true when no active jobs', async () => {
        const getActiveCount = vi.fn().mockReturnValue(0);
        const rt = createRuntime(createMockDeps({ getActiveCount }));

        await rt.initialize();
        const result = await rt.stop();

        expect(result.drained).toBe(true);
        expect(result.activeJobs).toBe(0);
    });

    it('waits for active jobs during drain timeout', async () => {
        // Simulate 2 active jobs that complete after a short delay
        let activeCount = 2;
        const getActiveCount = vi.fn().mockImplementation(() => activeCount);
        const drain = vi.fn().mockImplementation(async (_timeoutMs: number) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            activeCount = 0;
        });
        const deps = createMockDeps({ getActiveCount, drain, pollIntervalMs: 10 });
        const rt = createWorkerRuntime(deps);

        await rt.initialize();
        const result = await rt.stop({ drainTimeoutMs: 1000 });

        expect(result.waitedMs).toBeGreaterThanOrEqual(0);
        expect(drain).toHaveBeenCalledWith(1000);
    });

    it('respects custom drainTimeoutMs option', async () => {
        const getActiveCount = vi.fn().mockReturnValue(0);
        const deps = createMockDeps({ getActiveCount });
        const rt = createWorkerRuntime(deps);

        await rt.initialize();

        const start = Date.now();
        const result = await rt.stop({ drainTimeoutMs: 500 });
        const elapsed = Date.now() - start;

        expect(elapsed).toBeLessThan(550); // shouldn't wait full 500ms if no active jobs
        expect(result.waitedMs).toBeLessThanOrEqual(elapsed);
    });

    it('calls deps.drain() when provided', async () => {
        const drain = vi.fn().mockResolvedValue(undefined);
        const getActiveCount = vi.fn().mockReturnValue(0);
        const deps = createMockDeps({ getActiveCount, drain });
        const rt = createWorkerRuntime(deps);

        await rt.initialize();
        await rt.stop();

        expect(drain).toHaveBeenCalledOnce();
    });

    it('sets shutdownRequested in status', async () => {
        const rt = createRuntime();

        await rt.initialize();

        const statusBefore = rt.getStatus();
        expect(statusBefore.shutdownRequested).toBe(false);

        await rt.stop();

        const statusAfter = rt.getStatus();
        expect(statusAfter.shutdownRequested).toBe(true);
    });

    it('terminates runLoop', async () => {
        const processJob = vi.fn().mockResolvedValue(undefined);
        const getActiveCount = vi.fn().mockReturnValue(0);
        const deps = createMockDeps({ processJob, getActiveCount, pollIntervalMs: 10 });
        const rt = createWorkerRuntime(deps);

        await rt.initialize();

        const loopPromise = rt.runLoop();

        // Small wait to ensure loop starts
        await new Promise((resolve) => setTimeout(resolve, 15));

        await rt.stop();
        await loopPromise; // should resolve now

        // After loop ends, processJob should not be called again
        const callCountAfterStop = processJob.mock.calls.length;
        await new Promise((resolve) => setTimeout(resolve, 30));
        expect(processJob.mock.calls.length).toBe(callCountAfterStop);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// getStatus()
// ═══════════════════════════════════════════════════════════════════════════

describe('getStatus()', () => {
    it('returns initialized=false before initialize()', () => {
        const rt = createRuntime();
        const status: WorkerRuntimeStatus = rt.getStatus();

        expect(status.initialized).toBe(false);
    });

    it('returns initialized=true after initialize()', async () => {
        const rt = createRuntime();

        await rt.initialize();
        const status = rt.getStatus();

        expect(status.initialized).toBe(true);
    });

    it('returns running=true after initialize and before stop', async () => {
        const rt = createRuntime();

        await rt.initialize();
        const status = rt.getStatus();

        expect(status.running).toBe(true);
        expect(status.shutdownRequested).toBe(false);
    });

    it('returns running=false after stop', async () => {
        const rt = createRuntime();

        await rt.initialize();
        await rt.stop();

        const status = rt.getStatus();
        expect(status.running).toBe(false);
    });

    it('reflects activeJobs count from deps.getActiveCount()', () => {
        const getActiveCount = vi.fn().mockReturnValue(5);
        const rt = createRuntime(createMockDeps({ getActiveCount }));

        const status = rt.getStatus();
        expect(status.activeJobs).toBe(5);
    });

    it('returns activeJobs=0 when getActiveCount returns 0', () => {
        const getActiveCount = vi.fn().mockReturnValue(0);
        const rt = createRuntime(createMockDeps({ getActiveCount }));

        const status = rt.getStatus();
        expect(status.activeJobs).toBe(0);
    });
});

