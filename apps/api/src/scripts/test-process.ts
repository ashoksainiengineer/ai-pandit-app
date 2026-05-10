import 'dotenv/config';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { getApiEncryption } from '../lib/encryption/index.js';

const crypto = getApiEncryption();

async function testProcess() {
    const sessionId = '2f207ae6-0387-4039-8fc8-72128f0bf361';
    console.log(`Testing processing for session: ${sessionId}`);

    try {
        const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
        if (session.length === 0) {
            console.log('Session not found');
            return;
        }
        const s = session[0];
        console.log(`Status: ${s.status}`);
        console.log(`ExternalId: ${s.externalId}`);
        console.log(`isEncrypted: ${s.isEncrypted}`);

        // Test decryption
        console.log('\n=== Testing Decryption ===');
        try {
            if (!s.lifeEvents) {
                console.log('lifeEvents is null/missing');
            } else {
                const lifeEventsDecrypted = crypto.decrypt(s.lifeEvents, s.userId);
                console.log(`lifeEvents decrypted: ${lifeEventsDecrypted ? 'YES (' + lifeEventsDecrypted.length + ' chars)' : 'FAILED'}`);
                if (!lifeEventsDecrypted) {
                    try {
                        JSON.parse(s.lifeEvents);
                        console.log('lifeEvents is plain JSON (not encrypted)');
                    } catch {
                        console.log('lifeEvents is NOT plain JSON either');
                    }
                }
            }
        } catch (err) {
            console.error('Decryption error:', err);
        }

        try {
            const dob = crypto.parseField(s.dateOfBirth, s.userId);
            console.log(`dateOfBirth: ${dob}`);
        } catch (err) {
            console.error('DOB decryption error:', err);
        }

        try {
            const time = crypto.parseField(s.tentativeTime, s.userId);
            console.log(`tentativeTime: ${time}`);
        } catch (err) {
            console.error('Time decryption error:', err);
        }

    } catch (err) {
        console.error('Top-level error:', err);
    }

    process.exit(0);
}

testProcess();
