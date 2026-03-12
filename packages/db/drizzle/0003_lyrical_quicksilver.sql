ALTER TYPE "public"."artifact_kind" ADD VALUE 'dead_letter_report' BEFORE 'other';--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "retryCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "retryReasonCode" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "nextRetryAt" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "jobs_retry_schedule_idx" ON "jobs" USING btree ("status","nextRetryAt");--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_retry_count_check" CHECK ("jobs"."retryCount" >= 0);