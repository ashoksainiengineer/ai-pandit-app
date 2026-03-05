import { initSwissEph } from '../lib/ephemeris.js';

async function test() {
  const success = await initSwissEph();
  console.log("WASM Init Success:", success);
}
test();
