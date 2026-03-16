/**
 * Worker Runtime - API Implementation
 * 
 * This module provides the worker runtime implementation for the API.
 * It uses the shared @ai-pandit/worker-runtime package for core functionality
 * while providing API-specific implementations for job processing.
 */

import { ensureDatabaseInitialized } from '@ai-pandit/db';
import { config } from '../../config/index.js';
import { logger } from '../logger.js';
import {
  getActiveQueueCount,
  recoverInterruptedJobsOnStartup,
  runQueueIteration,
  waitForQueueDrain,
} from '../queue-manager.js';
import { initEphemerisProvider } from '../ephemeris.js';
import { createWorkerRuntime, type WorkerRuntime, type WorkerDependencies } from '@ai-pandit/worker-runtime';

// Legacy exports for backward compatibility
export interface WorkerRuntimeOptions {
  pollIntervalMs?: number;
}

let workerRuntimeInstance: WorkerRuntime | null = null;

/**
 * Create worker dependencies for API context
 */
function createAPIDependencies(): WorkerDependencies {
  return {
    pollIntervalMs: config.queue.pollIntervalMs,
    
    initialize: async () => {
      await ensureDatabaseInitialized();
      await initEphemerisProvider();
    },
    
    processJob: async () => {
      await runQueueIteration();
    },
    
    getActiveCount: () => getActiveQueueCount(),
    
    drain: async (timeoutMs: number) => {
      await waitForQueueDrain(timeoutMs);
    },
    
    recover: async () => {
      const recovery = await recoverInterruptedJobsOnStartup();
      if (
        recovery.recoveredJobs >= (config.queue.recoveryAlertThreshold ?? 1) ||
        recovery.abandonedAttempts >= (config.queue.recoveryAlertThreshold ?? 1)
      ) {
        logger.warn('Worker startup recovery threshold exceeded', {
          recoveredJobs: recovery.recoveredJobs,
          abandonedAttempts: recovery.abandonedAttempts,
          threshold: config.queue.recoveryAlertThreshold,
        });
      }
      return recovery;
    },
  };
}

/**
 * Get or create the worker runtime instance
 */
function getWorkerRuntime(): WorkerRuntime {
  if (!workerRuntimeInstance) {
    workerRuntimeInstance = createWorkerRuntime(createAPIDependencies());
  }
  return workerRuntimeInstance;
}

/**
 * Initialize the worker runtime
 */
export async function initializeWorkerRuntime(
  options: WorkerRuntimeOptions = {}
): Promise<{ pollIntervalMs: number; recoveredJobs: number }> {
  const runtime = getWorkerRuntime();
  const result = await runtime.initialize(options);
  
  logger.info('Standalone worker bootstrapping', {
    pollIntervalMs: result.pollIntervalMs,
    executionMode: config.queue.executionMode,
    architecture: config.queue.architecture,
  });
  
  return result;
}

/**
 * Run the standalone worker loop
 */
export async function runStandaloneWorkerLoop(): Promise<void> {
  const runtime = getWorkerRuntime();
  await runtime.runLoop();
}

/**
 * Stop the standalone worker
 */
export async function stopStandaloneWorker(options: {
  drainTimeoutMs?: number;
} = {}): Promise<{ drained: boolean; activeJobs: number; waitedMs: number }> {
  const runtime = getWorkerRuntime();
  const result = await runtime.stop(options);
  
  logger.info('Standalone worker stop requested', result as unknown as Record<string, unknown>);
  return result;
}

/**
 * Get worker runtime status
 */
export function getWorkerRuntimeStatus(): {
  initialized: boolean;
  shutdownRequested: boolean;
  activeJobs: number;
  running: boolean;
} {
  const runtime = getWorkerRuntime();
  return runtime.getStatus();
}

/**
 * Start the standalone worker
 */
export async function startStandaloneWorker(
  options: WorkerRuntimeOptions = {}
): Promise<void> {
  await initializeWorkerRuntime(options);
  return runStandaloneWorkerLoop();
}
