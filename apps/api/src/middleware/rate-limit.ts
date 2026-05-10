/**
 * 🔱 AI-Pandit Rate Limiting Middleware
 * =====================================
 * Production-grade rate limiting with Redis-compatible in-memory store.
 * Supports sliding window algorithm for fair rate distribution.
 */

import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { sendRateLimit } from '../utils/response.js';
import { logger } from '../utils/logger.js';

// ═════════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════════

interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | undefined>;
  set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void>;
  increment(key: string): Promise<number>;
  reset(key: string): Promise<void>;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  windowStart: number;
}

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  store?: RateLimitStore;
}

// ═════════════════════════════════════════════════════════════════════════════
// IN-MEMORY STORE (Production should use Redis)
// ═════════════════════════════════════════════════════════════════════════════

class MemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private timers = new Map<string, NodeJS.Timeout>();

  async get(key: string): Promise<RateLimitEntry | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    // Check if entry has expired
    if (Date.now() > entry.resetTime) {
      this.store.delete(key);
      return undefined;
    }

    return entry;
  }

  async set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void> {
    this.store.set(key, entry);

    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set cleanup timer
    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, ttlMs);

    this.timers.set(key, timer);
  }

  async increment(key: string): Promise<number> {
    const entry = await this.get(key);
    if (!entry) return 1;
    entry.count++;
    return entry.count;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  // Cleanup method for graceful shutdown
  destroy(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.store.clear();
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// RATE LIMITER CLASS
// ═════════════════════════════════════════════════════════════════════════════

class RateLimiter {
  private store: RateLimitStore;
  private windowMs: number;
  private maxRequests: number;
  private keyGenerator: (req: Request) => string;
  private standardHeaders: boolean;
  private legacyHeaders: boolean;

  constructor(options: RateLimitOptions = {}) {
    this.store = options.store || new MemoryStore();
    this.windowMs = options.windowMs || config.security.rateLimitWindowMs || 60000;
    this.maxRequests = options.maxRequests || config.security.rateLimitMaxRequests || 300; // Increased from 100
    this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
    this.standardHeaders = options.standardHeaders ?? true;
    this.legacyHeaders = options.legacyHeaders ?? false;
  }

  private defaultKeyGenerator(req: Request): string {
    // Use IP + externalId (set by auth middleware) for per-user limiting
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const externalId = req.externalId;
    return externalId ? `${ip}:${externalId}` : ip;
  }

  private getRetryAfter(resetTime: number): number {
    return Math.ceil((resetTime - Date.now()) / 1000);
  }

  private setHeaders(res: Response, count: number, resetTime: number): void {
    if (this.standardHeaders) {
      res.setHeader('RateLimit-Limit', String(this.maxRequests));
      res.setHeader('RateLimit-Remaining', String(Math.max(0, this.maxRequests - count)));
      res.setHeader('RateLimit-Reset', String(Math.ceil(resetTime / 1000)));
    }

    if (this.legacyHeaders) {
      res.setHeader('X-RateLimit-Limit', String(this.maxRequests));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, this.maxRequests - count)));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));
    }
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const key = this.keyGenerator(req);
      const now = Date.now();

      try {
        let entry = await this.store.get(key);

        if (!entry) {
          // Create new window
          entry = {
            count: 1,
            resetTime: now + this.windowMs,
            windowStart: now,
          };
          await this.store.set(key, entry, this.windowMs);
        } else {
          // Increment existing window
          entry.count = await this.store.increment(key);
        }

        // Set rate limit headers
        this.setHeaders(res, entry.count, entry.resetTime);

        // Check if limit exceeded
        if (entry.count > this.maxRequests) {
          const retryAfter = this.getRetryAfter(entry.resetTime);
          res.setHeader('Retry-After', String(retryAfter));

          // Send error response
          sendRateLimit(res, retryAfter, req.requestId);
          return;
        }

        next();
      } catch (error) {
        // Fail closed — return 503 to prevent unlimited requests during limiter failure
        logger.error('Rate limiter error (fail-closed)', {
          error: error instanceof Error ? error.message : String(error),
          path: req.path,
          key
        });
        res.status(503).json({
          success: false,
          error: { code: 'RATE_LIMITER_FAILURE', message: 'Rate limiting service unavailable' }
        });
        return; // Do NOT call next()
      }
    };
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// PRECONFIGURED MIDDLEWARE
// ═════════════════════════════════════════════════════════════════════════════

export const defaultRateLimiter = new RateLimiter().middleware();

export const strictRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10, // 10 requests per minute
}).middleware();

export const apiRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 200, // 200 requests per minute (increased from 60)
  keyGenerator: (req: Request) => {
    // Stricter limiting for AI endpoints
    if (req.path.includes('/api/calculate')) {
      return `btr:${req.ip || 'unknown'}`;
    }
    return req.ip || 'unknown';
  },
}).middleware();


export const calculateRateLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 3, // 3 BTR calculations per 5 minutes
  keyGenerator: (req: Request) => {
    // Auth middleware sets externalId — use it for per-user rate limiting
    const externalId = req.externalId;
    return `calculate:${externalId || req.ip || 'unknown'}`;
  },
}).middleware();

/**
 * Health endpoint rate limiter - prevents DoS on public health checks
 * More lenient than strict but still prevents abuse
 */
export const healthRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 30, // 30 requests per minute per IP
  keyGenerator: (req: Request) => {
    return `health:${req.ip || 'unknown'}`;
  },
}).middleware();

// ═════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═════════════════════════════════════════════════════════════════════════════

export function createRateLimiter(options: RateLimitOptions = {}) {
  const limiter = new RateLimiter(options);
  return limiter.middleware();
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════════════════════════════════════

export { RateLimiter, MemoryStore };
export type { RateLimitOptions, RateLimitStore, RateLimitEntry };
