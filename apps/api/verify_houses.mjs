import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createEncryption } from '@ai-pandit/shared';

const crypto = createEncryption(process.env.ENCRYPTION_SECRET);

async function main() {
  const userSessions = await db.select().from(sessions)
    .where(eq(sessions.userId, '7e66f9cb-dd2f-4287-bf0b-d7e74b2a3b18'))
    .orderBy(desc(sessions.createdAt))
    .limit(1);
  
  const session = userSessions[0];
  const dateOfBirth = crypto.parseField(session.dateOfBirth, session.userId, '');
  const tentativeTime = crypto.parseField(session.tentativeTime, session.userId, '');
  
  const { calculateEphemeris } = await import('./dist/lib/ephemeris.js');
  const eph = await calculateEphemeris(dateOfBirth, tentativeTime, session.latitude, session.longitude, session.timezone);
  
  console.log('=== HOUSE VERIFICATION ===');
  console.log(`Ascendant: ${eph.ascendant.sign} ${eph.ascendant.degree.toFixed(2)}°`);
  console.log('');
  console.log('House Cusps:');
  console.log('  House | Sign        | Cusp Degree');
  console.log('  ------|-------------|------------');
  eph.houses.forEach((house, i) => {
    console.log(`  ${String(i+1).padStart(5)} | ${house.sign.padEnd(11)} | ${house.cusp?.toFixed(2) || house.longitude?.toFixed(2) || 'N/A'}°`);
  });
  
  console.log('\n=== PLANET HOUSE ASSIGNMENTS ===');
  console.log('  Planet      | Sign        | Longitude | House | Should be in');
  console.log('  ------------|-------------|-----------|-------|-------------');
  for (const [name, planet] of Object.entries(eph.planets)) {
    // Calculate what house it should be in
    const houseIndex = eph.houses.findIndex((h, i) => {
      const nextHouse = eph.houses[(i + 1) % 12];
      const cusp = h.cusp || h.longitude || 0;
      const nextCusp = nextHouse.cusp || nextHouse.longitude || 0;
      if (nextCusp < cusp) { // crosses 0°
        return planet.longitude >= cusp || planet.longitude < nextCusp;
      }
      return planet.longitude >= cusp && planet.longitude < nextCusp;
    });
    const expectedHouse = houseIndex + 1;
    const match = planet.house === expectedHouse ? '✅' : '❌';
    console.log(`  ${name.padEnd(11)} | ${planet.sign.padEnd(11)} | ${planet.longitude.toFixed(2).padStart(9)}° | ${String(planet.house).padStart(5)} | ${String(expectedHouse).padStart(12)} ${match}`);
  }
  
  console.log('\n=== DASHA VERIFICATION ===');
  const { buildVimshottariDasha } = await import('./dist/lib/btr/dasha-builder.js');
  const { calculateVimshottariDasha } = await import('./dist/lib/vedic-astrology-engine.js');
  
  const birthDate = new Date(`${dateOfBirth}T${tentativeTime}`);
  const moonLong = eph.planets.moon.longitude;
  
  const rawDasha = calculateVimshottariDasha(moonLong, birthDate, 5);
  console.log(`Raw Dasha periods: ${rawDasha.length}`);
  
  const builtDasha = buildVimshottariDasha({
    moonLongitude: moonLong,
    birthDate,
    dashaDepth: 2,
    pranaWindowDays: 3,
    eventRanges: [],
    now: Date.now()
  });
  console.log(`Built Dasha periods: ${builtDasha.length}`);
  
  if (builtDasha.length > 0) {
    console.log('\nFirst 5 Dasha Periods:');
    for (let i = 0; i < Math.min(5, builtDasha.length); i++) {
      const d = builtDasha[i];
      console.log(`  ${i+1}. ${d.mahadasha} - Start: ${d.startDate}, End: ${d.endDate}`);
    }
  }
}

main().catch(console.error);
