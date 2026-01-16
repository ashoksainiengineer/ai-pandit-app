import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle> | undefined;
};

const createDbClient = () => {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
        throw new Error("Database connection could not be established at runtime. Check your environment variables.");
    }
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return drizzle(client);
};

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
    get(target, prop) {
        if (!globalForDb.db) {
            globalForDb.db = createDbClient();
        }
        return Reflect.get(globalForaDb.db as object, prop);
    }
});
