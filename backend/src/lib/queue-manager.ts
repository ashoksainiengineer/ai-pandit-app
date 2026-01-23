// lib/queue-manager.ts
// Efficient queue system for high-performance AI backend
// Design: Process multiple requests concurrently based on system capacity

import { db } from '../database/drizzle.js';
import { sessions } from '../database/schema.js';
import { eq, and, or, desc, asc, lt } from 'drizzle-orm';
import { logger } from './logger.js';
import { decryptData } from './crypto.js';
import {
  createAbortController,
  abortSession as abortSessionController,
  cleanupController,
  isCancellationError
} from './cancellation-manager.js';
import { emitComplete } from './session-events.js';


// ═════════════════════════════════════════════════════════════════════════════
// QUEUE CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════

const QUEUE_CONFIG = {
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '2'), // Process N sessions concurrently (Lowered for HF)
  pollIntervalMs: 3000,
  maxQueueSize: 500,
  staleTimeoutMs: 30 * 60 * 1000, // 30 mins
  baseAnalysisTime: 240,        // 4 Mins for God-Tier analysis (1 user)
  contentionMultiplier: 0.3,    // Moderate per-user overhead
};

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE STATUS TYPES
// ═════════════════════════════════════════════════════════════════════════════

export type QueueStatus =
  | 'queued'      // Waiting in queue
  | 'processing'  // Currently being analyzed
  | 'complete'    // Analysis done, results available
  | 'failed';     // Error occurred

export interface QueuePosition {
  sessionId: string;
  status: QueueStatus;
  position: number;       // 0 = currently processing, 1 = next, etc.
  estimatedWaitSeconds: number;
  totalInQueue: number;
  createdAt: string;
  session?: any;          // Full session metadata for UI
}

export interface QueueSubmitResult {
  success: boolean;
  sessionId?: string;
  position?: number;
  estimatedWaitSeconds?: number;
  error?: string;
}

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
    await db.update(sessions)
      .set({
        status: 'queued',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sessions.id, sessionId));

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
    const active = await db.select({ id: sessions.id, status: sessions.status })
      .from(sessions)
      .where(or(
        eq(sessions.status, 'queued'),
        eq(sessions.status, 'processing')
      ))
      .orderBy(asc(sessions.createdAt));

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
    const session = await db.select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

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
    const result = await db.select({ id: sessions.id })
      .from(sessions)
      .where(or(
        eq(sessions.status, 'queued'),
        eq(sessions.status, 'processing')
      ));

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
    const next = await db.select({ id: sessions.id })
      .from(sessions)
      .where(
        or(
          eq(sessions.status, 'pending'),
          eq(sessions.status, 'queued')
        )
      )
      .orderBy(asc(sessions.createdAt))
      .limit(1);

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
  await db.update(sessions)
    .set({
      status: 'processing',
      updatedAt: new Date().toISOString(),
    })
    .where(eq(sessions.id, sessionId));

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
  await db.update(sessions)
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
    .where(eq(sessions.id, sessionId));

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
  await db.update(sessions)
    .set({
      status: 'failed',
      errorMessage: error,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(sessions.id, sessionId));

  activeProcessingIds.delete(sessionId);
  processingStartTimes.delete(sessionId);

  logger.error('Session marked failed', { sessionId, error });
}

/**
 * Update session timestamp to prevent it from being marked as stale
 */
export async function heartbeat(sessionId: string): Promise<void> {
  await db.update(sessions)
    .set({
      updatedAt: new Date().toISOString(),
    })
    .where(eq(sessions.id, sessionId));
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

    await db.update(sessions)
      .set({
        status: 'failed',
        errorMessage: 'Cancelled by user',
        updatedAt: new Date().toISOString(),
        // 🗑️ HARD WIPE: Clear heavy data to save Turso Free Tier limit
        progressData: null,
        analysisResult: null,
        reasoningLogs: null
      } as any)
      .where(eq(sessions.id, sessionId));

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
 * Main queue processing loop
 */
async function processQueue(): Promise<void> {
  logger.info('Queue processor loop started');
  while (isProcessorRunning) {
    try {
      // Check for stale processing requests (crashed mid-process)
      await cleanupStaleRequests();

      // 🚀 GOD-TIER: Dynamic Pressure Throttling
      const memory = process.memoryUsage();
      const heapUsedPercent = (memory.heapUsed / memory.heapTotal);
      let effectiveMaxConcurrent = QUEUE_CONFIG.maxConcurrent;

      // If RAM is tight (>85% of heap), reduce concurrency to 1 to prevent OOM
      if (heapUsedPercent > 0.85) {
        logger.warn(`[PRESSURE] High RAM usage (${(heapUsedPercent * 100).toFixed(1)}%), restricting concurrency to 1`);
        effectiveMaxConcurrent = 1;
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

      // ⚡ ASYNC EXECUTION: Don't await the heavy process!
      // Fire and loop back immediately to pick up next task if slot available
      processSessionAsync(nextId);

    } catch (error) {
      logger.error('Queue processor error', error);
      await sleep(5000); // Wait before retry on error
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
    const session = await db.select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

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
      const decryptedLifeEvents = JSON.parse(decryptData(s.lifeEvents, s.clerkId));
      const decryptedPhysicalTraits = s.physicalTraits
        ? JSON.parse(decryptData(s.physicalTraits, s.clerkId))
        : undefined;

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
        abortSignal: abortController.signal, // 🛑 Pass abort signal
      });

      // ✂️ SPLIT REASONING LOGS (Database Optimization)
      // Extract the heavy reasoning text from the main JSON blob to store efficiently
      let reasoningLogs: string | null = null;
      let optimizedAnalysis = result.analysisResult;

      try {
        const params = JSON.parse(result.analysisResult);
        if (params.reasoning) {
          reasoningLogs = JSON.stringify(params.reasoning);
          delete params.reasoning; // Remove from main blob
          optimizedAnalysis = JSON.stringify(params);
        }
      } catch (e) {
        logger.warn('Failed to split reasoning logs', e);
      }

      await markAsComplete(sessionId, {
        ...result,
        analysisResult: optimizedAnalysis,
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
    // Ensure we clean up the slot if catastrophic failure
    activeProcessingIds.delete(sessionId);
  }
}

/**
 * Cleanup stale requests (stuck in processing for too long)
 */
async function cleanupStaleRequests(): Promise<void> {
  try {
    const staleThreshold = new Date(Date.now() - QUEUE_CONFIG.staleTimeoutMs).toISOString();

    // Find processing requests that are too old
    const stale = await db.select({ id: sessions.id })
      .from(sessions)
      .where(and(
        eq(sessions.status, 'processing'),
        lt(sessions.updatedAt, staleThreshold)
      ));

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

