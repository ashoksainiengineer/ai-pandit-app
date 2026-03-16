
// lib/queue-manager.ts
// Efficient queue system for high-performance AI backend
// Design: Process multiple requests concurrently based on system capacity

import crypto from 'node:crypto';
import {
  completeJob as completeJobRecord,
  db,
  executeWithRetry,
} from '@ai-pandit/db';
import {
  appendJobEvent,
  completeJobAttempt,
  createJobAttempt,
  failJob as failJobRecord,
  getLatestJobForSession,
  incrementJobAttempt,
  listJobEvents,
  markJobRunning as markJobRunningRecord,
  requestJobCancellation as requestJobCancellationRecord,
  scheduleJobRetry,
  updateJobAttemptHeartbeat,
  updateJobProgress as updateJobProgressRecord,
} from '@ai-pandit/db/jobs';
import { eq, and, or, asc, lt, gte } from 'drizzle-orm';
import { logger } from './logger.js';
import { safeDecryptWithFallback, parseSensitiveField } from './encryption/index.js';
import {
  createAbortController,
  abortSession as abortSessionController,
  cleanupController,
  isCancellationError
} from './cancellation-manager.js';
import { emitComplete, emitError } from './session-events.js';
import { getSessionProgress, ProgressTracker } from './progress-tracker.js';
import { calculations, jobAttempts, jobs, sessions } from '@ai-pandit/db/schema';
import { config } from '../config/index.js';
import { processSecondsPrecisionBTR } from './seconds-precision-btr.js';
import { getMemoryPressureSnapshot, triggerGC } from './memory-manager.js';
import { persistArtifactReference } from './jobs/artifact-storage.js';
import { getQueueDriver } from './queue/index.js';
import {
  getBlockingCircuitBreakers,
  getCircuitSnapshots,
  recordDependencyFailure,
  recordGlobalProcessingSuccess,
  resetAllCircuitBreakersForTests,
  type CircuitDependency,
} from './resilience/dependency-circuit-breaker.js';


// ═════════════════════════════════════════════════════════════════════════════
// QUEUE CONFIGURATION (Optimized for HF Spaces Free Tier: 16GB RAM)
// ═════════════════════════════════════════════════════════════════════════════

const QUEUE_CONFIG = {
  // Default 3 concurrent sessions - can handle up to 3 simultaneous BTR analyses
  // With 16GB RAM, each session gets ~5GB which is sufficient for God-Tier BTR
  maxConcurrent: config.queue?.maxConcurrent ?? 3,

  pollIntervalMs: config.queue?.pollIntervalMs ?? 5000,
  maxQueueSize: config.queue?.maxSize ?? 100,
  loadShedQueueDepth: config.queue?.loadShedQueueDepth ?? 80,

  // 2 hour timeout for complex BTR analyses with multiple life events
  staleTimeoutMs: config.queue?.staleTimeoutMs ?? 7_200_000,

  // Base analysis time ~4 minutes per session with DeepSeek R1
  baseAnalysisTime: config.queue?.baseAnalysisTime ?? 240,

  // Contention factor - minimal overhead per additional concurrent session
  contentionMultiplier: config.queue?.contentionMultiplier ?? 0.1,

  // Memory thresholds (in GB) for automatic throttling
  memoryPressureThresholdGB: config.memory?.pressureThresholdGB ?? 10,
  memoryCriticalThresholdGB: config.memory?.criticalThresholdGB ?? 11,
};

// ═════════════════════════════════════════════════════════════════════════════
// C4 FIX: Retry & Circuit Breaker Configuration
// ═════════════════════════════════════════════════════════════════════════════

const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 60000,  // 1 minute max
  backoffMultiplier: 2,
};

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE STATUS TYPES
// ═════════════════════════════════════════════════════════════════════════════

import type { QueueStatus, QueuePosition, QueueSubmitResult } from '@ai-pandit/shared';

// Re-export types for backwards compatibility
export type { QueueStatus, QueuePosition, QueueSubmitResult };

// ═════════════════════════════════════════════════════════════════════════════
// IN-MEMORY STATE (minimal - just tracking current jobs)
// ═════════════════════════════════════════════════════════════════════════════

// Track multiple concurrent processing IDs
const activeProcessingIds = new Set<string>();
const activeAttemptIds = new Map<string, string>();
const workerId = process.env.K_SERVICE
  ? `${process.env.K_SERVICE}:${process.env.K_REVISION ?? 'unknown'}`
  : `worker:${process.pid}`;

export function getActiveQueueCount(): number {
  return activeProcessingIds.size;
}

export function getQueueCircuitBreakerStatus() {
  return getCircuitSnapshots();
}

export function getQueueRecoveryTelemetry(): RecoveryTelemetry {
  return { ...recoveryTelemetry };
}

export function isQueueProcessorRunning(): boolean {
  return isProcessorRunning;
}

const processingStartTimes = new Map<string, number>(); // sessionId -> timestamp
let isProcessorRunning = false;
const queueDriver = getQueueDriver();

interface RecoveryTelemetry {
  lastRunAt: string | null;
  lastRecoveredJobs: number;
  lastAbandonedAttempts: number;
  totalRecoveredJobs: number;
  totalAbandonedAttempts: number;
  alertActive: boolean;
}

const recoveryTelemetry: RecoveryTelemetry = {
  lastRunAt: null,
  lastRecoveredJobs: 0,
  lastAbandonedAttempts: 0,
  totalRecoveredJobs: 0,
  totalAbandonedAttempts: 0,
  alertActive: false,
};

type RetryReasonCode =
  | 'network_error'
  | 'upstream_timeout'
  | 'rate_limited'
  | 'service_unavailable'
  | 'database_busy'
  | 'worker_restart'
  | 'processing_error';

async function getTrackedJob(sessionId: string) {
  return getLatestJobForSession(sessionId);
}

function deriveRetryReasonCode(error: unknown): RetryReasonCode {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes('429') || message.includes('rate limit') || message.includes('too many requests')) {
    return 'rate_limited';
  }

  if (message.includes('timeout') || message.includes('etimedout')) {
    return 'upstream_timeout';
  }

  if (
    message.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('econnreset')
  ) {
    return 'network_error';
  }

  if (message.includes('503') || message.includes('service unavailable') || message.includes('temporarily unavailable')) {
    return 'service_unavailable';
  }

  if (message.includes('database is locked') || message.includes('busy') || message.includes('sqlite_busy')) {
    return 'database_busy';
  }

  return 'processing_error';
}

