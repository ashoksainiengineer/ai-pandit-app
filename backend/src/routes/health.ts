/**
 * 🔱 AI-Pandit Health & Monitoring Routes
 * =======================================
 * Comprehensive health checks and system monitoring endpoints.
 */

import { Router } from 'express';
import { db } from '../database/drizzle.js';
import { sql } from 'drizzle-orm';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { sendSuccess, sendServiceUnavailable } from '../utils/response.js';

const router = Router();

// ═════════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════════

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: ComponentStatus;
    aiService: ComponentStatus;
    queue: ComponentStatus;
    memory: ComponentStatus;
  };
}

interface ComponentStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  message?: string;
  details?: Record<string, unknown>;
}

interface SystemMetrics {
  timestamp: string;
  memory: MemoryMetrics;
  cpu: CpuMetrics;
  queue: QueueMetrics;
  database: DatabaseMetrics;
}

interface MemoryMetrics {
  used: number;
  total: number;
  percentage: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
}

interface CpuMetrics {
  user: number;
  system: number;
  percentage: number;
}

interface QueueMetrics {
  active: number;
  queued: number;
  completed: number;
  failed: number;
}

interface DatabaseMetrics {
  connections: number;
  queryTime: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK ENDPOINT
// ═════════════════════════════════════════════════════════════════════════════

router.get('/', async (_req, res) => {
  const startTime = Date.now();
  
  try {
    const health = await performHealthCheck();
    const isHealthy = health.status === 'healthy';
    
    if (isHealthy) {
      sendSuccess(res, health);
    } else {
      sendServiceUnavailable(res, 'Service is degraded');
    }
  } catch (error) {
    logger.error('Health check failed', error);
    sendServiceUnavailable(res, 'Health check failed');
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// READINESS CHECK
// ═════════════════════════════════════════════════════════════════════════════

router.get('/ready', async (_req, res) => {
  try {
    const dbStatus = await checkDatabase();
    
    if (dbStatus.status === 'up') {
      sendSuccess(res, { ready: true, timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ ready: false, error: 'Database not ready' });
    }
  } catch (error) {
    res.status(503).json({ ready: false, error: 'Readiness check failed' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// LIVENESS CHECK
// ═════════════════════════════════════════════════════════════════════════════

router.get('/live', (_req, res) => {
  sendSuccess(res, {
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// METRICS ENDPOINT
// ═════════════════════════════════════════════════════════════════════════════

router.get('/metrics', async (_req, res) => {
  try {
    const metrics = await collectMetrics();
    sendSuccess(res, metrics);
  } catch (error) {
    logger.error('Metrics collection failed', error);
    sendServiceUnavailable(res, 'Failed to collect metrics');
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// SYSTEM STATUS
// ═════════════════════════════════════════════════════════════════════════════

router.get('/status', async (_req, res) => {
  try {
    const status = await getSystemStatus();
    sendSuccess(res, status);
  } catch (error) {
    logger.error('Status check failed', error);
    sendServiceUnavailable(res, 'Failed to get system status');
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

async function performHealthCheck(): Promise<HealthStatus> {
  const startTime = Date.now();
  
  const [dbStatus, aiStatus, queueStatus, memoryStatus] = await Promise.all([
    checkDatabase(),
    checkAIService(),
    checkQueue(),
    checkMemory(),
  ]);
  
  const checks = {
    database: dbStatus,
    aiService: aiStatus,
    queue: queueStatus,
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
    version: process.env.npm_package_version || '2.0.0',
    uptime: process.uptime(),
    checks,
  };
}

async function checkDatabase(): Promise<ComponentStatus> {
  const startTime = Date.now();
  
  try {
    await db.run(sql`SELECT 1`);
    return {
      status: 'up',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'down',
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

async function checkAIService(): Promise<ComponentStatus> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${config.ai.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${config.ai.apiKey}`,
      },
    });
    
    if (response.ok) {
      return {
        status: 'up',
        responseTime: Date.now() - startTime,
      };
    }
    
    return {
      status: 'degraded',
      message: `AI service returned ${response.status}`,
    };
  } catch (error) {
    return {
      status: 'down',
      message: error instanceof Error ? error.message : 'AI service check failed',
    };
  }
}

async function checkQueue(): Promise<ComponentStatus> {
  try {
    const memoryUsage = process.memoryUsage();
    const heapUsedGB = memoryUsage.heapUsed / 1024 / 1024 / 1024;
    
    if (heapUsedGB > config.memory.criticalThresholdGB) {
      return {
        status: 'degraded',
        message: `High memory usage: ${heapUsedGB.toFixed(2)}GB`,
        details: { heapUsedGB },
      };
    }
    
    return {
      status: 'up',
      details: { memoryUsageGB: heapUsedGB },
    };
  } catch (error) {
    return {
      status: 'down',
      message: error instanceof Error ? error.message : 'Queue check failed',
    };
  }
}

function checkMemory(): ComponentStatus {
  const usage = process.memoryUsage();
  const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
  const heapUsedGB = usage.heapUsed / 1024 / 1024 / 1024;
  
  let status: ComponentStatus['status'] = 'up';
  let message: string | undefined;
  
  if (heapUsedGB > config.memory.criticalThresholdGB) {
    status = 'down';
    message = `Critical memory usage: ${heapUsedGB.toFixed(2)}GB`;
  } else if (heapUsedPercent > config.memory.thresholdPercent) {
    status = 'degraded';
    message = `High memory usage: ${heapUsedPercent.toFixed(1)}%`;
  }
  
  return {
    status,
    message,
    details: {
      heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsedPercent: Math.round(heapUsedPercent * 100) / 100,
      rssMB: Math.round(usage.rss / 1024 / 1024),
    },
  };
}

async function collectMetrics(): Promise<SystemMetrics> {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    timestamp: new Date().toISOString(),
    memory: {
      used: memoryUsage.rss,
      total: memoryUsage.heapTotal,
      percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
      percentage: ((cpuUsage.user + cpuUsage.system) / 1e6), // Convert to milliseconds
    },
    queue: {
      active: 0, // Would need to be populated from actual queue state
      queued: 0,
      completed: 0,
      failed: 0,
    },
    database: {
      connections: 1, // Simplified - would need actual connection pool metrics
      queryTime: 0,
    },
  };
}

async function getSystemStatus(): Promise<Record<string, unknown>> {
  return {
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    environment: config.server.env,
    node: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    config: {
      maxConcurrent: config.queue.maxConcurrent,
      aiModel: config.ai.model,
      enableGodTier: config.features.enableGodTierEnhancement,
    },
  };
}

export default router;
