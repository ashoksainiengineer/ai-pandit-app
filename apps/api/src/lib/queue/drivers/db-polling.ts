import {
  claimNextQueuedJob,
  countQueuedJobs,
  listActiveJobs,
} from '@ai-pandit/db/jobs';
import type { QueueDriver } from '../driver.js';

export class DbPollingQueueDriver implements QueueDriver {
  public readonly name = 'db_polling';

  public listActiveJobs() {
    return listActiveJobs();
  }

  public countQueuedJobs() {
    return countQueuedJobs();
  }

  public claimNextQueuedJob() {
    return claimNextQueuedJob();
  }

  public async enqueueSession(_sessionId: string): Promise<void> {
    // DB polling architecture claims from durable DB state directly.
  }

  public async scheduleRetrySession(_sessionId: string, _nextRetryAtIso: string): Promise<void> {
    // DB polling architecture uses DB retry timestamps without external transport.
  }

  public async moveToDeadLetter(_sessionId: string, _payload: Record<string, unknown>): Promise<void> {
    // Dead-letter context is already persisted via artifact + job failure state.
  }
}
