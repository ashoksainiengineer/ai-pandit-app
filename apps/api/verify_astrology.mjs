import { performance } from 'perf_hooks';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createEncryption } from '@ai-pandit/shared';

const crypto = createEncryption(process.env.ENCRYPTION_SECRET);

function getZodiacSign(longitude) {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  return signs[Math.floor(longitude / 30) % 12];
}

function getNakshatra(longitude) {
  const nakshatras = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha',
    'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
  ];
  const index = Math.floor(longitude / (360 / 27));
  return nakshatras[index % 27];
}

async function main() {
  console.log('===============================================');
  console.log('  DEEP ASTROLOGICAL DATA VERIFICATION');
  console.log('===============================================');
  console.log('');
  
  // Fetch session
  const userSessions = await db.select().from(sessions)
    .where(eq(sessions.userId, '7e66f9cb-dd2f-4287-bf0b-d7e74b2a3b18'))
    .orderBy(desc(sessions.createdAt))
    .limit(1);
  
  const session = userSessions[0];
  const dateOfBirth = crypto.parseField(session.dateOfBirth, session.userId, '');
  const tentativeTime = crypto.parseField(session.tentativeTime, session.userId, '');
  const lifeEvents = JSON.parse(crypto.decrypt(session.lifeEvents, session.userId));
  const spouseData = session.spouseData ? JSON.parse(crypto.decrypt(session.spouseData, session.userId)) : undefined;
  const rawOffset = session.offsetConfig ? JSON.parse(crypto.decrypt(session.offsetConfig, session.userId)) : null;
  const offsetConfig = rawOffset && (typeof rawOffset === 'object' && ('preset' in rawOffset || 'customMinutes' in rawOffset)) ? rawOffset : { preset: '1hour' };
  
  const input = {
    sessionId: session.id,
    jobId: 'verify-astrology',
    dateOfBirth,
    tentativeTime,
    latitude: session.latitude,
    longitude: session.longitude,
    timezone: session.timezone,
    lifeEvents,
    offsetConfig,
    spouseData,
    abortSignal: new AbortController().signal,
  };
  
  console.log('=== USER PROFILE ===');
  console.log(`DOB: ${dateOfBirth}, Time: ${tentativeTime}`);
  console.log(`Location: ${session.latitude}N, ${session.longitude}E, TZ: ${session.timezone}`);
  console.log('');
  
  // Generate a few candidates and deeply verify
  const { calculateEphemeris, calculateEphemerisBatch } = await import('./dist/lib/ephemeris.js');
  const { buildCandidateDataPackage } = await import('./dist/lib/btr/data-package-builder.js');
  
  // Test 1: Single ephemeris for base time
  console.log('[TEST 1] Single Ephemeris Verification');
  console.log('----------------------------------------');
  const ephStart = performance.now();
  const baseEph = await calculateEphemeris(dateOfBirth, tentativeTime, session.latitude, session.longitude, session.timezone);
  console.log(`Ephemeris fetch: ${(performance.now() - ephStart).toFixed(0)}ms`);
  
  console.log('\nPlanetary Positions:');
  console.log('  Planet      | Sign        | Degree  | Longitude | Nakshatra      | House');
  console.log('  ------------|-------------|---------|-----------|----------------|-------');
  for (const [name, planet] of Object.entries(baseEph.planets)) {
    const expectedSign = getZodiacSign(planet.longitude);
    const expectedNakshatra = getNakshatra(planet.longitude);
    const signMatch = planet.sign === expectedSign ? '✅' : '❌';
    const nakshatraMatch = planet.nakshatra === expectedNakshatra ? '✅' : '❌';
    console.log(`  ${name.padEnd(11)} | ${planet.sign.padEnd(11)} | ${planet.degree.toFixed(2).padStart(7)} | ${planet.longitude.toFixed(2).padStart(9)} | ${planet.nakshatra.padStart(14)} | ${planet.house} ${signMatch}${nakshatraMatch}`);
  }
  
  console.log(`\nAscendant: ${baseEph.ascendant.sign} ${baseEph.ascendant.degree.toFixed(2)}° (${baseEph.ascendant.longitude.toFixed(2)}°)`);
  console.log(`Ayanamsa: ${baseEph.ayanamsa.toFixed(4)}°`);
  console.log(`Houses: ${baseEph.houses.length} houses`);
  
  // Test 2: Varga Verification
  console.log('\n\n[TEST 2] Varga (Divisional Chart) Verification');
  console.log('------------------------------------------------');
  const { calculateAllVargas } = await import('./dist/lib/vedic-astrology-engine.js');
  const vargas = calculateAllVargas(baseEph);
  
  console.log('\nVarga Ascendants:');
  for (const [type, chart] of Object.entries(vargas)) {
    if (chart?.ascendant) {
      console.log(`  ${type.padEnd(5)} | Asc: ${chart.ascendant.sign.padEnd(12)} | ${chart.ascendant.degree.toFixed(2)}°`);
    }
  }
  
  console.log('\nD9 (Navamsa) Planets:');
  if (vargas.D9?.planets) {
    for (const [name, pos] of Object.entries(vargas.D9.planets)) {
      console.log(`  ${name.padEnd(11)} | ${pos.sign.padEnd(12)} | ${pos.degree.toFixed(2)}° | House ${pos.house}`);
    }
  }
  
  console.log('\nD10 (Dasamsa) Planets:');
  if (vargas.D10?.planets) {
    for (const [name, pos] of Object.entries(vargas.D10.planets)) {
      console.log(`  ${name.padEnd(11)} | ${pos.sign.padEnd(12)} | ${pos.degree.toFixed(2)}° | House ${pos.house}`);
    }
  }
  
  console.log('\nD60 (Shashtiamsa) Planets:');
  if (vargas.D60?.planets) {
    for (const [name, pos] of Object.entries(vargas.D60.planets)) {
      console.log(`  ${name.padEnd(11)} | ${pos.sign.padEnd(12)} | ${pos.degree.toFixed(2)}° | House ${pos.house}`);
    }
  }
  
  // Test 3: Build Candidate Data Package
  console.log('\n\n[TEST 3] Candidate Data Package Verification');
  console.log('----------------------------------------------');
  const pkgStart = performance.now();
  const pkg = await buildCandidateDataPackage(tentativeTime, 0, input, {
    includeFullData: false,
    dashaDepth: 2,
    precomputedEphemeris: baseEph
  });
  console.log(`Package build: ${(performance.now() - pkgStart).toFixed(0)}ms`);
  
  console.log('\nPackage Contents:');
  console.log(`  Time: ${pkg.time}`);
  console.log(`  Ascendant: ${pkg.ascendant.sign} ${pkg.ascendant.degree}`);
  console.log(`  Moon Nakshatra: ${pkg.moonNakshatra}`);
  console.log(`  D9 Lagna: ${pkg.d9Lagna || 'MISSING ❌'}`);
  console.log(`  D10 Lagna: ${pkg.d10Lagna || 'MISSING ❌'}`);
  console.log(`  D60 Sign: ${pkg.d60Sign || 'MISSING ❌'}`);
  console.log(`  Vimshottari Dasha: ${pkg.vimshottariDasha?.length || 0} periods`);
  console.log(`  Yogas: ${pkg.yogas?.length || 0} detected`);
  console.log(`  Vimsopaka Bala: ${pkg.vimsopakaBala ? 'Present ✅' : 'Missing ❌'}`);
  console.log(`  KP Data: ${pkg.kpData ? 'Present ✅' : 'Missing ❌'}`);
  
  if (pkg.vimshottariDasha && pkg.vimshottariDasha.length > 0) {
    console.log('\n  First 3 Dasha Periods:');
    for (let i = 0; i < Math.min(3, pkg.vimshottariDasha.length); i++) {
      const d = pkg.vimshottariDasha[i];
      console.log(`    ${i+1}. ${d.mahadasha} (${new Date(d.startDate).toISOString().split('T')[0]} - ${new Date(d.endDate).toISOString().split('T')[0]})`);
    }
  }
  
  // Test 4: Batch Processing Verification
  console.log('\n\n[TEST 4] Batch Processing Verification');
  console.log('----------------------------------------');
  const batchInputs = [
    { birthDate: dateOfBirth, birthTime: tentativeTime, latitude: session.latitude, longitude: session.longitude, timezone: session.timezone },
    { birthDate: dateOfBirth, birthTime: '09:51:00', latitude: session.latitude, longitude: session.longitude, timezone: session.timezone },
    { birthDate: dateOfBirth, birthTime: '09:52:00', latitude: session.latitude, longitude: session.longitude, timezone: session.timezone },
  ];
  
  const batchStart = performance.now();
  const batchEph = await calculateEphemerisBatch(batchInputs);
  const batchTime = performance.now() - batchStart;
  console.log(`Batch 3 charts: ${batchTime.toFixed(0)}ms (${(batchTime/3).toFixed(0)}ms per chart)`);
  
  console.log('\nAscendant progression (should change):');
  for (let i = 0; i < batchEph.length; i++) {
    const e = batchEph[i];
    console.log(`  ${batchInputs[i].birthTime} | Asc: ${e.ascendant.sign} ${e.ascendant.degree.toFixed(2)}°`);
  }
  
  // Test 5: Data Package for multiple candidates
  console.log('\n\n[TEST 5] Multiple Candidate Packages');
  console.log('--------------------------------------');
  const candidates = ['09:20:00', '09:50:00', '10:20:00'];
  for (const time of candidates) {
    const start = performance.now();
    const cpkg = await buildCandidateDataPackage(time, 0, input, {
      includeFullData: false,
      dashaDepth: 2
    });
    const elapsed = performance.now() - start;
    console.log(`  ${time} | Asc: ${cpkg.ascendant.sign.padEnd(12)} | Moon: ${cpkg.moonNakshatra.padEnd(14)} | D9: ${cpkg.d9Lagna?.padEnd(12) || 'MISSING'} | ${elapsed.toFixed(0)}ms`);
  }
  
  console.log('\n\n===============================================');
  console.log('  VERIFICATION COMPLETE');
  console.log('===============================================');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
