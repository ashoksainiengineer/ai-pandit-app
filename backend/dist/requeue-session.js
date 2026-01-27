import 'dotenv/config';
import { db } from './database/drizzle.js';
import { sessions } from './database/schema.js';
import { eq } from 'drizzle-orm';
async function requeueSession() {
    const sessionId = process.argv[2];
    if (!sessionId) {
        console.error('Usage: tsx src/requeue-session.ts <sessionId>');
        process.exit(1);
    }
    console.log(`Requeueing session ${sessionId}...`);
    // Reset status to 'queued' and update timestamp to now so it's not stale
    await db.update(sessions)
        .set({
        status: 'queued',
        errorMessage: null,
        updatedAt: new Date().toISOString()
    })
        .where(eq(sessions.id, sessionId));
    console.log('Session requeued successfully.');
    process.exit(0);
}
requeueSession();
//# sourceMappingURL=requeue-session.js.map