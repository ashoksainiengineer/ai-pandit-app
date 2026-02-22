import { initSwissEph, calculateEphemeris } from './src/lib/ephemeris.js';

async function verifyEphemeris() {
    console.log("Initializing Swiss Ephemeris...");
    const initStart = Date.now();
    const success = await initSwissEph();
    console.log(`Init complete in ${Date.now() - initStart}ms. Success:`, success);

    if (!success) {
        console.warn("WASM failed to initialize. Testing algorithmic fallback...");
    } else {
        console.log("WASM initialized. Testing full coordinate calculation to verify planetary engines aren't crashing...");
    }

    try {
        const calcStart = Date.now();
        // birthDate: string, birthTime: string, latitude: number, longitude: number, timezone: number | string
        const ephData = await calculateEphemeris("2023-01-15", "12:30", 28.7041, 77.1025, "Asia/Kolkata");

        console.log(`Calculation massive payload complete in ${Date.now() - calcStart}ms`);
        console.log(`Sun Position: ${ephData.planets.sun?.degree.toFixed(2)} in ${ephData.planets.sun?.sign}`);
        console.log(`Moon Position: ${ephData.planets.moon?.degree.toFixed(2)} in ${ephData.planets.moon?.sign}`);
        console.log(`Lagna: ${ephData.ascendant.degree.toFixed(2)} in ${ephData.ascendant.sign}`);

        // Check if the data used algorithmic fallback
        const isAlgorithmic = ephData.calculations?.usedAlgorithmicFallback;
        console.log("Did it use algorithmic fallback?:", isAlgorithmic ? "YES" : "NO");

        console.log("Check complete. Result returned natively.");
    } catch (error) {
        console.error("CRITICAL FAILURE in calculateEphemeris:", error);
    }
}

verifyEphemeris();
