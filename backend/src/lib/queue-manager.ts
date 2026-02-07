// lib/queue-manager.ts
// Efficient queue system for high-performance AI backend
// Design: Process multiple requests concurrently based on system capacity

import { db, executeWithRetry } from '../database/drizzle.js';
import { sessions } from '../database/schema.js';
import { eq, and, or, desc, asc, lt } from 'drizzle-orm';
import { logger } from './logger.js';
import {
  safeDecrypt,
  isEncrypted,
  decryptObject,
  safeDecryptWithFallback,
} from './encryption/index.js';
import {
  createAbortController,
  abortSession as abortSessionController,
  cleanupController,
  isCancellationError
} from './cancellation-manager.js';
import { emitComplete } from './session-events.js';
import { ProgressTracker } from './progress-tracker.js';
import { config } from '../config/index.js';


// ═════════════════════════════════════════════════════════════════════════════
// QUEUE CONFIGURATION (Optimized for HF Spaces Free Tier: 16GB RAM)
// ═════════════════════════════════════════════════════════════════════════════

const QUEUE_CONFIG = {
  // Default 3 concurrent sessions - can handle up to 3 simultaneous BTR analyses
  // With 16GB RAM, each session gets ~5GB which is sufficient for God-Tier BTR
  maxConcurrent: config.queue.maxConcurrent,

  pollIntervalMs: config.queue.pollIntervalMs,
  maxQueueSize: config.queue.maxSize,

  // 2 hour timeout for complex BTR analyses with multiple life events
  staleTimeoutMs: config.queue.staleTimeoutMs,

  // Base analysis time ~4 minutes per session with DeepSeek R1
  baseAnalysisTime: config.queue.baseAnalysisTime,

  // Contention factor - minimal overhead per additional concurrent session
  contentionMultiplier: config.queue.contentionMultiplier,

  // Memory thresholds (in GB) for automatic throttling
  memoryPressureThresholdGB: config.memory.pressureThresholdGB,
  memoryCriticalThresholdGB: config.memory.criticalThresholdGB,
};

// ═════════════════════════════════════════════════════════════════════════════
// C4 FIX: Retry & Circuit Breaker Configuration
// ═════════════════════════════════════════════════════════════════════════════

const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 60000,  // 1 minute max
  backoffMultiplier: 2,
  circuitBreakerThreshold: 5,  // After 5 consecutive failures, pause
  circuitBreakerResetMs: 300000,  // Reset after 5 minutes
};

// Track consecutive failures for circuit breaker
let consecutiveFailures = 0;
let lastFailureTime = 0;

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE STATUS TYPES
// ═════════════════════════════════════════════════════════════════════════════

import type { QueueStatus, QueuePosition, QueueSubmitResult } from '../types/index.js';

// Re-export types for backwards compatibility
export type { QueueStatus, QueuePosition, QueueSubmitResult };

// ═════════════════════════════════════════════════════════════════════════════
// IN-MEMORY STATE (minimal - just tracking current jobs)
// ═════════════════════════════════════════════════════════════════════════════

// Track multiple concurrent processing IDs
const activeProcessingIds = new Set<string>();
const processingStartTimes = new Map<string, number>(); // sessionId -> timestamp
let isProcessorRunning = false;

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE OPERATIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Add a new request to the queue
 * Returns queue position and estimated wait time
 */
