/**
 * Insert Gandhi BTR job directly into database with ±30 min window
 * Run: npx tsx apps/api/src/scripts/insert-gandhi-job.ts
 */

import { db } from '@ai-pandit/db';
import { sessions, jobs } from '@ai-pandit/db/schema';
import crypto from 'node:crypto';
import { sql } from 'drizzle-orm';

const GANDHI_PROFILE = {
    fullName: 'Mohandas Karamchand Gandhi',
    dateOfBirth: '1869-10-02',
    tentativeTime: '07:11:00',
    latitude: 21.6417,
    longitude: 69.6293,
    timezone: 'Asia/Kolkata',
    birthPlace: 'Porbandar, Gujarat, India',
    gender: 'male',
    lifeEvents: [
        { date: '1869-10-02', eventType: 'birth', description: 'Birth at Porbandar', importance: 'critical' },
        { date: '1876-01-01', eventType: 'family', description: 'Father Karamchand Gandhi dies', importance: 'high' },
        { date: '1883-05-01', eventType: 'marriage', description: 'Marriage to Kasturba Makhanji', importance: 'high' },
        { date: '1888-09-01', eventType: 'education', description: 'Departs for London to study law', importance: 'high' },
        { date: '1891-06-01', eventType: 'education', description: 'Returns to India as barrister', importance: 'high' },
        { date: '1893-04-01', eventType: 'career', description: 'Leaves for South Africa', importance: 'critical' },
        { date: '1893-05-01', eventType: 'crisis', description: 'Thrown off train at Pietermaritzburg', importance: 'critical' },
        { date: '1894-01-01', eventType: 'career', description: 'Founds Natal Indian Congress', importance: 'high' },
        { date: '1897-01-01', eventType: 'crisis', description: 'Attacked by mob in Durban', importance: 'high' },
        { date: '1904-01-01', eventType: 'spiritual', description: 'Establishes Phoenix Settlement', importance: 'high' },
        { date: '1906-09-01', eventType: 'spiritual', description: 'Takes Brahmacharya vow', importance: 'critical' },
        { date: '1906-09-11', eventType: 'career', description: 'First Satyagraha campaign begins', importance: 'critical' },
        { date: '1908-01-01', eventType: 'crisis', description: 'First imprisonment', importance: 'high' },
        { date: '1909-01-01', eventType: 'career', description: 'Writes Hind Swaraj', importance: 'high' },
        { date: '1913-01-01', eventType: 'career', description: 'Great March (Transvaal)', importance: 'critical' },
        { date: '1914-01-01', eventType: 'career', description: 'Returns to India permanently', importance: 'critical' },
        { date: '1915-01-01', eventType: 'spiritual', description: 'Establishes Sabarmati Ashram', importance: 'high' },
        { date: '1917-01-01', eventType: 'career', description: 'Champaran Satyagraha', importance: 'critical' },
        { date: '1918-01-01', eventType: 'career', description: 'Ahmedabad Mill Strike', importance: 'high' },
        { date: '1919-04-13', eventType: 'crisis', description: 'Jallianwala Bagh Massacre', importance: 'critical' },
        { date: '1920-09-01', eventType: 'career', description: 'Launches Non-Cooperation Movement', importance: 'critical' },
        { date: '1922-03-01', eventType: 'crisis', description: 'Arrested for sedition', importance: 'high' },
        { date: '1924-02-01', eventType: 'health', description: 'Released from prison', importance: 'high' },
        { date: '1930-03-12', eventType: 'career', description: 'Dandi March begins', importance: 'critical' },
        { date: '1930-04-06', eventType: 'career', description: 'Breaks salt laws at Dandi', importance: 'critical' },
        { date: '1932-09-01', eventType: 'crisis', description: 'Poona Pact - fast unto death', importance: 'critical' },
        { date: '1934-01-01', eventType: 'career', description: 'Retires from Congress Party', importance: 'high' },
        { date: '1942-08-08', eventType: 'career', description: 'Quit India Movement launched', importance: 'critical' },
        { date: '1942-08-09', eventType: 'crisis', description: 'Arrested (Quit India)', importance: 'high' },
        { date: '1944-05-06', eventType: 'family', description: 'Wife Kasturba dies', importance: 'high' },
        { date: '1944-05-01', eventType: 'crisis', description: 'Released from Aga Khan Palace', importance: 'high' },
        { date: '1946-08-16', eventType: 'crisis', description: 'Calcutta riots', importance: 'critical' },
        { date: '1947-06-01', eventType: 'crisis', description: 'Mountbatten Plan announced', importance: 'critical' },
        { date: '1947-08-15', eventType: 'career', description: 'Indian Independence achieved', importance: 'critical' },
        { date: '1947-09-01', eventType: 'crisis', description: 'Delhi violence', importance: 'high' },
        { date: '1948-01-12', eventType: 'spiritual', description: 'Begins final fast', importance: 'high' },
        { date: '1948-01-30', eventType: 'death', description: 'Assassinated by Nathuram Godse', importance: 'critical' }
    ],
    forensicTraits: {
        physical: {
            complexion: 'medium-dark',
            bodyFrame: 'slender-lean',
            heightEstimate: 'average-to-short',
            distinctiveFeatures: 'bald-head, round-spectacles, dhoti-clad',
            vitality: 'frail-but-resilient, survived multiple fasts'
        },
        temperamental: {
            speechPattern: 'soft-spoken, measured, calm',
            socialOrientation: 'servant-leader, mass-mobilizer',
            emotionalExpression: 'compassionate, non-violent, forgiving',
            stressResponse: 'fasting, prayer, constructive-program',
            decisionMaking: 'consensus-seeking, spiritually-guided'
        },
        psychographic: {
            coreValues: 'truth-satya, non-violence-ahimsa, self-discipline',
            lifePhilosophy: 'simple-living-high-thinking, trusteeship',
            spiritualOrientation: 'deeply-devout-hindu, universalist',
            leadershipStyle: 'moral-authority, servant-leader',
            legacyFocus: 'social-justice, communal-harmony'
        }
    }
};

