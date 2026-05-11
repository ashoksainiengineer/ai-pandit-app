import { config } from 'dotenv';
import { createServer } from 'node:http';
import {
  createWorkerRuntime,
  createRedisQueueClient,
  type WorkerRuntime,
  type RedisQueueClient,
} from '@ai-pandit/worker-runtime';
import {
  updateJobProgress,
  completeJob,
  failJob,
  db,
  executeWithRetry,
  verifyDatabaseConnection,
} from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq, and } from 'drizzle-orm';
import type { SecondsPrecisionInput, SecondsPrecisionResult } from '@ai-pandit/shared';
import { createEncryption } from '@ai-pandit/shared';
import { Redis } from 'ioredis';
import { initRedisEventStore } from '../../api/src/lib/redis-event-store.js';
import { adaptIORedis } from '../../api/src/lib/redis-adapter.js';


// Load environment variables
config({ path: '.env' });
config({ path: '.env.local' });

const pollIntervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS || 2000);
const port = Number(process.env.PORT || 8080);
const drainTimeoutMs = Number(process.env.WORKER_DRAIN_TIMEOUT_MS || 30000);

// ── Encryption instance (shared crypto-factory, validates ≥32 chars) ───────
const crypto = (() => {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      `FATAL: ENCRYPTION_SECRET must be ≥32 characters (got ${secret?.length ?? 0}). ` +
      'Worker cannot decrypt session data without a valid secret.',
    );
  }
  return createEncryption(secret);
})();

// ── Redis Queue Client (replaces DB-polling claimNextQueuedJob) ────────────
const queueClient: RedisQueueClient = (() => {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('FATAL: REDIS_URL required. Worker cannot claim jobs without Redis.');
  const tls = ['1','true','yes','on'].includes((process.env.REDIS_TLS ?? 'true').toLowerCase());
  return createRedisQueueClient({ url, tls });
})();
// ── Redis Event Store (for progress streaming, heartbeats, checkpoints) ─────
const redisClient = (() => {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('FATAL: REDIS_URL required. Worker cannot initialise event store without Redis.');
  const tls = ['1','true','yes','on'].includes((process.env.REDIS_TLS ?? 'true').toLowerCase());
  return new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    tls: tls ? { rejectUnauthorized: false } : undefined,
    retryStrategy: (times) => Math.min(times * 200, 5000),
    reconnectOnError: (err) => {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      return targetErrors.some((e) => err.message.includes(e));
    },
  });
})();
// Wire the ioredis instance into the existing RedisEventStore so progress
// events, heartbeats and checkpoints survive container restarts.
initRedisEventStore(adaptIORedis(redisClient));
console.log('[WORKER] Redis Event Store initialised with ioredis adapter');


let workerStarted = false;
let workerHealthy = false;
let shutdownRequested = false;
let draining = false;
let startupError: string | null = null;
let workerRuntime: WorkerRuntime | null = null;

// Active job counter shared between processJob and getActiveCount
let activeCount = 0;

/**
 * Dynamic import helper that prevents TypeScript from statically resolving
 * the module path (which would bring API source files into the worker compilation).
 * The generic type parameter provides the expected shape at the call site.
 */
async function apiDynamicImport<T>(relativePath: string): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return import(relativePath) as Promise<T>;
}

async function gracefulShutdown(signal: 'SIGTERM' | 'SIGINT'): Promise<void> {
  if (shutdownRequested) {
    return;
  }

  shutdownRequested = true;
  draining = true;
  workerHealthy = false;
  console.log(`[WORKER] ${signal} received. Starting graceful shutdown...`);

  try {
    if (workerRuntime) {
      const drain = await workerRuntime.stop({ drainTimeoutMs });
      console.log(`[WORKER] Drain result: drained=${drain.drained} activeJobs=${drain.activeJobs} waitedMs=${drain.waitedMs}`);
    }

    // Disconnect Redis queue client
    await queueClient.disconnect();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[WORKER] Graceful shutdown encountered an error:', message);
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    process.exit(0);
  }
}