export async function addToQueue(sessionId: string): Promise<QueueSubmitResult> {
  try {
    // Check queue size limit
    const queuedCount = await getQueuedCount();

    if (queuedCount >= QUEUE_CONFIG.maxQueueSize) {
      return {
        success: false,
        error: 'Queue is full. Please try again in a few minutes.',
      };
    }

    // Update session status to queued
    await executeWithRetry(() =>
      db.update(sessions)
        .set({
          status: 'queued',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(sessions.id, sessionId))
    );

    // Start processor if not running
    startQueueProcessor();

    const status = await getQueueStatus(sessionId);

    logger.info('Request added to queue', {
      sessionId,
      position: status?.position || 0,
      estimatedWait: status?.estimatedWaitSeconds || 0,
    });

    return {
      success: true,
      sessionId,
      position: status?.position || 0,
      estimatedWaitSeconds: status?.estimatedWaitSeconds || 0,
    };
  } catch (error) {
    logger.error('Failed to add to queue', error);
    return {
      success: false,
      error: 'Failed to queue request',
    };
  }
}

/**
 * Get current queue position for a session
 */
export async function getQueuePosition(sessionId: string): Promise<number> {
  try {
    // Get all active sessions (processing or queued) ordered by creation time
    const active = await executeWithRetry(() =>
      db.select({ id: sessions.id, status: sessions.status })
        .from(sessions)
        .where(or(
          eq(sessions.status, 'queued'),
          eq(sessions.status, 'processing')
        ))
        .orderBy(asc(sessions.createdAt))
    );

    const item = active.find(s => s.id === sessionId);
    if (!item) return 0;

    // If already processing, position is effectively 0
    if (item.status === 'processing') return 0;

    // Find index among ONLY queued items, BUT only those that aren't in the top 'maxConcurrent' spots
    const index = active.findIndex(s => s.id === sessionId);

    // Position = Rank - active_slots + 1
    // Example: indices 0,1,2 are active. Index 3 is next (Position 1).
    const position = Math.max(1, index - QUEUE_CONFIG.maxConcurrent + 1);

    return position;
  } catch (error) {
    logger.error('Failed to get queue position', error);
    return 0;
  }
}

/**
 * Get full queue status for a session
 */
export async function getQueueStatus(sessionId: string): Promise<QueuePosition | null> {
  try {
    const session = await executeWithRetry(() =>
      db.select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1)
    );

    if (session.length === 0) {
      return null;
    }

    const s = session[0];
    const position = s.status === 'queued' || s.status === 'processing'
      ? await getQueuePosition(sessionId)
      : 0;

    // 🚀 GOD-TIER DYNAMIC WAIT ESTIMATION
    let estimatedWaitSeconds = 0;
    const activeCount = activeProcessingIds.size;

    if (s.status === 'queued') {
      // 1. Calculate how much time is left in the CURRENT active slots
      const contentionFactor = 1 + (Math.max(0, activeCount - 1) * QUEUE_CONFIG.contentionMultiplier);
      const adjustedCycleTime = QUEUE_CONFIG.baseAnalysisTime * contentionFactor;

      const sessionTimes = Array.from(processingStartTimes.values());
      const remainingTimes = sessionTimes.map(startTime => {
        const elapsed = (Date.now() - startTime) / 1000;
        return Math.max(10, adjustedCycleTime - elapsed);
      });

      // The next slot opens at the MIN of remaining times
      const nextSlotAvailableIn = remainingTimes.length > 0 ? Math.min(...remainingTimes) : 0;

      // 2. Add time for people ahead of you in the queue
      const itemsAhead = Math.max(0, position - 1);
      const waitPerQueueItem = adjustedCycleTime / QUEUE_CONFIG.maxConcurrent;

      estimatedWaitSeconds = Math.ceil(nextSlotAvailableIn + (itemsAhead * waitPerQueueItem));
    }

    const totalInQueue = await getQueuedCount();

    return {
      sessionId,
      status: s.status as QueueStatus,
      position,
      estimatedWaitSeconds,
      totalInQueue,
      createdAt: s.createdAt || '',
      session: s,
    };
  } catch (error) {
    logger.error('Failed to get queue status', error);
    return null;
  }
}

/**
 * Get count of queued + processing requests
 */
async function getQueuedCount(): Promise<number> {
  try {
    const result = await executeWithRetry(() =>
      db.select({ id: sessions.id })
        .from(sessions)
        .where(or(
          eq(sessions.status, 'queued'),
          eq(sessions.status, 'processing')
        ))
    );

    return result.length;
  } catch (error) {
    return 0;
  }
}

/**
 * Get next session to process (FIFO)
 */
async function getNextInQueue(): Promise<string | null> {
  try {
    // Check for both 'pending' (new submissions) and 'queued' status
    const next = await executeWithRetry(() =>
      db.select({ id: sessions.id })
        .from(sessions)
        .where(
          or(
            eq(sessions.status, 'pending'),
            eq(sessions.status, 'queued')
          )
        )
        .orderBy(asc(sessions.createdAt))
        .limit(1)
    );

    return next.length > 0 ? next[0].id : null;
  } catch (error) {
    logger.error('Failed to get next in queue', error);
    return null;
  }
}

