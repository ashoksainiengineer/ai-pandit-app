// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTES INDEX
// Centralized route mounting with security middleware
// ═══════════════════════════════════════════════════════════════════════════════

import { Router } from 'express';
import healthRouter from './health.js';
import calculateRouter from './calculate.js';
import queueRouter from './queue.js';
import progressRouter from './progress.js';
import streamRouter from './stream.js';
import warmupRouter from './warmup.js';
import adminRouter from './admin.js';
import {
  apiRateLimiter,
  calculateRateLimiter,
  strictRateLimiter,
  healthRateLimiter,
} from '../middleware/rate-limit.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════

// Apply rate limiting to all API routes
router.use(apiRateLimiter);

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// No authentication required, but rate limited
// ═══════════════════════════════════════════════════════════════════════════════

// Health check - rate limited to prevent DoS
router.use('/health', healthRateLimiter, healthRouter);

// Warmup endpoint for HF Spaces - rate limited
router.use('/warmup', healthRateLimiter, warmupRouter);

// ═══════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES
// Authentication + specific rate limits
// ═══════════════════════════════════════════════════════════════════════════════

// BTR calculation - most expensive operation, strict rate limit
router.use('/calculate', authMiddleware, calculateRateLimiter, calculateRouter);

// Queue operations - moderate rate limit
router.use('/queue/progress', authMiddleware, progressRouter);
router.use('/queue', authMiddleware, strictRateLimiter, queueRouter);

// Stream endpoint - SSE connection with auth
router.use('/stream', authMiddleware, streamRouter);

export { router as routes };
