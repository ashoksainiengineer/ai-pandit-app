import { and, asc, desc, eq, gt, inArray, isNull, lte, or } from 'drizzle-orm';
import { db, executeWithRetry } from './drizzle.js';
import {
  artifacts,
  type Artifact,
  type ArtifactKind,
  type IdempotencyKey,
  idempotencyKeys,
  jobAttempts,
  jobEvents,
  jobs,
  type Job,
  type JobAttempt,
  type JobAttemptOutcome,
  type JobEvent,
  type JobStatus,
} from './schema.js';

export interface CreateJobInput {
  id: string;
  sessionId: string;
  userId: string;
  kind?: Job['kind'];
  priority?: number;
  maxAttempts?: number;
  checkpointJson?: Job['checkpointJson'];
  cursorJson?: Job['cursorJson'];
}

export interface UpdateJobProgressInput {
  jobId: string;
  currentStage?: string | null;
  progressPercent: number;
  checkpointJson?: Job['checkpointJson'];
  cursorJson?: Job['cursorJson'];
  heartbeatAt?: string;
}

export interface CompleteJobInput {
  jobId: string;
  resultJson?: Job['resultJson'];
  finishedAt?: string;
}

export interface FailJobInput {
  jobId: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  status?: Extract<JobStatus, 'failed' | 'retrying' | 'cancelled'>;
  finishedAt?: string | null;
}

export interface ScheduleJobRetryInput {
  jobId: string;
  retryCount: number;
  retryReasonCode?: string | null;
  nextRetryAt: string;
  errorCode?: string | null;
  errorMessage?: string | null;
}

export interface CreateJobAttemptInput {
  id: string;
  jobId: string;
  attemptNo: number;
  workerId?: string | null;
  leaseToken?: string | null;
}

export interface UpdateJobAttemptHeartbeatInput {
  attemptId: string;
  checkpointJson?: JobAttempt['checkpointJson'];
  heartbeatAt?: string;
}

export interface CompleteJobAttemptInput {
  attemptId: string;
  outcome: Exclude<JobAttemptOutcome, 'running'>;
  endedAt?: string;
  failureReason?: string | null;
  failureCode?: string | null;
  checkpointJson?: JobAttempt['checkpointJson'];
}

export interface CreateJobEventInput {
  id: string;
  jobId: string;
  sessionId: string;
  sequenceNo: number;
  eventType: string;
  stage?: string | null;
  payloadJson: Record<string, unknown>;
}

export interface CreateIdempotencyKeyInput {
  id: string;
  userId: string;
  key: string;
  requestHash: string;
  expiresAt: string;
  sessionId?: string | null;
  jobId?: string | null;
}

export interface CreateArtifactInput {
  id: string;
  jobId: string;
  sessionId?: string | null;
  kind?: ArtifactKind;
  uri: string;
  mimeType?: string | null;
  checksum?: string | null;
  sizeBytes?: number | null;
  metadataJson?: Artifact['metadataJson'];
}

