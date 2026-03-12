import { initEphemerisProvider } from '../lib/ephemeris.js';

async function test() {
  const success = await initEphemerisProvider();
  console.log("Ephemeris init success:", success);
}
test();
