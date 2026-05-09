/**
 * Database Schema - AI Pandit BTR System
 *
 * Phase 1 foundation:
 * - Postgres/Neon-ready schema
 * - Existing session-centric tables preserved
 * - Durable async job orchestration tables added
 */

import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Shared timestamp helper to keep runtime values as ISO-compatible strings.
const timestampColumn = (name: string) =>
  timestamp(name, { withTimezone: true, mode: 'string' });

export const jobStatusEnum = pgEnum('job_status', [
  'queued',
  'running',
  'retrying',
  'failed',
  'completed',
  'cancelled',
]);

export const jobKindEnum = pgEnum('job_kind', ['btr_rectification']);

export const jobAttemptOutcomeEnum = pgEnum('job_attempt_outcome', [
  'running',
  'succeeded',
  'failed',
  'cancelled',
  'abandoned',
]);

export const artifactKindEnum = pgEnum('artifact_kind', [
  'analysis_result',
  'reasoning_log',
  'candidate_snapshot',
  'report',
  'export',
  'dead_letter_report',
  'other',
]);

export const sessionStatusEnum = pgEnum('session_status', [
  'draft',
  'pending',
  'queued',
  'processing',
  'complete',
  'failed',
]);

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    clerkId: text('clerkId').notNull().unique(),
    email: text('email').notNull(),
    fullName: text('fullName'),
    isActive: boolean('isActive').default(true).notNull(),
    role: text('role').default('user').notNull(),
    lastLoginAt: timestampColumn('lastLoginAt'),
    deletedAt: timestampColumn('deletedAt'),
    createdAt: timestampColumn('createdAt').defaultNow().notNull(),
    updatedAt: timestampColumn('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    clerkIdIdx: index('users_clerkId_idx').on(table.clerkId),
    emailIdx: index('users_email_idx').on(table.email),
    isActiveIdx: index('users_isActive_idx').on(table.isActive),
    roleIdx: index('users_role_idx').on(table.role),
    deletedAtIdx: index('users_deletedAt_idx').on(table.deletedAt),
  })
);

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
    clerkId: text('clerkId').notNull(),
    fullName: text('fullName').notNull(),
    dateOfBirth: text('dateOfBirth').notNull(),
    tentativeTime: text('tentativeTime').notNull(),
    birthPlace: text('birthPlace').notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    timezone: text('timezone').notNull(),
    gender: text('gender'),
    lifeEvents: text('lifeEvents'),
    spouseData: text('spouseData'),
    offsetConfig: text('offsetConfig'),
    rectifiedTime: text('rectifiedTime'),
    accuracy: integer('accuracy'),
    confidence: text('confidence'),
    analysisResult: jsonb('analysisResult'),
    progressData: jsonb('progressData'),
    reasoningLogs: jsonb('reasoningLogs'),
    status: sessionStatusEnum('status').default('draft').notNull(),
    errorMessage: text('errorMessage'),
    errorCode: text('errorCode'),
    submittedAt: timestampColumn('submittedAt'),
    startedProcessingAt: timestampColumn('startedProcessingAt'),
    completedAt: timestampColumn('completedAt'),
    deletedAt: timestampColumn('deletedAt'),
    retentionUntil: timestampColumn('retentionUntil'),
    aiConsentGiven: boolean('aiConsentGiven').default(false),
    aiConsentGivenAt: timestampColumn('aiConsentGivenAt'),
    aiConsentIp: text('aiConsentIp'),
    isEncrypted: boolean('isEncrypted').default(true).notNull(),
    createdAt: timestampColumn('createdAt').defaultNow().notNull(),
    updatedAt: timestampColumn('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('sessions_userId_idx').on(table.userId),
    statusIdx: index('sessions_status_idx').on(table.status),
    userStatusIdx: index('sessions_user_status_idx').on(table.userId, table.status),
    statusCreatedIdx: index('sessions_status_created_idx').on(table.status, table.createdAt),
    createdAtIdx: index('sessions_createdAt_idx').on(table.createdAt),
    submittedAtIdx: index('sessions_submittedAt_idx').on(table.submittedAt),
    retentionIdx: index('sessions_retention_idx').on(table.retentionUntil),
    deletedAtIdx: index('sessions_deletedAt_idx').on(table.deletedAt),
  })
);

