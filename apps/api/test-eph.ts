import { initSwissEph, calculatePlanetaryPositions } from './src/lib/ephemeris.js';

async function test() {
  console.log("Starting test...");
  try {
    const success = await initSwissEph();
    console.log("WASM Init Success:", success);
    
    // Test a calculation
    const jd = 2459999.5; // Example JD
    const pos = await calculatePlanetaryPositions(2023, 1, 1, 12, 0, 0, 0, 0, "UTC");
    console.log("Positions:", pos);
  } catch (e) {
    console.error("Test failed:", e);
  }
}
test();
