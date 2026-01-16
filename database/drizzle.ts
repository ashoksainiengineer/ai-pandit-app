
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

// Use a global symbol to ensure a true singleton in Next.js hot-reloading environments
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle> | undefined;
};

const createDbClient = () => {
    if (!process.env.TURSO_DATABASE_URL) {
        // During build, this can be undefined. We shouldn't try to connect.
        // We will rely on the runtime environment having the variable.
        // A proxy will handle the lazy connection.
        return null
    }
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return drizzle(client);
};

const dbInstance = globalForDb.db ?? createDbClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = dbInstance;
}

// We export a proxy to truly defer the connection until it's used.
export const db = new Proxy(dbInstance || {}, {
    get(target, prop) {
        // If the db instance is not yet created, create it on first access.
        if (!globalForDb.db) {
            globalForDb.db = createDbClient();
        }
        if (!globalForDb.db) { // If it still fails, there's a runtime config issue
            throw new Error("Database connection could not be established at runtime. Check your environment variables.");
        }
        return Reflect.get(globalForDb.db, prop);
    }
}) as ReturnType<typeof drizzle>;

