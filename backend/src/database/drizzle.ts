// database/drizzle.ts
// Turso (libSQL) database connection with Drizzle ORM

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Turso connection URL and auth token
const DATABASE_URL = process.env.DATABASE_URL || 'file:./local.db';
const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN;

// Create libSQL client
const client = createClient({
  url: DATABASE_URL,
  authToken: DATABASE_AUTH_TOKEN,
});

// Create Drizzle ORM instance
export const db = drizzle(client, { schema });

// Export for direct access if needed
export { client };
