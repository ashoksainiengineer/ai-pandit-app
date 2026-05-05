import crypto from 'node:crypto';
import { db, executeWithRetry } from '@ai-pandit/db';
import {
  appendJobEvent,
  completeJobAttempt,
  scheduleJobRetry,
} from '@ai-pandit/db/jobs';
import { eq, and, lt, gte, asc } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { jobAttempts, jobs, sessions } from '@ai-pandit/db/schema';
import { config } from '../config/index.js';
import { getNextJobEventSequence } from './job-lifecycle.js';

export interface RecoveryTelemetry {
  lastRunAt: string | null;
  lastRecoveredJobs: number;
  lastAbandonedAttempts: number;
  totalRecoveredJobs: number;
  totalAbandonedAttempts: number;
  alertActive: boolean;
}

export let recoveryTelemetry: RecoveryTelemetry | null = null;

export function getRecoveryTelemetryInstance(): RecoveryTelemetry {
  if (!recoveryTelemetry) {
    recoveryTelemetry = {
      lastRunAt: null,
      lastRecoveredJobs: 0,
      lastAbandonedAttempts: 0,
      totalRecoveredJobs: 0,
      totalAbandonedAttempts: 0,
      alertActive: false,
    };
  }
  return recoveryTelemetry;
}

export function getQueueRecoveryTelemetry(): RecoveryTelemetry {
  return { ...getRecoveryTelemetryInstance() };
}

export function updateRecoveryMetrics(recoveredJobs: number, abandonedAttempts: number): void {
  const telemetry = getRecoveryTelemetryInstance();
  telemetry.lastRunAt = new Date().toISOString();
  telemetry.lastRecoveredJobs = recoveredJobs;
  telemetry.lastAbandonedAttempts = abandonedAttempts;
  telemetry.totalRecoveredJobs += recoveredJobs;
  telemetry.totalAbandonedAttempts += abandonedAttempts;
  telemetry.alertActive =
    abandonedAttempts >= (config.queue.recoveryAlertThreshold ?? 1) ||
    recoveredJobs >= (config.queue.recoveryAlertThreshold ?? 1);
}

export async function fetchRunningJobs(): Promise<
  Array<{
    jobId: string;
    sessionId: string;
    retryCount: number;
    checkpointJson: unknown;
    attemptId: string | null;
  }>
> {
  return executeWithRetry(() =>
    db
      .select({
        jobId: jobs.id,
        sessionId: jobs.sessionId,
        retryCount: jobs.retryCount,
        checkpointJson: jobs.checkpointJson,
        attemptId: jobAttempts.id,
      })
      .from(jobs)
      .leftJoin(
        jobAttempts,
        and(eq(jobAttempts.jobId, jobs.id), eq(jobAttempts.outcome, 'running'))
      )
      .where(eq(jobs.status, 'running'))
      .orderBy(asc(jobs.updatedAt))
  );
}

export async function recoverSingleJob(
  runningJob: Awaited<ReturnType<typeof fetchRunningJobs>>[number]
): Promise<boolean> {
  const now = new Date().toISOString();
  let wasAbandoned = false;

  if (runningJob.attemptId) {
    await completeJobAttempt({
      attemptId: runningJob.attemptId,
      outcome: 'abandoned',
      failureReason: 'Worker restarted before completion',
      failureCode: 'worker_restart',
      checkpointJson: (runningJob.checkpointJson as Record<string, unknown> | null) ?? null,
    });
    wasAbandoned = true;
  }

  await scheduleJobRetry({
    jobId: runningJob.jobId,
    retryCount: runningJob.retryCount + 1,
    retryReasonCode: 'worker_restart',
    nextRetryAt: now,
    errorCode: 'worker_restart',
    errorMessage: 'Recovered after worker restart',
  });

  await executeWithRetry(() =>
    db
      .update(sessions)
      .set({
        status: 'queued',
        errorMessage: null,
        updatedAt: now,
      })
      .where(eq(sessions.id, runningJob.sessionId))
  );

  await appendJobEvent({
    id: crypto.randomUUID(),
    jobId: runningJob.jobId,
    sessionId: runningJob.sessionId,
    sequenceNo: await getNextJobEventSequence(runningJob.jobId),
    eventType: 'job.recovered',
    payloadJson: {
      status: 'retrying',
      retryReasonCode: 'worker_restart',
      recoveredAt: now,
    },
  });

  return wasAbandoned;
}

export async function recoverInterruptedJobsOnStartup(): Promise<{
  recoveredJobs: number;
  abandonedAttempts: number;
}> {
  const runningJobs = await fetchRunningJobs();
  let recoveredJobs = 0;
  let abandonedAttempts = 0;

  for (const runningJob of runningJobs) {
    const wasAbandoned = await recoverSingleJob(runningJob);
    if (wasAbandoned) abandonedAttempts++;
    recoveredJobs++;
  }

  if (recoveredJobs > 0) {
    logger.warn('Recovered interrupted running jobs on startup', {
      recoveredJobs,
      abandonedAttempts,
    });
  }

  updateRecoveryMetrics(recoveredJobs, abandonedAttempts);

  return {
    recoveredJobs,
    abandonedAttempts,
  };
}

export async function getQueueStats(queueDriver: { listActiveJobs: () => Promise<Array<{ status: string }>> }): Promise<{
  queuedCount: number;
  processingCount: number;
  completedToday: number;
  averageWaitTime: number;
}> {
  try {
    const activeJobs = await queueDriver.listActiveJobs();
    const queued = activeJobs.filter((job) => job.status === 'queued' || job.status === 'retrying');
    const processing = activeJobs.filter((job) => job.status === 'running');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const completed = await db.select({ id: sessions.id })
      .from(sessions)
      .where(and(
        eq(sessions.status, 'complete'),
        gte(sessions.completedAt, todayStr)
      ));

    return {
      queuedCount: queued.length,
      processingCount: processing.length,
      completedToday: completed.length,
      averageWaitTime: config.queue?.baseAnalysisTime ?? 240,
    };
  } catch (error) {
    logger.error('Failed to get queue stats', error);
    return {
      queuedCount: 0,
      processingCount: 0,
      completedToday: 0,
      averageWaitTime: 30,
    };
  }
}

export async function cleanupZombiesOnStartup(
  markAsFailedFn: (sessionId: string, error: string) => Promise<void>
): Promise<void> {
  try {
    const staleThreshold = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const staleZombies = await db.select({ id: sessions.id })
      .from(sessions)
      .where(and(
        eq(sessions.status, 'processing'),
        lt(sessions.updatedAt, staleThreshold)
      ));

    if (staleZombies.length > 0) {
      logger.warn(`Found ${staleZombies.length} stale zombie sessions (>10min). Cleaning up...`);
      for (const zombie of staleZombies) {
        await markAsFailedFn(zombie.id, 'Process interrupted (Stale Session at Startup)');
      }
    }

    const allProcessing = await db.select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.status, 'processing'));

    const activeProcessingIds = new Set<string>();
    const orphans = allProcessing.filter(s => !activeProcessingIds.has(s.id));

    if (orphans.length > 0) {
      logger.warn(`Found ${orphans.length} orphaned zombie sessions (processing in DB but no active worker). Resetting to pending...`);
      for (const orphan of orphans) {
        await executeWithRetry(() =>
          db.update(sessions)
            .set({
              status: 'pending',
              errorMessage: null,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(sessions.id, orphan.id))
        );
        logger.info(`Orphan ${orphan.id} reset to pending for re-processing`);
      }
    }
  } catch (error) {
    logger.error('Zombie cleanup failed', error);
  }
}
