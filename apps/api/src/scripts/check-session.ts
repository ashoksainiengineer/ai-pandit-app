
import 'dotenv/config';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger.js';

async function checkSession() {
    const sessionId = process.argv[2];
    if (!sessionId) {
        logger.error('Usage: tsx src/check-session.ts <sessionId>');
        process.exit(1);
    }

    logger.info(`Checking session ${sessionId}...`);
    const result = await db.select().from(sessions).where(eq(sessions.id, sessionId));

    if (result.length === 0) {
        logger.info('Session not found');
    } else {
        logger.info('Session details', {
            status: result[0].status,
            errorMessage: result[0].errorMessage,
            createdAt: result[0].createdAt,
            updatedAt: result[0].updatedAt,
        });
    }
    process.exit(0);
}

checkSession();
