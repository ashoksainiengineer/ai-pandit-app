import { logger } from '../lib/logger.js';

interface MetricsResponse {
  database?: {
    healthy?: boolean;
    latencyMs?: number;
  };
  realtime?: {
    activeSseConnections?: number;
    activeQueueProcessing?: number;
  };
  jobs?: {
    queueDepth?: number;
    activeJobCount?: number;
    retryCount?: number;
    failedTerminalJobs?: number;
  };
  config?: {
    jobExecutionMode?: string;
    queueArchitecture?: string;
  };
}

async function main(): Promise<void> {
  const baseUrl = process.env.WORKER_HEALTH_URL ?? 'http://localhost:3001';
  const token = process.env.WORKER_HEALTH_BEARER_TOKEN;
  const url = `${baseUrl.replace(/\/+$/, '')}/api/health/metrics`;

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Health verification failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as MetricsResponse;
  if (!payload.database?.healthy) {
    throw new Error('Database health is not healthy');
  }

  logger.info('Worker health verification passed', {
    url,
    dbLatencyMs: payload.database.latencyMs ?? null,
    activeQueueProcessing: payload.realtime?.activeQueueProcessing ?? 0,
    queueDepth: payload.jobs?.queueDepth ?? 0,
    retryCount: payload.jobs?.retryCount ?? 0,
    failedTerminalJobs: payload.jobs?.failedTerminalJobs ?? 0,
    jobExecutionMode: payload.config?.jobExecutionMode ?? 'unknown',
    queueArchitecture: payload.config?.queueArchitecture ?? 'unknown',
  });
}

main().catch((error) => {
  logger.error('Worker health verification failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
