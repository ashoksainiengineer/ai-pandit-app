import { db } from '@ai-pandit/db';
import { sessions, jobs } from '@ai-pandit/db/schema';
import crypto from 'node:crypto';

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
        { id: crypto.randomUUID(), date: '1869-10-02', eventType: 'birth', description: 'Birth at Porbandar', importance: 'critical', datePrecision: 'exact_date' },
        { id: crypto.randomUUID(), date: '1883-05-01', eventType: 'marriage', description: 'Marriage to Kasturba', importance: 'high', datePrecision: 'exact_date' },
        { id: crypto.randomUUID(), date: '1888-09-01', eventType: 'education', description: 'Departs for London', importance: 'high', datePrecision: 'exact_date' },
        { id: crypto.randomUUID(), date: '1891-06-01', eventType: 'education', description: 'Returns as barrister', importance: 'high', datePrecision: 'exact_date' },
        { id: crypto.randomUUID(), date: '1893-05-01', eventType: 'crisis', description: 'Thrown off train', importance: 'critical', datePrecision: 'exact_date' },
        { id: crypto.randomUUID(), date: '1906-09-01', eventType: 'spiritual', description: 'Brahmacharya vow', importance: 'critical', datePrecision: 'exact_date' },
        { id: crypto.randomUUID(), date: '1908-01-01', eventType: 'crisis', description: 'First imprisonment', importance: 'high', datePrecision: 'exact_date' },
        { id: crypto.randomUUID(), date: '1913-01-01', eventType: 'career', description: 'Great March', importance: 'critical', datePrecision: 'exact_date' },
        { id: crypto.randomUUID(), date: '1917-01-01', eventType: 'career', description: 'Champaran Satyagraha', importance: 'critical', datePrecision: 'exact_date' },
        { id: crypto.randomUUID(), date: '1930-03-12', eventType: 'career', description: 'Dandi March', importance: 'critical', datePrecision: 'exact_date' },
        { id: crypto.randomUUID(), date: '1932-09-01', eventType: 'crisis', description: 'Poona Pact fast', importance: 'critical', datePrecision: 'exact_date' },
        { id: crypto.randomUUID(), date: '1942-08-08', eventType: 'career', description: 'Quit India', importance: 'critical', datePrecision: 'exact_date' },
        { id: crypto.randomUUID(), date: '1947-08-15', eventType: 'career', description: 'Independence', importance: 'critical', datePrecision: 'exact_date' },
        { id: crypto.randomUUID(), date: '1948-01-30', eventType: 'death', description: 'Assassination', importance: 'critical', datePrecision: 'exact_date' }
    ],
    forensicTraits: {
        physical: { complexion: 'medium-dark', bodyFrame: 'slender-lean', heightEstimate: 'average-to-short', distinctiveFeatures: 'bald-head, round-spectacles, dhoti-clad', vitality: 'frail-but-resilient' },
        temperamental: { speechPattern: 'soft-spoken, measured, calm', socialOrientation: 'servant-leader, mass-mobilizer', emotionalExpression: 'compassionate, non-violent, forgiving', stressResponse: 'fasting, prayer, constructive-program', decisionMaking: 'consensus-seeking, spiritually-guided' },
        psychographic: { coreValues: 'truth-satya, non-violence-ahimsa, self-discipline', lifePhilosophy: 'simple-living-high-thinking, trusteeship', spiritualOrientation: 'deeply-devout-hindu, universalist', leadershipStyle: 'moral-authority, servant-leader', legacyFocus: 'social-justice, communal-harmony' }
    }
};

async function queueGandhiAnalysis() {
    console.log('🕊️  Queueing Mahatma Gandhi BTR Analysis...');
    console.log('----------------------------------------------------');
    
    const sessionId = 'gandhi_local_' + Date.now();
    const userId = 'research_gandhi';
    
    try {
        // Insert session
        await db.insert(sessions).values({
            id: sessionId,
            userId: userId,
            clerkId: userId,
            fullName: GANDHI_PROFILE.fullName,
            dateOfBirth: GANDHI_PROFILE.dateOfBirth,
            tentativeTime: GANDHI_PROFILE.tentativeTime,
            birthPlace: GANDHI_PROFILE.birthPlace,
            latitude: GANDHI_PROFILE.latitude,
            longitude: GANDHI_PROFILE.longitude,
            timezone: GANDHI_PROFILE.timezone,
            gender: GANDHI_PROFILE.gender,
            forensicTraits: JSON.stringify(GANDHI_PROFILE.forensicTraits),
            lifeEvents: JSON.stringify(GANDHI_PROFILE.lifeEvents),
            status: 'pending',
            isEncrypted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            submittedAt: new Date()
        });
        
        console.log('✅ Session created:', sessionId);
        console.log(`🎯 Window: 07:11:00 ± 30 minutes`);
        console.log(`📊 Events: ${GANDHI_PROFILE.lifeEvents.length}`);
        console.log('----------------------------------------------------');
        console.log('🚀 Analysis will start automatically');
        console.log(`📡 Monitor: http://localhost:3000/rectify/${sessionId}`);
        console.log(`📈 API Status: http://localhost:8080/health`);
        console.log('----------------------------------------------------');
        
    } catch (error) {
        console.error('❌ Failed:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

queueGandhiAnalysis();
