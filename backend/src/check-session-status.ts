import { db } from './database/drizzle.js';
import { sessions } from './database/schema.js';
import { eq, or, asc } from 'drizzle-orm';

async function checkSession() {
    const sessionId = '2f207ae6-0387-4039-8fc8-72128f0bf361';
    console.log(`Checking session ${sessionId}...`);

    const result = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (result.length === 0) {
        console.log('Session not found!');
        return;
    }

    const s = result[0];
    console.log('--- SESSION STATUS ---');
    console.log(`ID: ${s.id}`);
    console.log(`Status: ${s.status}`);
    console.log(`Created At: ${s.createdAt}`);
    console.log(`Updated At: ${s.updatedAt}`);
    console.log(`Date of Birth: ${s.dateOfBirth}`);
    console.log(`Tentative Time: ${s.tentativeTime}`);
    console.log(`Error Message: ${s.errorMessage}`);
    console.log('----------------------');

    console.log('\nFetching all session status counts...');
    const allSessions = await db.select({ status: sessions.status }).from(sessions);
    const counts: Record<string, number> = {};
    allSessions.forEach(s => {
        counts[s.status || 'null'] = (counts[s.status || 'null'] || 0) + 1;
    });

    console.log('\n--- SESSION STATUS COUNTS ---');
    console.table(counts);
    console.log('-------------------------------');

    const stuckSessions = await db.select({
        id: sessions.id,
        status: sessions.status,
        updatedAt: sessions.updatedAt
    })
        .from(sessions)
        .where(or(eq(sessions.status, 'queued'), eq(sessions.status, 'processing')))
        .orderBy(asc(sessions.updatedAt))
        .limit(20);

    console.log('\n--- POTENTIALLY STUCK SESSIONS ---');
    console.table(stuckSessions);
    console.log('-----------------------------------');
}

checkSession().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
