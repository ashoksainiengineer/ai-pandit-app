import crypto from 'node:crypto';
import { logger } from '../utils/logger.js';

interface StreamTicketRecord {
  clerkId: string;
  sessionId: string;
  expiresAtMs: number;
}

const DEFAULT_TTL_MS = 2 * 60 * 1000;
const tickets = new Map<string, StreamTicketRecord>();

function cleanupExpiredTickets(nowMs: number): void {
  for (const [ticket, record] of tickets.entries()) {
    if (record.expiresAtMs <= nowMs) {
      tickets.delete(ticket);
    }
  }
}

export function createStreamTicket(clerkId: string, sessionId: string, ttlMs: number = DEFAULT_TTL_MS): string {
  ensureCleanupTimer();
  const nowMs = Date.now();
  cleanupExpiredTickets(nowMs);

  const ticket = crypto.randomUUID();
  tickets.set(ticket, {
    clerkId,
    sessionId,
    expiresAtMs: nowMs + ttlMs,
  });

  return ticket;
}

export function consumeStreamTicket(ticket: string): { clerkId: string; sessionId: string } | null {
  const nowMs = Date.now();
  const record = tickets.get(ticket);
  if (!record) return null;

  tickets.delete(ticket); // Single-use ticket

  if (record.expiresAtMs <= nowMs) {
    return null;
  }

  return {
    clerkId: record.clerkId,
    sessionId: record.sessionId,
  };
}

export function getActiveStreamTicketCount(): number {
  return tickets.size;
}

let _cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanupTimer(): void {
  if (!_cleanupInterval) {
    _cleanupInterval = setInterval(() => {
      try {
        cleanupExpiredTickets(Date.now());
      } catch (error) {
        logger.warn('Failed to clean expired stream tickets', { error });
      }
    }, 60_000).unref();
  }
}
