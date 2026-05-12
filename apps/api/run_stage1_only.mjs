import { performance } from 'perf_hooks';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createEncryption } from '@ai-pandit/shared';

const crypto = createEncryption(process.env.ENCRYPTION_SECRET);

async function main() {
  console.log('============================================');
  console.log('  STAGE 1 ONLY - LOCAL DEBUG WITH USER DATA');
  console.log('============================================');
  console.log('Ephemeris: http://localhost:8000');
  console.log('');
  
  // Fetch user's latest session
  console.log('[1/4] Fetching user session from DB...');
  const fetchStart = performance.now();
  const userSessions = await db.select().from(sessions)
    .where(eq(sessions.userId, '7e66f9cb-dd2f-4287-bf0b-d7e74b2a3b18'))
    .orderBy(desc(sessions.createdAt))
    .limit(1);
  
  if (userSessions.length === 0) {
    console.log('ERROR: No sessions found');
    return;
  }
  const session = userSessions[0];
  console.log(`  Session ID: ${session.id}`);
  console.log(`  Status: ${session.status}`);
  console.log(`  DB fetch: ${(performance.now() - fetchStart).toFixed(0)}ms`);
  console.log('');
  
  // Decrypt
  console.log('[2/4] Decrypting session data...');
  const decryptStart = performance.now();
  const dateOfBirth = crypto.parseField(session.dateOfBirth, session.userId, '');
  const tentativeTime = crypto.parseField(session.tentativeTime, session.userId, '');
  const lifeEvents = JSON.parse(crypto.decrypt(session.lifeEvents, session.userId));
  const spouseData = session.spouseData ? JSON.parse(crypto.decrypt(session.spouseData, session.userId)) : undefined;
  const rawOffset = session.offsetConfig ? JSON.parse(crypto.decrypt(session.offsetConfig, session.userId)) : null;
  const offsetConfig = rawOffset && (typeof rawOffset === 'object' && ('preset' in rawOffset || 'customMinutes' in rawOffset)) ? rawOffset : { preset: '1hour' };
  console.log(`  Decryption: ${(performance.now() - decryptStart).toFixed(0)}ms`);
  console.log('');
  
  console.log('=== USER DATA SUMMARY ===');
  console.log(`DOB: ${dateOfBirth}, Time: ${tentativeTime}`);
  console.log(`Lat: ${session.latitude}, Lon: ${session.longitude}, TZ: ${session.timezone}`);
  console.log(`Life Events: ${lifeEvents.length}`);
  lifeEvents.forEach((e, i) => console.log(`  ${i+1}. ${e.date} - ${e.event}`));
  console.log(`Offset: ${JSON.stringify(offsetConfig)}`);
  console.log(`Spouse: ${spouseData ? 'Yes' : 'No'}`);
  console.log('');
  
  // Build input
  const input = {
    sessionId: session.id,
    jobId: 'local-stage1-debug',
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
  
  // Run Stage 1
  console.log('[3/4] Running Stage 1: Exhaustive Data Generation...');
  console.log('');
  
  const { stage1ExhaustiveDataGeneration } = await import('./dist/lib/btr/stages/stage1-exhaustive-data.js');
  const { ProgressTracker } = await import('./dist/lib/progress-tracker.js');
  
  const progress = new ProgressTracker(session.id);
  const stage1Start = performance.now();
  
  try {
    const result = await stage1ExhaustiveDataGeneration(input, progress);
    const stage1Elapsed = performance.now() - stage1Start;
    
    console.log('');
    console.log('=== STAGE 1 COMPLETE ===');
    console.log(`Total Stage 1 time: ${(stage1Elapsed / 1000).toFixed(1)}s`);
    console.log(`Candidates generated: ${result.candidates.length}`);
    console.log(`Stage result: ${JSON.stringify(result.stageResult)}`);
  } catch (err) {
    const stage1Elapsed = performance.now() - stage1Start;
    console.log('');
    console.log('=== STAGE 1 FAILED ===');
    console.log(`Time before failure: ${(stage1Elapsed / 1000).toFixed(1)}s`);
    console.log(`Error: ${err.message}`);
    console.log(err.stack);
  }
  
  console.log('');
  console.log('[4/4] Done.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
