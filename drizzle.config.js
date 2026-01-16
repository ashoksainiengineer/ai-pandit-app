const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

if (!process.env.TURSO_DATABASE_URL) throw new Error('TURSO_DATABASE_URL not found in environment');
if (!process.env.TURSO_AUTH_TOKEN) throw new Error('TURSO_AUTH_TOKEN not found in environment');

/** @type { import("drizzle-kit").Config } */
module.exports = {
    schema: './database/schema.ts',
    out: './drizzle',
    dialect: 'sqlite',
    driver: 'turso',
    dbCredentials: {
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    },
};
