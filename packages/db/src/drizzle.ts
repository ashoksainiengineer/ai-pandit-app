// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE CONNECTION MANAGEMENT
// Turso (libSQL) with connection pooling, retries, and health checks
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient, Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.js';

// ═══════════════════════════════════════════════════════════════════════════════
// CONNECTION CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONNECTION_CONFIG = {
  // Connection retry settings
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,

  // Query timeout
  queryTimeoutMs: 30000,

  // Connection pool settings (Turso client handles pooling internally)
  syncUrl: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT INITIALIZATION WITH RETRY
// ═══════════════════════════════════════════════════════════════════════════════

async function createClientWithRetry(): Promise<Client> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= CONNECTION_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`Connecting to Turso database (attempt ${attempt}/${CONNECTION_CONFIG.maxRetries})...`);

      const client = createClient({
        url: CONNECTION_CONFIG.syncUrl,
        authToken: CONNECTION_CONFIG.authToken,
      });

      // Verify connection with a simple query
      await client.execute('SELECT 1');

      console.log('✅ Database connection established');
      return client;

    } catch (error) {
      lastError = error as Error;
      const delay = Math.min(
        CONNECTION_CONFIG.baseDelayMs * Math.pow(2, attempt - 1),
        CONNECTION_CONFIG.maxDelayMs
      );

      console.warn(`Database connection attempt ${attempt} failed, retrying in ${delay}ms...`, {
        error: lastError.message,
      });

      if (attempt < CONNECTION_CONFIG.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed to connect to database after ${CONNECTION_CONFIG.maxRetries} attempts: ${lastError?.message}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZE CLIENT WITH TIMEOUT PROTECTION
// ═══════════════════════════════════════════════════════════════════════════════

let client: Client;
let db: ReturnType<typeof drizzle<typeof schema>>;

/**
 * Create client with explicit timeout to prevent indefinite hangs
 * HF Spaces may have restricted network egress causing createClient to hang
 */
async function createClientWithTimeout(url: string, authToken: string, timeoutMs: number = 10000): Promise<Client> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Database client creation timed out after ${timeoutMs}ms. Check network egress/Turso connectivity.`));
    }, timeoutMs);

    try {
      const newClient = createClient({ url, authToken });
      clearTimeout(timer);
      resolve(newClient);
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}

async function initializeDatabase(): Promise<void> {
  console.log('[DB] Initializing database client...');
  const startTime = Date.now();
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  const isProductionRuntime = process.env.NODE_ENV === 'production' && !isBuildPhase;
  
  try {
    // In production runtime, missing Turso URL must fail fast (no silent memory DB fallback)
    if (!CONNECTION_CONFIG.syncUrl && isProductionRuntime) {
      throw new Error('TURSO_DATABASE_URL is missing in production runtime');
    }

    // Use memory fallback only in non-production runtime (dev/test/build)
    const finalUrl = CONNECTION_CONFIG.syncUrl || 'file::memory:';
    if (!CONNECTION_CONFIG.syncUrl && !isBuildPhase) {
      console.warn('⚠️ TURSO_DATABASE_URL is missing - using memory-based fallback client');
    }

    // Create client with timeout protection
    client = await createClientWithTimeout(finalUrl, CONNECTION_CONFIG.authToken);
    console.log(`[DB] Client created in ${Date.now() - startTime}ms`);

    // Proactive check in non-build environments
    if (!isBuildPhase && CONNECTION_CONFIG.syncUrl) {
      console.log('[DB] Testing connection...');
      const testStart = Date.now();
      try {
        await client.execute('SELECT 1');
        console.log(`[DB] Connection verified in ${Date.now() - testStart}ms`);
      } catch (err) {
        console.error('❌ Proactive database health check failed:', (err as Error).message);
        // Continue - let runtime checks handle retries
      }
    }

    db = drizzle(client, { schema });
    console.log('[DB] Database client initialized successfully');

  } catch (error) {
    console.error('[DB] Failed to initialize database client:', (error as Error).message);
    
    // Allow fallback only in non-production runtime for local/dev/test/build ergonomics.
    if (!isProductionRuntime) {
      console.warn('[DB] Creating fallback in-memory client for non-production runtime...');
      client = createClient({ url: 'file::memory:' });
      db = drizzle(client, { schema });
    } else {
      // In production with valid config, we MUST connect to real database
      console.error('[DB] CRITICAL: Cannot connect to Turso database in production');
      throw error;
    }
  }
}

// Initialize immediately but don't block on it
// This prevents module load hangs while still initializing early
const initPromise = initializeDatabase();

// For backward compatibility: expose a function to ensure init is complete
export async function ensureDatabaseInitialized(): Promise<void> {
  await initPromise;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════════

export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latencyMs: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    await client.execute('SELECT 1');
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

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY HELPERS WITH TIMEOUT AND RETRY
// ═══════════════════════════════════════════════════════════════════════════════

export async function executeWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = CONNECTION_CONFIG.queryTimeoutMs
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 5
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Only retry on transient errors
      const errorMessage = lastError.message.toLowerCase();
      const isTransient =
        errorMessage.includes('timeout') ||
        errorMessage.includes('network') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('econnreset') ||
        errorMessage.includes('temporarily') ||
        errorMessage.includes('busy') ||
        errorMessage.includes('locked');

      if (!isTransient || attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const baseDelay = 500 * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 200;
      const delay = Math.min(baseDelay + jitter, 15000);

      console.warn(`[DB] Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(delay)}ms...`, {
        error: lastError.message,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════════════════════

export async function closeDatabaseConnection(): Promise<void> {
  try {
    console.log('Closing database connection...');
    await client.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { client, db };
