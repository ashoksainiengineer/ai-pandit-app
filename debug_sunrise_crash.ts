
import { calculateSunrise, initSwissEph } from './backend/src/lib/ephemeris';

async function test() {
    console.log("Starting Sunrise Crash Test...");
    // await initSwissEph(); // Initialize if needed, though calculateSunrise might purely be algorithmic or use it.

    // Invalid Date
    const badDob = "1999-13-45"; // Invalid month/day
    const lat = 26.6;
    const lon = 75.9;
    const tz = 5.5;

    try {
        console.log(`Testing with invalid date: ${badDob}`);
        await calculateSunrise(badDob, lat, lon, tz);
        console.error("❌ Should have thrown an error but didn't!");
    } catch (e) {
        if (e instanceof Error && e.message.includes("Invalid date provided")) {
            console.log("✅ Caught expected error:", e.message);
        } else {
            console.log("⚠️ Caught unexpected error:", e);
        }
    }

    // Valid Date to ensure regression
    try {
        const goodDob = "1999-06-16";
        console.log(`Testing with VALID date: ${goodDob}`);
        await calculateSunrise(goodDob, lat, lon, tz);
        console.log("✅ Valid date passed!");
    } catch (e) {
        console.error("❌ Valid date failed:", e);
    }
}

test();
