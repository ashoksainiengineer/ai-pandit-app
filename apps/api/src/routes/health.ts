// HEALTH & MONITORING ROUTES
// Comprehensive health checks and system monitoring endpoints

import { Router, Request, Response } from 'express';
import { checkDatabaseHealth, db } from '@ai-pandit/db';
import { jobs } from '@ai-pandit/db/schema';
import { count, eq, sql } from 'drizzle-orm';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { getEphemerisProviderStatus } from '../lib/ephemeris.js';
import { getQueueDriver } from '../lib/queue/index.js';
import { getSloAlerts, getSloSnapshot } from '../lib/observability/slo-monitor.js';
import { getOtlpExporterStats } from '../lib/observability/otlp-exporter.js';
import { getCircuitSnapshots } from '../lib/resilience/dependency-circuit-breaker.js';
import { getQueueRecoveryTelemetry as _getQueueRecoveryTelemetry } from '../lib/metrics-reporter.js';

const router = Router();

// TYPES

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: ComponentStatus;
    memory: ComponentStatus;
  };
}

interface ComponentStatus {
  status: 'up' | 'down' | 'degraded';
  responseTimeMs?: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface ApiReadinessStatus {
  ready: boolean;
  timestamp: string;
  dbLatencyMs?: number;
  dependencies: {
    database: 'ready' | 'not-ready';
    ephemeris: 'ready' | 'not-ready';
  };
  errors: {
    database: string | null;
    ephemeris: string | null;
  };
  ephemerisProvider: ReturnType<typeof getEphemerisProviderStatus>;
}

async function withDbHealthTimeout() {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) =>
    timer = setTimeout(() => reject(new Error('DB health check timeout')), 5000)
  );
  try {
    return await Promise.race([checkDatabaseHealth(), timeout]);
  } finally {
    // BUG-FIX: Clear timeout to prevent resource leak
    if (timer) clearTimeout(timer);
  }
}

export async function getApiReadinessStatus(): Promise<ApiReadinessStatus> {
  const timestamp = new Date().toISOString();
  const ephemerisProvider = getEphemerisProviderStatus();

  try {
    const dbHealth = await withDbHealthTimeout();
    const ready = dbHealth.healthy && ephemerisProvider.ready;

    return {
      ready,
      timestamp,
      dbLatencyMs: dbHealth.latencyMs,
      dependencies: {
        database: dbHealth.healthy ? 'ready' : 'not-ready',
        ephemeris: ephemerisProvider.ready ? 'ready' : 'not-ready',
      },
      errors: {
        database: dbHealth.healthy ? null : (dbHealth.error ?? 'Database not ready'),
        ephemeris: ephemerisProvider.ready ? null : 'Ephemeris provider not ready',
      },
      ephemerisProvider,
    };
  } catch (error) {
    return {
      ready: false,
      timestamp,
      dependencies: {
        database: 'not-ready',
        ephemeris: ephemerisProvider.ready ? 'ready' : 'not-ready',
      },
      errors: {
        database: `Readiness check failed: ${(error as Error).message}`,
        ephemeris: ephemerisProvider.ready ? null : 'Ephemeris provider not ready',
      },
      ephemerisProvider,
    };
  }
}

// HEALTH CHECK ENDPOINT

router.get('/', async (_req: Request, res: Response) => {
  try {
    const health = await performHealthCheck();
    const isHealthy = health.status === 'healthy';

    res.status(isHealthy ? 200 : 503).json(health);
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// READINESS CHECK

router.get('/ready', async (_req: Request, res: Response) => {
  const readiness = await getApiReadinessStatus();

  if (!readiness.ready) {
    logger.warn('Readiness check failed', readiness.errors);
  }

  res.status(readiness.ready ? 200 : 503).json(readiness);
});

// LIVENESS CHECK

router.get('/live', (_req: Request, res: Response) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
  });
});

// METRICS ENDPOINT

router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const [dbHealth, metrics] = await Promise.all([
      checkDatabaseHealth(),
      collectMetrics(),
    ]);

    res.json({
      timestamp: new Date().toISOString(),
      database: {
        healthy: dbHealth.healthy,
        latencyMs: dbHealth.latencyMs,
      },
      ...metrics,
    });
  } catch (error) {
    logger.error('Metrics collection failed', error);
    res.status(503).json({ error: 'Failed to collect metrics' });
  }
});

// HELPER FUNCTIONS

async function performHealthCheck(): Promise<HealthStatus> {
  const [dbStatus, memoryStatus] = await Promise.all([
    checkDatabaseComponent(),
    checkMemoryComponent(),
  ]);

  const checks = {
    database: dbStatus,
    memory: memoryStatus,
  };

  const allUp = Object.values(checks).every((c) => c.status === 'up');
  const anyDown = Object.values(checks).some((c) => c.status === 'down');

  let status: HealthStatus['status'] = 'healthy';
  if (anyDown) status = 'unhealthy';
  else if (!allUp) status = 'degraded';

  return {
    status,
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime(),
    checks,
  };
}

