/**
 * Redis-based Job Queue Client for the Worker
 *
 * Design Principles:
 *   1. Redis as hot-path transport (BLPOP for instant job pickup)
 *   2. PostgreSQL as durable source of truth (job lifecycle in DB)
 *   3. Dual-write: enqueue writes to Redis + DB; claim updates DB atomically
 *   4. Idempotent claims: DB UPDATE with status guard prevents double-processing
 *   5. Connection resilience: auto-reconnect, keepalive, graceful shutdown
 *
 * Queue Architecture:
 *   ai-pandit:btr:jobs:ready     → List (FIFO) — sessions ready for processing
 *   ai-pandit:btr:jobs:delayed   → Sorted Set — sessions scheduled for retry
 *   ai-pandit:btr:jobs:dlq       → List — dead-letter queue for exhausted retries
 *
 * Usage:
 *   import { createRedisQueueClient } from '@ai-pandit/worker-runtime';
 *   const client = createRedisQueueClient({ url: 'rediss://...', tls: true });
 *   const job = await client.claimNextJob();
 *   await client.disconnect();
 */

import { Redis as IORedis } from 'ioredis';
import {
  getLatestJobForSession,
  } from '@ai-pandit/db/jobs';
import type { Job } from '@ai-pandit/db/schema';
import { db } from '@ai-pandit/db';
import { jobs } from '@ai-pandit/db/schema';
import { and, eq, lte, or } from 'drizzle-orm';

// ─── Constants ───────────────────────────────────────────────────────────────

const QUEUE_PREFIX = 'ai-pandit:btr:jobs';
const REDIS_CLAIM_BATCH_SIZE = 50;
const BLPOP_TIMEOUT_SECONDS = 30;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RedisQueueConfig {
  /** Redis connection URL (rediss:// for TLS) */
  url: string;
  /** Enable TLS (default: true for Upstash compatibility) */
  tls?: boolean;
  /** Custom queue key prefix (default: ai-pandit:btr:jobs) */
  queuePrefix?: string;
  /** Connection timeout in ms (default: 10000) */
  connectTimeout?: number;
  /** BLPOP timeout in seconds (default: 30) */
  blpopTimeout?: number;
}

export interface RedisQueueClient {
  /** Claim the next available job. Returns null if queue is empty. */
  claimNextJob(): Promise<Job | null>;

  /** Block until a job is available, then claim it. Returns null on timeout. */
  claimNextJobBlocking(timeoutSeconds?: number): Promise<Job | null>;

  /** Enqueue a session for processing (called from API). */
  enqueueSession(sessionId: string): Promise<void>;

  /** Schedule a session for retry after delayMs. */
  scheduleRetry(sessionId: string, delayMs: number): Promise<void>;

  /** Move a session to the dead-letter queue. */
  moveToDeadLetter(sessionId: string, reason: Record<string, unknown>): Promise<void>;

  /** Gracefully disconnect and clean up. */
  disconnect(): Promise<void>;

  /** Check if the Redis connection is healthy. */
  isHealthy(): boolean;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createRedisQueueClient(config: RedisQueueConfig): RedisQueueClient {
  const prefix = config.queuePrefix ?? QUEUE_PREFIX;
  const readyKey = `${prefix}:ready`;
  const delayedKey = `${prefix}:delayed`;
  const dlqKey = `${prefix}:dlq`;

  const client = new IORedis(config.url, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    keepAlive: 30000,
    connectTimeout: config.connectTimeout ?? 10000,
    tls: config.tls !== false
      ? { rejectUnauthorized: false }
      : undefined,
    retryStrategy: (times) => {
      if (times > 10) return null; // Stop retrying after 10 attempts
      return Math.min(times * 200, 5000);
    },
    reconnectOnError: (err) => {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      return targetErrors.some((e) => err.message.includes(e));
    },
  });

  client.on('error', (error) => {
    console.error('[RedisQueue] Connection error:', error.message);
  });

  client.on('connect', () => {
    console.log('[RedisQueue] Connected');
  });

  // ─── Private helpers ──────────────────────────────────────────────────

