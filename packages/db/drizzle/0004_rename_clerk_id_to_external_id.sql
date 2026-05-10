-- Migration: Rename clerkId → externalId across all tables
-- Also fixes session_favorites to use userId instead of clerkId

-- 1. Rename users.clerkId → users.externalId
ALTER TABLE users RENAME COLUMN "clerkId" TO "externalId";
ALTER INDEX "users_clerkId_idx" RENAME TO "users_externalId_idx";

-- 2. Rename sessions.clerkId → sessions.externalId
ALTER TABLE sessions RENAME COLUMN "clerkId" TO "externalId";

-- 3. Drop old session_favorites (recreate with userId)
DROP TABLE IF EXISTS session_favorites CASCADE;

CREATE TABLE session_favorites (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "sessionId" TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "session_favorites_userId_idx" ON session_favorites("userId");
CREATE INDEX "session_favorites_sessionId_idx" ON session_favorites("sessionId");
CREATE UNIQUE INDEX "session_favorites_user_session_unique" ON session_favorites("userId", "sessionId");
