/**
 * Stream Ticket Manager — EventSource Authentication Workaround
 *
 * The browser-native EventSource API does not support custom HTTP headers,
 * making it impossible to send an Authorization: Bearer <token> header for
 * Server-Sent Events connections. This module provides a ticket-based auth
 * pattern as a secure workaround:
 *
 * FULL INTEGRATION FLOW (all actively used):
 *
 *   1. Frontend (use-stream-progress.ts):
 *      Calls POST /api/stream/ticket/:sessionId with a Clerk Bearer token
 *      to obtain a short-lived, single-use stream ticket.
 *
 *   2. Backend route (routes/stream.ts):
 *      The POST /ticket/:sessionId endpoint — guarded by authMiddleware +
 *      session-ownership verification — calls createStreamTicket() to mint
 *      a UUID ticket bound to (externalId, sessionId) with a 2-minute TTL.
 *
 *   3. Frontend opens EventSource (use-stream-progress.ts):
 *      Connects to GET /api/stream/:sessionId?ticket=<ticket> — no
 *      Authorization header (impossible with native EventSource).
 *
 *   4. Auth middleware (middleware/auth.ts):
 *      Detects a stream request with no Authorization header but with a
 *      ?ticket query param, calls consumeStreamTicket() to authenticate
 *      the connection. The ticket is consumed immediately (single-use).
 *
 *   5. SSE handler (routes/stream.ts):
 *      Receives req.externalId and req.sessionId set by the auth middleware,
 *      then performs its own session-ownership verification before opening
 *      the SSE stream.
 *
 * DESIGN NOTES:
 *  - Tickets are single-use (deleted on consume) to prevent replay attacks.
 *  - Tickets expire after 2 minutes (DEFAULT_TTL_MS) to limit window of misuse.
 *  - Tickets are stored in memory only (no persistence), suitable for single-
 *    instance deployments. For multi-instance, a Redis-backed ticket store
 *    would be needed.
 *  - The auth middleware prioritizes Authorization header over ticket:
 *    ticket auth is only attempted when no Bearer token is present AND the
 *    request targets a /stream endpoint.
 *  - getActiveStreamTicketCount() is available for observability/monitoring
 *    but is not currently wired into any metrics dashboard.
 */

import crypto from 'node:crypto';
import { logger } from '../utils/logger.js';

interface StreamTicketRecord {
  externalId: string;
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

/**
 * Creates a short-lived, single-use stream ticket for EventSource auth.
 *
 * Called from the POST /api/stream/ticket/:sessionId route after the
 * caller has been authenticated via Clerk Bearer token and session
 * ownership has been verified.
 *
 * @param externalId  - The authenticated user's external ID.
 * @param sessionId - The BTR session ID the caller wants to stream.
 * @param ttlMs    - Ticket time-to-live in milliseconds (default: 2 minutes).
 * @returns A UUID ticket string to be passed as ?ticket=<value> to the SSE endpoint.
 */
export function createStreamTicket(externalId: string, sessionId: string, ttlMs: number = DEFAULT_TTL_MS): string {
  ensureCleanupTimer();
  const nowMs = Date.now();
  cleanupExpiredTickets(nowMs);

  const ticket = crypto.randomUUID();
  tickets.set(ticket, {
    externalId,
    sessionId,
    expiresAtMs: nowMs + ttlMs,
  });

  return ticket;
}

/**
 * Consumes (validates and destroys) a stream ticket.
 *
 * Called from auth middleware (middleware/auth.ts) when a stream request
 * arrives with a ?ticket query param and no Authorization header.
 *
 * The ticket is deleted immediately on first read (single-use semantics)
 * to prevent replay attacks.
 *
 * @param ticket - The UUID ticket string from the ?ticket query parameter.
 * @returns The { externalId, sessionId } payload if valid and unexpired,
 *          or null if the ticket is invalid, expired, or already consumed.
 */
export function consumeStreamTicket(ticket: string): { externalId: string; sessionId: string } | null {
  const nowMs = Date.now();
  const record = tickets.get(ticket);
  if (!record) return null;

  tickets.delete(ticket); // Single-use ticket

  if (record.expiresAtMs <= nowMs) {
    return null;
  }

  return {
    externalId: record.externalId,
    sessionId: record.sessionId,
  };
}

/**
 * Returns the current number of active (unconsumed, unexpired) stream tickets.
 * Available for observability/monitoring; not currently wired to any dashboard.
 * @internal
 */
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
