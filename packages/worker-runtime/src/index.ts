/**
 * Worker Runtime Package
 * Shared runtime for standalone worker and inline processing
 * 
 * This package provides the core worker runtime that can be used by both
 * the API (for inline processing) and the standalone worker.
 */

// Default configuration
const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_DRAIN_TIMEOUT_MS = 30000;

// ═════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═════════════════════════════════════════════════════════════════════════════

export interface WorkerRuntimeOptions {
  pollIntervalMs?: number;
}

export interface WorkerInitializationResult {
  pollIntervalMs: number;
  recoveredJobs: number;
}

export interface WorkerStopResult {
  drained: boolean;
  activeJobs: number;
  waitedMs: number;
}

export interface WorkerRuntimeStatus {
  initialized: boolean;
  shutdownRequested: boolean;
  activeJobs: number;
  running: boolean;
}

export interface RecoveryResult {
  recoveredJobs: number;
  abandonedAttempts: number;
}

export interface WorkerDependencies {
  pollIntervalMs?: number;
  initialize?: () => Promise<void>;
  processJob: () => Promise<void>;
  getActiveCount: () => number;
  drain?: (timeoutMs: number) => Promise<void>;
  recover: () => Promise<RecoveryResult>;
}

export interface WorkerRuntime {
  initialize(options?: WorkerRuntimeOptions): Promise<WorkerInitializationResult>;
  runLoop(): Promise<void>;
  stop(options?: { drainTimeoutMs?: number }): Promise<WorkerStopResult>;
  getStatus(): WorkerRuntimeStatus;
  on(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
}

export interface QueueJob {
  id: string;
  sessionId: string;
  userId: string;
  payload: Record<string, unknown>;
  attempt: number;
  maxAttempts: number;
}

export type JobProcessor = (job: QueueJob, signal: AbortSignal) => Promise<void>;

// ═════════════════════════════════════════════════════════════════════════════
// WORKER RUNTIME FACTORY
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Create a new worker runtime instance
 * 
 * This factory function creates a runtime with the provided dependencies,
 * making it independent of any specific implementation details.
 */
export function createWorkerRuntime(deps: WorkerDependencies): WorkerRuntime {
  const state = {
    shouldRunLoop: true,
    shutdownRequested: false,
    initialized: false,
    pollIntervalMs: deps.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
    activeJobs: 0,
  };

  return {
    async initialize(options: WorkerRuntimeOptions = {}): Promise<WorkerInitializationResult> {
      state.shouldRunLoop = true;
      state.shutdownRequested = false;
      state.pollIntervalMs = options.pollIntervalMs ?? deps.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

      console.log('[WORKER-RUNTIME] Initializing...', {
        pollIntervalMs: state.pollIntervalMs,
      });

      // Run custom initialization if provided
      if (deps.initialize) {
        await deps.initialize();
      }

      // Recover interrupted jobs
      const recovery = await deps.recover();

      state.initialized = true;

      return {
        pollIntervalMs: state.pollIntervalMs,
        recoveredJobs: recovery.recoveredJobs,
      };
    },

    async runLoop(): Promise<void> {
      if (!deps.processJob) {
        throw new Error('[WORKER-RUNTIME] No processJob function provided');
      }

      console.log('[WORKER-RUNTIME] Starting worker loop');

      while (state.shouldRunLoop) {
        try {
          // Wait for poll interval
          await new Promise((resolve) => setTimeout(resolve, state.pollIntervalMs));

          if (!state.shouldRunLoop) {
            break;
          }

          // Process one iteration
          await deps.processJob();
        } catch (error) {
          console.error('[WORKER-RUNTIME] Error in worker loop:', error);
          // Continue loop - don't crash on transient errors
        }
      }

      console.log('[WORKER-RUNTIME] Worker loop ended');
    },

    async stop(options: { drainTimeoutMs?: number } = {}): Promise<WorkerStopResult> {
      const drainTimeout = options.drainTimeoutMs ?? DEFAULT_DRAIN_TIMEOUT_MS;
      state.shutdownRequested = true;
      state.shouldRunLoop = false;

      console.log('[WORKER-RUNTIME] Stopping worker...', { drainTimeoutMs: drainTimeout });

      const startTime = Date.now();

      // Wait for active jobs to complete
      while (deps.getActiveCount() > 0 && Date.now() - startTime < drainTimeout) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Run custom drain if provided
      if (deps.drain) {
        await deps.drain(drainTimeout);
      }

      const waitedMs = Date.now() - startTime;
      const activeJobs = deps.getActiveCount();
      const drained = activeJobs === 0;

      console.log('[WORKER-RUNTIME] Worker stopped', {
        drained,
        activeJobs,
        waitedMs,
      });

      return {
        drained,
        activeJobs,
        waitedMs,
      };
    },

    getStatus(): WorkerRuntimeStatus {
      return {
        initialized: state.initialized,
        shutdownRequested: state.shutdownRequested,
        activeJobs: deps.getActiveCount(),
        running: state.shouldRunLoop && !state.shutdownRequested,
      };
    },

    on(_event: string, _listener: (...args: any[]) => void): void {
      // Event subscription (for future use)
    },

    emit(_event: string, ..._args: any[]): void {
      // Event emission (for future use)
    },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// LEGACY EXPORTS (DEPRECATED - for backward compatibility)
// ═════════════════════════════════════════════════════════════════════════════

export async function initializeWorkerRuntime(): Promise<never> {
  throw new Error('[WORKER-RUNTIME] Use createWorkerRuntime() instead');
}

export async function runStandaloneWorkerLoop(): Promise<never> {
  throw new Error('[WORKER-RUNTIME] Use createWorkerRuntime().runLoop() instead');
}

export async function stopStandaloneWorker(): Promise<never> {
  throw new Error('[WORKER-RUNTIME] Use createWorkerRuntime().stop() instead');
}

export function getWorkerRuntimeStatus(): WorkerRuntimeStatus {
  return {
    initialized: false,
    shutdownRequested: false,
    activeJobs: 0,
    running: false,
  };
}

export async function startStandaloneWorker(): Promise<never> {
  throw new Error('[WORKER-RUNTIME] Use createWorkerRuntime() instead');
}

export function getActiveQueueCount(): number {
  return 0;
}
