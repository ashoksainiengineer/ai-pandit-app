import { initEphemerisProvider, calculateEphemeris } from '../lib/ephemeris.js';

async function test() {
  console.log("Starting test...");
  try {
    const success = await initEphemerisProvider();
    console.log("Ephemeris init success:", success);
    
    const pos = await calculateEphemeris("2023-01-01", "12:00", 28.6139, 77.2090, 5.5);
    console.log("Positions:", JSON.stringify(pos, null, 2));
  } catch (e) {
    console.error("Test failed:", e);
  }
}
test();
