import crypto from 'node:crypto';

/**
 * Mahatma Gandhi Test Profile
 * Birth: October 2, 1869, 7:11 AM
 * Location: Porbandar, Gujarat, India
 * 
 * Historical records confirm this birth time from multiple sources:
 * - Family records
 * - Astrological databases  
 * - Biographical accounts
 */
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
        { date: '1883-05-01', eventType: 'marriage', description: 'Marriage to Kasturba Makhanji (child marriage, age 13)', importance: 'high' },
        { date: '1885-01-01', eventType: 'family', description: 'First child Harilal born', importance: 'medium' },
        { date: '1888-09-01', eventType: 'education', description: 'Departs for London to study law (Inner Temple)', importance: 'high' },
        { date: '1891-06-01', eventType: 'education', description: 'Returns to India as barrister', importance: 'high' },
        { date: '1893-04-01', eventType: 'career', description: 'Leaves for South Africa (Dada Abdullah & Co.)', importance: 'critical' },
        { date: '1893-05-01', eventType: 'crisis', description: 'Thrown off train at Pietermaritzburg (racial discrimination)', importance: 'critical' },
        { date: '1894-01-01', eventType: 'career', description: 'Founds Natal Indian Congress', importance: 'high' },
        { date: '1897-01-01', eventType: 'crisis', description: 'Attacked by mob in Durban (nearly lynched)', importance: 'high' },
        { date: '1899-01-01', eventType: 'career', description: 'Organizes Indian Ambulance Corps (Boer War service)', importance: 'medium' },
        { date: '1904-01-01', eventType: 'spiritual', description: 'Establishes Phoenix Settlement (communal living)', importance: 'high' },
        { date: '1906-09-01', eventType: 'spiritual', description: 'Takes Brahmacharya vow (celibacy)', importance: 'critical' },
        { date: '1906-09-11', eventType: 'career', description: 'First Satyagraha campaign begins (Transvaal)', importance: 'critical' },
        { date: '1908-01-01', eventType: 'crisis', description: 'First imprisonment (Johannesburg jail)', importance: 'high' },
        { date: '1909-01-01', eventType: 'career', description: 'Writes Hind Swaraj (Indian Home Rule)', importance: 'high' },
        { date: '1913-01-01', eventType: 'career', description: 'Great March (Transvaal) - 2,000+ Indians strike', importance: 'critical' },
        { date: '1914-01-01', eventType: 'career', description: 'Returns to India permanently from South Africa', importance: 'critical' },
        { date: '1915-01-01', eventType: 'spiritual', description: 'Establishes Sabarmati Ashram (Ahmadabad)', importance: 'high' },
        { date: '1917-01-01', eventType: 'career', description: 'Champaran Satyagraha (first major success in India)', importance: 'critical' },
        { date: '1918-01-01', eventType: 'career', description: 'Ahmedabad Mill Strike (first hunger fast)', importance: 'high' },
        { date: '1919-04-13', eventType: 'crisis', description: 'Jallianwala Bagh Massacre (Amritsar)', importance: 'critical' },
        { date: '1920-09-01', eventType: 'career', description: 'Launches Non-Cooperation Movement', importance: 'critical' },
        { date: '1922-03-01', eventType: 'crisis', description: 'Arrested for sedition (6 years imprisonment)', importance: 'high' },
        { date: '1924-02-01', eventType: 'health', description: 'Released from prison (appendicitis surgery)', importance: 'high' },
        { date: '1930-03-12', eventType: 'career', description: 'Dandi March begins (24-day, 241-mile walk)', importance: 'critical' },
        { date: '1930-04-06', eventType: 'career', description: 'Breaks salt laws at Dandi (civil disobedience)', importance: 'critical' },
        { date: '1932-09-01', eventType: 'crisis', description: 'Poona Pact - fast unto death for Dalit rights', importance: 'critical' },
        { date: '1932-09-20', eventType: 'crisis', description: 'Released from Yerwada prison', importance: 'high' },
        { date: '1933-05-08', eventType: 'spiritual', description: 'Begins 21-day fast (self-purification)', importance: 'high' },
        { date: '1934-01-01', eventType: 'career', description: 'Retires from Congress Party leadership', importance: 'high' },
        { date: '1942-08-08', eventType: 'career', description: 'Quit India Movement launched ("Do or Die")', importance: 'critical' },
        { date: '1942-08-09', eventType: 'crisis', description: 'Arrested (Quit India) - Aga Khan Palace prison', importance: 'high' },
        { date: '1944-05-06', eventType: 'family', description: 'Wife Kasturba dies (imprisonment)', importance: 'high' },
        { date: '1944-05-01', eventType: 'crisis', description: 'Released from Aga Khan Palace', importance: 'high' },
        { date: '1946-08-16', eventType: 'crisis', description: 'Calcutta riots (Direct Action Day)', importance: 'critical' },
        { date: '1947-06-01', eventType: 'crisis', description: 'Mountbatten Plan announced (Partition)', importance: 'critical' },
        { date: '1947-08-15', eventType: 'career', description: 'Indian Independence achieved', importance: 'critical' },
        { date: '1947-08-15', eventType: 'crisis', description: 'Partition violence begins (mass migration)', importance: 'critical' },
        { date: '1947-09-01', eventType: 'crisis', description: 'Delhi violence - walks through riot areas', importance: 'high' },
        { date: '1948-01-12', eventType: 'spiritual', description: 'Begins final fast (Delhi) - communal harmony', importance: 'high' },
        { date: '1948-01-18', eventType: 'spiritual', description: 'Breaks fast (peace restored in Delhi)', importance: 'high' },
        { date: '1948-01-30', eventType: 'death', description: 'Assassinated by Nathuram Godse ( Birla House)', importance: 'critical' }
    ],
    forensicTraits: {
        physical: {
            complexion: 'medium-dark',
            bodyFrame: 'slender-lean',
            heightEstimate: 'average-to-short',
            distinctiveFeatures: 'bald-head-later-years, round-spectacles, dhoti-clad, walking-stick',
            vitality: 'frail-but-resilient, survived multiple fasts'
        },
        temperamental: {
            speechPattern: 'soft-spoken, measured, calm',
            socialOrientation: 'servant-leader, mass-mobilizer, community-first',
            emotionalExpression: 'compassionate, non-violent, forgiving',
            stressResponse: 'fasting, prayer, constructive-program',
            decisionMaking: 'consensus-seeking, spiritually-guided, patient'
        },
        psychographic: {
            coreValues: 'truth-satya, non-violence-ahimsa, self-discipline-swadeshi',
            lifePhilosophy: 'simple-living-high-thinking, trusteeship, sarvodaya',
            spiritualOrientation: 'deeply-devout-hindu, universalist, ram-nam',
            leadershipStyle: 'moral-authority, servant-leader, non-cooperation',
            legacyFocus: 'social-justice, communal-harmony, rural-empowerment'
        }
    }
};

