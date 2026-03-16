import 'dotenv/config';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger.js';

async function check() {
    const r = await db.select({
        status: sessions.status,
        errorMessage: sessions.errorMessage,
        errorCode: sessions.errorCode,
        completedAt: sessions.completedAt,
        rectifiedTime: sessions.rectifiedTime,
        accuracy: sessions.accuracy,
        confidence: sessions.confidence,
        updatedAt: sessions.updatedAt,
    }).from(sessions).where(eq(sessions.id, '2f207ae6-0387-4039-8fc8-72128f0bf361')).limit(1);
    logger.info('Session status', { session: r[0] });
    process.exit(0);
}
check();
