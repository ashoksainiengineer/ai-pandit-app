import { MODI_BLINDED_PROFILE } from '../lib/btr/__tests__/dataset/modi-blinded-profile.js';

const API_URL = 'http://localhost:3001';

async function triggerBlindedTest() {
    console.log('🚀 Triggering Real Testing on Local Server...');
    console.log(`📌 Profile: ${MODI_BLINDED_PROFILE.fullName}`);
    console.log(`🎯 Searching around: ${MODI_BLINDED_PROFILE.tentativeTime} (${MODI_BLINDED_PROFILE.offsetConfig.description})`);

    try {
        const response = await fetch(`${API_URL}/api/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Using the local DB authentication bypass!
                'x-test-bypass-auth': 'super-secret-test-key'
            },
            body: JSON.stringify({
                birthData: {
                    fullName: MODI_BLINDED_PROFILE.fullName,
                    dateOfBirth: MODI_BLINDED_PROFILE.dateOfBirth,
                    tentativeTime: '11:00:00',
                    latitude: MODI_BLINDED_PROFILE.latitude,
                    longitude: MODI_BLINDED_PROFILE.longitude,
                    timezone: MODI_BLINDED_PROFILE.timezone,
                    birthPlace: 'Unknown',
                    gender: 'male',
                },
                lifeEvents: MODI_BLINDED_PROFILE.lifeEvents,
                offsetConfig: MODI_BLINDED_PROFILE.offsetConfig
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error ${response.status}: ${error}`);
        }

        const result = await response.json() as any;
        const sessionId = result.data?.sessionId || result.sessionId;

        console.log('✅ Analysis Triggered Successfully!');
        console.log('----------------------------------------------------');
        console.log(`📡 Session ID: ${sessionId}`);
        console.log(`🌐 Debug URL: http://localhost:3000/debug-analysis/${sessionId}`);
        console.log('----------------------------------------------------');
        console.log('You can now open the Frontend Debug URL in your browser to watch the actual React Analysis UI process the blinded data in real time!');

    } catch (error) {
        console.error('❌ Failed to trigger test:', error);
    }
}

triggerBlindedTest();