async function buildCheckpointPayload(
  sessionId: string,
  status: 'queued' | 'running' | 'retrying' | 'failed' | 'completed' | 'cancelled',
  extra: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  const progress = await getSessionProgress(sessionId);

  return {
    status,
    progress: progress
      ? {
          currentStep: progress.currentStep,
          totalSteps: progress.totalSteps,
          percentage: progress.percentage,
          lastUpdate: progress.lastUpdate,
        }
      : null,
    capturedAt: new Date().toISOString(),
    ...extra,
  };
}

function mapJobStatusToQueueStatus(status: string | null | undefined): QueueStatus {
  switch (status) {
    case 'running':
      return 'processing';
    case 'completed':
      return 'complete';
    case 'failed':
    case 'cancelled':
      return 'failed';
    default:
      return 'queued';
  }
}

async function getNextJobEventSequence(jobId: string): Promise<number> {
  const events = await listJobEvents(jobId);
  const lastSequence = events.at(-1)?.sequenceNo ?? 0;
  return lastSequence + 1;
}

async function appendLifecycleEvent(
  sessionId: string,
  eventType: string,
  payload: Record<string, unknown>,
  stage?: string
): Promise<void> {
  const job = await getTrackedJob(sessionId);
  if (!job) {
    return;
  }

  await appendJobEvent({
    id: crypto.randomUUID(),
    jobId: job.id,
    sessionId,
    sequenceNo: await getNextJobEventSequence(job.id),
    eventType,
    stage: stage ?? null,
    payloadJson: payload,
  });
}

async function syncJobQueued(sessionId: string): Promise<void> {
  const job = await getTrackedJob(sessionId);
  if (!job) {
    return;
  }

  const checkpointJson = await buildCheckpointPayload(sessionId, 'queued');
  await updateJobProgressRecord({
    jobId: job.id,
    currentStage: null,
    progressPercent: 0,
    checkpointJson,
  });

  await appendLifecycleEvent(sessionId, 'job.queued', { status: 'queued' });
}

async function syncJobRunning(sessionId: string): Promise<void> {
  const job = await getTrackedJob(sessionId);
  if (!job) {
    return;
  }

  const progress = await getSessionProgress(sessionId);

  await markJobRunningRecord(job.id);
  await updateJobProgressRecord({
    jobId: job.id,
    currentStage: getCurrentStage(progress) ?? job.currentStage,
    progressPercent: progress?.percentage ?? job.progressPercent,
    checkpointJson: await buildCheckpointPayload(sessionId, 'running', {
      attempt: job.attempt,
      retryCount: job.retryCount,
    }),
  });

  await appendLifecycleEvent(sessionId, 'job.started', { status: 'running' });
}

async function syncJobCompleted(
  sessionId: string,
  results: {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
    analysisResult: string;
    reasoningLogs?: string | null;
  }
): Promise<void> {
  const job = await getTrackedJob(sessionId);
  if (!job) {
    return;
  }

  let parsedResult: Record<string, unknown> | undefined;
  try {
    const parsed = JSON.parse(results.analysisResult);
    if (typeof parsed === 'object' && parsed !== null) {
      parsedResult = parsed as Record<string, unknown>;
    }
  } catch {
    parsedResult = undefined;
  }

  await completeJobRecord({
    jobId: job.id,
    resultJson: parsedResult ?? {
      rectifiedTime: results.rectifiedTime,
      accuracy: results.accuracy,
      confidence: results.confidence,
    },
  });

  await Promise.all([
    persistArtifactReference({
      jobId: job.id,
      sessionId,
      kind: 'analysis_result',
      fileName: 'analysis-result.json',
      mimeType: 'application/json',
      payload: results.analysisResult,
      metadata: {
        rectifiedTime: results.rectifiedTime,
        accuracy: results.accuracy,
        confidence: results.confidence,
      },
    }),
    results.reasoningLogs
      ? persistArtifactReference({
          jobId: job.id,
          sessionId,
          kind: 'reasoning_log',
          fileName: 'reasoning-log.json',
          mimeType: 'application/json',
          payload: results.reasoningLogs,
          metadata: {
            format: 'stage_history',
          },
        })
      : Promise.resolve(),
    persistArtifactReference({
      jobId: job.id,
      sessionId,
      kind: 'report',
      fileName: 'result-summary.json',
      mimeType: 'application/json',
      payload: JSON.stringify({
        rectifiedTime: results.rectifiedTime,
        accuracy: results.accuracy,
        confidence: results.confidence,
      }),
      metadata: {
        source: 'queue_manager',
      },
    }),
  ]);

  await appendLifecycleEvent(sessionId, 'job.completed', {
    status: 'completed',
    rectifiedTime: results.rectifiedTime,
    accuracy: results.accuracy,
    confidence: results.confidence,
  });
}

async function syncJobFailed(
  sessionId: string,
  errorMessage: string,
  errorCode?: string
): Promise<void> {
  const job = await getTrackedJob(sessionId);
  if (!job) {
    return;
  }

  await failJobRecord({
    jobId: job.id,
    errorCode: errorCode ?? null,
    errorMessage,
    status: 'failed',
  });

  await appendLifecycleEvent(sessionId, 'job.failed', {
    status: 'failed',
    errorCode: errorCode ?? undefined,
    errorMessage,
  });
}

async function syncJobHeartbeat(sessionId: string): Promise<void> {
  const job = await getTrackedJob(sessionId);
  if (!job) {
    return;
  }

  const progress = await getSessionProgress(sessionId);
  const currentStage = getCurrentStage(progress) ?? job.currentStage;
  const checkpointJson = await buildCheckpointPayload(sessionId, job.status, {
    attempt: job.attempt,
    retryCount: job.retryCount,
  });

  await updateJobProgressRecord({
    jobId: job.id,
    currentStage,
    progressPercent: progress?.percentage ?? job.progressPercent,
    checkpointJson,
  });

  const attemptId = activeAttemptIds.get(sessionId);
  if (attemptId) {
    await updateJobAttemptHeartbeat({
      attemptId,
      checkpointJson,
    });
  }
}