/**
 * Mark session as processing
 */
async function markAsProcessing(sessionId: string): Promise<void> {
  await executeWithRetry(() =>
    db.update(sessions)
      .set({
        status: 'processing',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sessions.id, sessionId))
  );

  activeProcessingIds.add(sessionId);
  processingStartTimes.set(sessionId, Date.now());
}

/**
 * Mark session as complete with results
 */
export async function markAsComplete(
  sessionId: string,
  results: {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
    analysisResult: string;
    reasoningLogs?: string | null;
  }
): Promise<void> {
  await executeWithRetry(() =>
    db.update(sessions)
      .set({
        status: 'complete',
        rectifiedTime: results.rectifiedTime,
        accuracy: results.accuracy,
        confidence: results.confidence,
        analysisResult: results.analysisResult,
        reasoningLogs: results.reasoningLogs,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any)
      .where(eq(sessions.id, sessionId))
  );

  activeProcessingIds.delete(sessionId);
  processingStartTimes.delete(sessionId);

  logger.info('Session marked complete', { sessionId });

  // ⚡ Emit Complete Event so frontend gets the result!
  emitComplete(
    sessionId,
    results.rectifiedTime,
    results.accuracy,
    results.confidence
  );
}

/**
 * Mark session as failed
 */
export async function markAsFailed(sessionId: string, error: string): Promise<void> {
  await executeWithRetry(() =>
    db.update(sessions)
      .set({
        status: 'failed',
        errorMessage: error,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sessions.id, sessionId))
  );

  activeProcessingIds.delete(sessionId);
  processingStartTimes.delete(sessionId);

  logger.error('Session marked failed', { sessionId, error });
}

/**
 * Update session timestamp to prevent it from being marked as stale
 */
export async function heartbeat(sessionId: string): Promise<void> {
  await executeWithRetry(() =>
    db.update(sessions)
      .set({
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sessions.id, sessionId))
  );
}

/**
 * Cancel a session
 */
export async function cancelSession(sessionId: string): Promise<boolean> {
  try {
    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!session.length) return false;

    // Only cancel if pending, queued or processing
    if (session[0].status !== 'pending' && session[0].status !== 'queued' && session[0].status !== 'processing') {
      logger.warn(`Cannot cancel session ${sessionId}: status is '${session[0].status}' (expected pending, queued or processing)`);
      return false;
    }

    // 🛑 ABORT the running process (this will cancel fetch requests!)
    abortSessionController(sessionId);

    await executeWithRetry(() =>
      db.update(sessions)
        .set({
          status: 'failed',
          errorMessage: 'Cancelled by user',
          updatedAt: new Date().toISOString(),
          // 🗑️ HARD WIPE: Clear heavy data to save Turso Free Tier limit
          progressData: null,
          analysisResult: null,
          reasoningLogs: null
        } as any)
        .where(eq(sessions.id, sessionId))
    );

    activeProcessingIds.delete(sessionId);
    processingStartTimes.delete(sessionId);

    logger.info('Session cancelled by user (Hard Wipe Complete)', { sessionId });
    return true;
  } catch (error) {
    logger.error('Failed to cancel session', error);
    return false;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// C4 FIX: Retry & Circuit Breaker Helper Functions
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelayMs);
}

/**
 * Check if circuit breaker should trip
 */
