import 'dotenv/config';

import { compareEphemerisProviders, initEphemerisProvider } from '../lib/ephemeris.js';

async function main(): Promise<void> {
  await initEphemerisProvider();

  const result = await compareEphemerisProviders({
    birthDate: '1990-01-01',
    birthTime: '12:00:00',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
  });

  console.log(JSON.stringify(result.summary, null, 2));
}

main().catch((error) => {
  console.error('Failed to compare ephemeris providers');
  console.error(error);
  process.exit(1);
});