  async function ensureConnected(): Promise<void> {
    if (client.status === 'ready') return;
    if (client.status === 'connecting' || client.status === 'reconnecting') {
      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const onReady = () => { cleanup(); resolve(); };
        const onError = (e: Error) => { cleanup(); reject(e); };
        const cleanup = () => {
          client.off('ready', onReady);
          client.off('error', onError);
        };
        client.once('ready', onReady);
        client.once('error', onError);
        // Timeout safety
        setTimeout(() => {
          cleanup();
          reject(new Error('Redis connection timeout'));
        }, config.connectTimeout ?? 10000);
      });
      return;
    }
    await client.connect();
  }

  async function promoteDueRetries(): Promise<void> {
    const now = Date.now();
    const due = await client.zrangebyscore(delayedKey, 0, now, 'LIMIT', 0, 100);

    for (const sessionId of due) {
      const latestJob = await getLatestJobForSession(sessionId);
      if (!latestJob || !['queued', 'retrying'].includes(latestJob.status)) {
        await client.zrem(delayedKey, sessionId);
        continue;
      }
      await client.zrem(delayedKey, sessionId);
      await client.lpush(readyKey, sessionId);
    }
  }

  async function claimJobByDbId(jobId: string): Promise<Job | null> {
    const now = new Date().toISOString();
    const [claimed] = await db
      .update(jobs)
      .set({
        status: 'running',
        startedAt: now,
        heartbeatAt: now,
        updatedAt: now,
        errorCode: null,
        errorMessage: null,
        retryReasonCode: null,
        nextRetryAt: null,
      })
      .where(
        and(
          eq(jobs.id, jobId),
          or(
            eq(jobs.status, 'queued'),
            and(eq(jobs.status, 'retrying'), lte(jobs.nextRetryAt, now)),
          ),
        ),
      )
      .returning();

    return (claimed as Job | undefined) ?? null;
  }

  // ─── Public API ───────────────────────────────────────────────────────

  return {
    async claimNextJob(): Promise<Job | null> {
      await ensureConnected();
      await promoteDueRetries();

      for (let i = 0; i < REDIS_CLAIM_BATCH_SIZE; i++) {
        const sessionId = await client.lpop(readyKey);
        if (!sessionId) break;

        const latestJob = await getLatestJobForSession(sessionId);
        if (!latestJob) continue;

        const claimed = await claimJobByDbId(latestJob.id);
        if (claimed) return claimed;

        // Race condition — push back to front so job isn't lost
        await client.lpush(readyKey, sessionId);
      }

      return null;
    },

    async claimNextJobBlocking(timeoutSeconds?: number): Promise<Job | null> {
      await ensureConnected();
      await promoteDueRetries();

      // First try non-blocking
      const immediate = await this.claimNextJob();
      if (immediate) return immediate;

      // Block until a job arrives
      const result = await client.blpop(
        readyKey,
        timeoutSeconds ?? config.blpopTimeout ?? BLPOP_TIMEOUT_SECONDS,
      );

      if (!result) return null;

      // result is [key, value] from BLPOP
      const sessionId = result[1];
      const latestJob = await getLatestJobForSession(sessionId);
      if (!latestJob) return null;

      return claimJobByDbId(latestJob.id);
    },

    async enqueueSession(sessionId: string): Promise<void> {
      await ensureConnected();
      // Best-effort deduplication
      await client.lrem(readyKey, 0, sessionId);
      await client.rpush(readyKey, sessionId);
    },

    async scheduleRetry(sessionId: string, delayMs: number): Promise<void> {
      await ensureConnected();
      const retryAt = Date.now() + delayMs;
      await client.lrem(readyKey, 0, sessionId);
      await client.zadd(delayedKey, retryAt, sessionId);
    },

    async moveToDeadLetter(sessionId: string, reason: Record<string, unknown>): Promise<void> {
      await ensureConnected();
      const entry = JSON.stringify({
        sessionId,
        ...reason,
        movedAt: new Date().toISOString(),
      });
      await client.lpush(dlqKey, entry);
      // Keep DLQ bounded (last 10,000 entries)
      await client.ltrim(dlqKey, 0, 9999);
    },

    async disconnect(): Promise<void> {
      client.removeAllListeners();
      try {
        await client.quit();
      } catch {
        client.disconnect();
      }
      console.log('[RedisQueue] Disconnected');
    },

    isHealthy(): boolean {
      return client.status === 'ready';
    },
  };
}
