import { Redis as IORedis } from 'ioredis';
import {
  claimNextQueuedJob,
  countQueuedJobs,
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
      throw new AppError(ErrorCodes.INTERNAL_ERROR, 'REDIS_URL is required for redis_bullmq queue architecture.');
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
      retryStrategy: (times) => Math.min(times * 100, 3000),
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

  public countQueuedJobs() {
    return countQueuedJobs();
  }

  public async enqueueSession(sessionId: string): Promise<void> {
    await this.ensureConnected();

    // Best-effort deduplication before queueing latest attempt.
    await this.client.lrem(this.queueKey, 0, sessionId);
    await this.client.rpush(this.queueKey, sessionId);
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

    // Compatibility fallback for jobs queued before Redis transport was enabled.
    return claimNextQueuedJob();
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
}
