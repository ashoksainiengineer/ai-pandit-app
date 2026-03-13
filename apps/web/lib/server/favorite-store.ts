import crypto from 'node:crypto';
import { db, pool } from '@ai-pandit/db';
import { sessionFavorites } from '@ai-pandit/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

const fallbackFavorites = new Map<string, Set<string>>();
let ensureTablePromise: Promise<void> | null = null;

function getFallbackSet(clerkId: string): Set<string> {
  let set = fallbackFavorites.get(clerkId);
  if (!set) {
    set = new Set<string>();
    fallbackFavorites.set(clerkId, set);
  }
  return set;
}

function isMissingTableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return (
    (normalized.includes('no such table') || normalized.includes('does not exist')) &&
    normalized.includes('session_favorites')
  );
}

async function ensureFavoritesTable(): Promise<void> {
  if (ensureTablePromise) return ensureTablePromise;
  ensureTablePromise = (async () => {
    // Postgres-compatible DDL with TIMESTAMPTZ for proper timezone handling
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session_favorites (
        id TEXT PRIMARY KEY,
        clerk_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_session_favorites_clerk_id ON session_favorites(clerk_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_session_favorites_session_id ON session_favorites(session_id)`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_session_favorites_unique ON session_favorites(clerk_id, session_id)`);
  })().catch((error) => {
    ensureTablePromise = null;
    throw error;
  });
  return ensureTablePromise;
}

export async function isFavorite(clerkId: string, sessionId: string): Promise<boolean> {
  try {
    await ensureFavoritesTable();
    const row = await db.query.sessionFavorites.findFirst({
      where: and(
        eq(sessionFavorites.clerkId, clerkId),
        eq(sessionFavorites.sessionId, sessionId),
      ),
      columns: { id: true },
    });
    return !!row;
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return getFallbackSet(clerkId).has(sessionId);
  }
}

export async function getFavoriteSetForSessions(clerkId: string, sessionIds: string[]): Promise<Set<string>> {
  if (sessionIds.length === 0) return new Set<string>();
  try {
    await ensureFavoritesTable();
    const rows = await db.select({ sessionId: sessionFavorites.sessionId })
      .from(sessionFavorites)
      .where(and(
        eq(sessionFavorites.clerkId, clerkId),
        inArray(sessionFavorites.sessionId, sessionIds),
      ));
    return new Set(rows.map((row) => row.sessionId));
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    const fallback = getFallbackSet(clerkId);
    return new Set(sessionIds.filter((id) => fallback.has(id)));
  }
}

export async function setFavorite(clerkId: string, sessionId: string, value: boolean): Promise<boolean> {
  try {
    await ensureFavoritesTable();
    if (value) {
      await db.insert(sessionFavorites).values({
        id: crypto.randomUUID(),
        clerkId,
        sessionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).onConflictDoNothing({
        target: [sessionFavorites.clerkId, sessionFavorites.sessionId],
      });
      return true;
    }

    await db.delete(sessionFavorites).where(and(
      eq(sessionFavorites.clerkId, clerkId),
      eq(sessionFavorites.sessionId, sessionId),
    ));
    return false;
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    const set = getFallbackSet(clerkId);
    if (value) set.add(sessionId);
    else set.delete(sessionId);
    return value;
  }
}

export async function toggleFavorite(clerkId: string, sessionId: string): Promise<boolean> {
  const current = await isFavorite(clerkId, sessionId);
  return setFavorite(clerkId, sessionId, !current);
}
