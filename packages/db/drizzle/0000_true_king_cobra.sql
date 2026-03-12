CREATE TYPE "public"."artifact_kind" AS ENUM('analysis_result', 'reasoning_log', 'candidate_snapshot', 'report', 'export', 'other');--> statement-breakpoint
CREATE TYPE "public"."job_attempt_outcome" AS ENUM('running', 'succeeded', 'failed', 'cancelled', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('queued', 'running', 'retrying', 'failed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "artifacts" (
	"id" text PRIMARY KEY NOT NULL,
	"jobId" text NOT NULL,
	"sessionId" text,
	"kind" "artifact_kind" DEFAULT 'other' NOT NULL,
	"uri" text NOT NULL,
	"mimeType" text,
	"checksum" text,
	"sizeBytes" integer,
	"metadataJson" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditLogs" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"userRole" text NOT NULL,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resourceId" text,
	"oldValues" text,
	"newValues" text,
	"ipAddress" text,
	"userAgent" text,
	"requestId" text,
	"success" boolean DEFAULT true NOT NULL,
	"errorMessage" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calculations" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionId" text NOT NULL,
	"birthDateTime" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"timezone" text NOT NULL,
	"ephemerisData" text NOT NULL,
	"algorithmVersion" text DEFAULT '2.0.0' NOT NULL,
	"ephemerisVersion" text DEFAULT 'de440' NOT NULL,
	"processingTime" integer,
	"cacheHitCount" integer DEFAULT 0 NOT NULL,
	"expiresAt" timestamp with time zone,
	"success" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dataRetention" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"sessionId" text,
	"dataType" text NOT NULL,
	"retentionDays" integer NOT NULL,
	"scheduledDeletionAt" timestamp with time zone NOT NULL,
	"actuallyDeletedAt" timestamp with time zone,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"errorMessage" text,
	"retryCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"key" text NOT NULL,
	"requestHash" text NOT NULL,
	"sessionId" text,
	"jobId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"jobId" text NOT NULL,
	"attemptNo" integer NOT NULL,
	"workerId" text,
	"leaseToken" text,
	"startedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"heartbeatAt" timestamp with time zone,
	"endedAt" timestamp with time zone,
	"outcome" "job_attempt_outcome" DEFAULT 'running' NOT NULL,
	"failureReason" text,
	"failureCode" text,
	"checkpointJson" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_events" (
	"id" text PRIMARY KEY NOT NULL,
	"jobId" text NOT NULL,
	"sessionId" text NOT NULL,
	"sequenceNo" integer NOT NULL,
	"eventType" text NOT NULL,
	"stage" text,
	"payloadJson" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionId" text NOT NULL,
	"userId" text NOT NULL,
	"kind" text DEFAULT 'btr_rectification' NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"currentStage" text,
	"cursorJson" jsonb,
	"checkpointJson" jsonb,
	"progressPercent" integer DEFAULT 0 NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"maxAttempts" integer DEFAULT 3 NOT NULL,
	"queuedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"startedAt" timestamp with time zone,
	"heartbeatAt" timestamp with time zone,
	"finishedAt" timestamp with time zone,
	"cancelRequestedAt" timestamp with time zone,
	"errorCode" text,
	"errorMessage" text,
	"resultJson" jsonb,
	"version" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"sessionId" text,
	"amountPaise" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"razorpayOrderId" text,
	"razorpayPaymentId" text,
	"razorpaySignature" text,
	"webhookReceivedAt" timestamp with time zone,
	"verifiedAt" timestamp with time zone,
	"verificationMethod" text,
	"refundAmountPaise" integer DEFAULT 0 NOT NULL,
	"refundReason" text,
	"refundedAt" timestamp with time zone,
	"errorCode" text,
	"errorDescription" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_favorites" (
	"id" text PRIMARY KEY NOT NULL,
	"clerkId" text NOT NULL,
	"sessionId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"clerkId" text NOT NULL,
	"fullName" text NOT NULL,
	"dateOfBirth" text NOT NULL,
	"tentativeTime" text NOT NULL,
	"birthPlace" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"timezone" text NOT NULL,
	"gender" text,
	"physicalTraits" text,
	"forensicTraits" text,
	"lifeEvents" text,
	"spouseData" text,
	"offsetConfig" text,
	"rectifiedTime" text,
	"accuracy" integer,
	"confidence" text,
	"analysisResult" text,
	"progressData" text,
	"reasoningLogs" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"errorMessage" text,
	"errorCode" text,
	"submittedAt" timestamp with time zone,
	"startedProcessingAt" timestamp with time zone,
	"completedAt" timestamp with time zone,
	"deletedAt" timestamp with time zone,
	"retentionUntil" timestamp with time zone,
	"aiConsentGiven" boolean DEFAULT false,
	"aiConsentGivenAt" timestamp with time zone,
	"aiConsentIp" text,
	"isEncrypted" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"clerkId" text NOT NULL,
	"email" text NOT NULL,
	"fullName" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"lastLoginAt" timestamp with time zone,
	"deletedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerkId_unique" UNIQUE("clerkId")
);
--> statement-breakpoint
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_jobId_jobs_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditLogs" ADD CONSTRAINT "auditLogs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calculations" ADD CONSTRAINT "calculations_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataRetention" ADD CONSTRAINT "dataRetention_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataRetention" ADD CONSTRAINT "dataRetention_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_jobId_jobs_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_attempts" ADD CONSTRAINT "job_attempts_jobId_jobs_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_events" ADD CONSTRAINT "job_events_jobId_jobs_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_events" ADD CONSTRAINT "job_events_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_favorites" ADD CONSTRAINT "session_favorites_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "artifacts_job_kind_idx" ON "artifacts" USING btree ("jobId","kind");--> statement-breakpoint
CREATE INDEX "artifacts_sessionId_idx" ON "artifacts" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "auditLogs_userId_idx" ON "auditLogs" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "auditLogs_action_idx" ON "auditLogs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "auditLogs_resource_idx" ON "auditLogs" USING btree ("resource");--> statement-breakpoint
CREATE INDEX "auditLogs_user_created_idx" ON "auditLogs" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "auditLogs_resource_action_idx" ON "auditLogs" USING btree ("resource","action");--> statement-breakpoint
CREATE INDEX "auditLogs_createdAt_idx" ON "auditLogs" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "calculations_sessionId_idx" ON "calculations" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "calculations_createdAt_idx" ON "calculations" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "calculations_expires_idx" ON "calculations" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "calculations_session_created_idx" ON "calculations" USING btree ("sessionId","createdAt");--> statement-breakpoint
CREATE INDEX "dataRetention_userId_idx" ON "dataRetention" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "dataRetention_sessionId_idx" ON "dataRetention" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "dataRetention_status_idx" ON "dataRetention" USING btree ("status");--> statement-breakpoint
CREATE INDEX "dataRetention_scheduled_idx" ON "dataRetention" USING btree ("scheduledDeletionAt","status");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_keys_user_key_unique" ON "idempotency_keys" USING btree ("userId","key");--> statement-breakpoint
CREATE INDEX "idempotency_keys_expires_idx" ON "idempotency_keys" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "idempotency_keys_jobId_idx" ON "idempotency_keys" USING btree ("jobId");--> statement-breakpoint
CREATE INDEX "job_attempts_jobId_idx" ON "job_attempts" USING btree ("jobId");--> statement-breakpoint
CREATE INDEX "job_attempts_heartbeat_idx" ON "job_attempts" USING btree ("heartbeatAt");--> statement-breakpoint
CREATE UNIQUE INDEX "job_attempts_job_attempt_unique" ON "job_attempts" USING btree ("jobId","attemptNo");--> statement-breakpoint
CREATE UNIQUE INDEX "job_events_job_seq_unique" ON "job_events" USING btree ("jobId","sequenceNo");--> statement-breakpoint
CREATE INDEX "job_events_job_created_idx" ON "job_events" USING btree ("jobId","createdAt");--> statement-breakpoint
CREATE INDEX "job_events_session_created_idx" ON "job_events" USING btree ("sessionId","createdAt");--> statement-breakpoint
CREATE INDEX "jobs_sessionId_idx" ON "jobs" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "jobs_userId_idx" ON "jobs" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "jobs_status_created_idx" ON "jobs" USING btree ("status","createdAt");--> statement-breakpoint
CREATE INDEX "jobs_heartbeat_idx" ON "jobs" USING btree ("heartbeatAt");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_session_kind_unique" ON "jobs" USING btree ("sessionId","kind");--> statement-breakpoint
CREATE INDEX "payments_userId_idx" ON "payments" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "payments_sessionId_idx" ON "payments" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_razorpayOrderId_unique" ON "payments" USING btree ("razorpayOrderId");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_razorpayPaymentId_unique" ON "payments" USING btree ("razorpayPaymentId");--> statement-breakpoint
CREATE INDEX "payments_createdAt_idx" ON "payments" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "payments_refund_idx" ON "payments" USING btree ("status","refundAmountPaise");--> statement-breakpoint
CREATE INDEX "session_favorites_clerkId_idx" ON "session_favorites" USING btree ("clerkId");--> statement-breakpoint
CREATE INDEX "session_favorites_sessionId_idx" ON "session_favorites" USING btree ("sessionId");--> statement-breakpoint
CREATE UNIQUE INDEX "session_favorites_clerk_session_unique" ON "session_favorites" USING btree ("clerkId","sessionId");--> statement-breakpoint
CREATE INDEX "sessions_userId_idx" ON "sessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "sessions_status_idx" ON "sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_user_status_idx" ON "sessions" USING btree ("userId","status");--> statement-breakpoint
CREATE INDEX "sessions_status_created_idx" ON "sessions" USING btree ("status","createdAt");--> statement-breakpoint
CREATE INDEX "sessions_createdAt_idx" ON "sessions" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "sessions_submittedAt_idx" ON "sessions" USING btree ("submittedAt");--> statement-breakpoint
CREATE INDEX "sessions_retention_idx" ON "sessions" USING btree ("retentionUntil");--> statement-breakpoint
CREATE INDEX "sessions_deletedAt_idx" ON "sessions" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX "users_clerkId_idx" ON "users" USING btree ("clerkId");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_isActive_idx" ON "users" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_deletedAt_idx" ON "users" USING btree ("deletedAt");