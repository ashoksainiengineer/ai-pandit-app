import 'dotenv/config';
import crypto from 'node:crypto';
import { db, executeWithRetry } from '@ai-pandit/db';
import { sessions, users } from '@ai-pandit/db/schema';
import { addToQueue, startQueueProcessor } from '../apps/api/src/lib/queue-manager.js';
import { getApiEncryption } from '../apps/api/src/lib/encryption/index.js';
import { syncUser } from '../apps/api/src/lib/user-sync.js';
import { initEphemerisProvider } from '../apps/api/src/lib/ephemeris.js';
const crypto = getApiEncryption();

async function runUserRectification() {
    console.log('🚀 INITIALIZING USER BIRTH TIME RECTIFICATION...');

    await initEphemerisProvider();

    const clerkId = 'clerk_user_rectification_run';
    let internalUserId: string;

    try {
        internalUserId = await syncUser(clerkId);
    } catch (e) {
        internalUserId = crypto.randomUUID();
        await db.insert(users).values({
            id: internalUserId,
            clerkId: clerkId,
            email: 'user_rectify@example.com',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }).onConflictDoNothing();
    }

    // Birth Data: 16th June 1999, 9 AM to 11 AM
    const birthData = {
        fullName: 'User Rectification Case',
        dateOfBirth: '1999-06-16',
        tentativeTime: '10:00:00',
        latitude: 26.6035,
        longitude: 75.9436,
        timezone: '5.5',
        gender: 'male',
        birthPlace: 'Chaksu, Rajasthan'
    };

    const lifeEvents = [
        { id: '1', category: 'education', eventType: 'admission', eventDate: '2003-06-15', datePrecision: 'approx_month', description: 'Admission in 1st class', importance: 'medium' },
        { id: '2', category: 'relocation', eventType: 'shift', eventDate: '2006-07-01', datePrecision: 'approx_month', description: 'Shifted to Jaipur City', importance: 'high' },
        { id: '3', category: 'house', eventType: 'purchase', eventDate: '2006-10-15', datePrecision: 'approx_month', description: 'Father bought house & shifted in Jaipur', importance: 'critical' },
        { id: '4', category: 'health', eventType: 'surgery', eventDate: '2011-12-15', datePrecision: 'approx_month', description: 'Surgery of appendicitis', importance: 'high' },
        { id: '5', category: 'education', eventType: 'achievement', eventDate: '2013-06-06', eventTime: '16:00:00', datePrecision: 'exact_date', description: '10th Result (91.50%), highest in class', importance: 'high' },
        { id: '6', category: 'family', eventType: 'marriage', eventDate: '2014-04-15', datePrecision: 'approx_month', description: 'Older sister married', importance: 'high' },
        { id: '7', category: 'education', eventType: 'achievement', eventDate: '2015-05-22', datePrecision: 'exact_date', description: '12th Result (93.60% PCM)', importance: 'high' },
        { id: '8', category: 'education', eventType: 'achievement', eventDate: '2015-07-07', datePrecision: 'exact_date', description: 'JEE Mains Result (AIR 5672)', importance: 'high' },
        { id: '9', category: 'education', eventType: 'admission', eventDate: '2015-07-20', datePrecision: 'approx_month', description: 'Joined NIT Jaipur (Electrical Engineering)', importance: 'critical' },
        { id: '10', category: 'health', eventType: 'accident', eventDate: '2018-05-09', eventTime: '12:15:00', datePrecision: 'exact_date', description: 'Heavy accident, head/leg/eye damaged, 5 days ICU', importance: 'critical' },
        { id: '11', category: 'career', eventType: 'job_offer', eventDate: '2018-10-01', datePrecision: 'exact_date', description: 'Placed in Maruti Suzuki', importance: 'high' },
        { id: '12', category: 'travel', eventType: 'visit', eventDate: '2019-05-20', datePrecision: 'approx_month', description: 'First flight travel, Mumbai visit for BARC interview', importance: 'medium' },
        { id: '13', category: 'career', eventType: 'income', eventDate: '2019-06-07', datePrecision: 'exact_date', description: 'First freelance salary payment', importance: 'medium' },
        { id: '14', category: 'career', eventType: 'exit', eventDate: '2019-07-05', datePrecision: 'approx_month', description: 'Declined Maruti job on phone', importance: 'high' },
        { id: '15', category: 'education', eventType: 'achievement', eventDate: '2021-03-19', datePrecision: 'exact_date', description: 'GATE Result (AIR 377)', importance: 'high' },
        { id: '16', category: 'education', eventType: 'admission', eventDate: '2021-07-13', datePrecision: 'exact_date', description: 'Joined IIT Delhi for Masters', importance: 'critical' },
        { id: '17', category: 'career', eventType: 'job_offer', eventDate: '2021-11-14', eventTime: '20:00:00', datePrecision: 'exact_date', description: 'Selected in IOCL as Grade A Officer', importance: 'critical' },
        { id: '18', category: 'career', eventType: 'joining', eventDate: '2021-12-13', datePrecision: 'exact_date', description: 'Joined IOCL (Gujarat Refinery)', importance: 'critical' },
        { id: '19', category: 'career', eventType: 'job_offer', eventDate: '2022-02-25', datePrecision: 'exact_date', description: 'Selected in SSC JEn', importance: 'medium' },
        { id: '20', category: 'health', eventType: 'psychology', eventDate: '2022-06-15', datePrecision: 'approx_month', description: 'Anxiety and depression due to job', importance: 'medium' },
        { id: '21', category: 'career', eventType: 'promotion', eventDate: '2025-03-28', datePrecision: 'exact_date', description: 'Promotion at workplace', importance: 'high' },
        { id: '22', category: 'asset', eventType: 'purchase', eventDate: '2025-11-17', datePrecision: 'exact_date', description: 'Bought old car', importance: 'medium' },
        { id: '23', category: 'relationship', eventType: 'breakup', eventDate: '2025-12-15', datePrecision: 'approx_month', description: 'Heavy breakup after 1 year talking', importance: 'medium' }
    ];


    const offsetConfig = {
        preset: 'custom',
        customMinutes: 60, // ± 60 Minutes to cover 9 AM to 11 AM
        description: '9 AM to 11 AM Window'
    };

    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    console.log(`📡 Creating Session: ${sessionId}`);

    await executeWithRetry(() =>
        db.insert(sessions).values({
            id: sessionId,
            userId: internalUserId,
            clerkId: clerkId,
            fullName: crypto.encrypt(birthData.fullName, internalUserId),
            dateOfBirth: crypto.encrypt(birthData.dateOfBirth, internalUserId),
            tentativeTime: crypto.encrypt(birthData.tentativeTime, internalUserId),
            birthPlace: crypto.encrypt(birthData.birthPlace, internalUserId),
            latitude: birthData.latitude,
            longitude: birthData.longitude,
            timezone: birthData.timezone,
            gender: birthData.gender,
            lifeEvents: crypto.encrypt(JSON.stringify(lifeEvents), internalUserId),
            offsetConfig: crypto.encrypt(JSON.stringify(offsetConfig), internalUserId),
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

    console.log(`\n\n🎯 USER RECTIFICATION STARTED!`);
    console.log(`Session ID: ${sessionId}`);
    console.log(`Monitor here: http://localhost:3000/rectify/${sessionId}`);
    console.log(`Tail logs for progress...`);
}

runUserRectification().catch(err => {
    console.error('💥 FATAL ERROR IN USER RECTIFICATION:', err);
    process.exit(1);
});
