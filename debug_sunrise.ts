
import { calculateSunrise } from './backend/src/lib/ephemeris';

async function test() {
    console.log("Starting Sunrise Test...");

    // User Data
    const dob = "1999-06-16";
    const lat = 26.6059831;
    const lon = 75.9430338;
    const tz = 5.5;

    try {
        console.log(`Calculating sunrise for ${dob} at ${lat}, ${lon} (TZ: ${tz})...`);
        const sunrise = await calculateSunrise(dob, lat, lon, tz);
        console.log("✅ Sunrise calculated:", sunrise);
        console.log("Sunrise ISO:", sunrise.toISOString());

        if (isNaN(sunrise.getTime())) {
            console.error("❌ Invalid Date returned!");
        }

    } catch (e) {
        console.error("❌ Crashed in calculateSunrise:", e);
    }
}

test();