async function insertGandhiJob() {
    console.log('🕊️  Inserting Mahatma Gandhi BTR Job...');
    console.log('----------------------------------------------------');
    console.log(`📌 Profile: ${GANDHI_PROFILE.fullName}`);
    console.log(`🎯 Window: 07:11:00 ± 30 minutes`);
    console.log(`📊 Events: ${GANDHI_PROFILE.lifeEvents.length} documented events`);
    console.log('----------------------------------------------------');

    const sessionId = `gandhi_btr_${Date.now()}`;
    const jobId = crypto.randomUUID();
    const userId = 'research_gandhi';

    const birthData = {
        fullName: GANDHI_PROFILE.fullName,
        dateOfBirth: GANDHI_PROFILE.dateOfBirth,
        tentativeTime: GANDHI_PROFILE.tentativeTime,
        latitude: GANDHI_PROFILE.latitude,
        longitude: GANDHI_PROFILE.longitude,
        timezone: GANDHI_PROFILE.timezone,
        birthPlace: GANDHI_PROFILE.birthPlace,
        gender: GANDHI_PROFILE.gender,
    };

    const lifeEvents = GANDHI_PROFILE.lifeEvents.map((event: any) => ({
        ...event,
        id: crypto.randomUUID(),
        datePrecision: 'exact_date',
        eventTime: undefined
    }));

    const offsetConfig = {
        preset: '30min',
        minutes: 30,
        description: 'Gandhi ± 30 min - historical 7:11 AM birth time'
    };

    const sessionPayload = {
        birthData,
        lifeEvents,
        forensicTraits: GANDHI_PROFILE.forensicTraits,
        offsetConfig,
        sessionType: 'research',
        source: 'direct_insert'
    };

    try {
        // Insert session
        await db.insert(sessions).values({
            id: sessionId,
            userId: userId,
            status: 'pending',
            progress: 0,
            currentStage: 'init',
            birthData: sessionPayload.birthData,
            lifeEvents: sessionPayload.lifeEvents,
            forensicTraits: sessionPayload.forensicTraits,
            offsetMinutes: 30,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        console.log('✅ Session inserted:', sessionId);

        // Insert job for worker
        await db.insert(jobs).values({
            id: jobId,
            sessionId: sessionId,
            type: 'btr_analysis',
            status: 'pending',
            priority: 1,
            payload: {
                ...sessionPayload,
                sessionId,
                jobId
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            attempts: 0,
            maxAttempts: 3,
        });

        console.log('✅ Job inserted:', jobId);
        console.log('----------------------------------------------------');
        console.log('🚀 Analysis will start when worker picks up the job');
        console.log(`📊 Monitor: Check session ${sessionId}`);
        console.log('----------------------------------------------------');
        console.log('Expected behavior:');
        console.log('- Stage 1: Grid search (60 candidates: 06:41 to 07:41)');
        console.log('- Stage 2: Tournament (top candidates)');
        console.log('- Stage 3-6: Precision analysis');
        console.log('- Result: Should converge to ~07:11:00');
        console.log('----------------------------------------------------');

        return { sessionId, jobId, success: true };

    } catch (error) {
        console.error('❌ Failed to insert job:', error);
        throw error;
    } finally {
        process.exit(0);
    }
}

insertGandhiJob();