function getCurrentStage(progress: Awaited<ReturnType<typeof getSessionProgress>>): string | null {
  if (!progress) {
    return null;
  }

  const currentStep = progress.steps?.[progress.currentStep];
  return currentStep?.id ?? null;
}

async function syncJobCancelled(sessionId: string): Promise<void> {
  const job = await getTrackedJob(sessionId);
  if (!job) {
    return;
  }

  await requestJobCancellationRecord(job.id);
  await failJobRecord({
    jobId: job.id,
    errorMessage: 'Cancelled by user',
    status: 'cancelled',
  });

  const attemptId = activeAttemptIds.get(sessionId);
  if (attemptId) {
    await completeJobAttempt({
      attemptId,
      outcome: 'cancelled',
      failureReason: 'Cancelled by user',
      checkpointJson: await buildCheckpointPayload(sessionId, 'cancelled'),
    });
    activeAttemptIds.delete(sessionId);
  }

  await appendLifecycleEvent(sessionId, 'job.cancelled', {
    status: 'cancelled',
    errorMessage: 'Cancelled by user',
  });
}

async function beginTrackedJobAttempt(sessionId: string): Promise<void> {
  const job = await getTrackedJob(sessionId);
  if (!job) {
    return;
  }

  const updatedJob = await incrementJobAttempt(job.id);
  const attemptNo = updatedJob?.attempt ?? job.attempt + 1;
  const attempt = await createJobAttempt({
    id: crypto.randomUUID(),
    jobId: job.id,
    attemptNo,
    workerId,
    leaseToken: crypto.randomUUID(),
  });

  activeAttemptIds.set(sessionId, attempt.id);
}

async function completeTrackedJobAttempt(
  sessionId: string,
  outcome: 'succeeded' | 'failed' | 'cancelled' | 'abandoned',
  failureReason?: string,
  failureCode?: string
): Promise<void> {
  const attemptId = activeAttemptIds.get(sessionId);
  if (!attemptId) {
    return;
  }

  const job = await getTrackedJob(sessionId);
  await completeJobAttempt({
    attemptId,
    outcome,
    failureReason: failureReason ?? null,
    failureCode: failureCode ?? null,
    checkpointJson: (job?.checkpointJson as Record<string, unknown> | null) ?? null,
  });
  activeAttemptIds.delete(sessionId);
}

