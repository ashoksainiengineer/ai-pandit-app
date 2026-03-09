import 'dotenv/config';
import crypto from 'node:crypto';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { desc, eq } from 'drizzle-orm';
import { addToQueue, cancelSession, getQueueStatus, startQueueProcessor } from '../lib/queue-manager.js';

interface PollSnapshot {
  attempt: number;
  queueStatus: string | null;
  queuePosition: number | null;
  estimatedWaitSeconds: number | null;
  dbStatus: string | null;
  dbErrorMessage: string | null;
  timestamp: string;
}

const POLL_INTERVAL_MS = 5000;
const MAX_POLLS = 12; // 60 seconds

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const [template] = await db.select().from(sessions)
    .where(eq(sessions.status, 'complete'))
    .orderBy(desc(sessions.updatedAt))
    .limit(1);

  if (!template) {
    throw new Error('No completed session found to clone');
  }

  const now = new Date().toISOString();
  const clonedSessionId = crypto.randomUUID();

  await db.insert(sessions).values({
    id: clonedSessionId,
    userId: template.userId,
    clerkId: template.clerkId,
    fullName: template.fullName,
    dateOfBirth: template.dateOfBirth,
    tentativeTime: template.tentativeTime,
    birthPlace: template.birthPlace,
    latitude: template.latitude,
    longitude: template.longitude,
    timezone: template.timezone,
    gender: template.gender,
    physicalTraits: template.physicalTraits,
    forensicTraits: template.forensicTraits,
    lifeEvents: template.lifeEvents,
    spouseData: template.spouseData,
    offsetConfig: template.offsetConfig,
    status: 'draft',
    rectifiedTime: null,
    accuracy: null,
    confidence: null,
    analysisResult: null,
    progressData: null,
    reasoningLogs: null,
    errorMessage: null,
    errorCode: null,
    createdAt: now,
    updatedAt: now,
  } as typeof sessions.$inferInsert);

  const queueSubmitResult = await addToQueue(clonedSessionId);
  startQueueProcessor();

  const snapshots: PollSnapshot[] = [];
  for (let attempt = 1; attempt <= MAX_POLLS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS);

    const queue = await getQueueStatus(clonedSessionId);
    const [row] = await db.select({
      status: sessions.status,
      errorMessage: sessions.errorMessage,
      updatedAt: sessions.updatedAt,
    }).from(sessions).where(eq(sessions.id, clonedSessionId)).limit(1);

    const snapshot: PollSnapshot = {
      attempt,
      queueStatus: queue?.status ?? null,
      queuePosition: queue?.position ?? null,
      estimatedWaitSeconds: queue?.estimatedWaitSeconds ?? null,
      dbStatus: row?.status ?? null,
      dbErrorMessage: row?.errorMessage ?? null,
      timestamp: row?.updatedAt ?? new Date().toISOString(),
    };
    snapshots.push(snapshot);

    console.log(
      `[poll ${attempt}] dbStatus=${snapshot.dbStatus ?? 'null'} queueStatus=${snapshot.queueStatus ?? 'null'} position=${snapshot.queuePosition ?? 'null'}`
    );

    if (row?.status === 'complete' || row?.status === 'failed') {
      break;
    }
  }

  const [finalRow] = await db.select({
    status: sessions.status,
    errorMessage: sessions.errorMessage,
    rectifiedTime: sessions.rectifiedTime,
    confidence: sessions.confidence,
    accuracy: sessions.accuracy,
  }).from(sessions).where(eq(sessions.id, clonedSessionId)).limit(1);

  let cleanup: { cancelled: boolean; deleted: boolean } | null = null;
  if (finalRow && (finalRow.status === 'pending' || finalRow.status === 'queued' || finalRow.status === 'processing')) {
    const cancelled = await cancelSession(clonedSessionId);
    const deleteRows = await db.delete(sessions)
      .where(eq(sessions.id, clonedSessionId))
      .returning({ id: sessions.id });
    cleanup = {
      cancelled,
      deleted: deleteRows.length > 0,
    };
  }

  console.log('SMOKE_RESULT_JSON_START');
  console.log(JSON.stringify({
    templateSessionId: template.id,
    clonedSessionId,
    queueSubmitResult,
    finalRow,
    cleanup,
    snapshots,
  }, null, 2));
  console.log('SMOKE_RESULT_JSON_END');
}

main().catch((error) => {
  console.error('Smoke run failed:', error);
  process.exit(1);
});
