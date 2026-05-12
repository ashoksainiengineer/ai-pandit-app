import { performance } from 'perf_hooks';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createEncryption } from '@ai-pandit/shared';

const crypto = createEncryption(process.env.ENCRYPTION_SECRET);

async function main() {
  console.log('=== LOCAL BTR PIPELINE DEBUG ===');
  console.log('Using local ephemeris service at http://localhost:8000');
  console.log('');
  
  // Fetch user's latest session
  console.log('Fetching user sessions...');
  const userSessions = await db.select().from(sessions)
    .where(eq(sessions.userId, 'dharmahendrasaini@gmail.com'))
    .orderBy(desc(sessions.createdAt))
    .limit(5);
  
  if (userSessions.length === 0) {
    console.log('No sessions found for user');
    return;
  }
  
  console.log(`Found ${userSessions.length} sessions`);
  const session = userSessions[0];
  console.log(`Using session: ${session.id}, status: ${session.status}, createdAt: ${session.createdAt}`);
  console.log('');
  
  // Decrypt session data
  console.log('Decrypting session data...');
  const decryptStart = performance.now();
  
  const dateOfBirth = crypto.parseField(session.dateOfBirth, session.userId, '');
  const tentativeTime = crypto.parseField(session.tentativeTime, session.userId, '');
  const lifeEvents = JSON.parse(crypto.decrypt(session.lifeEvents, session.userId));
  const spouseData = session.spouseData ? JSON.parse(crypto.decrypt(session.spouseData, session.userId)) : undefined;
  const rawOffset = session.offsetConfig ? JSON.parse(crypto.decrypt(session.offsetConfig, session.userId)) : null;
  const offsetConfig = rawOffset && (typeof rawOffset === 'object' && ('preset' in rawOffset || 'customMinutes' in rawOffset)) ? rawOffset : { preset: '1hour' };
  
  console.log(`Decryption: ${(performance.now() - decryptStart).toFixed(0)}ms`);
  console.log('');
  
  console.log('=== DECRYPTED DATA ===');
  console.log(`Date of Birth: ${dateOfBirth}`);
  console.log(`Tentative Time: ${tentativeTime}`);
  console.log(`Location: ${session.latitude}, ${session.longitude}, TZ: ${session.timezone}`);
  console.log(`Life Events: ${lifeEvents.length} events`);
  lifeEvents.forEach((e, i) => console.log(`  ${i+1}. ${e.date} - ${e.event} (${e.eventType || 'general'})`));
  console.log(`Offset Config: ${JSON.stringify(offsetConfig)}`);
  console.log(`Spouse Data: ${spouseData ? 'Yes' : 'No'}`);
  console.log('');
  
  // Build input
  const btrInput = {
    sessionId: session.id,
    jobId: 'local-debug-job',
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
  
  // Run BTR pipeline with profiling
  console.log('=== STARTING BTR PIPELINE ===');
  const pipelineStart = performance.now();
  
  try {
    // Dynamic import to avoid loading until needed
    const { executeSecondsPrecisionRectification } = await import('./dist/lib/seconds-precision-btr.js');
    const result = await executeSecondsPrecisionRectification(btrInput);
    
    const pipelineElapsed = performance.now() - pipelineStart;
    console.log('');
    console.log('=== BTR PIPELINE COMPLETE ===');
    console.log(`Total time: ${(pipelineElapsed / 1000).toFixed(1)}s`);
    console.log(`Rectified Time: ${result.rectifiedTime}`);
    console.log(`Accuracy: ${result.accuracy}`);
    console.log(`Confidence: ${result.confidence}`);
  } catch (err) {
    const pipelineElapsed = performance.now() - pipelineStart;
    console.log('');
    console.log('=== BTR PIPELINE FAILED ===');
    console.log(`Total time before failure: ${(pipelineElapsed / 1000).toFixed(1)}s`);
    console.log(`Error: ${err.message}`);
    console.log(err.stack);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
