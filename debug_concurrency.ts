
import { buildCandidateDataPackage } from './backend/src/lib/btr/data-package-builder';
import { calculateEphemeris } from './backend/src/lib/ephemeris';

async function test() {
    console.log("Starting Concurrency Stress Test...");

    const dob = "1999-06-16";
    // Generate 50 fake times
    const times = [];
    for (let i = 0; i < 50; i++) {
        const h = Math.floor(i / 2) % 24;
        const m = (i * 15) % 60;
        times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
    }

    const input = {
        sessionId: "debug-session-concurrency",
        dateOfBirth: dob,
        latitude: 26.6,
        longitude: 75.9,
        timezone: 5.5,
        lifeEvents: [],
        forensicTraits: {},
        tentativeTime: "12:00:00",
        offsetConfig: { preset: "custom", customMinutes: 120 }
    };

    try {
        console.log(`Running ${times.length} parallel calculations...`);

        await Promise.all(times.map(async (time, idx) => {
            // console.log(`Starting ${time} (${idx})`);
            await buildCandidateDataPackage(time, 0, input as any, {
                includeFullData: true,
                dashaDepth: 3
            });
            // console.log(`Finished ${time} (${idx})`);
        }));

        console.log("✅ Concurrency Test Passed!");

    } catch (e) {
        console.error("❌ Crashed in Concurrency Test:", e);
    }
}

test();
