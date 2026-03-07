// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH & MONITORING ROUTES
// Comprehensive health checks and system monitoring endpoints
// ═══════════════════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '@ai-pandit/db';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// READINESS CHECK
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/ready', async (_req: Request, res: Response) => {
  try {
    const dbHealth = await checkDatabaseHealth();

    if (dbHealth.healthy) {
      res.json({
        ready: true,
        timestamp: new Date().toISOString(),
        dbLatencyMs: dbHealth.latencyMs,
      });
    } else {
      res.status(503).json({
        ready: false,
        error: 'Database not ready',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: 'Readiness check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// LIVENESS CHECK
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/live', (_req: Request, res: Response) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// METRICS ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function performHealthCheck(): Promise<HealthStatus> {
  const startTime = Date.now();

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

import { getActiveSseCount } from './stream.js';
import { getActiveQueueCount } from '../lib/queue-manager.js';

async function collectMetrics(): Promise<Record<string, unknown>> {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

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
      activeSseConnections: getActiveSseCount(),
      activeQueueProcessing: getActiveQueueCount(),
    },
    config: {
      nodeEnv: config.app.nodeEnv,
      maxConcurrentSessions: config.performance.maxConcurrentSessions,
      aiModel: config.ai.model,
    },
  };
}

export default router;