export const sessionFavorites = pgTable(
  'session_favorites',
  {
    id: text('id').primaryKey(),
    clerkId: text('clerkId').notNull(),
    sessionId: text('sessionId')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    createdAt: timestampColumn('createdAt').defaultNow().notNull(),
    updatedAt: timestampColumn('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    clerkIdIdx: index('session_favorites_clerkId_idx').on(table.clerkId),
    sessionIdIdx: index('session_favorites_sessionId_idx').on(table.sessionId),
    clerkSessionUnique: uniqueIndex('session_favorites_clerk_session_unique').on(
      table.clerkId,
      table.sessionId
    ),
  })
);

export const calculations = pgTable(
  'calculations',
  {
    id: text('id').primaryKey(),
    sessionId: text('sessionId')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    birthDateTime: text('birthDateTime').notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    timezone: text('timezone').notNull(),
    ephemerisData: text('ephemerisData').notNull(),
    algorithmVersion: text('algorithmVersion').default('2.0.0').notNull(),
    ephemerisVersion: text('ephemerisVersion').default('de440').notNull(),
    processingTime: integer('processingTime'),
    cacheHitCount: integer('cacheHitCount').default(0).notNull(),
    expiresAt: timestampColumn('expiresAt'),
    success: boolean('success').default(true).notNull(),
    createdAt: timestampColumn('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    sessionIdIdx: index('calculations_sessionId_idx').on(table.sessionId),
    createdAtIdx: index('calculations_createdAt_idx').on(table.createdAt),
    expiresAtIdx: index('calculations_expires_idx').on(table.expiresAt),
    sessionCreatedIdx: index('calculations_session_created_idx').on(table.sessionId, table.createdAt),
  })
);

export const payments = pgTable(
  'payments',
  {
    id: text('id').primaryKey(),
    // BUG-FIX NOTE: Add onDelete: 'set null' to allow user deletion without losing payment records
    userId: text('userId').notNull().references(() => users.id),
    sessionId: text('sessionId').references(() => sessions.id),
    amountPaise: integer('amountPaise').notNull(),
    currency: text('currency').default('INR').notNull(),
    status: text('status').default('pending').notNull(),
    razorpayOrderId: text('razorpayOrderId'),
    razorpayPaymentId: text('razorpayPaymentId'),
    razorpaySignature: text('razorpaySignature'),
    webhookReceivedAt: timestampColumn('webhookReceivedAt'),
    verifiedAt: timestampColumn('verifiedAt'),
    verificationMethod: text('verificationMethod'),
    refundAmountPaise: integer('refundAmountPaise').default(0).notNull(),
    refundReason: text('refundReason'),
    refundedAt: timestampColumn('refundedAt'),
    errorCode: text('errorCode'),
    errorDescription: text('errorDescription'),
    createdAt: timestampColumn('createdAt').defaultNow().notNull(),
    updatedAt: timestampColumn('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('payments_userId_idx').on(table.userId),
    sessionIdIdx: index('payments_sessionId_idx').on(table.sessionId),
    statusIdx: index('payments_status_idx').on(table.status),
    razorpayOrderIdIdx: uniqueIndex('payments_razorpayOrderId_unique').on(table.razorpayOrderId),
    razorpayPaymentIdIdx: uniqueIndex('payments_razorpayPaymentId_unique').on(table.razorpayPaymentId),
    createdAtIdx: index('payments_createdAt_idx').on(table.createdAt),
    refundStatusIdx: index('payments_refund_idx').on(table.status, table.refundAmountPaise),
  })
);

export const auditLogs = pgTable(
  'auditLogs',
  {
    id: text('id').primaryKey(),
    // BUG-FIX NOTE: Add onDelete: 'cascade' for auditLogs to allow clean user deletion
    userId: text('userId').notNull().references(() => users.id),
    userRole: text('userRole').notNull(),
    action: text('action').notNull(),
    resource: text('resource').notNull(),
    resourceId: text('resourceId'),
    oldValues: text('oldValues'),
    newValues: text('newValues'),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    requestId: text('requestId'),
    success: boolean('success').default(true).notNull(),
    errorMessage: text('errorMessage'),
    createdAt: timestampColumn('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('auditLogs_userId_idx').on(table.userId),
    actionIdx: index('auditLogs_action_idx').on(table.action),
    resourceIdx: index('auditLogs_resource_idx').on(table.resource),
    userCreatedIdx: index('auditLogs_user_created_idx').on(table.userId, table.createdAt),
    resourceActionIdx: index('auditLogs_resource_action_idx').on(table.resource, table.action),
    createdAtIdx: index('auditLogs_createdAt_idx').on(table.createdAt),
  })
);