async function checkDatabaseComponent(): Promise<ComponentStatus> {
  const health = await checkDatabaseHealth();

  if (health.healthy) {
    return {
      status: 'up',
      responseTimeMs: health.latencyMs,
    };
  }

  return {
    status: 'down',
    message: health.error || 'Database connection failed',
  };
}

function checkMemoryComponent(): ComponentStatus {
  const usage = process.memoryUsage();
  const rssGB = usage.rss / 1024 / 1024 / 1024;
  const heapUsedGB = usage.heapUsed / 1024 / 1024 / 1024;

  let status: ComponentStatus['status'] = 'up';
  let message: string | undefined;

  if (rssGB > config.performance.rssThresholdGB) {
    status = 'degraded';
    message = `High RSS memory: ${rssGB.toFixed(2)}GB`;
  } else if (heapUsedGB > config.performance.heapThresholdGB) {
    status = 'degraded';
    message = `High heap memory: ${heapUsedGB.toFixed(2)}GB`;
  }

  return {
    status,
    message,
    details: {
      rssMB: Math.round(usage.rss / 1024 / 1024),
      heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
      externalMB: Math.round(usage.external / 1024 / 1024),
    },
  };
}

import { getActiveProcessingCount } from '../lib/queue-manager.js';

async function collectMetrics(): Promise<Record<string, unknown>> {
  const queueDriver = getQueueDriver();
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  let activeJobs: Awaited<ReturnType<typeof queueDriver.listActiveJobs>> = [];
  let activeByStatus: Record<string, number> = {};
  let failedTerminalJobs = 0;
  let totalRetryCount = 0;

  try {
    activeJobs = await queueDriver.listActiveJobs();
    activeByStatus = activeJobs.reduce<Record<string, number>>((acc, job) => {
      acc[job.status] = (acc[job.status] ?? 0) + 1;
      return acc;
    }, {});

    const [failedTerminalJobsResult, retrySummaryResult] = await Promise.all([
      db.select({ count: count() }).from(jobs).where(eq(jobs.status, 'failed')),
      db
        .select({
          retryCount: sql<number>`COALESCE(SUM(${jobs.retryCount}), 0)`,
        })
        .from(jobs),
    ]);

    failedTerminalJobs = failedTerminalJobsResult[0]?.count ?? 0;
    totalRetryCount = retrySummaryResult[0]?.retryCount ?? 0;
  } catch (error) {
    logger.warn('Job metrics collection failed, returning zeroed runtime metrics', {
      error: (error as Error).message,
    });
  }

  const queueDepth = (activeByStatus.queued ?? 0) + (activeByStatus.retrying ?? 0);
  const activeJobCount = (activeByStatus.running ?? 0) + (activeByStatus.retrying ?? 0);
  const recoveryTelemetry = _getQueueRecoveryTelemetry();
  const otlpStats = getOtlpExporterStats();
  const sloConfig = config.observability?.slo ?? {
    windowMs: 300000,
    minSampleSize: 20,
    errorRateAlertPercent: 5,
    p95LatencyAlertMs: 5000,
  };
  const sloSnapshot = getSloSnapshot(sloConfig.windowMs);
  const alerts: Array<{ code: string; severity: 'warning' | 'critical'; message: string }> = [];

  if (recoveryTelemetry.alertActive) {
    alerts.push({
      code: 'WORKER_RECOVERY_ALERT',
      severity: recoveryTelemetry.lastAbandonedAttempts > 0 ? 'critical' : 'warning',
      message: `Recovered=${recoveryTelemetry.lastRecoveredJobs}, abandonedAttempts=${recoveryTelemetry.lastAbandonedAttempts}`,
    });
  }
  alerts.push(...getSloAlerts({
    windowMs: sloConfig.windowMs,
    minSampleSize: sloConfig.minSampleSize,
    errorRateAlertPercent: sloConfig.errorRateAlertPercent,
    p95LatencyAlertMs: sloConfig.p95LatencyAlertMs,
  }));

  return {
    memory: {
      rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      externalMB: Math.round(memoryUsage.external / 1024 / 1024),
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
    },
    realtime: {
      activeProcessingSlots: getActiveProcessingCount(),
      activeQueueProcessing: getActiveProcessingCount(),
          circuitBreakers: getCircuitSnapshots(),
      recovery: recoveryTelemetry,
      otlp: otlpStats,
    },
    jobs: {
      activeTotal: activeJobs.length,
      byStatus: activeByStatus,
      queueDepth,
      activeJobCount,
      retryCount: totalRetryCount,
      failedTerminalJobs,
    },
    slo: sloSnapshot,
    config: {
      nodeEnv: config.app.nodeEnv,
      maxConcurrentSessions: config.performance.maxConcurrentSessions,
      maxActiveJobsPerUser: config.queue.maxActiveJobsPerUser,
      maxActiveJobsByTier: config.queue.maxActiveJobsByTier,
      loadShedQueueDepth: config.queue.loadShedQueueDepth,
      aiModel: config.ai.model,
      jobExecutionMode: config.queue.executionMode,
      queueArchitecture: config.queue.architecture,
      queueDriver: queueDriver.name,
      workerRecoveryAlertThreshold: config.queue.recoveryAlertThreshold,
      observability: config.observability,
      features: config.features,
    },
    alerts,
  };
}

export default router;
