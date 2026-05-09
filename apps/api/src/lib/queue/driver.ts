import type { Job } from '@ai-pandit/db/schema';

export interface QueueDriver {
  readonly name: string;
  listActiveJobs(): Promise<Job[]>;
  countActiveJobs(): Promise<number>;
  claimNextQueuedJob(): Promise<Job | null>;
  enqueueSession(sessionId: string): Promise<void>;
  scheduleRetrySession(sessionId: string, nextRetryAtIso: string): Promise<void>;
  moveToDeadLetter(sessionId: string, payload: Record<string, unknown>): Promise<void>;
}
