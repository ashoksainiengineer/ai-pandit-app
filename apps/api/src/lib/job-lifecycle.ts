import crypto from 'node:crypto';
import { completeJob as completeJobRecord } from '@ai-pandit/db';
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
  updateJobAttemptHeartbeat,
  updateJobProgress as updateJobProgressRecord,
} from '@ai-pandit/db/jobs';
import type { QueueStatus } from '@ai-pandit/shared';
import { getSessionProgress } from './progress-tracker.js';
import { persistArtifactReference } from './jobs/artifact-storage.js';


export async function buildCheckpointPayload(
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

export function mapJobStatusToQueueStatus(status: string | null | undefined): QueueStatus {
  switch (status) {
    case 'running':
      return 'processing';
    case 'completed':
      return 'complete';
    case 'failed':
    case 'cancelled':
      return 'failed';
    case 'retrying':
      return 'queued';
    default:
      return 'queued';
  }
}
export async function getNextJobEventSequence(jobId: string): Promise<number> {
  const events = await listJobEvents(jobId);
  const lastSequence = events.at(-1)?.sequenceNo ?? 0;
  return lastSequence + 1;
}

export async function appendLifecycleEvent(
  sessionId: string,
  eventType: string,
  payload: Record<string, unknown>,
  stage?: string
): Promise<void> {
  const job = await getLatestJobForSession(sessionId);
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

export async function syncJobQueued(sessionId: string): Promise<void> {
  const job = await getLatestJobForSession(sessionId);
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

export async function syncJobRunning(sessionId: string): Promise<void> {
  const job = await getLatestJobForSession(sessionId);
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

export async function syncJobCompleted(
  sessionId: string,
  results: {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
    analysisResult: string;
    reasoningLogs?: string | null;
  }
): Promise<void> {
  const job = await getLatestJobForSession(sessionId);
  if (!job) {
    return;
  }

  const parsedResult = safeParseJsonRecord(results.analysisResult);

  await completeJobRecord({
    jobId: job.id,
    resultJson: parsedResult ?? {
      rectifiedTime: results.rectifiedTime,
      accuracy: results.accuracy,
      confidence: results.confidence,
    },
  });

  await persistCompletionArtifacts(job, sessionId, results);

  await appendLifecycleEvent(sessionId, 'job.completed', {
    status: 'completed',
    rectifiedTime: results.rectifiedTime,
    accuracy: results.accuracy,
    confidence: results.confidence,
  });
}

export function safeParseJsonRecord(value: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }
}

export async function persistCompletionArtifacts(
  job: NonNullable<Awaited<ReturnType<typeof getLatestJobForSession>>>,
  sessionId: string,
  results: {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
    analysisResult: string;
    reasoningLogs?: string | null;
  }
): Promise<void> {
  const artifacts: Promise<unknown>[] = [
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
  ];

  if (results.reasoningLogs) {
    artifacts.push(
      persistArtifactReference({
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
    );
  }

  await Promise.all(artifacts);
}

export async function syncJobFailed(
  sessionId: string,
  errorMessage: string,
  errorCode?: string
): Promise<void> {
  const job = await getLatestJobForSession(sessionId);
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

export async function syncJobHeartbeat(sessionId: string, activeAttemptIds: Map<string, string>): Promise<void> {
  const job = await getLatestJobForSession(sessionId);
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

export function getCurrentStage(progress: Awaited<ReturnType<typeof getSessionProgress>>): string | null {
  if (!progress) {
    return null;
  }

  const currentStep = progress.steps?.[progress.currentStep];
  return currentStep?.id ?? null;
}

export async function syncJobCancelled(sessionId: string, activeAttemptIds: Map<string, string>): Promise<void> {
  const job = await getLatestJobForSession(sessionId);
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

export async function beginTrackedJobAttempt(sessionId: string, activeAttemptIds: Map<string, string>, workerId: string): Promise<void> {
  const job = await getLatestJobForSession(sessionId);
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

export async function completeTrackedJobAttempt(
  sessionId: string,
  activeAttemptIds: Map<string, string>,
  outcome: 'succeeded' | 'failed' | 'cancelled' | 'abandoned',
  failureReason?: string,
  failureCode?: string
): Promise<void> {
  const attemptId = activeAttemptIds.get(sessionId);
  if (!attemptId) {
    return;
  }

  const job = await getLatestJobForSession(sessionId);
  await completeJobAttempt({
    attemptId,
    outcome,
    failureReason: failureReason ?? null,
    failureCode: failureCode ?? null,
    checkpointJson: (job?.checkpointJson as Record<string, unknown> | null) ?? null,
  });
  activeAttemptIds.delete(sessionId);
}

export async function writeDeadLetterArtifact(
  sessionId: string,
  errorMessage: string,
  attemptsUsed: number,
  queueDriver: { moveToDeadLetter: (sessionId: string, meta: Record<string, unknown>) => Promise<void> }
): Promise<void> {
  const job = await getLatestJobForSession(sessionId);
  if (!job) {
    return;
  }

  const payload = buildDeadLetterPayload(job, sessionId, errorMessage, attemptsUsed);
  await persistArtifactReference({
    jobId: job.id,
    sessionId,
    kind: 'dead_letter_report',
    fileName: 'dead-letter-report.json',
    mimeType: 'application/json',
    payload: JSON.stringify(payload),
    metadata: payload,
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

export function buildDeadLetterPayload(
  job: NonNullable<Awaited<ReturnType<typeof getLatestJobForSession>>>,
  sessionId: string,
  errorMessage: string,
  attemptsUsed: number
): Record<string, unknown> {
  return {
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
  };
}

