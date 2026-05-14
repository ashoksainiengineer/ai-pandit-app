import crypto from 'node:crypto';
import { logger } from '../utils/logger.js';
import type { RedisClient } from './redis-event-store.js';

const DEFAULT_TTL_SECONDS = 120;
const TICKET_KEY_PREFIX = 'stream-ticket:';

export interface StreamTicketPayload {
  externalId: string;
  sessionId: string;
}

interface InMemoryTicket extends StreamTicketPayload {
  expiresAtMs: number;
}

let redisClient: RedisClient | null = null;
let redisAvailable = false;
const inMemoryTickets = new Map<string, InMemoryTicket>();
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

export function initStreamTicketStore(client: RedisClient): void {
  redisClient = client;
  redisAvailable = true;
  logger.info('[StreamTicket] Redis-backed ticket store initialized');
}

export function isRedisAvailable(): boolean {
  return redisAvailable && redisClient !== null;
}

export async function createStreamTicket(
  externalId: string,
  sessionId: string,
  ttlMs: number = DEFAULT_TTL_SECONDS * 1000,
): Promise<string> {
  const ticket = crypto.randomUUID();
  const payload = JSON.stringify({ externalId, sessionId });

  if (redisClient && redisAvailable) {
    try {
      await redisClient.set(`${TICKET_KEY_PREFIX}${ticket}`, payload, DEFAULT_TTL_SECONDS);
      return ticket;
    } catch (error) {
      logger.warn('[StreamTicket] Redis set failed, falling back to in-memory', {
        error: error instanceof Error ? error.message : String(error),
      });
      redisAvailable = false;
    }
  }

  ensureCleanupTimer();
  cleanupExpiredTickets(Date.now());
  inMemoryTickets.set(ticket, {
    externalId,
    sessionId,
    expiresAtMs: Date.now() + ttlMs,
  });

  return ticket;
}

export async function consumeStreamTicket(ticket: string): Promise<StreamTicketPayload | null> {
  if (redisClient && redisAvailable) {
    try {
      const key = `${TICKET_KEY_PREFIX}${ticket}`;
      const val = await redisClient.get(key);
      if (val) {
        await redisClient.del(key);
        return JSON.parse(val) as StreamTicketPayload;
      }
    } catch (error) {
      logger.warn('[StreamTicket] Redis get/del failed, checking in-memory fallback', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const record = inMemoryTickets.get(ticket);
  if (!record) return null;

  inMemoryTickets.delete(ticket);
  if (record.expiresAtMs <= Date.now()) return null;

  return { externalId: record.externalId, sessionId: record.sessionId };
}

export function getActiveStreamTicketCount(): number {
  return inMemoryTickets.size;
}

export function getTicketStoreMode(): 'redis' | 'memory' {
  return redisAvailable && redisClient !== null ? 'redis' : 'memory';
}

function cleanupExpiredTickets(nowMs: number): void {
  for (const [ticket, record] of inMemoryTickets.entries()) {
    if (record.expiresAtMs <= nowMs) {
      inMemoryTickets.delete(ticket);
    }
  }
}

function ensureCleanupTimer(): void {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(() => {
      try {
        cleanupExpiredTickets(Date.now());
      } catch (error) {
        logger.warn('[StreamTicket] In-memory cleanup failed', { error });
      }
    }, 60_000).unref();
  }
}