export const dataRetention = pgTable(
  'dataRetention',
  {
    id: text('id').primaryKey(),
    userId: text('userId').references(() => users.id),
    sessionId: text('sessionId').references(() => sessions.id),
    dataType: text('dataType').notNull(),
    retentionDays: integer('retentionDays').notNull(),
    scheduledDeletionAt: timestampColumn('scheduledDeletionAt').notNull(),
    actuallyDeletedAt: timestampColumn('actuallyDeletedAt'),
    status: text('status').default('scheduled').notNull(),
    errorMessage: text('errorMessage'),
    retryCount: integer('retryCount').default(0).notNull(),
    createdAt: timestampColumn('createdAt').defaultNow().notNull(),
    updatedAt: timestampColumn('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('dataRetention_userId_idx').on(table.userId),
    sessionIdIdx: index('dataRetention_sessionId_idx').on(table.sessionId),
    statusIdx: index('dataRetention_status_idx').on(table.status),
    scheduledDeletionIdx: index('dataRetention_scheduled_idx').on(table.scheduledDeletionAt, table.status),
  })
);

export const jobs = pgTable(
  'jobs',
  {
    id: text('id').primaryKey(),
    sessionId: text('sessionId')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: jobKindEnum('kind').default('btr_rectification').notNull(),
    status: jobStatusEnum('status').default('queued').notNull(),
    currentStage: text('currentStage'),
    cursorJson: jsonb('cursorJson'),
    checkpointJson: jsonb('checkpointJson'),
    progressPercent: integer('progressPercent').default(0).notNull(),
    priority: integer('priority').default(100).notNull(),
    attempt: integer('attempt').default(0).notNull(),
    maxAttempts: integer('maxAttempts').default(3).notNull(),
    retryCount: integer('retryCount').default(0).notNull(),
    retryReasonCode: text('retryReasonCode'),
    nextRetryAt: timestampColumn('nextRetryAt'),
    queuedAt: timestampColumn('queuedAt').defaultNow().notNull(),
    startedAt: timestampColumn('startedAt'),
    heartbeatAt: timestampColumn('heartbeatAt'),
    finishedAt: timestampColumn('finishedAt'),
    cancelRequestedAt: timestampColumn('cancelRequestedAt'),
    errorCode: text('errorCode'),
    errorMessage: text('errorMessage'),
    resultJson: jsonb('resultJson'),
    version: integer('version').default(0).notNull(),
    createdAt: timestampColumn('createdAt').defaultNow().notNull(),
    updatedAt: timestampColumn('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    sessionIdIdx: index('jobs_sessionId_idx').on(table.sessionId),
    userIdIdx: index('jobs_userId_idx').on(table.userId),
    sessionKindIdx: index('jobs_session_kind_idx').on(table.sessionId, table.kind),
    statusCreatedIdx: index('jobs_status_created_idx').on(table.status, table.createdAt),
    statusPriorityCreatedIdx: index('jobs_status_priority_created_idx').on(
      table.status,
      table.priority,
      table.createdAt
    ),
    retryScheduleIdx: index('jobs_retry_schedule_idx').on(table.status, table.nextRetryAt),
    heartbeatIdx: index('jobs_heartbeat_idx').on(table.heartbeatAt),
    progressPercentCheck: check(
      'jobs_progress_percent_check',
      sql`${table.progressPercent} >= 0 AND ${table.progressPercent} <= 100`
    ),
    attemptCheck: check('jobs_attempt_check', sql`${table.attempt} >= 0`),
    retryCountCheck: check('jobs_retry_count_check', sql`${table.retryCount} >= 0`),
    maxAttemptsCheck: check('jobs_max_attempts_check', sql`${table.maxAttempts} >= 1`),
    priorityCheck: check('jobs_priority_check', sql`${table.priority} >= 0`),
    versionCheck: check('jobs_version_check', sql`${table.version} >= 0`),
    userStatusIdx: index('jobs_user_status_idx').on(table.userId, table.status),
  })
);

