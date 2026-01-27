
import 'dotenv/config';
import { db } from './database/drizzle.js';
import { sessions } from './database/schema.js';
import { eq } from 'drizzle-orm';

async function checkSession() {
    const sessionId = process.argv[2];
    if (!sessionId) {
        console.error('Usage: tsx src/check-session.ts <sessionId>');
        process.exit(1);
    }

    console.log(`Checking session ${sessionId}...`);
    const result = await db.select().from(sessions).where(eq(sessions.id, sessionId));

    if (result.length === 0) {
        console.log('Session not found');
    } else {
        console.log('Session Status:', result[0].status);
        console.log('Error Message:', result[0].errorMessage);
        console.log('Created At:', result[0].createdAt);
        console.log('Updated At:', result[0].updatedAt);
    }
    process.exit(0);
}

checkSession();
