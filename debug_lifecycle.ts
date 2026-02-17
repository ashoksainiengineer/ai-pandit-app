
import { calculateEphemeris } from './backend/src/lib/ephemeris';
import { calculateVimshottariDasha, getDashaForDate } from './backend/src/lib/vedic-astrology-engine';

async function test() {
    console.log("Starting Global Lifecycle Test...");

    // User Data
    const dob = "1999-06-16";
    const time = "10:14:00";
    const lat = 26.6059831;
    const lon = 75.9430338;
    const tz = 5.5;

    // Simulation of globalLifecycle loop
    const globalLifecycle: any[] = [];

    try {
        const birthDate = new Date(dob);
        const startYear = birthDate.getFullYear();
        const endYear = new Date().getFullYear();
        let lastSaturnSign = '';
        let lastJupiterSign = '';

        console.log(`Simulating loop from ${startYear} to ${endYear}...`);

        const baseEph = await calculateEphemeris(dob, time, lat, lon, tz);
        const baseDashas = calculateVimshottariDasha(baseEph.planets.moon.longitude, birthDate);

        for (let y = startYear; y <= endYear; y++) {
            for (let m of [1, 5, 9]) {
                const checkDateForCycle = `${y}-${String(m).padStart(2, '0')}-01`;

                // Logging to catch the exact crash date
                // console.log(`Checking: ${checkDateForCycle}`);

                // The potential crash line:
                const ephShift = await calculateEphemeris(checkDateForCycle, '12:00:00', lat, lon, tz);

                const currentSatSign = ephShift.planets.saturn.sign;
                const currentJupSign = ephShift.planets.jupiter.sign;

                if (currentSatSign !== lastSaturnSign || currentJupSign !== lastJupiterSign) {
                    const dashaCycle = getDashaForDate(baseDashas, new Date(checkDateForCycle));
                    globalLifecycle.push({
                        date: checkDateForCycle,
                        event: `TRANSIT INGRESS: Saturn in ${currentSatSign} | Jupiter in ${currentJupSign}`,
                        dasha: dashaCycle ? `${dashaCycle.mahadasha}-${dashaCycle.antardasha}` : 'N/A'
                    });
                    lastSaturnSign = currentSatSign;
                    lastJupiterSign = currentJupSign;
                }
                if (globalLifecycle.length > 50) break;
            }
            if (globalLifecycle.length > 50) break;
        }
        console.log(`✅ Success! Generated ${globalLifecycle.length} lifecycle events.`);
        console.log("Last event:", globalLifecycle[globalLifecycle.length - 1]);

    } catch (e) {
        console.error("❌ Crashed in Global Lifecycle Loop:", e);
    }
}

test();
