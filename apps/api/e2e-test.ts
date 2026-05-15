import { config } from 'dotenv';
config({ path: '../../.env' });

import { randomUUID } from 'crypto';
import { db } from '@ai-pandit/db';
import { sessions, jobs, users } from '@ai-pandit/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createQueuedBirthRectificationJob } from './src/lib/jobs/job-service.js';
import { getQueueDriver } from './src/lib/queue/index.js';

const TEST_EXTERNAL_ID = 'test_user_e2e_' + Date.now();

async function ensureTestUser(): Promise<string> {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.externalId, TEST_EXTERNAL_ID)).limit(1);
  if (existing) return existing.id;

  const userId = randomUUID();
  const [user] = await db.insert(users).values({
    id: userId,
    externalId: TEST_EXTERNAL_ID,
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).returning({ id: users.id });

  return user.id;
}

async function runE2ETest(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  AI-PANDIT BTR END-TO-END TEST');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const startTime = Date.now();

  console.log('[1/7] Creating test user...');
  const userId = await ensureTestUser();
  console.log(`      User ID: ${userId}`);

  console.log('\n[2/7] Creating BTR job with birth data...');
  const result = await createQueuedBirthRectificationJob({
    externalId: TEST_EXTERNAL_ID,
    ownershipContext: {
      externalId: TEST_EXTERNAL_ID,
      internalUserId: userId,
      email: 'test@example.com',
    },
    body: {
      birthData: {
        fullName: 'Rahul Sharma',
        dateOfBirth: '1990-06-15',
        tentativeTime: '14:30:00',
        birthPlace: 'New Delhi, India',
        latitude: 28.6139,
        longitude: 77.209,
        timezone: 5.5,
        gender: 'male',
      },
      lifeEvents: [
        {
          id: 'evt_1',
          eventType: 'Graduation',
          category: 'education',
          eventDate: '2012-05-15',
          datePrecision: 'exact_date',
          description: 'Completed engineering degree',
          importance: 'high',
        },
        {
          id: 'evt_2',
          eventType: 'First Job',
          category: 'career',
          eventDate: '2012-07-01',
          datePrecision: 'exact_date',
          description: 'Started first job at IT company',
          importance: 'high',
        },
        {
          id: 'evt_3',
          eventType: 'Marriage',
          category: 'marriage',
          eventDate: '2018-11-20',
          datePrecision: 'exact_date',
          description: 'Got married',
          importance: 'high',
        },
        {
          id: 'evt_4',
          eventType: 'Child Birth',
          category: 'children',
          eventDate: '2020-03-10',
          datePrecision: 'exact_date',
          description: 'First child born',
          importance: 'high',
        },
      ],
      offsetConfig: {
        preset: '1hour',
        customMinutes: 60,
        description: '1 hour offset for testing',
      },
      consentConfirmed: true,
    },
  });

  console.log(`      Session ID: ${result.job.sessionId}`);
  console.log(`      Job ID: ${result.job.id}`);
  console.log(`      Queue Position: ${result.queue.position}`);
  console.log(`      Estimated Wait: ${result.queue.estimatedWaitSeconds}s`);
  console.log(`      Status: ${result.job.status}`);

  console.log('\n[3/7] Checking Redis queue state...');
  const queueDriver = getQueueDriver();
  const activeJobs = await queueDriver.countActiveJobs();
  console.log(`      Active jobs in queue: ${activeJobs}`);

  console.log('\n[4/7] Monitoring job execution (polling every 3s)...');
  const sessionId = result.job.sessionId;
  let lastStatus = result.job.status;
  let completed = false;
  let failed = false;
  const maxWaitMs = 5 * 60 * 1000;
  const pollIntervalMs = 3000;
  const startPoll = Date.now();

  while (Date.now() - startPoll < maxWaitMs) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    const job = await db.select().from(jobs).where(eq(jobs.sessionId, sessionId)).orderBy(desc(jobs.createdAt)).limit(1);

    if (session.length === 0 || job.length === 0) {
      console.log('      Session or job not found!');
      break;
    }

    const currentStatus = session[0].status;
    const jobStatus = job[0].status;

    if (currentStatus !== lastStatus) {
      console.log(`      [${new Date().toISOString()}] Status: ${lastStatus} → ${currentStatus} | Job: ${jobStatus}`);
      lastStatus = currentStatus;
    }

    if (currentStatus === 'complete') {
      completed = true;
      console.log(`\n      ✅ JOB COMPLETED SUCCESSFULLY`);
      console.log(`      Rectified Time: ${session[0].rectifiedTime}`);
      console.log(`      Accuracy: ${session[0].accuracy}`);
      console.log(`      Confidence: ${session[0].confidence}`);
      break;
    }

    if (currentStatus === 'failed') {
      failed = true;
      console.log(`\n      ❌ JOB FAILED`);
      console.log(`      Error: ${session[0].errorMessage}`);
      break;
    }

    const elapsedSec = Math.floor((Date.now() - startPoll) / 1000);
    if (elapsedSec % 15 === 0) {
      console.log(`      [${elapsedSec}s] Still ${currentStatus}... (job: ${jobStatus})`);
    }
  }

  console.log('\n[5/7] Final verification...');
  const finalSession = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  const finalJob = await db.select().from(jobs).where(eq(jobs.sessionId, sessionId)).orderBy(desc(jobs.createdAt)).limit(1);

  if (finalSession.length > 0) {
    const s = finalSession[0];
    console.log(`      Final Status: ${s.status}`);
    console.log(`      Rectified Time: ${s.rectifiedTime || 'N/A'}`);
    console.log(`      Accuracy: ${s.accuracy || 'N/A'}`);
    console.log(`      Confidence: ${s.confidence || 'N/A'}`);
    console.log(`      Error Message: ${s.errorMessage || 'None'}`);
  }

  if (finalJob.length > 0) {
    const j = finalJob[0];
    console.log(`      Job Status: ${j.status}`);
    console.log(`      Current Stage: ${j.currentStage || 'N/A'}`);
    console.log(`      Progress: ${j.progressPercent || 0}%`);
    console.log(`      Attempt: ${j.attempt}/${j.maxAttempts}`);
    console.log(`      Error Code: ${j.errorCode || 'None'}`);
  }

  console.log('\n[6/7] Post-execution Redis queue check...');
  const finalActiveJobs = await queueDriver.countActiveJobs();
  console.log(`      Active jobs in queue: ${finalActiveJobs}`);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Total Time: ${totalTime}s`);
  console.log(`  Completed: ${completed ? '✅ YES' : '❌ NO'}`);
  console.log(`  Failed: ${failed ? '❌ YES' : '✅ NO'}`);
  console.log(`  Session ID: ${sessionId}`);
  console.log(`  Job ID: ${result.job.id}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (!completed && !failed) {
    console.log('⚠️  Job did not complete within timeout. It may still be processing.');
  }
}

runE2ETest().catch((error) => {
  console.error('Test failed with error:', error);
  process.exit(1);
});
