import { getDb, executeWithRetry } from './drizzle.js';
import { users } from './schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';

// ── Helpers ────────────────────────────────────────────────────────────────

function isUniqueConstraintError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes('unique') || message.toLowerCase().includes('constraint');
}

// ── Simple ensure-exists (no Clerk lookup) ─────────────────────────────────

export interface EnsureUserInput {
  clerkId: string;
  email?: string | null;
  fullName?: string | null;
}

export async function ensureUserRecord(
  input: EnsureUserInput,
): Promise<{ id: string; clerkId: string }> {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.clerkId, input.clerkId)).limit(1);
  if (rows.length > 0) {
    return { id: rows[0].id, clerkId: rows[0].clerkId };
  }

  const now = new Date().toISOString();
  await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      clerkId: input.clerkId,
      email: input.email ?? '',
      fullName: input.fullName ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: users.clerkId });

  const resolved = await db.select().from(users).where(eq(users.clerkId, input.clerkId)).limit(1);
  if (resolved.length === 0) {
    throw new Error('Failed to resolve user after upsert');
  }
  return { id: resolved[0].id, clerkId: resolved[0].clerkId };
}

// ── Full sync-from-Clerk (with retry + logging) ────────────────────────────

export interface SyncUserOptions {
  /** Clerk client for user lookup. Required for Clerk-sourced sync. */
  getClerkUser: (clerkId: string) => Promise<{
    emailAddresses: Array<{ emailAddress: string }>;
    firstName?: string | null;
    lastName?: string | null;
  }>;
  /** Logging function (default: silent). */
  log?: (level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) => void;
  /** If true, bypass sync and return a deterministic test ID. */
  testBypass?: boolean;
}

export async function syncUser(
  clerkId: string,
  options: SyncUserOptions,
): Promise<string> {
  const db = getDb();
  const log = options.log ?? (() => {});

  // Test bypass
  if (options.testBypass || clerkId === 'TEST_SCRIPT') {
    const testUserId = '00000000-0000-0000-0000-000000000000';
    try {
      const dbUser = await executeWithRetry(() =>
        db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1),
      );
      if (dbUser.length === 0) {
        const now = new Date().toISOString();
        await executeWithRetry(async () => {
          try {
            await db.insert(users).values({
              id: testUserId,
              clerkId,
              email: 'test@example.com',
              fullName: 'Test User',
              createdAt: now,
              updatedAt: now,
            });
          } catch (error) {
            if (!isUniqueConstraintError(error)) throw error;
          }
        });
      }
    } catch (e) {
      log('warn', 'Failed to insert test user', {
        error: e instanceof Error ? e.message : String(e),
      });
    }
    return testUserId;
  }

  // Check local DB first
  const dbUser = await executeWithRetry(() =>
    db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1),
  );
  if (dbUser.length > 0) {
    return dbUser[0].id;
  }

  log('info', 'User missing from DB. Syncing from Clerk...', { clerkId });

  try {
    const clerkUser = await options.getClerkUser(clerkId);
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const fullName =
      `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null;
    const internalUserId = crypto.randomUUID();
    const now = new Date().toISOString();
    let insertHadConflict = false;

    await executeWithRetry(async () => {
      try {
        await db.insert(users).values({
          id: internalUserId,
          clerkId,
          email,
          fullName,
          createdAt: now,
          updatedAt: now,
        });
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;
        insertHadConflict = true;
      }
    });

    const resolved = await executeWithRetry(() =>
      db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1),
    );

    if (resolved.length > 0) {
      log('info', 'User record recreated successfully', {
        clerkId,
        internalUserId: resolved[0].id,
      });
      return resolved[0].id;
    }

    if (!insertHadConflict) {
      log('warn', 'User row not visible after insert; using generated ID fallback', { clerkId });
      return internalUserId;
    }

    throw new Error('User record not found after upsert');
  } catch (error) {
    log('error', 'Failed to fetch/create user from Clerk', {
      clerkId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('User synchronization failed');
  }
}
