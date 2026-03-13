import 'dotenv/config';

import { calculateEphemeris, initEphemerisProvider, isHighPrecisionMode } from '../lib/ephemeris.js';
import { EPHEMERIS_GOLD_DATASET } from '../lib/ephemeris/gold-dataset.js';

async function main(): Promise<void> {
  const initialized = await initEphemerisProvider();
  if (!initialized || !isHighPrecisionMode()) {
    throw new Error('Skyfield high-precision mode is required to generate trusted candidate fixtures.');
  }

  const snapshot = [];
  for (const testCase of EPHEMERIS_GOLD_DATASET) {
    const eph = await calculateEphemeris(
      testCase.input.date,
      testCase.input.time,
      testCase.input.latitude,
      testCase.input.longitude,
      testCase.input.timezone
    );

    snapshot.push({
      id: testCase.id,
      name: testCase.name,
      source: testCase.source,
      suggestedExpected: {
        sunSign: eph.planets.sun.sign,
        moonSign: eph.planets.moon.sign,
        ascendantSign: eph.ascendant.sign,
        sunLongitude: eph.planets.sun.longitude,
        moonLongitude: eph.planets.moon.longitude,
        ascendantLongitude: eph.ascendant.longitude,
        longitudeToleranceDeg: testCase.expected.longitudeToleranceDeg ?? 0.1,
        maxRahuKetuOppositionDelta: testCase.expected.maxRahuKetuOppositionDelta ?? 0.0001,
      },
    });
  }

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    provider: 'skyfield',
    note: 'Candidate trusted anchors. Verify against audited production sessions before marking qualityTier=trusted.',
    cases: snapshot,
  }, null, 2));
}

main().catch((error) => {
  console.error('Failed to generate trusted candidate fixtures');
  console.error(error);
  process.exit(1);
});
