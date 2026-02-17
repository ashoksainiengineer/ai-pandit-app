
import { findAstrologicalBoundaries, initSwissEph } from './backend/src/lib/advanced-btr-methods'; // Adjust path if needed, but since I'm running from root, I probably need to fix imports in a robust way or use tsx
import { calculateEphemeris } from './backend/src/lib/ephemeris';

// Mock initSwissEph to avoid actual WASM loading if not needed, or just let it run
// Actually, let's just run it.

async function test() {
    console.log("Starting Boundary Test...");

    // User Data
    const dob = "1999-06-16";
    const time = "10:14:00";
    const lat = 26.6059831;
    const lon = 75.9430338;
    const tz = 5.5;
    const offsetMinutes = 15; // From debug_encryption.ts

    try {
        const boundaries = await findAstrologicalBoundaries(dob, time, offsetMinutes, lat, lon, tz);
        console.log(`✅ Found ${boundaries.length} boundaries`);
        boundaries.forEach(b => console.log(`  ${b.type}: ${b.from} -> ${b.to} at ${b.time}`));
    } catch (e) {
        console.error("❌ Crashed in findAstrologicalBoundaries:", e);
    }
}

test();