export const jobAttempts = pgTable(
  'job_attempts',
  {
    id: text('id').primaryKey(),
    jobId: text('jobId')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    attemptNo: integer('attemptNo').notNull(),
    workerId: text('workerId'),
    leaseToken: text('leaseToken'),
    startedAt: timestampColumn('startedAt').defaultNow().notNull(),
    heartbeatAt: timestampColumn('heartbeatAt'),
    endedAt: timestampColumn('endedAt'),
    outcome: jobAttemptOutcomeEnum('outcome').default('running').notNull(),
    failureReason: text('failureReason'),
    failureCode: text('failureCode'),
    checkpointJson: jsonb('checkpointJson'),
    createdAt: timestampColumn('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    jobIdIdx: index('job_attempts_jobId_idx').on(table.jobId),
    heartbeatIdx: index('job_attempts_heartbeat_idx').on(table.heartbeatAt),
    jobAttemptUnique: uniqueIndex('job_attempts_job_attempt_unique').on(table.jobId, table.attemptNo),
    attemptNoCheck: check('job_attempts_attempt_no_check', sql`${table.attemptNo} >= 1`),
  })
);

export const jobEvents = pgTable(
  'job_events',
  {
    id: text('id').primaryKey(),
    jobId: text('jobId')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    sessionId: text('sessionId')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    sequenceNo: integer('sequenceNo').notNull(),
    eventType: text('eventType').notNull(),
    stage: text('stage'),
    payloadJson: jsonb('payloadJson').notNull(),
    createdAt: timestampColumn('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    jobIdSeqIdx: uniqueIndex('job_events_job_seq_unique').on(table.jobId, table.sequenceNo),
    jobCreatedIdx: index('job_events_job_created_idx').on(table.jobId, table.createdAt),
    sessionCreatedIdx: index('job_events_session_created_idx').on(table.sessionId, table.createdAt),
  })
);

export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    requestHash: text('requestHash').notNull(),
    sessionId: text('sessionId').references(() => sessions.id, { onDelete: 'set null' }),
    jobId: text('jobId').references(() => jobs.id, { onDelete: 'set null' }),
    createdAt: timestampColumn('createdAt').defaultNow().notNull(),
    expiresAt: timestampColumn('expiresAt').notNull(),
  },
  (table) => ({
    userKeyUnique: uniqueIndex('idempotency_keys_user_key_unique').on(table.userId, table.key),
    expiresAtIdx: index('idempotency_keys_expires_idx').on(table.expiresAt),
    jobIdIdx: index('idempotency_keys_jobId_idx').on(table.jobId),
    requestHashIdx: index('idempotency_keys_request_hash_idx').on(table.requestHash),
  })
);

export const artifacts = pgTable(
  'artifacts',
  {
    id: text('id').primaryKey(),
    jobId: text('jobId')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    sessionId: text('sessionId').references(() => sessions.id, { onDelete: 'set null' }),
    kind: artifactKindEnum('kind').default('other').notNull(),
    uri: text('uri').notNull(),
    mimeType: text('mimeType'),
    checksum: text('checksum'),
    sizeBytes: integer('sizeBytes'),
    metadataJson: jsonb('metadataJson'),
    createdAt: timestampColumn('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    jobKindIdx: index('artifacts_job_kind_idx').on(table.jobId, table.kind),
    sessionIdIdx: index('artifacts_sessionId_idx').on(table.sessionId),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type SessionFavorite = typeof sessionFavorites.$inferSelect;
export type NewSessionFavorite = typeof sessionFavorites.$inferInsert;
export type Calculation = typeof calculations.$inferSelect;
export type NewCalculation = typeof calculations.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type DataRetention = typeof dataRetention.$inferSelect;
export type NewDataRetention = typeof dataRetention.$inferInsert;
export type JobStatus = (typeof jobStatusEnum.enumValues)[number];
export type JobKind = (typeof jobKindEnum.enumValues)[number];
export type JobAttemptOutcome = (typeof jobAttemptOutcomeEnum.enumValues)[number];
export type ArtifactKind = (typeof artifactKindEnum.enumValues)[number];
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type JobAttempt = typeof jobAttempts.$inferSelect;
export type NewJobAttempt = typeof jobAttempts.$inferInsert;
export type JobEvent = typeof jobEvents.$inferSelect;
export type NewJobEvent = typeof jobEvents.$inferInsert;
export type IdempotencyKey = typeof idempotencyKeys.$inferSelect;
export type NewIdempotencyKey = typeof idempotencyKeys.$inferInsert;
export type Artifact = typeof artifacts.$inferSelect;
export type NewArtifact = typeof artifacts.$inferInsert;
