/**
 * Worker Runtime Package
 * Shared runtime for standalone worker and inline processing
 *
 * This package provides the core worker runtime that can be used by both
 * the API (for inline processing) and the standalone worker.
 */

import type {
  WorkerDependencies,
  WorkerInitializationResult,
  WorkerRuntime,
  WorkerRuntimeOptions,
  WorkerRuntimeStatus,
  WorkerStopResult,
} from './types.js';

// Re-export shared types for consumers
export type {
  WorkerDependencies,
  WorkerInitializationResult,
  WorkerRuntime,
  WorkerRuntimeOptions,
  WorkerRuntimeStatus,
  WorkerStopResult,
  RecoveryResult,
  QueueJob,
  QueueStatus,
  WorkerConfig,
  JobProcessor,
} from './types.js';

// Default configuration
const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_DRAIN_TIMEOUT_MS = 30000;

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
      let consecutiveFailures = 0;
      const MAX_BACKOFF_MS = 60000; // cap backoff at 1 minute
      
      while (state.shouldRunLoop) {
        try {
          // Calculate delay: use backoff if failing, normal poll otherwise
          const delayMs = consecutiveFailures > 0
            ? Math.min(state.pollIntervalMs * Math.pow(2, consecutiveFailures - 1), MAX_BACKOFF_MS)
            : state.pollIntervalMs;

          await new Promise((resolve) => setTimeout(resolve, delayMs));

          if (!state.shouldRunLoop) {
            break;
          }

          await deps.processJob();

          // Success — reset failure counter
          consecutiveFailures = 0;
        } catch (error) {
          consecutiveFailures++;
          console.error('[WORKER-RUNTIME] Error in worker loop:', error);
        }
      }
    },

    async stop(options: { drainTimeoutMs?: number } = {}): Promise<WorkerStopResult> {
      const drainTimeout = options.drainTimeoutMs ?? DEFAULT_DRAIN_TIMEOUT_MS;
      state.shutdownRequested = true;
      state.shouldRunLoop = false;

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
  };
}
