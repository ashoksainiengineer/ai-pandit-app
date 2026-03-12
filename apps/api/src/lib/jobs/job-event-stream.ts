import { getLatestJobForSession, listJobEvents, listJobEventsSince } from '@ai-pandit/db';
import type { SessionEvent } from '@ai-pandit/shared';

export interface PersistedSessionEvent {
  seq: number;
  event: SessionEvent;
}

function toSessionEvent(payload: unknown): SessionEvent | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  if (!('type' in payload) || typeof (payload as { type?: unknown }).type !== 'string') {
    return null;
  }

  return payload as SessionEvent;
}

export async function getPersistedSessionEvents(sessionId: string): Promise<PersistedSessionEvent[]> {
  const job = await getLatestJobForSession(sessionId);
  if (!job) {
    return [];
  }

  const events = await listJobEvents(job.id);
  return events
    .map((eventRow) => {
      const event = toSessionEvent(eventRow.payloadJson);
      if (!event) {
        return null;
      }

      return {
        seq: eventRow.sequenceNo,
        event,
      };
    })
    .filter((entry): entry is PersistedSessionEvent => entry !== null);
}

export async function getPersistedSessionEventsSince(
  sessionId: string,
  sequenceNo: number
): Promise<PersistedSessionEvent[]> {
  const job = await getLatestJobForSession(sessionId);
  if (!job) {
    return [];
  }

  const events = await listJobEventsSince(job.id, sequenceNo);
  return events
    .map((eventRow) => {
      const event = toSessionEvent(eventRow.payloadJson);
      if (!event) {
        return null;
      }

      return {
        seq: eventRow.sequenceNo,
        event,
      };
    })
    .filter((entry): entry is PersistedSessionEvent => entry !== null);
}
