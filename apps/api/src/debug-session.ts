import 'dotenv/config';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';

async function debugSession(sessionId: string) {
    console.log(`Debugging session: ${sessionId}`);
    const result = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (result.length === 0) {
        console.log('Session not found');
        return;
    }

    const s = result[0];
    console.log('Session Details:');
    console.log(JSON.stringify(s, (key, value) => {
        if (key === 'progressData' || key === 'analysisResult' || key === 'lifeEvents') {
            return value ? `(Truncated: ${value.length} chars)` : null;
        }
        return value;
    }, 2));

    const now = new Date().toISOString();
    console.log(`Current Time (ISO): ${now}`);
}

const sid = process.argv[2] || '2f207ae6-0387-4039-8fc8-72128f0bf361';
debugSession(sid).catch(console.error);
