// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST TIMEOUT MIDDLEWARE
// Prevents long-running requests from consuming resources
// ═══════════════════════════════════════════════════════════════════════════════

import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import { logger } from '../lib/logger.js';

// ───────────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────────

interface TimeoutOptions {
  timeoutMs: number;
  message?: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// TIMEOUT MIDDLEWARE FACTORY
// ───────────────────────────────────────────────────────────────────────────────

export function createTimeoutMiddleware(options: TimeoutOptions) {
  const { timeoutMs, message = 'Request timeout' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = (req as any).id || 'unknown';
    
    // Set timeout for this request
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn(`Request timeout after ${timeoutMs}ms`, {
          requestId,
          path: req.path,
          method: req.method,
        });
        
        res.status(504).json({
          error: 'Gateway Timeout',
          message,
          requestId,
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    res.on('close', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// PRECONFIGURED MIDDLEWARES
// ───────────────────────────────────────────────────────────────────────────────

/** Standard API timeout (5 minutes) */
export const apiTimeout = createTimeoutMiddleware({
  timeoutMs: config.timeouts.requestMs,
  message: 'Request processing timeout - please try again',
});

/** AI calculation timeout (2+ hours for complex BTR with DeepSeek R1) */
export const aiTimeout = createTimeoutMiddleware({
  timeoutMs: config.timeouts.aiMs, // 2 hours default
  message: 'AI analysis timeout - your request is still processing, please check status',
});

/** Short timeout for health checks (5 seconds) */
export const healthTimeout = createTimeoutMiddleware({
  timeoutMs: 5000,
  message: 'Health check timeout',
});
