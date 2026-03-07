import fetch from 'node-fetch';
import crypto from 'node:crypto';
import { TEST_PROFILES } from '../lib/btr/__tests__/dataset/test-profiles.js';

const API_URL = 'http://localhost:3001';

async function triggerModiAnalysis() {
    const modiProfile = TEST_PROFILES.find(p => p.fullName === 'Narendra Modi');
    if (!modiProfile) {
        console.error('❌ Narendra Modi profile not found in test-profiles.ts');
        return;
    }

    console.log('🚀 Triggering Narendra Modi Analysis...');
    console.log(`📌 Profile: ${modiProfile.fullName}`);
    console.log(`🎯 Searching around: 10:50:00 (± 30 min)`);

    try {
        const response = await fetch(`${API_URL}/api/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-test-bypass-auth': 'super-secret-test-key'
            },
            body: JSON.stringify({
                birthData: {
                    fullName: modiProfile.fullName,
                    dateOfBirth: modiProfile.dateOfBirth,
                    tentativeTime: '10:50:00',
                    latitude: modiProfile.latitude,
                    longitude: modiProfile.longitude,
                    timezone: modiProfile.timezone,
                    birthPlace: 'Vadnagar, Gujarat',
                    gender: 'male',
                },
                lifeEvents: modiProfile.lifeEvents.map(event => ({
                    ...event,
                    id: crypto.randomUUID()
                })),
                forensicTraits: modiProfile.forensicTraits,
                offsetConfig: {
                    preset: '30min',
                    minutes: 30,
                    description: 'Custom ± 30 min offset'
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
        console.log(`🌐 Debug URL: http://localhost:3000/rectify/${sessionId}`);
        console.log('----------------------------------------------------');

    } catch (error) {
        console.error('❌ Failed to trigger analysis:', error);
    }
}

triggerModiAnalysis();
