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
// INITIALIZE CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

let client: Client;
let db: ReturnType<typeof drizzle<typeof schema>>;

try {
  // Use a fallback URL if syncUrl is missing (common during Next.js build time)
  const finalUrl = CONNECTION_CONFIG.syncUrl || 'file::memory:';

  if (!CONNECTION_CONFIG.syncUrl) {
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      console.warn('⚠️ TURSO_DATABASE_URL is missing - using memory-based fallback client');
    }
  }

  client = createClient({
    url: finalUrl,
    authToken: CONNECTION_CONFIG.authToken,
  });

  db = drizzle(client, { schema });

} catch (error) {
  console.error('Failed to initialize database client:', error);
  // During build time, we don't want to crash the process if the DB is unreachable
  if (process.env.NODE_ENV === 'production') {
    console.warn('Continuing build despite database initialization error...');
  } else {
    throw error;
  }
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
  maxRetries: number = 3
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
        errorMessage.includes('busy');

      if (!isTransient || attempt === maxRetries) {
        throw lastError;
      }

      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.warn(`Query failed (attempt ${attempt}/${maxRetries}), retrying...`, {
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
