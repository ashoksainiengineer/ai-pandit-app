import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.TURSO_DATABASE_URL) throw new Error('TURSO_DATABASE_URL not found');
if (!process.env.TURSO_AUTH_TOKEN) throw new Error('TURSO_AUTH_TOKEN not found');

export default defineConfig({
  schema: './database/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
