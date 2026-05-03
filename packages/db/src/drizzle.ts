import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import { ConfigurationError, DatabaseError, TimeoutError } from '@ai-pandit/shared';
type PgDb = NodePgDatabase<typeof schema>;

const CONNECTION_CONFIG = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  queryTimeoutMs: 30000,
  connectionString:
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    '',
};

function getFallbackConnectionString(): string {
  return 'postgresql://postgres:postgres@127.0.0.1:5432/postgres';
}

function shouldUseSsl(connectionString: string): boolean {
  try {
    const parsed = new URL(connectionString);
    return parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1';
  } catch {
    console.error('[DB] Failed to parse connection string for SSL check — falling back to no SSL', {
      error: 'Invalid connection URL format'
    });
    return false;
  }
}

function resolveConnectionString(): string {
  if (CONNECTION_CONFIG.connectionString) {
    return CONNECTION_CONFIG.connectionString;
  }

  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  const isProductionRuntime = process.env.NODE_ENV === 'production' && !isBuildPhase;

  if (isProductionRuntime) {
    throw new ConfigurationError('NEON_DATABASE_URL or DATABASE_URL is required in production runtime');
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(
      '[DB] No Postgres connection string found. Using local fallback URL for non-production runtime.'
    );
  }
  return getFallbackConnectionString();
}
// ─── Lazy initialization ───────────────────────────────────────────────────

let _pool: Pool | null = null;
let _db: PgDb | null = null;

function ensureInit(): void {
  if (_pool) return;

  const connectionString = resolveConnectionString();
  _pool = new Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: shouldUseSsl(connectionString)
      ? { rejectUnauthorized: process.env.NODE_ENV === 'production' || process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : undefined,
  });
  _db = drizzle(_pool, { schema });
}

/**
 * Lazily-initialized pool proxy.
 * Behaves exactly like a pg.Pool instance but defers connection-string
 * resolution and Pool construction until the first property access.
 */
const pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    ensureInit();
    const value = Reflect.get(_pool!, prop, _pool!);
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(_pool!) : value;
  },
  set(_target, prop, value, receiver) {
    ensureInit();
    return Reflect.set(_pool!, prop, value, _pool!);
  },
  has(_target, prop) {
    ensureInit();
    return Reflect.has(_pool!, prop);
  },
  ownKeys(_target) {
    ensureInit();
    return Reflect.ownKeys(_pool!);
  },
  getOwnPropertyDescriptor(_target, prop) {
    ensureInit();
    return Reflect.getOwnPropertyDescriptor(_pool!, prop);
  },
});

/**
 * Lazily-initialized db proxy.
 * Behaves exactly like a Drizzle ORM instance but defers pool creation until first access.
 */
const db: PgDb = new Proxy({} as PgDb, {
  get(_target, prop, receiver) {
    ensureInit();
    const value = Reflect.get(_db!, prop, _db!);
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(_db!) : value;
  },
  set(_target, prop, value, receiver) {
    ensureInit();
    return Reflect.set(_db!, prop, value, _db!);
  },
  has(_target, prop) {
    ensureInit();
    return Reflect.has(_db!, prop);
  },
  ownKeys(_target) {
    ensureInit();
    return Reflect.ownKeys(_db!);
  },
  getOwnPropertyDescriptor(_target, prop) {
    ensureInit();
    return Reflect.getOwnPropertyDescriptor(_db!, prop);
  },
});

/** Canonical lazy accessor — prefer this over the pool proxy when you need a direct reference. */
export function getPool(): Pool {
  ensureInit();
  return _pool!;
}

/** Canonical lazy accessor — prefer this over the db proxy when you need a direct reference. */
export function getDb(): PgDb {
  ensureInit();
  return _db!;
}


export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latencyMs: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    await pool.query('SELECT 1');
    return {
      healthy: true,
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      healthy: false,
      latencyMs: Date.now() - startTime,
      error: (error as Error).message,
    };
  }
}

export async function executeWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = CONNECTION_CONFIG.queryTimeoutMs
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new TimeoutError(`Query timeout after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = CONNECTION_CONFIG.maxRetries
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const errorMessage = lastError.message.toLowerCase();
      const isTransient =
        errorMessage.includes('timeout') ||
        errorMessage.includes('network') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('econnreset') ||
        errorMessage.includes('connection terminated') ||
        errorMessage.includes('connection ended') ||
        errorMessage.includes('too many clients') ||
        errorMessage.includes('too many connections') ||
        errorMessage.includes('could not connect') ||
        errorMessage.includes('busy') ||
        errorMessage.includes('locked') ||
        errorMessage.includes('57p01') ||
        errorMessage.includes('53300') ||
        errorMessage.includes('40001') ||
        errorMessage.includes('40p01');

      if (!isTransient || attempt === maxRetries) {
        throw lastError;
      }

      const baseDelay = CONNECTION_CONFIG.baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 200;
      const delay = Math.min(baseDelay + jitter, CONNECTION_CONFIG.maxDelayMs);

      console.error(
        `[DB] Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(delay)}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new DatabaseError('Database operation failed after retries', { cause: lastError });
}

export async function verifyDatabaseConnection(): Promise<void> {
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  if (isBuildPhase || isTest) return;

  try {
    await executeWithTimeout(() => pool.query('SELECT 1'), 10000);
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    console.error('[DB] Proactive database health check failed in non-production runtime', {
      error: (error as Error).message,
    });
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  await pool.end();
}

export { pool, db };