async function processJob(): Promise<void> {
  // Use Redis queue client with non-blocking claim (worker runtime handles polling)
  const job = await queueClient.claimNextJob();

  if (!job) {
    return;
  }

  activeCount += 1;

  console.log({ event: 'job_claimed', jobId: job.id, sessionId: job.sessionId, kind: job.kind });

  // BUG-CRIT-1 fix: Mark session as processing so completion update succeeds
  await executeWithRetry(() =>
    db
      .update(sessions)
      .set({ status: 'processing', updatedAt: new Date().toISOString() })
      .where(eq(sessions.id, job.sessionId)),
  );

  try {
    // ── Read session from DB ────────────────────────────────────────────────
    await updateJobProgress({
      jobId: job.id,
      currentStage: 'reading_session',
      progressPercent: 10,
    });

    const sessionRows = await executeWithRetry(() =>
      db.select().from(sessions).where(eq(sessions.id, job.sessionId)).limit(1),
    );
    if (!sessionRows.length) {
      throw new Error('Session not found');
    }
    const session = sessionRows[0];

    // ── Decrypt session fields ──────────────────────────────────────────────
    await updateJobProgress({
      jobId: job.id,
      currentStage: 'decrypting_data',
      progressPercent: 20,
    });

    if (!session.lifeEvents) {
      throw new Error('lifeEvents data is missing — cannot process without life events');
    }

    // Decrypt and parse session fields using the shared encryption instance
    const lifeEvents = decryptSessionJsonField(
      session.lifeEvents,
      session.userId,
    );

    const dateOfBirth = crypto.parseField(session.dateOfBirth, session.userId, '') as string;
    const tentativeTime = crypto.parseField(session.tentativeTime, session.userId, '') as string;
    const spouseData = session.spouseData
      ? crypto.parseField(session.spouseData, session.userId)
      : undefined;

    // ── Build BTR input ─────────────────────────────────────────────────────
    await updateJobProgress({
      jobId: job.id,
      currentStage: 'building_input',
      progressPercent: 30,
    });

    const rawOffset =
      crypto.parseField(session.offsetConfig, session.userId) as
        | Record<string, unknown>
        | null;
    const offsetConfig =
      rawOffset && (
        typeof rawOffset === 'object' &&
        ('preset' in rawOffset || 'customMinutes' in rawOffset)
      )
        ? rawOffset
        : { preset: '1hour' };

    const { executeSecondsPrecisionRectification } =
      await apiDynamicImport<{
        executeSecondsPrecisionRectification: (input: SecondsPrecisionInput) => Promise<SecondsPrecisionResult>;
      }>('../../api/src/lib/seconds-precision-btr.js');

    const btrInput: SecondsPrecisionInput = {
      sessionId: session.id,
      jobId: job.id, // Enables checkpoint/resume for long-running pipelines
      dateOfBirth,
      tentativeTime,
      latitude: session.latitude,
      longitude: session.longitude,
      timezone: session.timezone,
      lifeEvents: lifeEvents as SecondsPrecisionInput['lifeEvents'],
      offsetConfig: offsetConfig as unknown as SecondsPrecisionInput['offsetConfig'],
      spouseData: spouseData as SecondsPrecisionInput['spouseData'],
      abortSignal: new AbortController().signal,
    };

    // ── Run BTR analysis ────────────────────────────────────────────────────
    // Progress updates are emitted by the pipeline internally via ProgressTracker
    console.log('[WORKER] Starting BTR analysis', {
      sessionId: session.id,
      jobId: job.id,
    });

    // INDUSTRY-STANDARD: Heartbeat via Redis TTL (not DB) to avoid Neon
    // connection timeouts during long-running AI pipeline stages.
    // Redis SET with EX automatically expires if worker crashes, enabling
    // fast detection of orphaned jobs by the queue health monitor.
    const heartbeatInterval = setInterval(() => {
      redisClient
        .set(`btr:heartbeat:${job.sessionId}`, Date.now().toString(), 'EX', 60)
        .catch((err) => console.warn('[WORKER] Redis heartbeat failed:', err));
    }, 15_000);

    let result: SecondsPrecisionResult;
    try {
      result = await executeSecondsPrecisionRectification(btrInput);
    } finally {
      clearInterval(heartbeatInterval);
    }

    console.log('[WORKER] BTR analysis complete', {
      sessionId: session.id,
      rectifiedTime: result.rectifiedTime,
      accuracy: result.accuracy,
    });

    // ── Save results to session ─────────────────────────────────────────────
    await updateJobProgress({
      jobId: job.id,
      currentStage: 'saving_results',
      progressPercent: 95,
    });

    await executeWithRetry(() =>
      db
        .update(sessions)
        .set({
          status: 'complete',
          rectifiedTime: result.rectifiedTime,
          accuracy: result.accuracy,
          confidence: result.confidence,
          analysisResult: JSON.stringify(result.analysisResult),
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(sessions.id, session.id),
            eq(sessions.status, 'processing'),
          ),
        ),
    );

    // ── Complete job ────────────────────────────────────────────────────────
    await completeJob({
      jobId: job.id,
      resultJson: {
        rectifiedTime: result.rectifiedTime,
        accuracy: result.accuracy,
        confidence: result.confidence,
      },
    });

    console.log({ event: 'job_completed', jobId: job.id, sessionId: job.sessionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error({ event: 'job_failed', jobId: job.id, sessionId: job.sessionId, error: message });

    // Mark session as failed
    try {
      await executeWithRetry(() =>
        db
          .update(sessions)
          .set({
            status: 'failed',
            errorMessage: message,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(sessions.id, job.sessionId)),
      );
    } catch (sessionError) {
      console.error({
        event: 'session_fail_update_error',
        jobId: job.id,
        error:
          sessionError instanceof Error
            ? sessionError.message
            : String(sessionError),
      });
    }

    // Mark job as failed — guard against DB errors during fail handling
    try {
      await failJob({
        jobId: job.id,
        errorMessage: message,
        errorCode: 'WORKER_PROCESSING_ERROR',
      });
    } catch (failError) {
      const failMessage = failError instanceof Error ? failError.message : String(failError);
      console.error({ event: 'fail_job_db_error', jobId: job.id, error: failMessage });
    }
  } finally {
    activeCount -= 1;
  }
}

/**
 * Decrypt and parse a session JSON field (required).
 * Follows the same fallback pattern as queue-manager's decryptJsonField.
 */
function decryptSessionJsonField(
  encrypted: string,
  userId: string,
): unknown {
  if (!crypto.isEncrypted(encrypted)) {
    // Not encrypted — try raw JSON parse (legacy data)
    try {
      return JSON.parse(encrypted);
    } catch {
      throw new Error('Failed to parse unencrypted session field');
    }
  }
  try {
    const decrypted = crypto.decrypt(encrypted, userId);
    return JSON.parse(decrypted);
  } catch {
    throw new Error('Failed to decrypt or parse session field');
  }
}

/**
 * Decrypt and parse an optional session JSON field.
 * Follows the same pattern as queue-manager's decryptOptionalJsonField.
 */
function decryptOptionalSessionJsonField(
  encrypted: string | null,
  userId: string,
  ): unknown {
  if (!encrypted) {
    return undefined;
  }
  if (!crypto.isEncrypted(encrypted)) {
    // Not encrypted — try raw JSON parse (legacy data)
    try {
      return JSON.parse(encrypted);
    } catch {
      return undefined;
    }
  }
  try {
    const decrypted = crypto.decrypt(encrypted, userId);
    return JSON.parse(decrypted);
  } catch {
    return undefined;
  }
}

/**
 * Recover interrupted jobs on worker startup.
 * Delegates to the API's recovery logic if available,
 * otherwise returns zero counts (graceful fallback).
 */
async function recoverInterruptedJobs(): Promise<{
  recoveredJobs: number;
  abandonedAttempts: number;
}> {
  try {
    const { recoverInterruptedJobsOnStartup } =
      await apiDynamicImport<{
        recoverInterruptedJobsOnStartup: () => Promise<{ recoveredJobs: number; abandonedAttempts: number }>;
      }>('../../api/src/lib/metrics-reporter.js');
    return await recoverInterruptedJobsOnStartup();
  } catch (error) {
    console.error('[WORKER] Recovery import/execution failed:', error);
    return { recoveredJobs: 0, abandonedAttempts: 0 };
  }
}

const server = createServer((req, res) => {
  const path = req.url || '/';
  const runtimeStatus = workerRuntime?.getStatus() ?? {
    initialized: false,
    shutdownRequested: false,
    activeJobs: 0,
    running: false,
  };

  if (path === '/' || path === '/health' || path === '/live' || path === '/ready') {
    const healthy = workerStarted && workerHealthy && !startupError;
    const ready = healthy && !shutdownRequested && !draining && runtimeStatus.running;
    const statusCode = path === '/ready' && !ready ? 503 : 200;

    res.writeHead(statusCode, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        service: 'worker',
        healthy,
        ready,
        workerStarted,
        shutdownRequested,
        draining,
        startupError,
        runtimeStatus,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[WORKER] Health server listening on ${port}`);
});

process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM');
});

process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT');
});

void (async () => {
  try {
    // Create worker runtime with basic dependencies
    workerRuntime = createWorkerRuntime({
      pollIntervalMs,
      getActiveCount: () => activeCount,
      recover: async () => recoverInterruptedJobs(),
      processJob: () => processJob(),
    });

    // Verify database connectivity before starting the worker loop
    console.log('[WORKER] Verifying database connection...');
    await verifyDatabaseConnection();
    console.log('[WORKER] Database connection verified successfully');

    await workerRuntime.initialize({ pollIntervalMs });
    workerStarted = true;
    workerHealthy = true;
    await workerRuntime.runLoop();
    if (shutdownRequested) {
      return;
    }
    workerHealthy = false;
    startupError = 'Worker loop exited unexpectedly';
    console.error('[WORKER] Worker loop exited unexpectedly');
    process.exit(1);
  } catch (error) {
    startupError = error instanceof Error ? error.message : String(error);
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error('[WORKER] Fatal startup failure');
    console.error(message);
    process.exit(1);
  }
})();
