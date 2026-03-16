import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq, or, asc } from 'drizzle-orm';
import { logger } from '../lib/logger.js';

async function checkSession() {
    const sessionId = '2f207ae6-0387-4039-8fc8-72128f0bf361';
    logger.info(`Checking session ${sessionId}...`);

    const result = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (result.length === 0) {
        logger.info('Session not found!');
        return;
    }

    const s = result[0];
    logger.info('Session status', {
        id: s.id,
        status: s.status,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        dateOfBirth: s.dateOfBirth,
        tentativeTime: s.tentativeTime,
        errorMessage: s.errorMessage,
    });

    logger.info('Fetching all session status counts...');
    const allSessions = await db.select({ status: sessions.status }).from(sessions);
    const counts: Record<string, number> = {};
    allSessions.forEach(s => {
        counts[s.status || 'null'] = (counts[s.status || 'null'] || 0) + 1;
    });

    logger.info('Session status counts', { counts });

    const stuckSessions = await db.select({
        id: sessions.id,
        status: sessions.status,
        updatedAt: sessions.updatedAt
    })
        .from(sessions)
        .where(or(eq(sessions.status, 'queued'), eq(sessions.status, 'processing')))
        .orderBy(asc(sessions.updatedAt))
        .limit(20);

    logger.info('Potentially stuck sessions', { stuckSessions });
}

checkSession().then(() => process.exit(0)).catch(err => {
    logger.error('Error checking session', err);
    process.exit(1);
});
