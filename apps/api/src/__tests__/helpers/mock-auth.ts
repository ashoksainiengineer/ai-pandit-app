/**
 * Mock Auth Utilities — Pre-built vi.mock factories for auth and rate limiting.
 *
 * These mocks bypass Clerk authentication and rate limiting during tests.
 * Follows the patterns established in routes/__tests__/sessions.test.ts
 * and middleware/__tests__/auth.test.ts.
 */

import { vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// ═════════════════════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE MOCKS
// ═════════════════════════════════════════════════════════════════════════════

interface MockAuthOptions {
  externalId?: string;
  userId?: string;
  sessionId?: string;
}

/**
 * Default mock auth middleware — sets req.externalId and calls next().
 * Does NOT verify tokens or call Clerk APIs.
 *
 * Usage:
 *   vi.mock('../../middleware/auth.js', () => mockClerkAuth());
 */
export function mockClerkAuth(options: MockAuthOptions = {}) {
  const defaultClerkId = options.externalId ?? 'test_clerk_id';
  const defaultUserId = options.userId ?? 'test_user_id';
  const defaultSessionId = options.sessionId ?? 'test_session_id';

  return {
    authMiddleware: (req: Request, _res: Response, next: NextFunction) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const headers = (req.headers as Record<string, string>) || {};
      (req as any).externalId = headers['x-test-clerk-id'] || defaultClerkId;
      (req as any).userId = headers['x-test-user-id'] || defaultUserId;
      (req as any).sessionId = headers['x-test-session-id'] || defaultSessionId;
      next();
    },
    AuthenticatedRequest: {} as unknown,
  };
}

/**
 * Mock Clerk backend — prevents actual Clerk SDK calls.
 *
 * Usage:
 *   vi.mock('@clerk/backend', () => mockClerkBackend());
 */
export function mockClerkBackend() {
  return {
    createClerkClient: vi.fn(() => ({
      users: { getUser: vi.fn() },
      sessions: { getSession: vi.fn() },
    })),
    verifyToken: vi.fn().mockResolvedValue({
      sub: 'test_clerk_id',
      sid: 'test_session_id',
    }),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// RATE LIMITING MOCKS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Mock rate limiting middleware — passes through all requests.
 *
 * Usage:
 *   vi.mock('../../middleware/rate-limit.js', () => mockRateLimit());
 */
export function mockRateLimit() {
  const passthroughMiddleware = (_req: Request, _res: Response, next: NextFunction) => next();

  return {
    defaultRateLimiter: passthroughMiddleware,
    strictRateLimiter: passthroughMiddleware,
    apiRateLimiter: passthroughMiddleware,
    calculateRateLimiter: passthroughMiddleware,
    healthRateLimiter: passthroughMiddleware,
    createRateLimiter: vi.fn(() => passthroughMiddleware),
    RateLimiter: class {},
    MemoryStore: class {},
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPRESS MIDDLEWARE FACTORY
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Inline middleware factory for use in test-app.ts.
 * Injects mock auth context without needing vi.mock hoisting.
 */
export function createMockAuthMiddleware(options: MockAuthOptions = {}) {
  const externalId = options.externalId ?? 'test_clerk_id';
  const userId = options.userId ?? 'test_user_id';
  const sessionId = options.sessionId ?? 'test_session_id';

  return (req: Request, _res: Response, next: NextFunction): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headers = (req.headers as Record<string, string>) || {};
    (req as any).externalId = headers['x-test-clerk-id'] || externalId;
    (req as any).userId = headers['x-test-user-id'] || userId;
    (req as any).sessionId = headers['x-test-session-id'] || sessionId;
    next();
  };
}
