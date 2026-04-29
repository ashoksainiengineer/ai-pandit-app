-- Migration 0002: Add session_favorites table
-- This migration was missing from the sequence. Adding it as a no-op for existing databases
-- and proper creation for new databases.

CREATE TABLE IF NOT EXISTS "session_favorites" (
	"id" text PRIMARY KEY NOT NULL,
	"clerkId" text NOT NULL,
	"sessionId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_favorites_clerkId_idx" ON "session_favorites" USING btree ("clerkId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_favorites_sessionId_idx" ON "session_favorites" USING btree ("sessionId");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "session_favorites_clerk_session_unique" ON "session_favorites" USING btree ("clerkId","sessionId");
--> statement-breakpoint
ALTER TABLE "session_favorites" ADD CONSTRAINT IF NOT EXISTS "session_favorites_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
