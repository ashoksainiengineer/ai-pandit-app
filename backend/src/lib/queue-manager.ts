// lib/queue-manager.ts
// Memory-efficient queue system for 512MB RAM backend
// Design: Process one request at a time, queue others in database

import { db } from '../database/drizzle.js';
import { sessions } from '../database/schema.js';
import { eq, and, or, desc, asc } from 'drizzle-orm';
import { logger } from './logger.js';
import { decryptData } from './crypto.js';

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════

const QUEUE_CONFIG = {
  maxConcurrent: 1,           // Process ONE at a time (512MB RAM)
  pollIntervalMs: 2000,       // Frontend polls every 2 seconds
  maxQueueSize: 50,           // Maximum pending requests
  staleTimeoutMs: 20 * 60 * 1000, // 20 minutes - comprehensive analysis takes longer
  estimatedTimePerRequest: 90, // ~90 seconds per analysis with all methods
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
}

export interface QueueSubmitResult {
  success: boolean;
  sessionId?: string;
  position?: number;
  estimatedWaitSeconds?: number;
  error?: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// IN-MEMORY STATE (minimal - just tracking current job)
// ═════════════════════════════════════════════════════════════════════════════

let currentProcessingId: string | null = null;
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

    // Get position in queue
    const position = await getQueuePosition(sessionId);
    const estimatedWait = position * QUEUE_CONFIG.estimatedTimePerRequest;

    logger.info('Request added to queue', {
      sessionId,
      position,
      estimatedWait,
    });

    // Start processor if not running
    startQueueProcessor();

    return {
      success: true,
      sessionId,
      position,
      estimatedWaitSeconds: estimatedWait,
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
    // Get all queued sessions ordered by creation time
    const queued = await db.select({ id: sessions.id })
      .from(sessions)
      .where(or(
        eq(sessions.status, 'queued'),
        eq(sessions.status, 'processing')
      ))
      .orderBy(asc(sessions.createdAt));

    const index = queued.findIndex(s => s.id === sessionId);
    return index === -1 ? 0 : index;
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

    const totalInQueue = await getQueuedCount();

    return {
      sessionId,
      status: s.status as QueueStatus,
      position,
      estimatedWaitSeconds: position * QUEUE_CONFIG.estimatedTimePerRequest,
      totalInQueue,
      createdAt: s.createdAt || '',
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
    const next = await db.select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.status, 'queued'))
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

  currentProcessingId = sessionId;
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
  }
): Promise<void> {
  await db.update(sessions)
    .set({
      status: 'complete',
      rectifiedTime: results.rectifiedTime,
      accuracy: results.accuracy,
      confidence: results.confidence,
      analysisResult: results.analysisResult,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(sessions.id, sessionId));

  if (currentProcessingId === sessionId) {
    currentProcessingId = null;
  }

  logger.info('Session marked complete', { sessionId });
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

  if (currentProcessingId === sessionId) {
    currentProcessingId = null;
  }

  logger.error('Session marked failed', { sessionId, error });
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
  while (isProcessorRunning) {
    try {
      // Check for stale processing requests (crashed mid-process)
      await cleanupStaleRequests();

      // Check if already processing something
      if (currentProcessingId !== null) {
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

      logger.info('Starting to process request', { sessionId: nextId });

      // Get session data
      const session = await db.select()
        .from(sessions)
        .where(eq(sessions.id, nextId))
        .limit(1);

      if (session.length === 0) {
        await markAsFailed(nextId, 'Session not found');
        continue;
      }

      const s = session[0];

      // Process the analysis
      try {
        // 🔐 Decrypt sensitive data using userId
        const decryptedLifeEvents = JSON.parse(decryptData(s.lifeEvents, s.userId));
        const decryptedPhysicalTraits = s.physicalTraits
          ? JSON.parse(decryptData(s.physicalTraits, s.userId))
          : undefined;

        const result = await processSecondsPrecisionBTR({
          sessionId: nextId,
          dateOfBirth: s.dateOfBirth,
          tentativeTime: s.tentativeTime,
          latitude: s.latitude,
          longitude: s.longitude,
          timezone: s.timezone,
          lifeEvents: decryptedLifeEvents,
          offsetConfig: s.offsetConfig ? JSON.parse(s.offsetConfig) : { preset: '1hour' },
          physicalTraits: decryptedPhysicalTraits,
        });

        await markAsComplete(nextId, result);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        await markAsFailed(nextId, errorMsg);
      }

    } catch (error) {
      logger.error('Queue processor error', error);
      await sleep(5000); // Wait before retry on error
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
    const stale = await db.select({ id: sessions.id })
      .from(sessions)
      .where(and(
        eq(sessions.status, 'processing'),
        // Note: This comparison works with ISO strings
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
      averageWaitTime: QUEUE_CONFIG.estimatedTimePerRequest,
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

