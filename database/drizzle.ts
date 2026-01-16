import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

let db: ReturnType<typeof drizzle> | null = null;

try {
  const sqlite = new Database(DATABASE_URL);
  db = drizzle(sqlite, { schema });
} catch (error) {
  console.error('Failed to connect to database:', error);
  throw new Error('Database connection failed');
}

export { db };
