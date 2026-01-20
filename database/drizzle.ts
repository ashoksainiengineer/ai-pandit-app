// database/drizzle.ts
// Turso (libSQL) database connection with Drizzle ORM

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Turso connection from environment variables
const DATABASE_URL = process.env.TURSO_DATABASE_URL;
const DATABASE_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ TURSO_DATABASE_URL environment variable is not set');
}

// Create libSQL client
const client = createClient({
  url: DATABASE_URL,
  authToken: DATABASE_AUTH_TOKEN,
});

// Create Drizzle ORM instance
export const db = drizzle(client, { schema });

// Export for direct access if needed
export { client };
