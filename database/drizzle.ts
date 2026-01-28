// database/drizzle.ts
// Turso (libSQL) database connection with Drizzle ORM

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Hardcoded Turso connection for local development
const DATABASE_URL = 'libsql://ai-pandit-ashoksainiengineer.aws-ap-south-1.turso.io';
const DATABASE_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg0NTA3NDQsImlkIjoiMmNiMzEzZDctODBiZC00YmQ0LWFlYjctYmIxNDM1MGRmZWQ1IiwicmlkIjoiNmU0MzE1YTQtODIwMC00ZDlhLTg1YTItNGVkZTMyYzUyYzNlIn0.DflPLPc8OFnwuivqmFi6RXD-lzghUvyXS2EoZHlqXg00qCRp-1ayoNsW5q1nNLnkjrvizn1JXJfM4Bom95Y0Bw';

if (!DATABASE_URL) {
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