function shouldTripCircuitBreaker(): boolean {
  if (consecutiveFailures >= RETRY_CONFIG.circuitBreakerThreshold) {
    const timeSinceLastFailure = Date.now() - lastFailureTime;
    // Reset after 5 minutes of no failures
    if (timeSinceLastFailure > RETRY_CONFIG.circuitBreakerResetMs) {
      consecutiveFailures = 0;
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Determine if error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    // Network errors - retry
    if (msg.includes('timeout') ||
      msg.includes('network') ||
      msg.includes('econnrefused') ||
      msg.includes('enotfound') ||
      msg.includes('rate limit') ||
      msg.includes('429') ||
      msg.includes('503') ||
      msg.includes('too many requests') ||
      msg.includes('etimedout') ||
      msg.includes('econnreset')) {
      return true;
    }

    // AI service errors - retry
    if (msg.includes('ai_analysis_incomplete') ||
      msg.includes('openrouter') ||
      msg.includes('temporarily unavailable') ||
      msg.includes('service unavailable')) {
      return true;
    }

    // Database transient errors - retry
    if (msg.includes('database is locked') ||
      msg.includes('busy') ||
      msg.includes('sqlITE_BUSY')) {
      return true;
    }
  }

  return false;
}

/**
 * Process session with retry logic (C4 Fix)
 */
async function processSessionWithRetry(sessionId: string, attempt: number = 0): Promise<void> {
  try {
    await processSessionAsync(sessionId);

    // Success - reset failure counter
    if (consecutiveFailures > 0) {
      logger.info(`Session ${sessionId} succeeded after ${consecutiveFailures} previous failures. Resetting counter.`);
      consecutiveFailures = 0;
    }

  } catch (error) {
    const isRetryable = isRetryableError(error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    if (isRetryable && attempt < RETRY_CONFIG.maxRetries) {
      const delay = getRetryDelay(attempt);
      logger.warn(`Retrying session ${sessionId} after ${delay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries})`, {
        error: errorMsg,
        isRetryable,
      });

      await sleep(delay);
      return processSessionWithRetry(sessionId, attempt + 1);
    }

    // Non-retryable or max retries exceeded
    logger.error(`Session ${sessionId} failed permanently after ${attempt + 1} attempts`, {
      error: errorMsg,
      isRetryable,
    });

    consecutiveFailures++;
    lastFailureTime = Date.now();

    // Try to mark as failed (with its own error handling)
    try {
      await markAsFailed(sessionId, errorMsg);
    } catch (markError) {
      logger.error(`Failed to mark session ${sessionId} as failed`, markError);
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE PROCESSOR
// ═════════════════════════════════════════════════════════════════════════════

// Import seconds-precision analysis function for ultimate accuracy
import { processSecondsPrecisionBTR } from './seconds-precision-btr.js';

/**
 * Start the queue processor
 * Runs in background, processes one request at a time
 */
export function startQueueProcessor(): void {
  if (isProcessorRunning) {
    return; // Already running
  }

  isProcessorRunning = true;
  processQueue();
}

/**
 * Main queue processing loop (C4 Fix: Global error handling + Circuit breaker)
 */
async function processQueue(): Promise<void> {
  logger.info('Queue processor loop started with C4 fixes (retry + circuit breaker)');

  while (isProcessorRunning) {
    try {
      // C4: Circuit breaker check
      if (shouldTripCircuitBreaker()) {
        const remainingMs = RETRY_CONFIG.circuitBreakerResetMs - (Date.now() - lastFailureTime);
        const remainingSec = Math.ceil(remainingMs / 1000);
        logger.error(`🔴 CIRCUIT BREAKER TRIPPED: ${consecutiveFailures} consecutive failures. Pausing for ${remainingSec}s...`);
        await sleep(60000);  // Wait 60s before checking again
        continue;
      }

      // Check for stale processing requests (crashed mid-process)
      await cleanupStaleRequests();

      // 🚀 GOD-TIER: Dynamic Pressure Throttling (HF Spaces Free Tier: 16GB RAM)
      const memory = process.memoryUsage();
      const heapUsedGB = memory.heapUsed / 1024 / 1024 / 1024;
      const heapTotalGB = memory.heapTotal / 1024 / 1024 / 1024;
      const rssGB = memory.rss / 1024 / 1024 / 1024;
      let effectiveMaxConcurrent = QUEUE_CONFIG.maxConcurrent;

      // Pressure restriction triggers when:
      // RSS > threshold (actual system memory pressure)
      // OR heapUsed > threshold (Node.js heap getting full)
      // This ensures stability while utilizing HF Spaces 16GB capacity
      const RSS_THRESHOLD_GB = config.memory.gcThresholdGB;
      const HEAP_THRESHOLD_GB = config.memory.heapThresholdGB;

      // Only log memory stats every 10 iterations to reduce noise
      if (Math.random() < 0.1) {
        logger.info(`[MEMORY] RSS: ${rssGB.toFixed(2)}GB | Heap: ${heapUsedGB.toFixed(2)}GB / ${heapTotalGB.toFixed(2)}GB | Concurrent: ${activeProcessingIds.size}/${effectiveMaxConcurrent} | Failures: ${consecutiveFailures}`);
      }

      if (rssGB > RSS_THRESHOLD_GB || heapUsedGB > HEAP_THRESHOLD_GB) {
        logger.warn(`[PRESSURE] RAM Pressure detected (RSS: ${rssGB.toFixed(2)}GB, Heap: ${heapUsedGB.toFixed(2)}GB), restricting concurrency from ${effectiveMaxConcurrent} to 1`);
        effectiveMaxConcurrent = 1;

        // Trigger GC if available
        if ((global as any).gc) {
          logger.info('[MEMORY] Triggering manual GC due to pressure');
          (global as any).gc();
        }
      }

      // Check concurrent limit
      if (activeProcessingIds.size >= effectiveMaxConcurrent) {
        // High frequency logging for wait state
        const queuedCount = await getQueuedCount();
        if (queuedCount > activeProcessingIds.size) {
          logger.debug('Queue blocked: all slots full', {
            active: activeProcessingIds.size,
            max: QUEUE_CONFIG.maxConcurrent
          });
        }
        await sleep(1000);
        continue;
      }

      // Get next in queue
      const nextId = await getNextInQueue();

      if (nextId === null) {
        // Queue empty, wait and check again
        await sleep(2000);
        continue;
      }

      // Mark as processing
      await markAsProcessing(nextId);

      // ⚡ C4 FIX: Use retry wrapper instead of direct call
      // Fire and loop back immediately to pick up next task if slot available
      processSessionWithRetry(nextId).catch(err => {
        // Final safety net - should not reach here due to internal error handling
        logger.error(`🔴 CRITICAL: Unhandled error in processSessionWithRetry for ${nextId}`, err);
        consecutiveFailures++;
        lastFailureTime = Date.now();
      });

    } catch (error) {
      logger.error('Queue processor error', error);
      consecutiveFailures++;
      lastFailureTime = Date.now();

      // C4: Exponential backoff for queue processor errors
      const delay = getRetryDelay(Math.min(consecutiveFailures, 5));
      logger.info(`Queue processor backing off for ${delay}ms due to error`);
      await sleep(delay);
    }
  }
}

/**
 * Process a single session (async worker)
 */
async function processSessionAsync(sessionId: string): Promise<void> {
  try {
    logger.info('Starting to process request', { sessionId });

    // Get session data
    const session = await executeWithRetry(() =>
      db.select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1)
    );

    if (session.length === 0) {
      await markAsFailed(sessionId, 'Session not found');
      return;
    }

    const s = session[0];

    // 🛑 Create AbortController for this session
    const abortController = createAbortController(sessionId);

    // Process the analysis
    try {
      // 🔐 Decrypt sensitive data using clerkId (encryption key)
      // lifeEvents is nullable for drafts, but at processing stage it must exist
      if (!s.lifeEvents) {
        throw new Error('lifeEvents data is missing - cannot process without life events');
      }
      const lifeEventsData = safeDecryptWithFallback(s.lifeEvents, s.clerkId, s.userId);
      if (!lifeEventsData) {
        throw new Error('Failed to decrypt lifeEvents data');
      }
      const decryptedLifeEvents = JSON.parse(lifeEventsData);

      let decryptedPhysicalTraits: any = undefined;
      if (s.physicalTraits) {
        const decrypted = safeDecryptWithFallback(s.physicalTraits, s.clerkId, s.userId);
        if (decrypted) {
          try {
            decryptedPhysicalTraits = JSON.parse(decrypted);
          } catch (e) {
            logger.warn('Failed to parse physicalTraits JSON, using undefined', { sessionId, error: e });
          }
        }
      }

      let decryptedForensicTraits: any = undefined;
      if (s.forensicTraits) {
        const decrypted = safeDecryptWithFallback(s.forensicTraits, s.clerkId, s.userId);
        if (decrypted) {
          try {
            decryptedForensicTraits = JSON.parse(decrypted);
          } catch (e) {
            logger.warn('Failed to parse forensicTraits JSON, using undefined', { sessionId, error: e });
          }
        }
      }

      const result = await processSecondsPrecisionBTR({
        sessionId: sessionId,
        dateOfBirth: s.dateOfBirth,
        tentativeTime: s.tentativeTime,
        latitude: s.latitude,
        longitude: s.longitude,
        timezone: s.timezone,
        lifeEvents: decryptedLifeEvents,
        offsetConfig: s.offsetConfig ? JSON.parse(s.offsetConfig) : { preset: '1hour' },
        physicalTraits: decryptedPhysicalTraits,
        forensicTraits: decryptedForensicTraits,
        abortSignal: abortController.signal, // 🛑 Pass abort signal
      });

      // ✂️ SPLIT REASONING LOGS (Database Optimization)
      // Capture the persistent stage history from the ProgressTracker
      let reasoningLogs: string | null = null;
      let optimizedAnalysisStr = "";

      try {
        const tracker = ProgressTracker.getInstance(sessionId);
        if (tracker) {
          const history = tracker.getProgress().stageHistory;
          reasoningLogs = JSON.stringify(history);
        }

        optimizedAnalysisStr = JSON.stringify(result.analysisResult);
      } catch (e) {
        logger.warn('Failed to serialize analysis result', e);
        optimizedAnalysisStr = JSON.stringify({ error: "Serialization failed" });
      }

      await markAsComplete(sessionId, {
        ...result,
        analysisResult: optimizedAnalysisStr,
        reasoningLogs
      });

      cleanupController(sessionId); // Cleanup on success
    } catch (error) {
      // Check if this was a cancellation
      if (isCancellationError(error)) {
        logger.info('Session processing cancelled', { sessionId });
        cleanupController(sessionId);
        // Status already set to 'failed' by cancelSession, no need to update
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        await markAsFailed(sessionId, errorMsg);
        cleanupController(sessionId);
      }
    }
  } catch (error) {
    logger.error('Async worker error', error);
  } finally {
    // 🛡️ Ensure slot is ALWAYS released
    activeProcessingIds.delete(sessionId);

    // 🚀 GOD-TIER MEMORY RECOVERY
    // Manually trigger Garbage Collection if --expose-gc is enabled
    if ((global as any).gc) {
      logger.info('[MEMORY] Triggering manual GC after session recovery');
      (global as any).gc();
    }
  }
}

/**
 * Cleanup stale requests (stuck in processing for too long)
 */
async function cleanupStaleRequests(): Promise<void> {
  try {
    const staleThreshold = new Date(Date.now() - QUEUE_CONFIG.staleTimeoutMs).toISOString();

    // Find processing requests that are too old
    const stale = await executeWithRetry(() =>
      db.select({ id: sessions.id })
        .from(sessions)
        .where(and(
          eq(sessions.status, 'processing'),
          lt(sessions.updatedAt, staleThreshold)
        ))
    );

    for (const s of stale) {
      await markAsFailed(s.id, 'Request timed out');
      logger.warn('Cleaned up stale request', { sessionId: s.id });
    }
  } catch (error) {
    logger.error('Cleanup stale requests failed', error);
  }
}

/**
 * Stop the queue processor (for graceful shutdown)
 */
export function stopQueueProcessor(): void {
  isProcessorRunning = false;
  logger.info('Queue processor stopped');
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  queuedCount: number;
  processingCount: number;
  completedToday: number;
  averageWaitTime: number;
}> {
  try {
    const queued = await db.select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.status, 'queued'));

    const processing = await db.select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.status, 'processing'));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const completed = await db.select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.status, 'complete'));

    return {
      queuedCount: queued.length,
      processingCount: processing.length,
      completedToday: completed.length,
      averageWaitTime: QUEUE_CONFIG.baseAnalysisTime,
    };
  } catch (error) {
    logger.error('Failed to get queue stats', error);
    return {
      queuedCount: 0,
      processingCount: 0,
      completedToday: 0,
      averageWaitTime: 30,
    };
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// UTILITY
// ═════════════════════════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Cleanup processing sessions on startup (Zombie killer)
 * Resets any session stuck in 'processing' state to 'failed'
 */
export async function cleanupZombiesOnStartup(): Promise<void> {
  try {
    const zombies = await db.select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.status, 'processing'));

    if (zombies.length > 0) {
      logger.warn(`Found ${zombies.length} zombie sessions from previous run. Cleaning up...`);

      for (const zombie of zombies) {
        await markAsFailed(zombie.id, 'Process interrupted (Server Restart)');
      }
    }
  } catch (error) {
    logger.error('Zombie cleanup failed', error);
  }
}

