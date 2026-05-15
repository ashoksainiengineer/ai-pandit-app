import { Redis as IORedis } from 'ioredis';
import {
  countActiveJobs,
  getLatestJobForSession,
  listActiveJobs,
} from '@ai-pandit/db/jobs';
import { db } from '@ai-pandit/db';
import { jobs } from '@ai-pandit/db/schema';
import { and, eq, lte, or } from 'drizzle-orm';
import { config } from '../../../config/index.js';
import { logger } from '../../../utils/logger.js';
import type { QueueDriver } from '../driver.js';
import { AppError, ErrorCodes } from '../../../errors/index.js';

const REDIS_CLAIM_BATCH_SIZE = 50;

export class RedisBullMqQueueDriver implements QueueDriver {
  public readonly name = 'redis_bullmq';
  private readonly client: IORedis;
  private readonly queueKey: string;
  private readonly delayedKey: string;
  private readonly deadLetterKey: string;

  public constructor() {
    if (!config.queue.redis?.url) {
      throw new AppError(ErrorCodes.INTERNAL_ERROR, 'REDIS_URL is required for the job queue.');
    }

    this.client = new IORedis(config.queue.redis.url, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      tls: config.queue.redis.tls
        ? { rejectUnauthorized: false }
        : undefined,
      retryStrategy: (times) => Math.min(times * 200, 5000),
      reconnectOnError: (err) => {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        return targetErrors.some((e) => err.message.includes(e));
      },
    });

    const keyPrefix = config.queue.redis.queueName;
    this.queueKey = `${keyPrefix}:ready`;
    this.delayedKey = `${keyPrefix}:delayed`;
    this.deadLetterKey = `${keyPrefix}:dlq`;

    this.client.on('error', (error) => {
      logger.error('Redis queue driver error', {
        message: error.message,
        architecture: config.queue.architecture,
      });
    });

    logger.info('Redis queue driver initialized', {
      architecture: config.queue.architecture,
      queueKey: this.queueKey,
      delayedKey: this.delayedKey,
      deadLetterKey: this.deadLetterKey,
    });
  }

  public listActiveJobs() {
    return listActiveJobs();
  }

  public countActiveJobs() {
    return countActiveJobs();
  }

  /** Pub/Sub channel for notifying workers of new jobs */
  private readonly notifyChannel = 'btr:job:notify';

  public async enqueueSession(sessionId: string): Promise<void> {
    await this.ensureConnected();

    // Best-effort deduplication before queueing latest attempt.
    await this.client.lrem(this.queueKey, 0, sessionId);
    await this.client.rpush(this.queueKey, sessionId);

    // Notify idle workers via Redis Pub/Sub so they wake up immediately
    // instead of waiting for the next BLPOP/poll cycle. This eliminates
    // wasteful polling commands and enables near-zero idle Redis usage.
    await this.client.publish(this.notifyChannel, sessionId).catch(() => {
      // Pub/Sub is advisory — queue push already guarantees delivery
    });
  }

  public async scheduleRetrySession(sessionId: string, nextRetryAtIso: string): Promise<void> {
    await this.ensureConnected();

    const retryAtMs = Number.isFinite(Date.parse(nextRetryAtIso))
      ? Date.parse(nextRetryAtIso)
      : Date.now() + 1000;

    // Ensure session is not in ready queue while delayed.
    await this.client.lrem(this.queueKey, 0, sessionId);
    await this.client.zadd(this.delayedKey, retryAtMs, sessionId);
  }

  public async moveToDeadLetter(sessionId: string, payload: Record<string, unknown>): Promise<void> {
    await this.ensureConnected();

    const entry = JSON.stringify({
      sessionId,
      ...payload,
      createdAt: new Date().toISOString(),
    });

    await this.client.lpush(this.deadLetterKey, entry);
    await this.client.ltrim(this.deadLetterKey, 0, 9999);
  }

  public async claimNextQueuedJob() {
    await this.ensureConnected();
    await this.promoteDueRetries();

    for (let i = 0; i < REDIS_CLAIM_BATCH_SIZE; i += 1) {
      const sessionId = await this.client.lpop(this.queueKey);
      if (!sessionId) {
        break;
      }

      const latestJob = await getLatestJobForSession(sessionId);
      if (!latestJob) {
        continue;
      }

      const claimed = await this.claimJobById(latestJob.id);
      if (claimed) {
        return claimed;
      }

      // Claim failed (race or DB issue) — push BACK to front of queue so no job is lost
      await this.client.lpush(this.queueKey, sessionId);
    }

    // Queue empty — nothing to claim
    return null;
  }
  private async ensureConnected(): Promise<void> {
    if (this.client.status === 'ready' || this.client.status === 'connecting') {
      return;
    }

    await this.client.connect();
  }

  private async promoteDueRetries(): Promise<number> {
    const now = Date.now();
    const dueSessions = await this.client.zrangebyscore(this.delayedKey, 0, now, 'LIMIT', 0, 200);

    let promoted = 0;
    for (const sessionId of dueSessions) {
      // Check DB that session is still retryable (not cancelled/completed)
      const latestJob = await getLatestJobForSession(sessionId);
      if (!latestJob || !['queued', 'retrying'].includes(latestJob.status)) {
        // Stale or cancelled — remove from delayed set and skip
        await this.client.zrem(this.delayedKey, sessionId);
        continue;
      }

      await this.client.zrem(this.delayedKey, sessionId);
      await this.client.lpush(this.queueKey, sessionId);
      promoted++;
    }

    return promoted;
  }

  private async claimJobById(jobId: string) {
    const timestamp = new Date().toISOString();
    const [claimedJob] = await db
      .update(jobs)
      .set({
        status: 'running',
        startedAt: timestamp,
        heartbeatAt: timestamp,
        updatedAt: timestamp,
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
            and(eq(jobs.status, 'retrying'), lte(jobs.nextRetryAt, timestamp))
          )
        )
      )
      .returning();

    return claimedJob ?? null;
  }

  public async recoverLostQueuedJobs(sessionIds: string[]): Promise<number> {
    await this.ensureConnected();

    const queuedInRedis = new Set(await this.client.lrange(this.queueKey, 0, -1));
    const delayedInRedis = new Set(await this.client.zrange(this.delayedKey, 0, -1));

    let recovered = 0;
    for (const sessionId of sessionIds) {
      if (queuedInRedis.has(sessionId) || delayedInRedis.has(sessionId)) {
        continue;
      }

      await this.client.rpush(this.queueKey, sessionId);
      recovered++;
      logger.warn('[QUEUE-RECOVERY] Re-enqueued lost job', { sessionId });
    }

    if (recovered > 0) {
      logger.info('[QUEUE-RECOVERY] Recovered lost queued jobs', { recovered, totalChecked: sessionIds.length });
    }

    return recovered;
  }

  public async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.client.ping();
      return { healthy: true, latencyMs: Date.now() - start };
    } catch {
      return { healthy: false, latencyMs: Date.now() - start };
    }
  }

  public async getQueueMetrics(): Promise<{
    readyCount: number;
    delayedCount: number;
    deadLetterCount: number;
  }> {
    await this.ensureConnected();
    const [readyCount, delayedCount, deadLetterCount] = await Promise.all([
      this.client.llen(this.queueKey),
      this.client.zcard(this.delayedKey),
      this.client.llen(this.deadLetterKey),
    ]);
    return { readyCount, delayedCount, deadLetterCount };
  }

  async disconnect(): Promise<void> {
    this.client.removeAllListeners('error');
    await this.client.quit();
    logger.info('Redis queue driver disconnected');
  }
}
