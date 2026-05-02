import crypto from 'node:crypto';
import {
  db,
  executeWithRetry,
} from '@ai-pandit/db';
import {
  scheduleJobRetry,
  failJob as failJobRecord,
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
import { getQueueDriver } from './queue/index.js';
import {
  getBlockingCircuitBreakers,
  getCircuitSnapshots,
  recordDependencyFailure,
  recordGlobalProcessingSuccess,
  resetAllCircuitBreakersForTests,
  type CircuitDependency,
} from './resilience/dependency-circuit-breaker.js';
import {
  syncJobQueued,
  syncJobRunning,
  syncJobCompleted,
  syncJobFailed,
  syncJobHeartbeat,
  syncJobCancelled,
  beginTrackedJobAttempt,
  completeTrackedJobAttempt,
  writeDeadLetterArtifact,
  getTrackedJob,
  mapJobStatusToQueueStatus,
  appendLifecycleEvent,
} from './job-lifecycle.js';
import {
  RETRY_CONFIG,
  type RetryReasonCode,
  deriveRetryReasonCode,
  getRetryDelay,
  mapReasonToDependency,
  isRetryableError,
} from './retry-policies.js';
import {
  recoveryTelemetry,
  recoverInterruptedJobsOnStartup as _recoverInterruptedJobsOnStartup,
  getQueueStats as _getQueueStats,
  cleanupZombiesOnStartup as _cleanupZombiesOnStartup,
  getQueueRecoveryTelemetry as _getQueueRecoveryTelemetry,
} from './metrics-reporter.js';

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE CONFIGURATION (Optimized for HF Spaces Free Tier: 16GB RAM)
// ═════════════════════════════════════════════════════════════════════════════

const QUEUE_CONFIG = {
  maxConcurrent: config.queue?.maxConcurrent ?? 3,
  pollIntervalMs: config.queue?.pollIntervalMs ?? 5000,
  maxQueueSize: config.queue?.maxSize ?? 100,
  loadShedQueueDepth: config.queue?.loadShedQueueDepth ?? 80,
  staleTimeoutMs: config.queue?.staleTimeoutMs ?? 7_200_000,
  baseAnalysisTime: config.queue?.baseAnalysisTime ?? 240,
  contentionMultiplier: config.queue?.contentionMultiplier ?? 0.1,
  memoryPressureThresholdGB: config.memory?.pressureThresholdGB ?? 10,
  memoryCriticalThresholdGB: config.memory?.criticalThresholdGB ?? 11,
};

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE STATUS TYPES
// ═════════════════════════════════════════════════════════════════════════════

import type { QueueStatus, QueuePosition, QueueSubmitResult, PhysicalTraits, ForensicTraits, SecondsPrecisionInput } from '@ai-pandit/shared';

export type { QueueStatus, QueuePosition, QueueSubmitResult };

// ═════════════════════════════════════════════════════════════════════════════
// IN-MEMORY STATE (minimal - just tracking current jobs)
// ═════════════════════════════════════════════════════════════════════════════

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

export function getQueueRecoveryTelemetry() {
  return _getQueueRecoveryTelemetry();
}

export function isQueueProcessorRunning(): boolean {
  return isProcessorRunning;
}

const processingStartTimes = new Map<string, number>();
let isProcessorRunning = false;
const queueDriver = getQueueDriver();

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE OPERATIONS
// ═════════════════════════════════════════════════════════════════════════════

export async function addToQueue(sessionId: string): Promise<QueueSubmitResult> {
  try {
    const queuedCount = await getQueuedCount();
    const capacityResult = checkQueueCapacity(queuedCount);
    if (capacityResult) {
      return capacityResult;
    }

    await enqueueSession(sessionId);
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

function checkQueueCapacity(queuedCount: number): QueueSubmitResult | null {
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

  return null;
}

async function enqueueSession(sessionId: string): Promise<void> {
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
}

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

export async function getQueueStatus(sessionId: string): Promise<QueuePosition | null> {
  try {
    const { session, job } = await fetchSessionAndJob(sessionId);
    if (!session) {
      return null;
    }

    const queueStatus = mapJobStatusToQueueStatus(job?.status ?? session.status);
    const position = await computeQueuePosition(sessionId, queueStatus);
    const estimatedWaitSeconds = await computeEstimatedWait(position, queueStatus);
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

async function fetchSessionAndJob(sessionId: string): Promise<{
  session: typeof sessions.$inferSelect | null;
  job: Awaited<ReturnType<typeof getTrackedJob>>;
}> {
  const sessionRows = await executeWithRetry(() =>
    db.select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1)
  );

  const session = sessionRows[0] ?? null;
  const job = session ? await getTrackedJob(sessionId) : null;

  return { session, job };
}

async function computeQueuePosition(sessionId: string, queueStatus: QueueStatus): Promise<number> {
  if (queueStatus !== 'queued' && queueStatus !== 'processing') {
    return 0;
  }
  return getQueuePosition(sessionId);
}

async function computeEstimatedWait(position: number, queueStatus: QueueStatus): Promise<number> {
  if (queueStatus !== 'queued') {
    return 0;
  }

  const activeCount = activeProcessingIds.size;
  const contentionFactor = 1 + (Math.max(0, activeCount - 1) * QUEUE_CONFIG.contentionMultiplier);
  const adjustedCycleTime = QUEUE_CONFIG.baseAnalysisTime * contentionFactor;

  const sessionTimes = Array.from(processingStartTimes.values());
  const remainingTimes = sessionTimes.map(startTime => {
    const elapsed = (Date.now() - startTime) / 1000;
    return Math.max(10, adjustedCycleTime - elapsed);
  });

  const nextSlotAvailableIn = remainingTimes.length > 0 ? Math.min(...remainingTimes) : 0;
  const itemsAhead = Math.max(0, position - 1);
  const waitPerQueueItem = adjustedCycleTime / QUEUE_CONFIG.maxConcurrent;

  return Math.ceil(nextSlotAvailableIn + (itemsAhead * waitPerQueueItem));
}

async function getQueuedCount(): Promise<number> {
  try {
    return await queueDriver.countQueuedJobs();
  } catch (error) {
    return 0;
  }
}

async function _getNextInQueue(): Promise<string | null> {
  try {
    const nextJob = await queueDriver.claimNextQueuedJob();
    return nextJob?.sessionId ?? null;
  } catch (error) {
    logger.error('Failed to get next in queue', { error: error instanceof Error ? error.message : error });
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
  await beginTrackedJobAttempt(claimedJob.sessionId, activeAttemptIds, workerId);
  await syncJobRunning(claimedJob.sessionId);
  return claimedJob.sessionId;
}

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
  const rowsAffected = await updateSessionToComplete(sessionId, results);
  if (rowsAffected === 0) {
    logger.warn('Skipped complete transition due to non-processing state', { sessionId });
    releaseProcessingSlot(sessionId);
    return;
  }

  releaseProcessingSlot(sessionId);
  await completeTrackedJobAttempt(sessionId, activeAttemptIds, 'succeeded');

  logger.info('Session marked complete', { sessionId });
  await syncJobCompleted(sessionId, results);
  emitComplete(
    sessionId,
    results.rectifiedTime,
    results.accuracy,
    results.confidence
  );
}

async function updateSessionToComplete(
  sessionId: string,
  results: {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
    analysisResult: string;
    reasoningLogs?: string | null;
  }
): Promise<number | null> {
  const updateResult = await executeWithRetry(() =>
    db.update(sessions)
      .set({
        status: 'complete',
        rectifiedTime: results.rectifiedTime,
        accuracy: results.accuracy,
        confidence: results.confidence,
        analysisResult: results.analysisResult,
        reasoningLogs: results.reasoningLogs ? JSON.stringify(results.reasoningLogs) : null,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any)
      .where(and(
        eq(sessions.id, sessionId),
        eq(sessions.status, 'processing')
      ))
  );

  return getRowsAffected(updateResult);
}

function releaseProcessingSlot(sessionId: string): void {
  activeProcessingIds.delete(sessionId);
  processingStartTimes.delete(sessionId);
}

export async function markAsFailed(
  sessionId: string,
  error: string,
  errorCode?: string
): Promise<void> {
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
  await completeTrackedJobAttempt(sessionId, activeAttemptIds, 'failed', error, errorCode);

  logger.error('Session marked failed (Trash Flushed)', { sessionId, error });
  await syncJobFailed(sessionId, error, errorCode);
}

export async function flushSessionTrash(sessionId: string): Promise<void> {
  try {
    logger.info('Flushing technical trash and aborting session', { sessionId });

    abortSessionController(sessionId);

    await executeWithRetry(() =>
      db.update(sessions)
        .set({
          progressData: null,
          analysisResult: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(sessions.id, sessionId))
    );

    await executeWithRetry(() =>
      db.delete(calculations)
        .where(eq(calculations.sessionId, sessionId))
    );

    cleanupController(sessionId);
    ProgressTracker.clearInstance(sessionId);
    activeProcessingIds.delete(sessionId);
    processingStartTimes.delete(sessionId);

    logger.debug('Trash flush complete', { sessionId });
  } catch (error) {
    logger.error('Failed to flush session trash', { sessionId, error });
  }
}

export async function heartbeat(sessionId: string): Promise<void> {
  await executeWithRetry(() =>
    db.update(sessions)
      .set({
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sessions.id, sessionId))
  );
  await syncJobHeartbeat(sessionId, activeAttemptIds);
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
    await syncJobCancelled(sessionId, activeAttemptIds);
    logger.info('Session cancelled by user (Full Wipe Complete)', { sessionId });
    return true;
  } catch (error) {
    logger.error('Failed to cancel session', { error: error instanceof Error ? error.message : error });
    return false;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// C4 FIX: Retry Orchestration
// ═════════════════════════════════════════════════════════════════════════════

async function processSessionWithRetry(sessionId: string, attempt: number = 0): Promise<void> {
  logger.debug('processSessionWithRetry called', { sessionId, attempt });
  try {
    await processSessionAsync(sessionId);

    logger.debug('processSessionAsync completed successfully', { sessionId });
    recordGlobalProcessingSuccess();

  } catch (error) {
    await handleProcessingFailure(sessionId, error, attempt);
  }
}

async function handleProcessingFailure(
  sessionId: string,
  error: unknown,
  attempt: number
): Promise<void> {
  const isRetryable = isRetryableError(error);
  const errorMsg = error instanceof Error ? error.message : 'Unknown error';
  const retryReasonCode = deriveRetryReasonCode(error);
  const dependency = mapReasonToDependency(retryReasonCode);

  if (isRetryable && attempt < RETRY_CONFIG.maxRetries) {
    await scheduleRetry(sessionId, errorMsg, retryReasonCode, attempt);
    return;
  }

  await finalizePermanentFailure(sessionId, errorMsg, attempt, retryReasonCode, dependency);
}

async function scheduleRetry(
  sessionId: string,
  errorMsg: string,
  retryReasonCode: RetryReasonCode,
  attempt: number
): Promise<void> {
  const delay = getRetryDelay(attempt);
  await completeTrackedJobAttempt(sessionId, activeAttemptIds, 'abandoned', errorMsg, retryReasonCode);

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
    isRetryable: true,
  });

  await sleep(delay);
  await beginTrackedJobAttempt(sessionId, activeAttemptIds, workerId);
  return processSessionWithRetry(sessionId, attempt + 1);
}

async function finalizePermanentFailure(
  sessionId: string,
  errorMsg: string,
  attempt: number,
  retryReasonCode: RetryReasonCode,
  dependency: CircuitDependency
): Promise<void> {
  logger.error(`Session ${sessionId} failed permanently after ${attempt + 1} attempts`, {
    error: errorMsg,
    isRetryable: false,
    retryReasonCode,
  });
  recordDependencyFailure(dependency);

  try {
    await writeDeadLetterArtifact(sessionId, errorMsg, attempt + 1, queueDriver);
    await markAsFailed(sessionId, errorMsg, retryReasonCode);
  } catch (markError) {
    logger.error(`Failed to mark session ${sessionId} as failed`, markError);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE PROCESSOR
// ═════════════════════════════════════════════════════════════════════════════

export function startQueueProcessor(): void {
  if (isProcessorRunning) {
    return;
  }

  if (config.queue.executionMode === 'external_worker') {
    logger.info('Queue processor start skipped because execution mode is external_worker');
    return;
  }

  isProcessorRunning = true;
  void processQueue();
}

async function processQueue(): Promise<void> {
  logger.info('Queue processor loop started with C4 fixes (retry + circuit breaker)');

  while (isProcessorRunning) {
    await runQueueIteration();
  }
}

export async function runQueueIteration(): Promise<void> {
  try {
    const breakerDelay = await checkCircuitBreakers();
    if (breakerDelay !== null) {
      await sleep(breakerDelay);
      return;
    }

    await cleanupStaleRequests();
    const effectiveMaxConcurrent = await evaluateMemoryPressure();

    if (activeProcessingIds.size >= effectiveMaxConcurrent) {
      await handleQueueBlocked();
      return;
    }

    const nextId = await claimNextQueuedSession();
    if (nextId === null) {
      await sleep(config.queue.pollIntervalMs);
      return;
    }

    logger.debug('Found next queued session', { sessionId: nextId });
    logger.debug('Claimed session as processing', { sessionId: nextId });
    startSessionProcessing(nextId);
  } catch (error) {
    await handleQueueIterationError(error);
  }
}

async function checkCircuitBreakers(): Promise<number | null> {
  const blockingBreakers = getBlockingCircuitBreakers();
  if (blockingBreakers.length === 0) {
    return null;
  }

  const remainingMs = Math.min(...blockingBreakers.map((breaker) => breaker.remainingMs));
  const remainingSec = Math.ceil(remainingMs / 1000);
  logger.error('Dependency circuit breaker open. Pausing queue iteration.', {
    blockingDependencies: blockingBreakers.map((breaker) => breaker.dependency),
    remainingSec,
  });
  return Math.max(1000, Math.min(config.queue.pollIntervalMs, remainingMs));
}

async function evaluateMemoryPressure(): Promise<number> {
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

  return effectiveMaxConcurrent;
}

async function handleQueueBlocked(): Promise<void> {
  const queuedCount = await getQueuedCount();
  if (queuedCount > activeProcessingIds.size) {
    logger.debug('Queue blocked: all slots full', {
      active: activeProcessingIds.size,
      max: QUEUE_CONFIG.maxConcurrent,
    });
  }
  await sleep(1000);
}

function startSessionProcessing(sessionId: string): void {
  processSessionWithRetry(sessionId).catch((err) => {
    logger.error('UNHANDLED ERROR in processSessionWithRetry', { sessionId, error: err });
    recordDependencyFailure('processing');
  });
}

async function handleQueueIterationError(error: unknown): Promise<void> {
  logger.error('Queue processor error', { error: (error as any)?.message || error });
  const reasonCode = deriveRetryReasonCode(error);
  recordDependencyFailure(mapReasonToDependency(reasonCode));

  const processingSnapshot = getCircuitSnapshots().find((item) => item.dependency === 'processing');
  const failureDepth = processingSnapshot?.consecutiveFailures ?? 1;
  const delay = getRetryDelay(Math.min(failureDepth, 5));
  logger.info(`Queue processor backing off for ${delay}ms due to error`);
  await sleep(delay);
}

// ═════════════════════════════════════════════════════════════════════════════
// SESSION PROCESSING
// ═════════════════════════════════════════════════════════════════════════════

async function processSessionAsync(sessionId: string): Promise<void> {
  logger.debug('processSessionAsync entered', { sessionId });
  try {
    logger.debug('processSessionAsync querying DB', { sessionId });
    logger.info('Starting to process request', { sessionId });

    const s = await fetchSessionRow(sessionId);
    const abortController = createAbortController(sessionId);

    try {
      await heartbeat(sessionId);
      const heartbeatTimer = startHeartbeatTimer(sessionId);

      try {
        const decrypted = decryptSessionFields(s, sessionId);
        const btrInput = buildBtrInput(s, decrypted, abortController.signal);
        const result = await runBtrAnalysis(sessionId, btrInput);
        await serializeAndComplete(sessionId, result);
        cleanupController(sessionId);
      } finally {
        clearInterval(heartbeatTimer);
      }
    } catch (error) {
      handleProcessingException(error, sessionId);
    }
  } catch (error) {
    logger.error('Async worker error', error);
    throw error;
  } finally {
    releaseWorkerSlot(sessionId);
  }
}

async function fetchSessionRow(sessionId: string): Promise<typeof sessions.$inferSelect> {
  const rows = await executeWithRetry(() =>
    db.select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1)
  );

  if (rows.length === 0) {
    throw new Error('Session not found');
  }
  return rows[0];
}

function startHeartbeatTimer(sessionId: string): ReturnType<typeof setInterval> {
  return setInterval(() => {
    void heartbeat(sessionId).catch((error) => {
      logger.warn('Worker heartbeat failed', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }, 15000);
}

interface DecryptedSessionData {
  lifeEvents: unknown;
  physicalTraits: PhysicalTraits | undefined;
  forensicTraits: ForensicTraits | undefined;
  dateOfBirth: string;
  tentativeTime: string;
  spouseData: unknown | undefined;
}

function decryptSessionFields(
  s: typeof sessions.$inferSelect,
  sessionId: string
): DecryptedSessionData {
  if (!s.lifeEvents) {
    throw new Error('lifeEvents data is missing - cannot process without life events');
  }

  const lifeEvents = decryptJsonField(s.lifeEvents, s.clerkId, s.userId, true);
  const physicalTraits = decryptOptionalJsonField<PhysicalTraits>(
    s.physicalTraits, s.clerkId, s.userId, sessionId, 'physicalTraits'
  );
  const forensicTraits = decryptOptionalJsonField<ForensicTraits>(
    s.forensicTraits, s.clerkId, s.userId, sessionId, 'forensicTraits'
  );

  const dateOfBirth = parseSensitiveField(s.dateOfBirth, s.clerkId, s.userId) as string;
  const tentativeTime = parseSensitiveField(s.tentativeTime, s.clerkId, s.userId) as string;

  logger.info('[Time Format]', {
    sessionId,
    rawTime: s.tentativeTime?.substring(0, 20) + '...',
    decryptedTime: tentativeTime,
    type: typeof tentativeTime,
  });

  const spouseData = s.spouseData
    ? parseSensitiveField(s.spouseData, s.clerkId, s.userId)
    : undefined;

  return { lifeEvents, physicalTraits, forensicTraits, dateOfBirth, tentativeTime, spouseData };
}

function decryptJsonField(
  encrypted: string,
  clerkId: string,
  userId: string,
  required: boolean
): unknown {
  const decrypted = safeDecryptWithFallback(encrypted, clerkId, userId);
  if (decrypted) {
    try {
      return JSON.parse(decrypted);
    } catch {
      // Decrypted value is not valid JSON, fall through to try parsing raw encrypted
    }
  }
  try {
    return JSON.parse(encrypted);
  } catch {
    if (required) {
      throw new Error('Failed to decrypt or parse required field');
    }
    return undefined;
  }
}

function decryptOptionalJsonField<T>(
  encrypted: string | null,
  clerkId: string,
  userId: string,
  sessionId: string,
  fieldName: string
): T | undefined {
  if (!encrypted) return undefined;

  const decrypted = safeDecryptWithFallback(encrypted, clerkId, userId);
  if (decrypted) {
    try {
      return JSON.parse(decrypted) as T;
    } catch (e) {
      logger.warn(`Failed to parse ${fieldName} JSON, using undefined`, { sessionId, error: e });
      return undefined;
    }
  }
  try {
    return JSON.parse(encrypted) as T;
  } catch {
    return undefined;
  }
}

function buildBtrInput(
  s: typeof sessions.$inferSelect,
  decrypted: DecryptedSessionData,
  abortSignal: AbortSignal
): Parameters<typeof processSecondsPrecisionBTR>[0] {
  logger.info('Initializing Seconds Precision BTR...', {
    sessionId: s.id,
    offsetConfig: s.offsetConfig ? 'Preserving User Config' : 'Using Default',
    dashaSystem: 'Vimshottari',
  });

  const rawOffset = parseSensitiveField(s.offsetConfig, s.clerkId, s.userId) as Record<string, unknown> | null;
  const offsetConfig = rawOffset && (rawOffset.preset || rawOffset.customMinutes)
    ? rawOffset
    : { preset: '1hour' };

  return {
    sessionId: s.id,
    dateOfBirth: decrypted.dateOfBirth,
    tentativeTime: decrypted.tentativeTime,
    latitude: s.latitude,
    longitude: s.longitude,
    timezone: s.timezone,
    lifeEvents: decrypted.lifeEvents as Parameters<typeof processSecondsPrecisionBTR>[0]['lifeEvents'],
    offsetConfig: offsetConfig as unknown as Parameters<typeof processSecondsPrecisionBTR>[0]['offsetConfig'],
    physicalTraits: decrypted.physicalTraits,
    forensicTraits: decrypted.forensicTraits as ForensicTraits,
    spouseData: decrypted.spouseData as Parameters<typeof processSecondsPrecisionBTR>[0]['spouseData'],
    abortSignal,
  };
}

async function runBtrAnalysis(
  sessionId: string,
  btrInput: Parameters<typeof processSecondsPrecisionBTR>[0]
): Promise<Awaited<ReturnType<typeof processSecondsPrecisionBTR>>> {
  const result = await processSecondsPrecisionBTR(btrInput);
  logger.info('Analysis finished successfully', { sessionId });
  return result;
}

async function serializeAndComplete(
  sessionId: string,
  result: Awaited<ReturnType<typeof processSecondsPrecisionBTR>>
): Promise<void> {
  let optimizedAnalysisStr = '';

  try {
    const tracker = ProgressTracker.getInstance(sessionId);
    if (tracker) {
      tracker.getProgress().stageHistory;
    }
    optimizedAnalysisStr = JSON.stringify(result.analysisResult);
  } catch (e) {
    logger.warn('Failed to serialize analysis result', { error: e instanceof Error ? e.message : e });
    optimizedAnalysisStr = JSON.stringify({ error: 'Serialization failed' });
  }

  await markAsComplete(sessionId, {
    ...result,
    analysisResult: optimizedAnalysisStr,
  });
}

function handleProcessingException(error: unknown, sessionId: string): void {
  if (isCancellationError(error)) {
    logger.info('Session processing cancelled', { sessionId });
    cleanupController(sessionId);
    return;
  }

  const errorMsg = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;
  logger.error('[PROCESSING ERROR] Session failed during processing', {
    sessionId,
    errorMsg,
    errorStack: errorStack?.substring(0, 500),
  });
  cleanupController(sessionId);
  throw error;
}

function releaseWorkerSlot(sessionId: string): void {
  activeProcessingIds.delete(sessionId);

  const globalWithGC = globalThis as typeof globalThis & { gc?: () => void };
  if (globalWithGC.gc) {
    logger.info('[MEMORY] Triggering manual GC after session recovery');
    globalWithGC.gc();
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// CLEANUP & UTILITIES
// ═════════════════════════════════════════════════════════════════════════════

async function cleanupStaleRequests(): Promise<void> {
  try {
    const staleThreshold = new Date(Date.now() - QUEUE_CONFIG.staleTimeoutMs).toISOString();

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

export async function getQueueStats() {
  return _getQueueStats(queueDriver);
}

export async function recoverInterruptedJobsOnStartup() {
  return _recoverInterruptedJobsOnStartup();
}

export async function cleanupZombiesOnStartup() {
  return _cleanupZombiesOnStartup(markAsFailed);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