async function triggerGandhiAnalysis() {
    console.log('🕊️  Triggering Mahatma Gandhi Analysis...');
    console.log(`📌 Profile: ${GANDHI_PROFILE.fullName}`);
    console.log(`🎯 Searching around: 07:11:00 (± 30 min)`);
    console.log(`📊 Total Events: ${GANDHI_PROFILE.lifeEvents.length} high-quality events`);
    console.log('----------------------------------------------------');

    const sessionId = `gandhi_test_${Date.now()}`;
    const payload = {
        birthData: {
            fullName: GANDHI_PROFILE.fullName,
            dateOfBirth: GANDHI_PROFILE.dateOfBirth,
            tentativeTime: GANDHI_PROFILE.tentativeTime,
            latitude: GANDHI_PROFILE.latitude,
            longitude: GANDHI_PROFILE.longitude,
            timezone: GANDHI_PROFILE.timezone,
            birthPlace: GANDHI_PROFILE.birthPlace,
            gender: GANDHI_PROFILE.gender,
        },
        lifeEvents: GANDHI_PROFILE.lifeEvents.map(event => ({
            ...event,
            id: crypto.randomUUID()
        })),
        forensicTraits: GANDHI_PROFILE.forensicTraits,
        offsetConfig: {
            preset: '30min',
            minutes: 30,
            description: 'Gandhi ± 30 min offset - historical records confirm 7:11 AM'
        }
    };

    console.log('📋 Payload prepared:');
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Birth: ${payload.birthData.dateOfBirth} ${payload.birthData.tentativeTime}`);
    console.log(`   Events: ${payload.lifeEvents.length}`);
    console.log('');
    console.log('💾 To execute analysis, use one of these methods:');
    console.log('');
    console.log('Method 1: Direct function call (if in codebase)');
    console.log('   Import and call secondsPrecisionBTR() with above payload');
    console.log('');
    console.log('Method 2: Insert via database');
    console.log(`   Session ID: ${sessionId}`);
    console.log('   Use the SQL generated by: npm run test:btr -- --profile=gandhi');
    console.log('');
    console.log('Method 3: Use dashboard (recommended for now)');
    console.log('   Currently dashboard is hardcoded for Modi');
    console.log('   Modify: apps/web/app/rectify/page.tsx to use Gandhi data');
    console.log('');
    console.log('✅ Profile data ready for testing!');
    console.log('----------------------------------------------------');
    console.log('Key Test Scenarios for Gandhi:');
    console.log('1. Spiritual vs Career balance (D60 deity = Rakshasa/Deva)');
    console.log('2. Multiple imprisonment periods (Dasha timing)');
    console.log('3. Fasts and health crises (6th/8th house)');
    console.log('4. Partition trauma 1947 (crisis events)');
    console.log('5. Assassination Jan 30, 1948 (life end timing)');
    console.log('----------------------------------------------------');

    return { sessionId, payload };
}

triggerGandhiAnalysis();