
import { calculateEphemeris, initSwissEph } from './backend/src/lib/ephemeris';

async function test() {
    console.log("Initializing Swiss Eph...");
    await initSwissEph();
    console.log("Initialized.");

    const dob = "1999-06-16";
    const time = "10:14:00";
    const lat = 26.6059831;
    const lon = 75.9430338;
    const tz = 5.5; // Number

    console.log("Calculating Eph with:", { dob, time, lat, lon, tz });

    try {
        const eph = await calculateEphemeris(dob, time, lat, lon, tz);
        console.log("✅ Success!");
        console.log("Ascendant:", eph.ascendant.sign, eph.ascendant.degree);
    } catch (e) {
        console.error("❌ Failed:", e);
    }

    console.log("Calculating Eph with TZ as string '5.5'...");
    try {
        const eph2 = await calculateEphemeris(dob, time, lat, lon, "5.5");
        console.log("✅ Success (String TZ)!");
    } catch (e) {
        console.error("❌ Failed (String TZ):", e);
    }
}

test();
