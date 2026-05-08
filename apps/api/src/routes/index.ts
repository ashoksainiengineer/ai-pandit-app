// API ROUTES INDEX

// RATE LIMITING ARCHITECTURE:
// 1. Global rate limiter in server.ts SKIPS /api/stream and /api/queue/progress
// 2. This file applies route-specific rate limiters
// 3. Progress and Stream routes have their own lenient limiters (no double-limiting)
// 4. Other routes get the standard apiRateLimiter

import { Router, Request, Response, NextFunction } from 'express';
import healthRouter from './health.js';
import calculateRouter from './calculate.js';
import queueRouter from './queue.js';
import jobsRouter from './jobs.js';
import progressRouter from './progress.js';
import streamRouter from './stream.js';
// warmupRouter removed for security realignment
import adminRouter from './admin.js';
import sessionsRouter from './sessions.js';
import candidateDetailRouter from './candidate-detail.js';
import { config } from '../config/index.js';
import consentRouter from './consent.js';
import {
  apiRateLimiter,
  calculateRateLimiter,
  strictRateLimiter,
  healthRateLimiter,
  createRateLimiter,
} from '../middleware/rate-limit.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// RATE LIMITERS
// Progress/Stream endpoints - VERY lenient for polling during analysis
// These are the only rate limiters applied to progress/stream routes
const progressRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 300, // 5 requests per second - very generous
});

// SELECTIVE API RATE LIMITER

// Custom middleware to apply apiRateLimiter EXCEPT for progress/stream routes
const selectiveApiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;

  // 🔍 DEBUG: Log path for debugging 404s
  logger.debug(`[Router] Incoming path: ${path} (original: ${req.originalUrl})`);

  // Skip rate limiting for real-time endpoints (they have their own limiters below)
  if (path.startsWith('/stream') ||
    path.startsWith('/queue/progress') ||
    path === '/queue/progress' ||
    path.startsWith('/calculate') ||
    path.startsWith('/jobs') ||
    path.startsWith('/admin') ||
    path.startsWith('/debug-analysis') ||
    path.startsWith('/sessions') ||
    path.startsWith('/candidate') ||
    path.startsWith('/health') ||
    path.startsWith('/consent') ||
    path.startsWith('/queue')) {
    return next();
  }

  // Apply apiRateLimiter to all other routes
  return apiRateLimiter(req, res, next);
};

// Apply selective rate limiter to all API routes
router.use(selectiveApiRateLimiter);

// PUBLIC ROUTES (No authentication required)

// Health check - own rate limit
router.use('/health', healthRateLimiter, healthRouter);

// Warmup endpoint removed for security realignment

// PROTECTED ROUTES (Authentication required)

// BTR calculation - most expensive operation, strict rate limit
router.use('/calculate', authMiddleware, calculateRateLimiter, calculateRouter);

// Progress endpoint - MUST come before /queue to match correctly
// Lenient rate limit for frequent polling during analysis
// NOTE: auth is enforced within progressRouter to avoid duplicate auth verification.
router.use('/queue/progress', progressRateLimiter, progressRouter);

// Queue management - strict rate limit (matches /queue but NOT /queue/progress)
// NOTE: auth is enforced within queueRouter to avoid duplicate auth verification.
router.use('/queue', strictRateLimiter, queueRouter);

// Durable job orchestration endpoints
if (config.features.useAsyncJobPipeline) {
  router.use('/jobs', strictRateLimiter, jobsRouter);
}

// Sessions CRUD - exposed for same-origin web routes and internal tooling
// The web app uses its own server routes for draft/session CRUD while API owns analysis orchestration.
router.use('/sessions', authMiddleware, apiRateLimiter, sessionsRouter);

// Consent management - record and check AI processing consent
router.use('/consent', authMiddleware, apiRateLimiter, consentRouter);

// NOTE: auth is enforced within streamRouter to avoid duplicate auth verification.
router.use('/stream', progressRateLimiter, streamRouter);

// Candidate Detail — Tiered Loading (on-demand ephemeris + reasoning)
// NOTE: auth is enforced within candidateDetailRouter to avoid duplicate auth verification.
router.use('/candidate', progressRateLimiter, candidateDetailRouter);

// Debug route (dev-only, lazily loaded to survive missing compiled output in Docker)
let debugAnalysisRouter: Router | undefined;
async function getDebugRouter(): Promise<Router> {
  if (!debugAnalysisRouter) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore debug-analysis may be excluded from build
    try { debugAnalysisRouter = (await import('./debug-analysis.js')).default; } catch { debugAnalysisRouter = Router(); }
  }
  return debugAnalysisRouter;
}
router.use('/debug-analysis', authMiddleware, strictRateLimiter, async (req, res, next) => {
  (await getDebugRouter())(req, res, next);
});

// Routes-test endpoint removed for security audit (PROD-001: unprotected debug route)
export { router as routes };
