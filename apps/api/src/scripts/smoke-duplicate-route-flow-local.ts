import 'dotenv/config';
import crypto from 'node:crypto';
import request from 'supertest';
import { db, verifyDatabaseConnection } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { desc, eq } from 'drizzle-orm';
import { syncUser } from '../lib/user-sync.js';

const BYPASS_HEADER = { 'x-test-bypass-auth': 'super-secret-test-key' };
const POLL_INTERVAL_MS = Number(process.env.SMOKE_POLL_INTERVAL_MS || 5000);
const MAX_POLLS = Number(process.env.SMOKE_MAX_POLLS || 8);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  process.env.NODE_ENV = 'test';
  await verifyDatabaseConnection();

  const testUserId = await syncUser('TEST_SCRIPT');

  const [template] = await db.select().from(sessions)
    .where(eq(sessions.status, 'complete'))
    .orderBy(desc(sessions.updatedAt))
    .limit(1);

  let templateSession = template;
  if (!templateSession) {
    const syntheticTemplateId = crypto.randomUUID();
    const syntheticNow = new Date().toISOString();

    await db.insert(sessions).values({
      id: syntheticTemplateId,
      userId: testUserId,
      clerkId: 'TEST_SCRIPT',
      fullName: 'Synthetic Smoke Template',
      dateOfBirth: '1990-01-01',
      tentativeTime: '10:00:00',
      birthPlace: 'Delhi',
      latitude: 28.6139,
      longitude: 77.2090,
      timezone: '5.5',
      gender: 'male',
      physicalTraits: null,
      forensicTraits: null,
      lifeEvents: '[]',
      spouseData: null,
      offsetConfig: '{}',
      status: 'complete',
      rectifiedTime: '10:00:12',
      accuracy: 90,
      confidence: 'medium',
      analysisResult: '{}',
      progressData: null,
      reasoningLogs: null,
      errorMessage: null,
      errorCode: null,
      aiConsentGiven: true,
      aiConsentGivenAt: syntheticNow,
      isEncrypted: false,
      createdAt: syntheticNow,
      updatedAt: syntheticNow,
    } as typeof sessions.$inferInsert);

    const [createdTemplate] = await db.select().from(sessions)
      .where(eq(sessions.id, syntheticTemplateId))
      .limit(1);

    if (!createdTemplate) {
      throw new Error('Failed to create synthetic completed template session');
    }

    templateSession = createdTemplate;
  }

  const seededCompletedSessionId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(sessions).values({
    id: seededCompletedSessionId,
    userId: testUserId,
    clerkId: 'TEST_SCRIPT',
    fullName: templateSession.fullName,
    dateOfBirth: templateSession.dateOfBirth,
    tentativeTime: templateSession.tentativeTime,
    birthPlace: templateSession.birthPlace,
    latitude: templateSession.latitude,
    longitude: templateSession.longitude,
    timezone: templateSession.timezone,
    gender: templateSession.gender,
    physicalTraits: templateSession.physicalTraits,
    forensicTraits: templateSession.forensicTraits,
    lifeEvents: templateSession.lifeEvents,
    spouseData: templateSession.spouseData,
    offsetConfig: templateSession.offsetConfig,
    status: 'complete',
    rectifiedTime: templateSession.rectifiedTime,
    accuracy: templateSession.accuracy,
    confidence: templateSession.confidence,
    analysisResult: templateSession.analysisResult,
    progressData: templateSession.progressData,
    reasoningLogs: templateSession.reasoningLogs,
    errorMessage: null,
    errorCode: null,
    aiConsentGiven: templateSession.aiConsentGiven,
    aiConsentGivenAt: templateSession.aiConsentGivenAt,
    isEncrypted: templateSession.isEncrypted,
    createdAt: now,
    updatedAt: now,
  } as typeof sessions.$inferInsert);

  const { default: app } = await import('../server.js');

  let clonedSessionId: string | null = null;
  try {
    const cloneRes = await request(app)
      .post(`/api/sessions/${seededCompletedSessionId}/clone`)
      .set(BYPASS_HEADER)
      .send();

    if (cloneRes.status !== 201 || !cloneRes.body?.success || !cloneRes.body?.data?.id) {
      throw new Error(`Clone route failed: status=${cloneRes.status} body=${JSON.stringify(cloneRes.body)}`);
    }

    clonedSessionId = cloneRes.body.data.id as string;

    const requeueRes = await request(app)
      .post('/api/queue/requeue')
      .set(BYPASS_HEADER)
      .send({ sessionId: clonedSessionId });

    if (requeueRes.status !== 200 || !requeueRes.body?.success) {
      throw new Error(`Requeue failed: status=${requeueRes.status} body=${JSON.stringify(requeueRes.body)}`);
    }

    let finalStatus: string | null = null;
    for (let attempt = 1; attempt <= MAX_POLLS; attempt += 1) {
      await sleep(POLL_INTERVAL_MS);
      const progressRes = await request(app)
        .get(`/api/queue/progress?sessionId=${encodeURIComponent(clonedSessionId)}`)
        .set(BYPASS_HEADER);

      if (progressRes.status !== 200) {
        throw new Error(`Progress failed: status=${progressRes.status} body=${JSON.stringify(progressRes.body)}`);
      }

      const status = progressRes.body?.status || 'unknown';
      if (['complete', 'failed', 'cancelled', 'error'].includes(status)) {
        finalStatus = status;
        break;
      }
    }

    // Keep smoke cleanup deterministic regardless of terminal state.
    await request(app)
      .post('/api/queue/cancel')
      .set(BYPASS_HEADER)
      .send({ sessionId: clonedSessionId });

    const deleteCloneRes = await request(app)
      .delete(`/api/sessions/${clonedSessionId}`)
      .set(BYPASS_HEADER)
      .send();

    if (deleteCloneRes.status !== 200 || !deleteCloneRes.body?.success) {
      throw new Error(`Delete cloned session failed: status=${deleteCloneRes.status} body=${JSON.stringify(deleteCloneRes.body)}`);
    }

    console.log(`SMOKE_LOCAL_RESULT: seed=${seededCompletedSessionId} clone=${clonedSessionId} status=${finalStatus ?? 'non-terminal'}`);
  } finally {
    await db.delete(sessions).where(eq(sessions.id, seededCompletedSessionId));

    if (clonedSessionId) {
      await db.delete(sessions).where(eq(sessions.id, clonedSessionId));
    }
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('[SMOKE-LOCAL] Failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
