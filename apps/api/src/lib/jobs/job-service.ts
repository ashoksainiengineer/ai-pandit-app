import nodeCrypto from 'node:crypto';
import { db, executeWithRetry } from '@ai-pandit/db';
import { idempotencyKeys, jobs, sessions, users } from '@ai-pandit/db/schema';
import { and, count, eq } from 'drizzle-orm';
import {
  CalculateRequestSchema,
  type JobDetail,
  type JobSummary,
} from '@ai-pandit/shared';
import {
  AppError,
  ErrorCodes,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../errors/index.js';
import { addToQueue, cancelSession, startQueueProcessor } from '../queue-manager.js';
import { validateOffsetConfig } from '../time-offset-manager.js';
import { getApiEncryption } from '../encryption/index.js';
const crypto = getApiEncryption();

import { syncUser } from '../user-sync.js';
import { isSessionOwnedByContext, type SessionOwnershipContext } from '../session-ownership.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { config } from '../../config/index.js';

type UserPlanTier = 'free' | 'pro' | 'enterprise';

interface CreateJobRequestBody extends Record<string, unknown> {
  birthData?: unknown;
  lifeEvents?: unknown;
  offsetConfig?: unknown;
  existingSessionId?: unknown;
  consentConfirmed?: unknown;
}

export interface CreateJobOptions {
  externalId: string;
  ownershipContext: SessionOwnershipContext;
  body: CreateJobRequestBody;
  idempotencyKey?: string;
}

export interface EnqueueJobResult {
  job: JobDetail;
  idempotentReplay: boolean;
  queue: {
    position: number;
    estimatedWaitSeconds: number;
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function getRequestHash(payload: unknown): string {
  return nodeCrypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
}

function normalizeJobStatus(sessionStatus: string | null | undefined): JobSummary['status'] {
  switch (sessionStatus) {
    case 'processing':
      return 'running';
    case 'complete':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'queued':
    case 'pending':
      return 'queued';
    default:
      return 'queued';
  }
}

function mergeJobStatus(
  jobStatus: JobSummary['status'],
  sessionStatus: string | null | undefined
): JobSummary['status'] {
  if (jobStatus === 'cancelled' || jobStatus === 'retrying') {
    return jobStatus;
  }

  if (!sessionStatus) {
    return jobStatus;
  }

  return normalizeJobStatus(sessionStatus);
}

function parseResultPayload(value: string | null): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function mapJobDetail(
  jobRow: typeof jobs.$inferSelect,
  sessionStatus?: string | null,
  sessionResult?: string | null
): JobDetail {
  return {
    id: jobRow.id,
    sessionId: jobRow.sessionId,
    userId: jobRow.userId,
    kind: jobRow.kind,
    status: mergeJobStatus(jobRow.status, sessionStatus),
    currentStage: jobRow.currentStage,
    progressPercent: jobRow.progressPercent,
    attempt: jobRow.attempt,
    maxAttempts: jobRow.maxAttempts,
    retryCount: jobRow.retryCount,
    retryReasonCode: jobRow.retryReasonCode,
    nextRetryAt: jobRow.nextRetryAt,
    queuedAt: jobRow.queuedAt,
    startedAt: jobRow.startedAt,
    heartbeatAt: jobRow.heartbeatAt,
    finishedAt: jobRow.finishedAt,
    cancelRequestedAt: jobRow.cancelRequestedAt,
    errorCode: jobRow.errorCode,
    errorMessage: jobRow.errorMessage,
    createdAt: jobRow.createdAt,
    updatedAt: jobRow.updatedAt,
    version: jobRow.version,
    result: (jobRow.resultJson as Record<string, unknown> | null) ?? parseResultPayload(sessionResult ?? null),
    checkpoint: (jobRow.checkpointJson as Record<string, unknown> | null) ?? null,
    cursor: (jobRow.cursorJson as Record<string, unknown> | null) ?? null,
    sessionStatus: sessionStatus ?? null,
  };
}

function getIdempotencyKey(request: AuthenticatedRequest): string | undefined {
  const headerValue = request.headers['idempotency-key'];
  if (typeof headerValue === 'string' && headerValue.trim()) {
    return headerValue.trim();
  }

  return undefined;
}

async function ensureConsentIfReferenced(
  existingSessionId: string | undefined,
  consentConfirmed: boolean | undefined,
  ownershipContext: SessionOwnershipContext
): Promise<void> {
  if (!existingSessionId || consentConfirmed) {
    return;
  }

  const [existingSession] = await executeWithRetry(() =>
    db
      .select({
        id: sessions.id,
        externalId: sessions.externalId,
        userId: sessions.userId,
        aiConsentGiven: sessions.aiConsentGiven,
      })
      .from(sessions)
      .where(eq(sessions.id, existingSessionId))
      .limit(1)
  );

  if (!existingSession) {
    throw new NotFoundError('Session', existingSessionId);
  }

  if (!isSessionOwnedByContext(existingSession, ownershipContext)) {
    throw new ForbiddenError('Access denied');
  }

  if (!existingSession.aiConsentGiven) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'AI processing consent required', {
      code: 'CONSENT_REQUIRED',
      sessionId: existingSessionId,
    });
  }
}

function validateBirthData(value: CreateJobRequestBody): asserts value is CreateJobRequestBody {
  const validationResult = CalculateRequestSchema.safeParse({
    birthData: value.birthData,
    lifeEvents: value.lifeEvents,
    offsetConfig: value.offsetConfig,
  });

  if (!validationResult.success) {
    throw new ValidationError('Validation failed', {
      fields: validationResult.error.errors.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  const { birthData, offsetConfig } = validationResult.data;

  const offsetValidation = validateOffsetConfig(offsetConfig);
  if (!offsetValidation.valid) {
    throw new ValidationError(offsetValidation.error ?? 'Invalid offset configuration');
  }

  const birthDate = birthData.dateOfBirth;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw new ValidationError('dateOfBirth must be strictly in YYYY-MM-DD format.', {
      field: 'birthData.dateOfBirth',
    });
  }

  const [year, month, day] = birthDate.split('-').map(Number);
  const parsedBirthDate = new Date(Date.UTC(year, month - 1, day));
  if (
    parsedBirthDate.getUTCFullYear() !== year ||
    parsedBirthDate.getUTCMonth() + 1 !== month ||
    parsedBirthDate.getUTCDate() !== day
  ) {
    throw new ValidationError('Invalid date of birth (silent overflow detected)', {
      field: 'birthData.dateOfBirth',
    });
  }
}

async function enforceQueueCapacity(userId: string): Promise<void> {
  const [userRow] = await executeWithRetry(() =>
    db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
  );

  const roleValue = userRow?.role?.toLowerCase() ?? 'user';
  const inferredTier: UserPlanTier =
    roleValue.includes('enterprise') || roleValue === 'admin'
      ? 'enterprise'
      : roleValue.includes('pro') || roleValue.includes('premium') || roleValue.includes('paid')
        ? 'pro'
        : 'free';

  const tierLimit = config.queue.maxActiveJobsByTier[inferredTier] ?? config.queue.maxActiveJobsPerUser;

  const [globalQResult, globalRResult, globalReResult, userQResult, userRResult, userReResult] = await Promise.all([
    executeWithRetry(() => db.select({ count: count() }).from(jobs).where(eq(jobs.status, 'queued'))),
    executeWithRetry(() => db.select({ count: count() }).from(jobs).where(eq(jobs.status, 'running'))),
    executeWithRetry(() => db.select({ count: count() }).from(jobs).where(eq(jobs.status, 'retrying'))),
    executeWithRetry(() =>
      db.select({ count: count() }).from(jobs).where(and(eq(jobs.userId, userId), eq(jobs.status, 'queued')))
    ),
    executeWithRetry(() =>
      db.select({ count: count() }).from(jobs).where(and(eq(jobs.userId, userId), eq(jobs.status, 'running')))
    ),
    executeWithRetry(() =>
      db.select({ count: count() }).from(jobs).where(and(eq(jobs.userId, userId), eq(jobs.status, 'retrying')))
    ),
  ]);

  const globalActiveCount = (globalQResult[0]?.count ?? 0) + (globalRResult[0]?.count ?? 0) + (globalReResult[0]?.count ?? 0);
  const userActiveCount = (userQResult[0]?.count ?? 0) + (userRResult[0]?.count ?? 0) + (userReResult[0]?.count ?? 0);

  if (userActiveCount >= tierLimit) {
    throw new AppError(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      `Per-user active job limit reached (${tierLimit}) for tier ${inferredTier}.`,
      {
        userId,
        tier: inferredTier,
        role: userRow?.role ?? 'user',
        reason: 'PER_USER_ACTIVE_LIMIT',
        contractVersion: '2026-03-12',
        httpStatusHint: 429,
        retryable: true,
        retryAfterSeconds: 60,
        limitType: 'active_jobs_per_user',
        limit: tierLimit,
        current: userActiveCount,
        activeJobs: userActiveCount,
        maxActiveJobsPerUser: tierLimit,
      }
    );
  }

  if (globalActiveCount >= config.queue.loadShedQueueDepth) {
    throw new AppError(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      'System is under high load. Please retry shortly.',
      {
        tier: inferredTier,
        role: userRow?.role ?? 'user',
        reason: 'GLOBAL_LOAD_SHEDDING',
        contractVersion: '2026-03-12',
        httpStatusHint: 429,
        retryable: true,
        retryAfterSeconds: 30,
        limitType: 'global_active_jobs',
        limit: config.queue.loadShedQueueDepth,
        current: globalActiveCount,
        activeJobs: globalActiveCount,
        loadShedQueueDepth: config.queue.loadShedQueueDepth,
      }
    );
  }
}

export async function createQueuedBirthRectificationJob(
  options: CreateJobOptions
): Promise<EnqueueJobResult> {
  validateBirthData(options.body);

  const validationResult = CalculateRequestSchema.parse({
    birthData: options.body.birthData,
    lifeEvents: options.body.lifeEvents,
    offsetConfig: options.body.offsetConfig,
  });

  const existingSessionId =
    typeof options.body.existingSessionId === 'string' ? options.body.existingSessionId : undefined;
  const consentConfirmed =
    typeof options.body.consentConfirmed === 'boolean' ? options.body.consentConfirmed : undefined;

  await ensureConsentIfReferenced(existingSessionId, consentConfirmed, options.ownershipContext);

  const internalUserId = await syncUser(options.externalId);
  await enforceQueueCapacity(internalUserId);
  const requestHash = getRequestHash(validationResult);

  if (options.idempotencyKey) {
    const idempotencyKey = options.idempotencyKey;
    const [existingRecord] = await executeWithRetry(() =>
      db
        .select({
          requestHash: idempotencyKeys.requestHash,
          jobId: idempotencyKeys.jobId,
        })
        .from(idempotencyKeys)
        .where(
          and(
            eq(idempotencyKeys.userId, internalUserId),
            eq(idempotencyKeys.key, idempotencyKey)
          )
        )
        .limit(1)
    );

    if (existingRecord?.jobId) {
      if (existingRecord.requestHash !== requestHash) {
        throw new AppError(ErrorCodes.DUPLICATE_REQUEST, 'Idempotency key reuse with different payload', {
          key: options.idempotencyKey,
        });
      }

      const replayJob = await getJobDetailById(existingRecord.jobId, options.ownershipContext);
      return {
        job: replayJob,
        idempotentReplay: true,
        queue: {
          position: 0,
          estimatedWaitSeconds: 0,
        },
      };
    }
  }

  const sessionId = nodeCrypto.randomUUID();
  const jobId = nodeCrypto.randomUUID();
  const timestamp = nowIso();
  const encryptedFullName = crypto.encrypt(validationResult.birthData.fullName, internalUserId);
  const encryptedLifeEvents = crypto.encrypt(JSON.stringify(validationResult.lifeEvents), internalUserId);

  try {
    await db.transaction(async (tx) => {
      await tx.insert(sessions).values({
        id: sessionId,
        userId: internalUserId,
        externalId: options.externalId,
        fullName: encryptedFullName,
        dateOfBirth: crypto.encrypt(validationResult.birthData.dateOfBirth, internalUserId),
        tentativeTime: crypto.encrypt(validationResult.birthData.tentativeTime, internalUserId),
        birthPlace: crypto.encrypt(validationResult.birthData.birthPlace, internalUserId),
        latitude: validationResult.birthData.latitude,
        longitude: validationResult.birthData.longitude,
        timezone: validationResult.birthData.timezone.toString(),
        gender: validationResult.birthData.gender ?? 'other',
        lifeEvents: encryptedLifeEvents,
        offsetConfig: crypto.encrypt(JSON.stringify(validationResult.offsetConfig), internalUserId),
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      await tx.insert(jobs).values({
        id: jobId,
        sessionId,
        userId: internalUserId,
        kind: 'btr_rectification',
        status: 'queued',
        progressPercent: 0,
        priority: 100,
        attempt: 0,
        maxAttempts: 3,
        queuedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      if (options.idempotencyKey) {
        await tx.insert(idempotencyKeys).values({
          id: nodeCrypto.randomUUID(),
          userId: internalUserId,
          key: options.idempotencyKey,
          requestHash,
          sessionId,
          jobId,
          createdAt: timestamp,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    });
  } catch (error) {
    if (isUniqueViolation(error) && options.idempotencyKey) {
      const idempotencyKey = options.idempotencyKey;
      const [existingRecord] = await executeWithRetry(() =>
        db
          .select({
            requestHash: idempotencyKeys.requestHash,
            jobId: idempotencyKeys.jobId,
          })
          .from(idempotencyKeys)
          .where(
            and(
              eq(idempotencyKeys.userId, internalUserId),
              eq(idempotencyKeys.key, idempotencyKey)
            )
          )
          .limit(1)
      );

      if (existingRecord?.jobId && existingRecord.requestHash === requestHash) {
        const replayJob = await getJobDetailById(existingRecord.jobId, options.ownershipContext);
        return {
          job: replayJob,
          idempotentReplay: true,
          queue: { position: 0, estimatedWaitSeconds: 0 },
        };
      }
    }

    throw error;
  }

  const queueResult = await addToQueue(sessionId);
  if (!queueResult.success) {
    const message = queueResult.error ?? 'Failed to queue request';
    await executeWithRetry(() =>
      db.transaction(async (tx) => {
        await tx
          .update(sessions)
          .set({
            status: 'failed',
            errorMessage: message,
            updatedAt: nowIso(),
          })
          .where(eq(sessions.id, sessionId));

        await tx
          .update(jobs)
          .set({
            status: 'failed',
            errorMessage: message,
            updatedAt: nowIso(),
          })
          .where(eq(jobs.id, jobId));
      })
    );

    const isRateLimit = message.includes('[RATE_LIMIT_EXCEEDED]');
    const retryMatch = message.match(/retry_after=(\d+)/);
    const retryAfterSeconds = retryMatch ? Number.parseInt(retryMatch[1], 10) : undefined;
    const sanitizedMessage = message
      .replace('[RATE_LIMIT_EXCEEDED]', '')
      .replace(/\s*retry_after=\d+/, '')
      .trim();

    throw new AppError(isRateLimit ? ErrorCodes.RATE_LIMIT_EXCEEDED : ErrorCodes.QUEUE_FULL, sanitizedMessage, {
      sessionId,
      jobId,
      reason: isRateLimit ? 'QUEUE_LOAD_SHEDDING' : 'QUEUE_FULL',
      contractVersion: '2026-03-12',
      httpStatusHint: isRateLimit ? 429 : 503,
      retryable: isRateLimit,
      retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
    });
  }

  startQueueProcessor();

  const job = await getJobDetailById(jobId, options.ownershipContext);
  return {
    job,
    idempotentReplay: false,
    queue: {
      position: queueResult.position ?? 0,
      estimatedWaitSeconds: queueResult.estimatedWaitSeconds ?? 0,
    },
  };
}

export async function getJobDetailById(
  jobId: string,
  ownershipContext: SessionOwnershipContext
): Promise<JobDetail> {
  const [jobRow] = await executeWithRetry(() =>
    db
      .select({
        job: jobs,
        sessionStatus: sessions.status,
        sessionResult: sessions.analysisResult,
        sessionExternalId: sessions.externalId,
        sessionUserId: sessions.userId,
      })
      .from(jobs)
      .innerJoin(sessions, eq(sessions.id, jobs.sessionId))
      .where(eq(jobs.id, jobId))
      .limit(1)
  );

  if (!jobRow) {
    throw new NotFoundError('Job', jobId);
  }

  if (
    !isSessionOwnedByContext(
      {
        externalId: jobRow.sessionExternalId,
        userId: jobRow.sessionUserId,
      },
      ownershipContext
    )
  ) {
    throw new ForbiddenError('Access denied');
  }

  return mapJobDetail(jobRow.job as typeof jobs.$inferSelect, jobRow.sessionStatus as string, jobRow.sessionResult as string);
}

export async function cancelJobById(
  jobId: string,
  ownershipContext: SessionOwnershipContext
): Promise<{ job: JobDetail; cancelled: boolean }> {
  const job = await getJobDetailById(jobId, ownershipContext);
  const cancelled = await cancelSession(job.sessionId);
  const refreshedJob = await getJobDetailById(jobId, ownershipContext);

  return {
    job: refreshedJob,
    cancelled,
  };
}

export function getJobIdempotencyKey(request: AuthenticatedRequest): string | undefined {
  return getIdempotencyKey(request);
}
