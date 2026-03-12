CREATE TYPE "public"."job_kind" AS ENUM('btr_rectification');--> statement-breakpoint
DROP INDEX "jobs_session_kind_unique";--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "kind" SET DEFAULT 'btr_rectification'::"public"."job_kind";--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "kind" SET DATA TYPE "public"."job_kind" USING "kind"::"public"."job_kind";--> statement-breakpoint
CREATE INDEX "idempotency_keys_request_hash_idx" ON "idempotency_keys" USING btree ("requestHash");--> statement-breakpoint
CREATE INDEX "jobs_session_kind_idx" ON "jobs" USING btree ("sessionId","kind");--> statement-breakpoint
CREATE INDEX "jobs_status_priority_created_idx" ON "jobs" USING btree ("status","priority","createdAt");--> statement-breakpoint
ALTER TABLE "job_attempts" ADD CONSTRAINT "job_attempts_attempt_no_check" CHECK ("job_attempts"."attemptNo" >= 1);--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_progress_percent_check" CHECK ("jobs"."progressPercent" >= 0 AND "jobs"."progressPercent" <= 100);--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_attempt_check" CHECK ("jobs"."attempt" >= 0);--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_max_attempts_check" CHECK ("jobs"."maxAttempts" >= 1);--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_priority_check" CHECK ("jobs"."priority" >= 0);--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_version_check" CHECK ("jobs"."version" >= 0);