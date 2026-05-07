import { beforeAll } from 'vitest';
import { db } from '@ai-pandit/db';
import { sql } from 'drizzle-orm';

beforeAll(async () => {
  // Verify database connection (early-returns in test env, so this is a no-op probe)
  try {
    const { verifyDatabaseConnection } = await import('@ai-pandit/db');
    if (typeof verifyDatabaseConnection === 'function') {
      await verifyDatabaseConnection();
    }
  } catch {
    // connection probe is best-effort; table creation will surface real issues
  }

  // Create tables using PostgreSQL types matching the Drizzle schema exactly.
  // Wrapped in try-catch so tests that don't need a DB (unit/ephemeris-only) still pass.
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        "clerkId" TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        "fullName" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        role TEXT NOT NULL DEFAULT 'user',
        "lastLoginAt" TIMESTAMPTZ,
        "deletedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY NOT NULL,
        "userId" TEXT NOT NULL REFERENCES users(id),
        "clerkId" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "dateOfBirth" TEXT NOT NULL,
        "tentativeTime" TEXT NOT NULL,
        "birthPlace" TEXT NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        timezone TEXT NOT NULL,
        gender TEXT,
        "lifeEvents" TEXT,
        "spouseData" TEXT,
        "offsetConfig" TEXT,
        "rectifiedTime" TEXT,
        accuracy INTEGER,
        confidence TEXT,
        "analysisResult" TEXT,
        "progressData" TEXT,
        "reasoningLogs" TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        "errorMessage" TEXT,
        "errorCode" TEXT,
        "submittedAt" TIMESTAMPTZ,
        "startedProcessingAt" TIMESTAMPTZ,
        "completedAt" TIMESTAMPTZ,
        "deletedAt" TIMESTAMPTZ,
        "retentionUntil" TIMESTAMPTZ,
        "aiConsentGiven" BOOLEAN DEFAULT false,
        "aiConsentGivenAt" TIMESTAMPTZ,
        "aiConsentIp" TEXT,
        "isEncrypted" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS calculations (
        id TEXT PRIMARY KEY NOT NULL,
        "sessionId" TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        "birthDateTime" TEXT NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        timezone TEXT NOT NULL,
        "ephemerisData" TEXT NOT NULL,
        "algorithmVersion" TEXT NOT NULL DEFAULT '2.0.0',
        "ephemerisVersion" TEXT NOT NULL DEFAULT 'de440',
        "processingTime" INTEGER,
        "cacheHitCount" INTEGER NOT NULL DEFAULT 0,
        "expiresAt" TIMESTAMPTZ,
        success BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  } catch (error) {
    console.warn(
      '[TEST SETUP] Database table creation skipped — tests requiring a running DB may fail:',
      (error as Error).message,
    );
  }

  if (process.env.SKIP_EPHEMERIS_INIT === 'true') {
    return;
  }

  try {
    // Use dynamic import to avoid static import deadlocks/hangs
    const { initEphemerisProvider } = await import('../ephemeris.js');
    await initEphemerisProvider();
  } catch (error) {
    console.warn('⚠️ [TEST SETUP] Ephemeris init skipped (tests will use mocks or algorithmic fallback):', (error as Error).message);
  }
});