function nowIso(): string {
  return new Date().toISOString();
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const timestamp = nowIso();
  const [createdJob] = await executeWithRetry(() =>
    db
      .insert(jobs)
      .values({
        id: input.id,
        sessionId: input.sessionId,
        userId: input.userId,
        kind: input.kind ?? 'btr_rectification',
        status: 'queued',
        priority: input.priority ?? 100,
        attempt: 0,
        maxAttempts: input.maxAttempts ?? 3,
        queuedAt: timestamp,
        checkpointJson: input.checkpointJson,
        cursorJson: input.cursorJson,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning()
  );

  return createdJob;
}

export async function getJobById(jobId: string): Promise<Job | null> {
  const [job] = await executeWithRetry(() =>
    db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1)
  );

  return job ?? null;
}

export async function getLatestJobForSession(sessionId: string): Promise<Job | null> {
  const [job] = await executeWithRetry(() =>
    db
      .select()
      .from(jobs)
      .where(eq(jobs.sessionId, sessionId))
      .orderBy(desc(jobs.createdAt))
      .limit(1)
  );

  return job ?? null;
}

export async function listActiveJobs(): Promise<Job[]> {
  return executeWithRetry(() =>
    db
      .select()
      .from(jobs)
      .where(inArray(jobs.status, ['queued', 'running', 'retrying']))
      .orderBy(asc(jobs.createdAt))
  );
}

export async function countQueuedJobs(): Promise<number> {
  const activeJobs = await listActiveJobs();
  return activeJobs.length;
}

export async function claimNextQueuedJob(): Promise<Job | null> {
  const timestamp = nowIso();
  const candidates = await executeWithRetry(() =>
    db
      .select()
      .from(jobs)
      .where(
        or(
          eq(jobs.status, 'queued'),
          and(eq(jobs.status, 'retrying'), lte(jobs.nextRetryAt, timestamp))
        )
      )
      .orderBy(asc(jobs.priority), asc(jobs.createdAt))
      .limit(10)
  );

  for (const candidate of candidates) {
    const [claimedJob] = await executeWithRetry(() =>
      db
        .update(jobs)
        .set({
          status: 'running',
          startedAt: candidate.startedAt ?? timestamp,
          heartbeatAt: timestamp,
          updatedAt: timestamp,
          errorCode: null,
          errorMessage: null,
          retryReasonCode: null,
          nextRetryAt: null,
        })
        .where(
          and(
            eq(jobs.id, candidate.id),
            or(
              eq(jobs.status, 'queued'),
              and(eq(jobs.status, 'retrying'), lte(jobs.nextRetryAt, timestamp))
            )
          )
        )
        .returning()
    );

    if (claimedJob) {
      return claimedJob;
    }
  }

  return null;
}

export async function markJobRunning(jobId: string, startedAt: string = nowIso()): Promise<Job | null> {
  const [job] = await executeWithRetry(() =>
    db
      .update(jobs)
      .set({
        status: 'running',
        startedAt,
        heartbeatAt: startedAt,
        updatedAt: startedAt,
        errorCode: null,
        errorMessage: null,
        retryReasonCode: null,
        nextRetryAt: null,
      })
      .where(eq(jobs.id, jobId))
      .returning()
  );

  return job ?? null;
}

export async function updateJobProgress(input: UpdateJobProgressInput): Promise<Job | null> {
  const timestamp = input.heartbeatAt ?? nowIso();
  const [job] = await executeWithRetry(() =>
    db
      .update(jobs)
      .set({
        currentStage: input.currentStage ?? null,
        progressPercent: input.progressPercent,
        checkpointJson: input.checkpointJson,
        cursorJson: input.cursorJson,
        heartbeatAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(jobs.id, input.jobId))
      .returning()
  );

  return job ?? null;
}

export async function requestJobCancellation(jobId: string): Promise<Job | null> {
  const timestamp = nowIso();
  const [job] = await executeWithRetry(() =>
    db
      .update(jobs)
      .set({
        cancelRequestedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(and(eq(jobs.id, jobId), isNull(jobs.cancelRequestedAt)))
      .returning()
  );

  if (job) {
    return job;
  }

  return getJobById(jobId);
}

export async function completeJob(input: CompleteJobInput): Promise<Job | null> {
  const finishedAt = input.finishedAt ?? nowIso();
  const [job] = await executeWithRetry(() =>
    db
      .update(jobs)
      .set({
        status: 'completed',
        progressPercent: 100,
        finishedAt,
        heartbeatAt: finishedAt,
        resultJson: input.resultJson,
        updatedAt: finishedAt,
        errorCode: null,
        errorMessage: null,
        retryReasonCode: null,
        nextRetryAt: null,
      })
      .where(eq(jobs.id, input.jobId))
      .returning()
  );

  return job ?? null;
}

export async function failJob(input: FailJobInput): Promise<Job | null> {
  const timestamp = input.finishedAt ?? nowIso();
  const updates: Partial<typeof jobs.$inferInsert> = {
    status: input.status ?? 'failed',
    errorCode: input.errorCode ?? null,
    errorMessage: input.errorMessage ?? null,
    finishedAt: input.status === 'retrying' ? null : timestamp,
    heartbeatAt: timestamp,
    updatedAt: timestamp,
  };

  if (input.status !== 'retrying') {
    updates.retryReasonCode = null;
    updates.nextRetryAt = null;
  }

  const [job] = await executeWithRetry(() =>
    db
      .update(jobs)
      .set(updates)
      .where(eq(jobs.id, input.jobId))
      .returning()
  );

  return job ?? null;
}

export async function scheduleJobRetry(input: ScheduleJobRetryInput): Promise<Job | null> {
  const timestamp = nowIso();
  const [job] = await executeWithRetry(() =>
    db
      .update(jobs)
      .set({
        status: 'retrying',
        retryCount: input.retryCount,
        retryReasonCode: input.retryReasonCode ?? null,
        nextRetryAt: input.nextRetryAt,
        errorCode: input.errorCode ?? null,
        errorMessage: input.errorMessage ?? null,
        finishedAt: null,
        heartbeatAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(jobs.id, input.jobId))
      .returning()
  );

  return job ?? null;
}

export async function incrementJobAttempt(jobId: string): Promise<Job | null> {
  const currentJob = await getJobById(jobId);
  if (!currentJob) {
    return null;
  }

  const timestamp = nowIso();
  const [updatedJob] = await executeWithRetry(() =>
    db
      .update(jobs)
      .set({
        attempt: currentJob.attempt + 1,
        updatedAt: timestamp,
        heartbeatAt: timestamp,
      })
      .where(and(eq(jobs.id, jobId), eq(jobs.version, currentJob.version)))
      .returning()
  );

  return updatedJob ?? null;
}

export async function bumpJobVersion(jobId: string): Promise<Job | null> {
  const currentJob = await getJobById(jobId);
  if (!currentJob) {
    return null;
  }

  const [updatedJob] = await executeWithRetry(() =>
    db
      .update(jobs)
      .set({
        version: currentJob.version + 1,
        updatedAt: nowIso(),
      })
      .where(and(eq(jobs.id, jobId), eq(jobs.version, currentJob.version)))
      .returning()
  );

  return updatedJob ?? null;
}

export async function createJobAttempt(input: CreateJobAttemptInput): Promise<JobAttempt> {
  const timestamp = nowIso();
  const [attempt] = await executeWithRetry(() =>
    db
      .insert(jobAttempts)
      .values({
        id: input.id,
        jobId: input.jobId,
        attemptNo: input.attemptNo,
        workerId: input.workerId ?? null,
        leaseToken: input.leaseToken ?? null,
        startedAt: timestamp,
        createdAt: timestamp,
      })
      .returning()
  );

  return attempt;
}

export async function updateJobAttemptHeartbeat(
  input: UpdateJobAttemptHeartbeatInput
): Promise<JobAttempt | null> {
  const timestamp = input.heartbeatAt ?? nowIso();
  const [attempt] = await executeWithRetry(() =>
    db
      .update(jobAttempts)
      .set({
        heartbeatAt: timestamp,
        checkpointJson: input.checkpointJson,
      })
      .where(eq(jobAttempts.id, input.attemptId))
      .returning()
  );

  return attempt ?? null;
}

export async function completeJobAttempt(
  input: CompleteJobAttemptInput
): Promise<JobAttempt | null> {
  const timestamp = input.endedAt ?? nowIso();
  const [attempt] = await executeWithRetry(() =>
    db
      .update(jobAttempts)
      .set({
        endedAt: timestamp,
        heartbeatAt: timestamp,
        outcome: input.outcome,
        failureReason: input.failureReason ?? null,
        failureCode: input.failureCode ?? null,
        checkpointJson: input.checkpointJson,
      })
      .where(eq(jobAttempts.id, input.attemptId))
      .returning()
  );

  return attempt ?? null;
}

export async function appendJobEvent(input: CreateJobEventInput): Promise<JobEvent> {
  let nextSequenceNo = input.sequenceNo;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const [event] = await executeWithRetry(() =>
        db
          .insert(jobEvents)
          .values({
            id: attempt === 0 ? input.id : `${input.id}-${attempt}`,
            jobId: input.jobId,
            sessionId: input.sessionId,
            sequenceNo: nextSequenceNo,
            eventType: input.eventType,
            stage: input.stage ?? null,
            payloadJson: input.payloadJson,
          })
          .returning()
      );

      return event;
    } catch (error) {
      if (!isUniqueConstraintError(error) || attempt === 2) {
        throw error;
      }

      const latestEvent = await executeWithRetry(() =>
        db
          .select({ sequenceNo: jobEvents.sequenceNo })
          .from(jobEvents)
          .where(eq(jobEvents.jobId, input.jobId))
          .orderBy(desc(jobEvents.sequenceNo))
          .limit(1)
      );
      nextSequenceNo = (latestEvent[0]?.sequenceNo ?? nextSequenceNo) + 1;
    }
  }

  throw new Error('Failed to append job event after retries');
}

export async function listJobEvents(jobId: string): Promise<JobEvent[]> {
  return executeWithRetry(() =>
    db
      .select()
      .from(jobEvents)
      .where(eq(jobEvents.jobId, jobId))
      .orderBy(jobEvents.sequenceNo)
  );
}

export async function listJobEventsSince(jobId: string, sequenceNo: number): Promise<JobEvent[]> {
  return executeWithRetry(() =>
    db
      .select()
      .from(jobEvents)
      .where(and(eq(jobEvents.jobId, jobId), gt(jobEvents.sequenceNo, sequenceNo)))
      .orderBy(jobEvents.sequenceNo)
  );
}

export async function createIdempotencyKey(input: CreateIdempotencyKeyInput): Promise<IdempotencyKey> {
  const [record] = await executeWithRetry(() =>
    db
      .insert(idempotencyKeys)
      .values({
        id: input.id,
        userId: input.userId,
        key: input.key,
        requestHash: input.requestHash,
        sessionId: input.sessionId ?? null,
        jobId: input.jobId ?? null,
        expiresAt: input.expiresAt,
      })
      .returning()
  );

  return record;
}

export async function getIdempotencyKey(userId: string, key: string): Promise<IdempotencyKey | null> {
  const [record] = await executeWithRetry(() =>
    db
      .select()
      .from(idempotencyKeys)
      .where(and(eq(idempotencyKeys.userId, userId), eq(idempotencyKeys.key, key)))
      .limit(1)
  );

  return record ?? null;
}

export async function createArtifact(input: CreateArtifactInput): Promise<Artifact> {
  const [artifact] = await executeWithRetry(() =>
    db
      .insert(artifacts)
      .values({
        id: input.id,
        jobId: input.jobId,
        sessionId: input.sessionId ?? null,
        kind: input.kind ?? 'other',
        uri: input.uri,
        mimeType: input.mimeType ?? null,
        checksum: input.checksum ?? null,
        sizeBytes: input.sizeBytes ?? null,
        metadataJson: input.metadataJson,
      })
      .returning()
  );

  return artifact;
}

export async function listArtifactsForJob(jobId: string): Promise<Artifact[]> {
  return executeWithRetry(() =>
    db
      .select()
      .from(artifacts)
      .where(eq(artifacts.jobId, jobId))
      .orderBy(desc(artifacts.createdAt))
  );
}

export async function getLatestArtifactForJobByKind(
  jobId: string,
  kind: ArtifactKind
): Promise<Artifact | null> {
  const [artifact] = await executeWithRetry(() =>
    db
      .select()
      .from(artifacts)
      .where(and(eq(artifacts.jobId, jobId), eq(artifacts.kind, kind)))
      .orderBy(desc(artifacts.createdAt))
      .limit(1)
  );

  return artifact ?? null;
}

export async function listDeadLetterArtifacts(limit = 50): Promise<Artifact[]> {
  return executeWithRetry(() =>
    db
      .select()
      .from(artifacts)
      .where(eq(artifacts.kind, 'dead_letter_report'))
      .orderBy(desc(artifacts.createdAt))
      .limit(limit)
  );
}
