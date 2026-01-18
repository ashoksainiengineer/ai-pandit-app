import dotenv from 'dotenv';
import path from 'path';
import { eq } from 'drizzle-orm';

async function resetSession() {
    // 1. Load Env
    const envPath = path.join(process.cwd(), 'backend', '.env');
    console.log('Loading env from:', envPath);
    dotenv.config({ path: envPath });

    if (!process.env.TURSO_DATABASE_URL) {
        throw new Error('TURSO_DATABASE_URL missing after loading .env');
    }

    // 2. Import DB dynamically AFTER env is loaded
    const { db } = await import('./backend/src/database/drizzle');
    const { sessions } = await import('./backend/src/database/schema');

    const sessionId = 'ebcb60a5-0f40-4f35-8e65-7476de1da6b3';
    console.log(`Resetting session ${sessionId} to queued...`);

    await db.update(sessions)
        .set({
            status: 'queued',
            updatedAt: new Date().toISOString()
        })
        .where(eq(sessions.id, sessionId));

    console.log('Done. Queue processor should pick it up.');
    process.exit(0);
}

resetSession().catch(console.error);
