import crypto from 'node:crypto';

const API_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * Gandhi BTR Analysis Trigger
 * Window: 07:11:00 ± 30 minutes
 */
async function triggerGandhiAnalysis() {
    console.log('🕊️  Triggering Mahatma Gandhi BTR Analysis...');
    console.log('----------------------------------------------------');

    const gandhiProfile = {
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
            { id: crypto.randomUUID(), date: '1876-01-01', eventType: 'family', description: 'Father Karamchand Gandhi dies', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1883-05-01', eventType: 'marriage', description: 'Marriage to Kasturba Makhanji', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1888-09-01', eventType: 'education', description: 'Departs for London to study law', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1891-06-01', eventType: 'education', description: 'Returns to India as barrister', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1893-04-01', eventType: 'career', description: 'Leaves for South Africa', importance: 'critical', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1893-05-01', eventType: 'crisis', description: 'Thrown off train at Pietermaritzburg', importance: 'critical', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1894-01-01', eventType: 'career', description: 'Founds Natal Indian Congress', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1897-01-01', eventType: 'crisis', description: 'Attacked by mob in Durban', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1904-01-01', eventType: 'spiritual', description: 'Establishes Phoenix Settlement', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1906-09-01', eventType: 'spiritual', description: 'Takes Brahmacharya vow', importance: 'critical', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1906-09-11', eventType: 'career', description: 'First Satyagraha campaign begins', importance: 'critical', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1908-01-01', eventType: 'crisis', description: 'First imprisonment', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1909-01-01', eventType: 'career', description: 'Writes Hind Swaraj', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1913-01-01', eventType: 'career', description: 'Great March (Transvaal)', importance: 'critical', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1914-01-01', eventType: 'career', description: 'Returns to India permanently', importance: 'critical', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1915-01-01', eventType: 'spiritual', description: 'Establishes Sabarmati Ashram', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1917-01-01', eventType: 'career', description: 'Champaran Satyagraha', importance: 'critical', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1918-01-01', eventType: 'career', description: 'Ahmedabad Mill Strike', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1919-04-13', eventType: 'crisis', description: 'Jallianwala Bagh Massacre', importance: 'critical', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1920-09-01', eventType: 'career', description: 'Launches Non-Cooperation Movement', importance: 'critical', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1922-03-01', eventType: 'crisis', description: 'Arrested for sedition', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1924-02-01', eventType: 'health', description: 'Released from prison', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1930-03-12', eventType: 'career', description: 'Dandi March begins', importance: 'critical', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1930-04-06', eventType: 'career', description: 'Breaks salt laws at Dandi', importance: 'critical', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1932-09-01', eventType: 'crisis', description: 'Poona Pact - fast unto death', importance: 'critical', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1934-01-01', eventType: 'career', description: 'Retires from Congress Party', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1942-08-08', eventType: 'career', description: 'Quit India Movement launched', importance: 'critical', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1942-08-09', eventType: 'crisis', description: 'Arrested (Quit India)', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1944-05-06', eventType: 'family', description: 'Wife Kasturba dies', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1946-08-16', eventType: 'crisis', description: 'Calcutta riots', importance: 'critical', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1947-06-01', eventType: 'crisis', description: 'Mountbatten Plan announced', importance: 'critical', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1947-08-15', eventType: 'career', description: 'Indian Independence achieved', importance: 'critical', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1947-09-01', eventType: 'crisis', description: 'Delhi violence', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1948-01-12', eventType: 'spiritual', description: 'Begins final fast', importance: 'high', datePrecision: 'exact_date' },
            { id: crypto.randomUUID(), date: '1948-01-30', eventType: 'death', description: 'Assassinated by Nathuram Godse', importance: 'critical', datePrecision: 'exact_date' }
        ],
        forensicTraits: {
            physical: {
                complexion: 'medium-dark',
                bodyFrame: 'slender-lean',
                heightEstimate: 'average-to-short',
                distinctiveFeatures: 'bald-head, round-spectacles, dhoti-clad',
                vitality: 'frail-but-resilient'
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

    console.log(`📌 Profile: ${gandhiProfile.fullName}`);
    console.log(`🎯 Window: 07:11:00 ± 30 minutes`);
    console.log(`📊 Events: ${gandhiProfile.lifeEvents.length} documented events`);
    console.log(`🌐 API: ${API_URL}`);
    console.log('----------------------------------------------------');

    try {
        const response = await fetch(`${API_URL}/api/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-test-bypass-auth': 'super-secret-test-key'
            },
            body: JSON.stringify({
                birthData: {
                    fullName: gandhiProfile.fullName,
                    dateOfBirth: gandhiProfile.dateOfBirth,
                    tentativeTime: gandhiProfile.tentativeTime,
                    latitude: gandhiProfile.latitude,
                    longitude: gandhiProfile.longitude,
                    timezone: gandhiProfile.timezone,
                    birthPlace: gandhiProfile.birthPlace,
                    gender: gandhiProfile.gender,
                },
                lifeEvents: gandhiProfile.lifeEvents,
                forensicTraits: gandhiProfile.forensicTraits,
                offsetConfig: {
                    preset: '30min',
                    minutes: 30,
                    description: 'Gandhi ± 30 min - historical 7:11 AM'
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error ${response.status}: ${error}`);
        }

        const result = await response.json();
        const sessionId = result.data?.sessionId || result.sessionId;

        console.log('✅ Analysis Triggered Successfully!');
        console.log('----------------------------------------------------');
        console.log(`📡 Session ID: ${sessionId}`);
        console.log(`🌐 Monitor: http://localhost:3000/rectify/${sessionId}`);
        console.log('----------------------------------------------------');
        console.log('Expected Timeline:');
        console.log('- Stage 1 (Grid): ~5-10 minutes');
        console.log('- Stage 2 (Tournament): ~10-15 minutes');
        console.log('- Stage 3-6 (Precision): ~5-10 minutes');
        console.log('- Total: ~20-35 minutes');
        console.log('----------------------------------------------------');

    } catch (error) {
        console.error('❌ Failed to trigger analysis:', error);
        process.exit(1);
    }
}

triggerGandhiAnalysis();
