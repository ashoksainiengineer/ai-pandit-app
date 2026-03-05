// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTES INDEX - Production Grade
// ═══════════════════════════════════════════════════════════════════════════════
// 
// RATE LIMITING ARCHITECTURE:
// ───────────────────────────
// 1. Global rate limiter in server.ts SKIPS /api/stream and /api/queue/progress
// 2. This file applies route-specific rate limiters
// 3. Progress and Stream routes have their own lenient limiters (no double-limiting)
// 4. Other routes get the standard apiRateLimiter
//
// ═══════════════════════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import healthRouter from './health.js';
import calculateRouter from './calculate.js';
import queueRouter from './queue.js';
import progressRouter from './progress.js';
import streamRouter from './stream.js';
import warmupRouter from './warmup.js';
import adminRouter from './admin.js';
import sessionsRouter from './sessions.js';
import candidateDetailRouter from './candidate-detail.js';
import {
  apiRateLimiter,
  calculateRateLimiter,
  strictRateLimiter,
  healthRateLimiter,
  createRateLimiter,
} from '../middleware/rate-limit.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITERS
// ═══════════════════════════════════════════════════════════════════════════════

// Progress/Stream endpoints - VERY lenient for polling during analysis
// These are the only rate limiters applied to progress/stream routes
const progressRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 300, // 5 requests per second - very generous
});

// ═══════════════════════════════════════════════════════════════════════════════
// SELECTIVE API RATE LIMITER
// ═══════════════════════════════════════════════════════════════════════════════
// 
// CRITICAL: Do NOT apply apiRateLimiter globally with router.use()!
// Progress and Stream endpoints need to be excluded to prevent double-limiting.
// Instead, we apply it selectively to routes that need it.
//
// ═══════════════════════════════════════════════════════════════════════════════

// Custom middleware to apply apiRateLimiter EXCEPT for progress/stream routes
const selectiveApiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;

  // Skip rate limiting for real-time endpoints (they have their own limiters below)
  if (path.startsWith('/stream') ||
    path.startsWith('/queue/progress') ||
    path === '/queue/progress') {
    return next();
  }

  // Apply apiRateLimiter to all other routes
  return apiRateLimiter(req, res, next);
};

// Apply selective rate limiter to all API routes
router.use(selectiveApiRateLimiter);

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES (No authentication required)
// ═══════════════════════════════════════════════════════════════════════════════

// Health check - own rate limit
router.use('/health', healthRateLimiter, healthRouter);

// Warmup endpoint for HF Spaces
router.use('/warmup', healthRateLimiter, warmupRouter);

// ═══════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES (Authentication required)
// ═══════════════════════════════════════════════════════════════════════════════

// BTR calculation - most expensive operation, strict rate limit
router.use('/calculate', authMiddleware, calculateRateLimiter, calculateRouter);

// Progress endpoint - MUST come before /queue to match correctly
// Lenient rate limit for frequent polling during analysis
router.use('/queue/progress', authMiddleware, progressRateLimiter, progressRouter);

// Queue management - strict rate limit (matches /queue but NOT /queue/progress)
router.use('/queue', authMiddleware, strictRateLimiter, queueRouter);

// Sessions CRUD - Kept for internal use / debugging
// Primary CRUD is now handled by Vercel serverless (Option A Hybrid Architecture)
// Frontend uses Vercel /api/sessions for speed, HF only handles AI analysis
router.use('/sessions', authMiddleware, apiRateLimiter, sessionsRouter);

// Stream endpoint - SSE connection, lenient rate limit
router.use('/stream', authMiddleware, progressRateLimiter, streamRouter);

// 🔱 Candidate Detail — Tiered Loading (on-demand ephemeris + reasoning)
router.use('/candidate', progressRateLimiter, candidateDetailRouter);

// Admin routes
router.use('/admin', authMiddleware, strictRateLimiter, adminRouter);

export { router as routes };
