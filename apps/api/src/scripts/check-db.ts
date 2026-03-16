import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { desc } from 'drizzle-orm';
import { logger } from '../lib/logger.js';

async function checkSessions() {
    const recentSessions = await db.select({
        id: sessions.id,
        status: sessions.status,
        errorMessage: sessions.errorMessage,
        updatedAt: sessions.updatedAt
    })
        .from(sessions)
        .orderBy(desc(sessions.updatedAt))
        .limit(5);

    logger.info("RECENT SESSIONS:", { sessions: recentSessions });
    process.exit(0);
}

checkSessions();
