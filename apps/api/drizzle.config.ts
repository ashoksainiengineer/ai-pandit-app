import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit configuration for Neon Postgres database
 */
export default defineConfig({
    schema: '../../packages/db/src/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL!,
    },
    verbose: true,
    strict: true,
});