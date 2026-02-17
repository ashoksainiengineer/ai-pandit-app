
import { buildCandidateDataPackage } from './backend/src/lib/btr/data-package-builder';
import { calculateEphemeris, initSwissEph } from './backend/src/lib/ephemeris';

async function test() {
    console.log("Starting Full Data Package Test (with WASM)...");
    await initSwissEph();
    console.log("WASM Initialized.");

    // User Data
    const dob = "1999-06-16";
    const time = "10:14:00";
    const offsetMinutes = 15;
    const lat = 26.6059831;
    const lon = 75.9430338;
    const tz = 5.5;

    const input = {
        sessionId: "debug-session",
        dateOfBirth: dob,
        tentativeTime: time,
        latitude: lat,
        longitude: lon,
        timezone: tz,
        offsetConfig: { preset: "custom", customMinutes: 15 },
        lifeEvents: [], // Empty as seen in DB
        forensicTraits: {},
        abortSignal: new AbortController().signal
    };

    try {
        console.log("Building Data Package...");
        // This exercises all sub-calculations: Vargas, Ashtakavarga, Shadbala, etc.
        const pkg = await buildCandidateDataPackage(time, offsetMinutes, input as any, {
            includeFullData: true,
            dashaDepth: 3
        });

        console.log("✅ Data Package Built Successfully!");
        console.log("Sun Sign:", pkg.planets.sun.sign);
        console.log("Ascendant:", pkg.ascendant.sign);
        console.log("Vimshottari Depth:", pkg.vimshottariDasha.length);

    } catch (e) {
        console.error("❌ Crashed in buildCandidateDataPackage:", e);
        if (e instanceof Error) {
            console.error(e.stack);
        }
    }
}

test();
