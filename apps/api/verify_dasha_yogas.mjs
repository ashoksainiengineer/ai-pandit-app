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
  
  console.log('=== DASHA VERIFICATION ===');
  const { buildVimshottariDasha } = await import('./dist/lib/btr/dasha-builder.js');
  const { calculateVimshottariDasha } = await import('./dist/lib/vedic-astrology-engine.js');
  
  const birthDate = new Date(`${dateOfBirth}T${tentativeTime}`);
  const moonLong = eph.planets.moon.longitude;
  
  console.log(`Birth Date: ${birthDate.toISOString()}`);
  console.log(`Moon Longitude: ${moonLong.toFixed(2)}°`);
  console.log(`Moon Nakshatra: ${eph.planets.moon.nakshatra}`);
  console.log('');
  
  console.log('Raw Dasha (from vedic-astrology-engine):');
  const rawDasha = calculateVimshottariDasha(moonLong, birthDate, 3);
  console.log(`  Periods: ${rawDasha.length}`);
  for (let i = 0; i < Math.min(3, rawDasha.length); i++) {
    const d = rawDasha[i];
    console.log(`  ${i+1}. ${d.lord} | ${d.startDate?.toISOString()?.split('T')[0]} - ${d.endDate?.toISOString()?.split('T')[0]} | ${d.durationYears} years`);
  }
  
  console.log('\nBuilt Dasha (from dasha-builder):');
  const builtDasha = buildVimshottariDasha({
    moonLongitude: moonLong,
    birthDate,
    dashaDepth: 2,
    pranaWindowDays: 3,
    eventRanges: [],
    now: Date.now()
  });
  console.log(`  Periods: ${builtDasha.length}`);
  console.log(`  Type: ${typeof builtDasha}`);
  if (builtDasha.length > 0) {
    console.log(`  First item keys: ${Object.keys(builtDasha[0]).join(', ')}`);
    for (let i = 0; i < Math.min(3, builtDasha.length); i++) {
      const d = builtDasha[i];
      console.log(`  ${i+1}. ${JSON.stringify(d)}`);
    }
  }
  
  console.log('\n=== YOGA VERIFICATION ===');
  const { detectYogas } = await import('./dist/lib/vedic-astrology-engine.js');
  const yogas = detectYogas(eph);
  console.log(`Yogas detected: ${yogas.length}`);
  if (yogas.length > 0) {
    yogas.forEach((y, i) => console.log(`  ${i+1}. ${y.name}: ${y.description}`));
  } else {
    console.log('  No yogas detected - this might be normal for this chart');
  }
  
  console.log('\n=== VIMSOPAKA BALA VERIFICATION ===');
  const { calculateVimsopakaBala } = await import('./dist/lib/vedic-astrology-engine.js');
  const vimsopaka = calculateVimsopakaBala(eph);
  console.log(`Vimsopaka Bala: ${JSON.stringify(vimsopaka, null, 2)}`);
  
  console.log('\n=== SHADBALA VERIFICATION ===');
  const { calculateShadbala } = await import('./dist/lib/vedic-astrology-engine.js');
  const shadbala = calculateShadbala(eph);
  console.log(`Shadbala scores: ${JSON.stringify(shadbala, null, 2)}`);
}

main().catch(console.error);
