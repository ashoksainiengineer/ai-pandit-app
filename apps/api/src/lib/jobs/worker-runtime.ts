import { ensureDatabaseInitialized } from '@ai-pandit/db';
import { config } from '../../config/index.js';
import { logger } from '../logger.js';
import { recoverInterruptedJobsOnStartup, runQueueIteration } from '../queue-manager.js';
import { initEphemerisProvider } from '../ephemeris.js';

export interface WorkerRuntimeOptions {
  pollIntervalMs?: number;
}

export async function initializeWorkerRuntime(
  options: WorkerRuntimeOptions = {}
): Promise<{ pollIntervalMs: number; recoveredJobs: number }> {
  const pollIntervalMs = options.pollIntervalMs ?? config.queue.pollIntervalMs;
  logger.info('Standalone worker bootstrapping', {
    pollIntervalMs,
    executionMode: config.queue.executionMode,
    architecture: config.queue.architecture,
  });

  await ensureDatabaseInitialized();
  await initEphemerisProvider();
  const recovery = await recoverInterruptedJobsOnStartup();

  return {
    pollIntervalMs,
    recoveredJobs: recovery.recoveredJobs,
  };
}

export async function runStandaloneWorkerLoop(): Promise<never> {
  while (true) {
    await runQueueIteration();
  }
}

export async function startStandaloneWorker(
  options: WorkerRuntimeOptions = {}
): Promise<never> {
  await initializeWorkerRuntime(options);
  return runStandaloneWorkerLoop();
}
