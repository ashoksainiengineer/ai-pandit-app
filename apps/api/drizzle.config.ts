import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit configuration for Turso database
 * 
 * For drizzle-kit v0.31+, use dialect: 'turso' directly
 * This provides native support for Turso's libSQL protocol
 */
export default defineConfig({
    schema: '../../packages/db/src/schema.ts',
    out: './drizzle',
    dialect: 'turso',
    dbCredentials: {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    },
    verbose: true,
    strict: true,
});