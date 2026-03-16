import './load-env.js';
import { logger } from '../lib/logger.js';

interface MetricsResponse {
  service?: string;
  healthy?: boolean;
  ready?: boolean;
  workerStarted?: boolean;
  shutdownRequested?: boolean;
  draining?: boolean;
  startupError?: string | null;
  runtimeStatus?: {
    running?: boolean;
    pollIntervalMs?: number;
    activeJobs?: number;
    queueArchitecture?: string;
    jobExecutionMode?: string;
    lastError?: string | null;
  };
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

async function main(): Promise<void> {
  const baseUrl = getRequiredEnv('WORKER_HEALTH_URL');
  const token = process.env.WORKER_HEALTH_BEARER_TOKEN;
  const url = `${baseUrl.replace(/\/+$/, '')}/health`;

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Health verification failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as MetricsResponse;
  if (!payload.healthy || !payload.ready || !payload.runtimeStatus?.running) {
    throw new Error(
      payload.startupError
        ? `Worker is not ready: ${payload.startupError}`
        : 'Worker is not healthy or ready'
    );
  }

  logger.info('Worker health verification passed', {
    url,
    service: payload.service ?? 'unknown',
    workerStarted: payload.workerStarted ?? false,
    draining: payload.draining ?? false,
    activeJobs: payload.runtimeStatus?.activeJobs ?? 0,
    pollIntervalMs: payload.runtimeStatus?.pollIntervalMs ?? null,
    jobExecutionMode: payload.runtimeStatus?.jobExecutionMode ?? 'unknown',
    queueArchitecture: payload.runtimeStatus?.queueArchitecture ?? 'unknown',
  });
}

main().catch((error) => {
  logger.error('Worker health verification failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
