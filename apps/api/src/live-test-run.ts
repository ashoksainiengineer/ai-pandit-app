import 'dotenv/config';
import crypto from 'node:crypto';
import { db, executeWithRetry } from '@ai-pandit/db';
import { sessions, users } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from './lib/logger.js';
import { addToQueue, startQueueProcessor } from './lib/queue-manager.js';
import { encryptData } from './lib/encryption/index.js';
import { syncUser } from './lib/user-sync.js';
import { initEphemerisProvider } from './lib/ephemeris.js';

async function runLiveTest() {
    console.log('🚀 INITIALIZING HIGH-PRECISION LIVE TEST (OFFSET: ±5 MIN)...');

    await initEphemerisProvider();

    const clerkId = 'clerk_test_live_run';
    let internalUserId: string;

    try {
        internalUserId = await syncUser(clerkId);
    } catch (e) {
        // Fallback for direct DB insert if syncUser fails (unlikely in dev)
        internalUserId = crypto.randomUUID();
        await db.insert(users).values({
            id: internalUserId,
            clerkId: clerkId,
            email: 'test@example.com',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }).onConflictDoNothing();
    }

    // 2. Kohli Data with ±5 min offset
    const birthData = {
        fullName: 'Virat Kohli (Test)',
        dateOfBirth: '1988-11-05',
        tentativeTime: '10:28:00',
        latitude: 28.6139,
        longitude: 77.2090,
        timezone: '5.5',
        gender: 'male',
        birthPlace: 'Delhi'
    };

    const lifeEvents = [
        { id: '1', category: 'family', eventType: 'death', eventDate: '2006-12-18', datePrecision: 'exact_date', description: 'Father passed away', importance: 'critical', impact: 'major', source: 'document' },
        { id: '2', category: 'career', eventType: 'debut', eventDate: '2008-08-18', datePrecision: 'exact_date', description: 'ODI Debut', importance: 'high', impact: 'major', source: 'document' },
        { id: '3', category: 'career', eventType: 'achievement', eventDate: '2011-04-02', datePrecision: 'exact_date', description: 'World Cup Win', importance: 'high', impact: 'high', source: 'document' },
        { id: '4', category: 'career', eventType: 'debut', eventDate: '2011-06-20', datePrecision: 'exact_date', description: 'Test Debut', importance: 'medium', impact: 'high', source: 'document' },
        { id: '6', category: 'marriage', eventType: 'marriage', eventDate: '2017-12-11', datePrecision: 'exact_date', description: 'Marriage to Anushka', importance: 'critical', impact: 'major', source: 'document' },
        { id: '7', category: 'children', eventType: 'birth', eventDate: '2021-01-11', datePrecision: 'exact_date', description: 'Daughter Vamika born', importance: 'high', impact: 'major', source: 'document' }
    ];

    const forensicTraits = {
        personality: 'aggressive',
        physique: 'athletic'
    };

    const offsetConfig = {
        preset: 'custom',
        customMinutes: 5,
        description: '± 5 Minutes High Precision Live Test'
    };

    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    console.log(`📡 Creating Session: ${sessionId}`);

    await executeWithRetry(() =>
        db.insert(sessions).values({
            id: sessionId,
            userId: internalUserId,
            clerkId: clerkId,
            fullName: encryptData(birthData.fullName, clerkId),
            dateOfBirth: encryptData(birthData.dateOfBirth, clerkId),
            tentativeTime: encryptData(birthData.tentativeTime, clerkId),
            birthPlace: encryptData(birthData.birthPlace, clerkId),
            latitude: birthData.latitude,
            longitude: birthData.longitude,
            timezone: birthData.timezone,
            gender: birthData.gender,
            forensicTraits: encryptData(JSON.stringify(forensicTraits), clerkId),
            lifeEvents: encryptData(JSON.stringify(lifeEvents), clerkId),
            offsetConfig: encryptData(JSON.stringify(offsetConfig), clerkId),
            status: 'pending',
            createdAt: now,
            updatedAt: now,
        })
    );

    console.log('✅ Session Created. Adding to Queue...');
    const queueResult = await addToQueue(sessionId);

    if (!queueResult.success) {
        console.error('❌ Failed to add to queue:', queueResult.error);
        process.exit(1);
    }

    console.log(`📊 Queue Position: ${queueResult.position}`);
    console.log('🚀 Starting Queue Processor...');
    startQueueProcessor();

    console.log(`\n\n🎯 LIVE TEST STARTED!`);
    console.log(`Session ID: ${sessionId}`);
    console.log(`Monitor here: http://localhost:3000/rectify/${sessionId}`);
    console.log(`Tail logs for progress...`);
}

runLiveTest().catch(err => {
    console.error('💥 FATAL ERROR IN TEST RUN:', err);
    process.exit(1);
});