async function writeDeadLetterArtifact(sessionId: string, errorMessage: string, attemptsUsed: number): Promise<void> {
  const job = await getTrackedJob(sessionId);
  if (!job) {
    return;
  }

  await persistArtifactReference({
    jobId: job.id,
    sessionId,
    kind: 'dead_letter_report',
    fileName: 'dead-letter-report.json',
    mimeType: 'application/json',
    payload: JSON.stringify({
      jobId: job.id,
      sessionId,
      retryCount: job.retryCount,
      attemptsUsed,
      maxAttempts: job.maxAttempts,
      errorMessage,
      checkpoint: job.checkpointJson ?? null,
      cursor: job.cursorJson ?? null,
      finalStatus: 'failed',
      createdAt: new Date().toISOString(),
    }),
    metadata: {
      reason: 'max_attempts_exceeded',
      attemptsUsed,
      maxAttempts: job.maxAttempts,
      retryCount: job.retryCount,
      errorMessage,
      finalStatus: 'failed',
      createdAt: new Date().toISOString(),
    },
  });

  await appendLifecycleEvent(sessionId, 'job.dead_lettered', {
    status: 'failed',
    reason: 'max_attempts_exceeded',
    attemptsUsed,
    maxAttempts: job.maxAttempts,
    errorMessage,
  });

  await queueDriver.moveToDeadLetter(sessionId, {
    reason: 'max_attempts_exceeded',
    attemptsUsed,
    maxAttempts: job.maxAttempts,
    retryCount: job.retryCount,
    errorMessage,
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE OPERATIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Add a new request to the queue
 * Returns queue position and estimated wait time
 */
export async function addToQueue(sessionId: string): Promise<QueueSubmitResult> {
  try {
    // Check queue size limit
    const queuedCount = await getQueuedCount();

    if (queuedCount >= QUEUE_CONFIG.maxQueueSize) {
      return {
        success: false,
        error: 'Queue is full. Please try again in a few minutes.',
      };
    }

    if (queuedCount >= QUEUE_CONFIG.loadShedQueueDepth) {
      const retryAfterSeconds = Math.max(
        5,
        Math.ceil(QUEUE_CONFIG.baseAnalysisTime / Math.max(1, QUEUE_CONFIG.maxConcurrent))
      );
      return {
        success: false,
        error: `[RATE_LIMIT_EXCEEDED] System is under high load. Please retry shortly. retry_after=${retryAfterSeconds}`,
      };
    }

    // Update session status to queued
    await executeWithRetry(() =>
      db.update(sessions)
        .set({
          status: 'queued',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(sessions.id, sessionId))
    );

    await syncJobQueued(sessionId);
    await queueDriver.enqueueSession(sessionId);

    // Start processor if not running
    startQueueProcessor();

    const status = await getQueueStatus(sessionId);

    logger.info('Request added to queue', {
      sessionId,
      position: status?.position || 0,
      estimatedWait: status?.estimatedWaitSeconds || 0,
    });

    return {
      success: true,
      sessionId,
      position: status?.position || 0,
      estimatedWaitSeconds: status?.estimatedWaitSeconds || 0,
    };
  } catch (error) {
    logger.error('Failed to add to queue', error);
    return {
      success: false,
      error: 'Failed to queue request',
    };
  }
}

/**
 * Get current queue position for a session
 */
export async function getQueuePosition(sessionId: string): Promise<number> {
  try {
    const active = await queueDriver.listActiveJobs();
    const item = active.find((job) => job.sessionId === sessionId);
    if (!item) return 0;

    if (item.status === 'running') return 0;

    const index = active.findIndex((job) => job.sessionId === sessionId);
    const position = Math.max(1, index - QUEUE_CONFIG.maxConcurrent + 1);

    return position;
  } catch (error) {
    logger.error('Failed to get queue position', error);
    return 0;
  }
}

/**
 * Get full queue status for a session
 */
export async function getQueueStatus(sessionId: string): Promise<QueuePosition | null> {
  try {
    const sessionRows = await executeWithRetry(() =>
      db.select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1)
    );

    if (sessionRows.length === 0) {
      return null;
    }

    const session = sessionRows[0];
    const job = await getTrackedJob(sessionId);
    const queueStatus = mapJobStatusToQueueStatus(job?.status ?? session.status);
    const position = queueStatus === 'queued' || queueStatus === 'processing'
      ? await getQueuePosition(sessionId)
      : 0;

    // 🚀 GOD-TIER DYNAMIC WAIT ESTIMATION
    let estimatedWaitSeconds = 0;
    const activeCount = activeProcessingIds.size;

    if (queueStatus === 'queued') {
      // 1. Calculate how much time is left in the CURRENT active slots
      const contentionFactor = 1 + (Math.max(0, activeCount - 1) * QUEUE_CONFIG.contentionMultiplier);
      const adjustedCycleTime = QUEUE_CONFIG.baseAnalysisTime * contentionFactor;

      const sessionTimes = Array.from(processingStartTimes.values());
      const remainingTimes = sessionTimes.map(startTime => {
        const elapsed = (Date.now() - startTime) / 1000;
        return Math.max(10, adjustedCycleTime - elapsed);
      });

      // The next slot opens at the MIN of remaining times
      const nextSlotAvailableIn = remainingTimes.length > 0 ? Math.min(...remainingTimes) : 0;

      // 2. Add time for people ahead of you in the queue
      const itemsAhead = Math.max(0, position - 1);
      const waitPerQueueItem = adjustedCycleTime / QUEUE_CONFIG.maxConcurrent;

      estimatedWaitSeconds = Math.ceil(nextSlotAvailableIn + (itemsAhead * waitPerQueueItem));
    }

    const totalInQueue = await getQueuedCount();

    return {
      sessionId,
      status: queueStatus,
      position,
      estimatedWaitSeconds,
      totalInQueue,
      createdAt: session.createdAt || '',
      session,
    };
  } catch (error) {
    logger.error('Failed to get queue status', { error: (error as any)?.message || error });
    return null;
  }
}

/**
 * Get count of queued + processing requests
 */
async function getQueuedCount(): Promise<number> {
  try {
    return await queueDriver.countQueuedJobs();
  } catch (error) {
    return 0;
  }
}

/**
 * Get next session to process (FIFO)
 */
async function _getNextInQueue(): Promise<string | null> {
  try {
    const nextJob = await queueDriver.claimNextQueuedJob();
    return nextJob?.sessionId ?? null;
  } catch (error) {
    logger.error('Failed to get next in queue', { error: (error as any)?.message || error });
    return null;
  }
}

function getRowsAffected(result: unknown): number | null {
  if (result && typeof result === 'object' && 'rowsAffected' in (result as Record<string, unknown>)) {
    const value = (result as { rowsAffected?: unknown }).rowsAffected;
    if (typeof value === 'number') return value;
  }
  return null;
}

/**
 * Atomically claim the next queued session.
 * Prevents two workers from processing the same session under race.
 */
async function claimNextQueuedSession(): Promise<string | null> {
  const claimedJob = await queueDriver.claimNextQueuedJob();
  if (!claimedJob) {
    return null;
  }

  const updateResult = await executeWithRetry(() =>
    db.update(sessions)
      .set({
        status: 'processing',
        startedProcessingAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sessions.id, claimedJob.sessionId))
  );

  const rowsAffected = getRowsAffected(updateResult);
  if (rowsAffected === 0) {
    await failJobRecord({
      jobId: claimedJob.id,
      errorMessage: 'Session missing during claim',
      status: 'failed',
    });
    return null;
  }

  activeProcessingIds.add(claimedJob.sessionId);
  processingStartTimes.set(claimedJob.sessionId, Date.now());
  await beginTrackedJobAttempt(claimedJob.sessionId);
  await syncJobRunning(claimedJob.sessionId);
  return claimedJob.sessionId;
}

/**
 * Test hooks for deterministic race-condition validation.
 * Not used in production paths.
 */
export const __queueInternals = {
  claimNextQueuedSession,
};

export function __resetQueueStateForTests(): void {
  activeProcessingIds.clear();
  activeAttemptIds.clear();
  processingStartTimes.clear();
  isProcessorRunning = false;
  resetAllCircuitBreakersForTests();
  recoveryTelemetry.lastRunAt = null;
  recoveryTelemetry.lastRecoveredJobs = 0;
  recoveryTelemetry.lastAbandonedAttempts = 0;
  recoveryTelemetry.totalRecoveredJobs = 0;
  recoveryTelemetry.totalAbandonedAttempts = 0;
  recoveryTelemetry.alertActive = false;
}

/**
 * Mark session as processing
 */
async function _markAsProcessing(sessionId: string): Promise<void> {
  await executeWithRetry(() =>
    db.update(sessions)
      .set({
        status: 'processing',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sessions.id, sessionId))
  );

  activeProcessingIds.add(sessionId);
  processingStartTimes.set(sessionId, Date.now());
  await syncJobRunning(sessionId);
}

/**
 * Mark session as complete with results
 */
export async function markAsComplete(
  sessionId: string,
  results: {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
    analysisResult: string;
    reasoningLogs?: string | null;
  }
): Promise<void> {
  const updateResult = await executeWithRetry(() =>
    db.update(sessions)
      .set({
        status: 'complete',
        rectifiedTime: results.rectifiedTime,
        accuracy: results.accuracy,
        confidence: results.confidence,
        analysisResult: results.analysisResult,
        // progressData: LEAVE AS IS (Saved by ProgressTracker.complete())
        reasoningLogs: results.reasoningLogs ? JSON.stringify(results.reasoningLogs) : null, // 🔥 PERSISTING LOGS NOW
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any)
      .where(and(
        eq(sessions.id, sessionId),
        eq(sessions.status, 'processing')
      ))
  );

  const rowsAffected = getRowsAffected(updateResult);
  if (rowsAffected === 0) {
    logger.warn('Skipped complete transition due to non-processing state', { sessionId });
    activeProcessingIds.delete(sessionId);
    processingStartTimes.delete(sessionId);
    return;
  }

  activeProcessingIds.delete(sessionId);
  processingStartTimes.delete(sessionId);
  await completeTrackedJobAttempt(sessionId, 'succeeded');

  logger.info('Session marked complete', { sessionId });
  await syncJobCompleted(sessionId, results);

  // ⚡ Emit Complete Event so frontend gets the result!
  emitComplete(
    sessionId,
    results.rectifiedTime,
    results.accuracy,
    results.confidence
  );
}

/**
 * Mark session as failed and flush technical trash
 */
export async function markAsFailed(
  sessionId: string,
  error: string,
  errorCode?: string
): Promise<void> {
  // 🧹 FLUSH KACHRA & ABORT: Stop operations and clear logs immediately on failure
  await flushSessionTrash(sessionId);

  const updateResult = await executeWithRetry(() =>
    db.update(sessions)
      .set({
        status: 'failed',
        errorMessage: error,
        updatedAt: new Date().toISOString(),
      })
      .where(and(
        eq(sessions.id, sessionId),
        eq(sessions.status, 'processing')
      ))
  );

  const rowsAffected = getRowsAffected(updateResult);
  if (rowsAffected === 0) {
    logger.warn('Skipped failed transition due to non-processing state', { sessionId, error });
    activeProcessingIds.delete(sessionId);
    processingStartTimes.delete(sessionId);
    return;
  }

  activeProcessingIds.delete(sessionId);
  processingStartTimes.delete(sessionId);
  await completeTrackedJobAttempt(sessionId, 'failed', error, errorCode);

  logger.error('Session marked failed (Trash Flushed)', { sessionId, error });
  await syncJobFailed(sessionId, error, errorCode);
}

/**
 * Technical Trash Flush Tool
 * Aborts ongoing operations and wipes heavy processing artifacts (logs, cache, results)
 */
export async function flushSessionTrash(sessionId: string): Promise<void> {
  try {
    logger.info('🧹 Flushing technical trash and aborting session', { sessionId });

    // 1. 🛑 ABORT Engine: Immediately kill all ongoing AI calls and calculations
    abortSessionController(sessionId);

    // 2. 🧽 DB WIPE: Clear heavy processing columns
    await executeWithRetry(() =>
      db.update(sessions)
        .set({
          progressData: null,
          analysisResult: null,
          // reasoningLogs: null, // Note: Not in DB but keep in mind
          updatedAt: new Date().toISOString(),
        } as any)
        .where(eq(sessions.id, sessionId))
    );

    // 3. 🗑️ CACHE WIPE: Delete all ephemeris cache records for this session
    await executeWithRetry(() =>
      db.delete(calculations)
        .where(eq(calculations.sessionId, sessionId))
    );

    // 4. Memory Cleanup
    cleanupController(sessionId);
    ProgressTracker.clearInstance(sessionId);
    activeProcessingIds.delete(sessionId);
    processingStartTimes.delete(sessionId);

    logger.debug('✨ Trash flush complete', { sessionId });
  } catch (error) {
    logger.error('Failed to flush session trash', { sessionId, error });
  }
}

/**
 * Update session timestamp to prevent it from being marked as stale
 */
export async function heartbeat(sessionId: string): Promise<void> {
  await executeWithRetry(() =>
    db.update(sessions)
      .set({
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sessions.id, sessionId))
  );
  await syncJobHeartbeat(sessionId);
}

async function releaseProcessingSlot(sessionId: string): Promise<void> {
  activeProcessingIds.delete(sessionId);
  processingStartTimes.delete(sessionId);
}

async function markSessionQueuedForRetry(sessionId: string): Promise<void> {
  await executeWithRetry(() =>
    db.update(sessions)
      .set({
        status: 'queued',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sessions.id, sessionId))
  );

  await syncJobQueued(sessionId);
  await releaseProcessingSlot(sessionId);
}

/**
 * Cancel a session
 */
export async function cancelSession(sessionId: string): Promise<boolean> {
  try {
    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!session.length) return false;

    const job = await getTrackedJob(sessionId);
    const activeJobStatus = job?.status;
    if (activeJobStatus && !['queued', 'running', 'retrying'].includes(activeJobStatus)) {
      logger.warn(`Cannot cancel session ${sessionId}: job status is '${activeJobStatus}'`);
      return false;
    }

    // 🧹 FLUSH KACHRA & ABORT: Stop operations and clear logs immediately
    await flushSessionTrash(sessionId);

    const updateResult = await executeWithRetry(() =>
      db.update(sessions)
        .set({
          status: 'failed',
          errorMessage: 'Cancelled by user',
          updatedAt: new Date().toISOString(),
        })
        .where(and(
          eq(sessions.id, sessionId),
          or(
            eq(sessions.status, 'pending'),
            eq(sessions.status, 'queued'),
            eq(sessions.status, 'processing')
          )
        ))
    );

    const rowsAffected = getRowsAffected(updateResult);
    if (rowsAffected === 0) {
      logger.warn('Cancel skipped due to status transition race', { sessionId });
      return false;
    }

    emitError(sessionId, 'Cancelled by user', 'cancelled');
    await syncJobCancelled(sessionId);
    logger.info('Session cancelled by user (Full Wipe Complete)', { sessionId });
    return true;
  } catch (error) {
    logger.error('Failed to cancel session', { error: (error as any)?.message || error });
    return false;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// C4 FIX: Retry & Circuit Breaker Helper Functions
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelayMs);
}

function mapReasonToDependency(reasonCode: RetryReasonCode): CircuitDependency {
  switch (reasonCode) {
    case 'database_busy':
      return 'database';
    case 'rate_limited':
    case 'service_unavailable':
      return 'ai_provider';
    case 'network_error':
    case 'upstream_timeout':
      return 'network';
    default:
      return 'processing';
  }
}

/**
 * Determine if error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    // Network errors - retry
    if (msg.includes('timeout') ||
      msg.includes('network') ||
      msg.includes('econnrefused') ||
      msg.includes('enotfound') ||
      msg.includes('rate limit') ||
      msg.includes('429') ||
      msg.includes('503') ||
      msg.includes('too many requests') ||
      msg.includes('etimedout') ||
      msg.includes('econnreset')) {
      return true;
    }

    // AI service errors - retry (only transient/network issues)
    // NOTE: ai_analysis_incomplete is NOT retryable — it's a parsing failure,
    // and retrying restarts ALL 6 stages (~19 AI calls each time = credit drain)
    if (msg.includes('openrouter') ||
      msg.includes('temporarily unavailable') ||
      msg.includes('service unavailable')) {
      return true;
    }

    // Database transient errors - retry
    if (msg.includes('database is locked') ||
      msg.includes('busy') ||
      msg.includes('sqlITE_BUSY')) {
      return true;
    }
  }

  return false;
}

/**
 * Process session with retry logic (C4 Fix)
 */
async function processSessionWithRetry(sessionId: string, attempt: number = 0): Promise<void> {
  logger.debug('processSessionWithRetry called', { sessionId, attempt });
  try {
    await processSessionAsync(sessionId);

    logger.debug('processSessionAsync completed successfully', { sessionId });
    recordGlobalProcessingSuccess();

  } catch (error) {
    const isRetryable = isRetryableError(error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    const retryReasonCode = deriveRetryReasonCode(error);
    const dependency = mapReasonToDependency(retryReasonCode);

    if (isRetryable && attempt < RETRY_CONFIG.maxRetries) {
      const delay = getRetryDelay(attempt);
      await completeTrackedJobAttempt(sessionId, 'abandoned', errorMsg, retryReasonCode);
      const job = await getTrackedJob(sessionId);
      if (job) {
        const nextRetryAt = new Date(Date.now() + delay).toISOString();
        await scheduleJobRetry({
          jobId: job.id,
          retryCount: job.retryCount + 1,
          retryReasonCode,
          nextRetryAt,
          errorCode: retryReasonCode,
          errorMessage: errorMsg,
        });
        await appendLifecycleEvent(sessionId, 'job.retrying', {
          status: 'retrying',
          attempt: attempt + 1,
          retryCount: job.retryCount + 1,
          retryReasonCode,
          delayMs: delay,
          nextRetryAt,
          errorMessage: errorMsg,
        });
        await queueDriver.scheduleRetrySession(sessionId, nextRetryAt);
      }

      if (config.queue.architecture === 'redis_bullmq') {
        await markSessionQueuedForRetry(sessionId);
        logger.warn(`Queued retry via Redis transport for session ${sessionId}`, {
          delayMs: delay,
          attempt: attempt + 1,
          maxAttempts: RETRY_CONFIG.maxRetries,
          retryReasonCode,
        });
        return;
      }

      logger.warn(`Retrying session ${sessionId} after ${delay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries})`, {
        error: errorMsg,
        isRetryable,
      });

      await sleep(delay);
      await beginTrackedJobAttempt(sessionId);
      return processSessionWithRetry(sessionId, attempt + 1);
    }

    // Non-retryable or max retries exceeded
    logger.error(`Session ${sessionId} failed permanently after ${attempt + 1} attempts`, {
      error: errorMsg,
      isRetryable,
      retryReasonCode,
    });
    recordDependencyFailure(dependency);

    // Try to mark as failed (with its own error handling)
    try {
      await writeDeadLetterArtifact(sessionId, errorMsg, attempt + 1);
      await markAsFailed(sessionId, errorMsg, retryReasonCode);
    } catch (markError) {
      logger.error(`Failed to mark session ${sessionId} as failed`, markError);
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE PROCESSOR
// ═════════════════════════════════════════════════════════════════════════════

// processSecondsPrecisionBTR imported at top of file

/**
 * Start the queue processor
 * Runs in background, processes one request at a time
 */
export function startQueueProcessor(): void {
  if (isProcessorRunning) {
    return; // Already running
  }

  if (config.queue.executionMode === 'external_worker') {
    logger.info('Queue processor start skipped because execution mode is external_worker');
    return;
  }

  isProcessorRunning = true;
  void processQueue();
}

/**
 * Main queue processing loop (C4 Fix: Global error handling + Circuit breaker)
 */
async function processQueue(): Promise<void> {
  logger.info('Queue processor loop started with C4 fixes (retry + circuit breaker)');

  while (isProcessorRunning) {
    await runQueueIteration();
  }
}

export async function runQueueIteration(): Promise<void> {
  try {
    const blockingBreakers = getBlockingCircuitBreakers();
    if (blockingBreakers.length > 0) {
      const remainingMs = Math.min(...blockingBreakers.map((breaker) => breaker.remainingMs));
      const remainingSec = Math.ceil(remainingMs / 1000);
      logger.error('Dependency circuit breaker open. Pausing queue iteration.', {
        blockingDependencies: blockingBreakers.map((breaker) => breaker.dependency),
        remainingSec,
      });
      await sleep(Math.max(1000, Math.min(config.queue.pollIntervalMs, remainingMs)));
      return;
    }

    await cleanupStaleRequests();

    const memoryPressure = getMemoryPressureSnapshot();
    const { heapUsedGB, heapTotalGB, rssGB } = memoryPressure;
    let effectiveMaxConcurrent = QUEUE_CONFIG.maxConcurrent;

    if (Math.random() < 0.1) {
      const snapshot = getCircuitSnapshots();
      logger.info('[MEMORY] Queue runtime snapshot', {
        rssGB: Number(rssGB.toFixed(2)),
        heapUsedGB: Number(heapUsedGB.toFixed(2)),
        heapTotalGB: Number(heapTotalGB.toFixed(2)),
        concurrentActive: activeProcessingIds.size,
        concurrentLimit: effectiveMaxConcurrent,
        circuitBreakers: snapshot.map((item) => ({
          dependency: item.dependency,
          consecutiveFailures: item.consecutiveFailures,
          isOpen: item.isOpen,
        })),
      });
    }

    if (memoryPressure.isUnderPressure) {
      logger.warn(`[PRESSURE] RAM Pressure detected (RSS: ${rssGB.toFixed(2)}GB, Heap: ${heapUsedGB.toFixed(2)}GB), restricting concurrency from ${effectiveMaxConcurrent} to 1`);
      effectiveMaxConcurrent = 1;
      triggerGC();
    }

    if (activeProcessingIds.size >= effectiveMaxConcurrent) {
      const queuedCount = await getQueuedCount();
      if (queuedCount > activeProcessingIds.size) {
        logger.debug('Queue blocked: all slots full', {
          active: activeProcessingIds.size,
          max: QUEUE_CONFIG.maxConcurrent
        });
      }
      await sleep(1000);
      return;
    }

    const nextId = await claimNextQueuedSession();
    if (nextId === null) {
      await sleep(config.queue.pollIntervalMs);
      return;
    }

    logger.debug('Found next queued session', { sessionId: nextId });
    logger.debug('Claimed session as processing', { sessionId: nextId });

    processSessionWithRetry(nextId).catch(err => {
      logger.error('UNHANDLED ERROR in processSessionWithRetry', { sessionId: nextId, error: err });
      recordDependencyFailure('processing');
    });
  } catch (error) {
    logger.error('Queue processor error', { error: (error as any)?.message || error });
    const reasonCode = deriveRetryReasonCode(error);
    recordDependencyFailure(mapReasonToDependency(reasonCode));

    const processingSnapshot = getCircuitSnapshots().find((item) => item.dependency === 'processing');
    const failureDepth = processingSnapshot?.consecutiveFailures ?? 1;
    const delay = getRetryDelay(Math.min(failureDepth, 5));
    logger.info(`Queue processor backing off for ${delay}ms due to error`);
    await sleep(delay);
  }
}

/**
 * Process a single session (async worker)
 */
async function processSessionAsync(sessionId: string): Promise<void> {
  logger.debug('processSessionAsync entered', { sessionId });
  try {
    logger.debug('processSessionAsync querying DB', { sessionId });
    logger.info('Starting to process request', { sessionId });

    // Get session data
    const session = await executeWithRetry(() =>
      db.select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1)
    );

    if (session.length === 0) {
      throw new Error('Session not found');
    }

    const s = session[0];

    // 🛑 Create AbortController for this session
    const abortController = createAbortController(sessionId);

    // Process the analysis
    try {
      await heartbeat(sessionId);
      const heartbeatTimer = setInterval(() => {
        void heartbeat(sessionId).catch((error) => {
          logger.warn('Worker heartbeat failed', {
            sessionId,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }, 15000);

      try {
      // 🔐 Decrypt sensitive data using clerkId (encryption key)
      // lifeEvents is nullable for drafts, but at processing stage it must exist
      if (!s.lifeEvents) {
        throw new Error('lifeEvents data is missing - cannot process without life events');
      }

      let decryptedLifeEvents;
      const lifeEventsDecrypted = safeDecryptWithFallback(s.lifeEvents, s.clerkId, s.userId);
      if (lifeEventsDecrypted) {
        decryptedLifeEvents = JSON.parse(lifeEventsDecrypted);
      } else {
        // Fallback: Try parsing as plain JSON (for Hybrid/Vercel created sessions)
        try {
          decryptedLifeEvents = JSON.parse(s.lifeEvents);
        } catch (e) {
          throw new Error('Failed to decrypt or parse lifeEvents data');
        }
      }

      let decryptedPhysicalTraits: any = undefined;
      if (s.physicalTraits) {
        const decrypted = safeDecryptWithFallback(s.physicalTraits, s.clerkId, s.userId);
        if (decrypted) {
          try {
            decryptedPhysicalTraits = JSON.parse(decrypted);
          } catch (e) {
            logger.warn('Failed to parse physicalTraits JSON, using undefined', { sessionId, error: e });
          }
        } else {
          // Fallback: Try parsing as plain JSON
          try {
            decryptedPhysicalTraits = JSON.parse(s.physicalTraits);
          } catch (e) {
            // Ignore plain text parse errors for optional fields
          }
        }
      }

      let decryptedForensicTraits: any = undefined;
      if (s.forensicTraits) {
        const decrypted = safeDecryptWithFallback(s.forensicTraits, s.clerkId, s.userId);
        if (decrypted) {
          try {
            decryptedForensicTraits = JSON.parse(decrypted);
          } catch (e) {
            logger.warn('Failed to parse forensicTraits JSON, using undefined', { sessionId, error: e });
          }
        } else {
          // Fallback: Try parsing as plain JSON
          try {
            decryptedForensicTraits = JSON.parse(s.forensicTraits);
          } catch (e) {
            // Ignore plain text parse errors for optional fields
          }
        }
      }

      // 🔐 Decrypt core birth data (Robust Fallback for Legacy Sessions)
      const dateOfBirth = parseSensitiveField(s.dateOfBirth, s.clerkId, s.userId);
      const tentativeTime = parseSensitiveField(s.tentativeTime, s.clerkId, s.userId);

      // 🔍 DEBUG: Log time format to catch "Invalid time value"
      logger.info('🔍 [TIME DEBUG]', {
        sessionId,
        rawTime: s.tentativeTime?.substring(0, 20) + '...',
        decryptedTime: tentativeTime,
        type: typeof tentativeTime
      });

      // Decrypt Spouse Data if present
      let decryptedSpouseData: any = undefined;
      if (s.spouseData) {
        decryptedSpouseData = parseSensitiveField(s.spouseData, s.clerkId, s.userId);
      }

      // 🚀 GOD-TIER STARTUP LOGGING
      logger.info('🚀 [ENGINE START] Initializing Seconds Precision BTR...', {
        sessionId,
        offsetConfig: s.offsetConfig ? 'Preserving User Config' : 'Using Default',
        dashaSystem: 'Vimshottari'
      });

      const result = await processSecondsPrecisionBTR({
        sessionId: sessionId,
        dateOfBirth: dateOfBirth,
        tentativeTime: tentativeTime,
        latitude: s.latitude,
        longitude: s.longitude,
        timezone: s.timezone,
        lifeEvents: decryptedLifeEvents,
        offsetConfig: (() => {
          // 🧠 Robust Offset Parsing: Prioritize User Config > Default
          const raw = parseSensitiveField(s.offsetConfig, s.clerkId, s.userId);
          if (raw && (raw.preset || raw.customMinutes)) return raw;
          return { preset: '1hour' }; // Only fallback if totally missing/invalid
        })(),
        physicalTraits: decryptedPhysicalTraits,
        forensicTraits: decryptedForensicTraits,
        spouseData: decryptedSpouseData,
        abortSignal: abortController.signal, // 🛑 Pass abort signal
      });

      logger.info('✅ [ENGINE COMPLETE] Analysis finished successfully', { sessionId });


      // ✂️ SPLIT REASONING LOGS (Database Optimization)
      // Capture the persistent stage history from the ProgressTracker
      let _reasoningLogs: string | null = null;
      let optimizedAnalysisStr = "";

      try {
        const tracker = ProgressTracker.getInstance(sessionId);
        if (tracker) {
          const history = tracker.getProgress().stageHistory;
          _reasoningLogs = JSON.stringify(history);
        }

        optimizedAnalysisStr = JSON.stringify(result.analysisResult);
      } catch (e) {
        logger.warn('Failed to serialize analysis result', { error: (e as any)?.message || e });
        optimizedAnalysisStr = JSON.stringify({ error: "Serialization failed" });
      }

      await markAsComplete(sessionId, {
        ...result,
        analysisResult: optimizedAnalysisStr
        // reasoningLogs: null // 🔥 NOT SAVED TO DB
      });

      cleanupController(sessionId); // Cleanup on success
      } finally {
        clearInterval(heartbeatTimer);
      }
    } catch (error) {
      // Check if this was a cancellation
      if (isCancellationError(error)) {
        logger.info('Session processing cancelled', { sessionId });
        cleanupController(sessionId);
        // Status already set to 'failed' by cancelSession, no need to update
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('[PROCESSING ERROR] Session failed during processing', {
          sessionId,
          errorMsg,
          errorStack: errorStack?.substring(0, 500)
        });
        cleanupController(sessionId);
        throw error;
      }
    }
  } catch (error) {
    logger.error('Async worker error', error);
    throw error;
  } finally {
    // 🛡️ Ensure slot is ALWAYS released
    activeProcessingIds.delete(sessionId);

    // 🚀 GOD-TIER MEMORY RECOVERY
    // Manually trigger Garbage Collection if --expose-gc is enabled
    if ((global as any).gc) {
      logger.info('[MEMORY] Triggering manual GC after session recovery');
      (global as any).gc();
    }
  }
}

/**
 * Cleanup stale requests (stuck in processing for too long)
 */
async function cleanupStaleRequests(): Promise<void> {
  try {
    const staleThreshold = new Date(Date.now() - QUEUE_CONFIG.staleTimeoutMs).toISOString();

    // Find processing requests that are too old
    const stale = await executeWithRetry(() =>
      db.select({ id: sessions.id })
        .from(sessions)
        .where(and(
          eq(sessions.status, 'processing'),
          lt(sessions.updatedAt, staleThreshold)
        ))
    );

    for (const s of stale) {
      await markAsFailed(s.id, 'Request timed out');
      logger.warn('Cleaned up stale request', { sessionId: s.id });
    }
  } catch (error) {
    logger.error('Cleanup stale requests failed', error);
  }
}

/**
 * Stop the queue processor (for graceful shutdown)
 */
export function stopQueueProcessor(): void {
  isProcessorRunning = false;
  logger.info('Queue processor stopped');
}

export async function waitForQueueDrain(
  timeoutMs = 30_000,
  pollIntervalMs = 250
): Promise<{ drained: boolean; activeJobs: number; waitedMs: number }> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const activeJobs = activeProcessingIds.size;
    if (activeJobs === 0) {
      return {
        drained: true,
        activeJobs: 0,
        waitedMs: Date.now() - start,
      };
    }
    await sleep(pollIntervalMs);
  }

  return {
    drained: activeProcessingIds.size === 0,
    activeJobs: activeProcessingIds.size,
    waitedMs: Date.now() - start,
  };
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
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

    // Filter by today's date — previously todayStr was computed but never used
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
      averageWaitTime: QUEUE_CONFIG.baseAnalysisTime,
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

// ═════════════════════════════════════════════════════════════════════════════
// UTILITY
// ═════════════════════════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function recoverInterruptedJobsOnStartup(): Promise<{
  recoveredJobs: number;
  abandonedAttempts: number;
}> {
  const runningJobs = await executeWithRetry(() =>
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

  let recoveredJobs = 0;
  let abandonedAttempts = 0;

  for (const runningJob of runningJobs) {
    const now = new Date().toISOString();

    if (runningJob.attemptId) {
      await completeJobAttempt({
        attemptId: runningJob.attemptId,
        outcome: 'abandoned',
        failureReason: 'Worker restarted before completion',
        failureCode: 'worker_restart',
        checkpointJson: (runningJob.checkpointJson as Record<string, unknown> | null) ?? null,
      });
      abandonedAttempts += 1;
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

    recoveredJobs += 1;
  }

  if (recoveredJobs > 0) {
    logger.warn('Recovered interrupted running jobs on startup', {
      recoveredJobs,
      abandonedAttempts,
    });
  }

  recoveryTelemetry.lastRunAt = new Date().toISOString();
  recoveryTelemetry.lastRecoveredJobs = recoveredJobs;
  recoveryTelemetry.lastAbandonedAttempts = abandonedAttempts;
  recoveryTelemetry.totalRecoveredJobs += recoveredJobs;
  recoveryTelemetry.totalAbandonedAttempts += abandonedAttempts;
  recoveryTelemetry.alertActive =
    abandonedAttempts >= (config.queue.recoveryAlertThreshold ?? 1) ||
    recoveredJobs >= (config.queue.recoveryAlertThreshold ?? 1);

  return {
    recoveredJobs,
    abandonedAttempts,
  };
}

/**
 * Cleanup processing sessions on startup (Zombie killer)
 * Two strategies:
 * 1. STALE: Sessions stuck in 'processing' for > 10 minutes (time-based)
 * 2. ORPHAN: Sessions marked 'processing' in DB but NOT in activeProcessingIds
 *    (lost during dev hot-reloads or crash — the real zombie killer)
 */
export async function cleanupZombiesOnStartup(): Promise<void> {
  try {
    // Strategy 1: Time-based stale detection (production-safe)
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
        await markAsFailed(zombie.id, 'Process interrupted (Stale Session at Startup)');
      }
    }

    // Strategy 2: Orphan detection (dev-mode hot-reload safety net)
    // On fresh startup, activeProcessingIds is EMPTY. Any DB session showing
    // 'processing' is a guaranteed orphan — its worker died with the old process.
    const allProcessing = await db.select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.status, 'processing'));

    const orphans = allProcessing.filter(s => !activeProcessingIds.has(s.id));

    if (orphans.length > 0) {
      logger.warn(`🧟 Found ${orphans.length} orphaned zombie sessions (processing in DB but no active worker). Resetting to pending...`);
      for (const orphan of orphans) {
        // Reset to 'pending' so queue processor picks them up again
        await executeWithRetry(() =>
          db.update(sessions)
            .set({
              status: 'pending',
              errorMessage: null,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(sessions.id, orphan.id))
        );
        logger.info(`🧟 Orphan ${orphan.id} reset to pending for re-processing`);
      }
    }
  } catch (error) {
    logger.error('Zombie cleanup failed', error);
  }
}
