"use strict";
// lib/queue-manager.ts
// Memory-efficient queue system for 512MB RAM backend
// Design: Process one request at a time, queue others in database
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToQueue = addToQueue;
exports.getQueuePosition = getQueuePosition;
exports.getQueueStatus = getQueueStatus;
exports.markAsComplete = markAsComplete;
exports.markAsFailed = markAsFailed;
exports.heartbeat = heartbeat;
exports.cancelSession = cancelSession;
exports.startQueueProcessor = startQueueProcessor;
exports.stopQueueProcessor = stopQueueProcessor;
exports.getQueueStats = getQueueStats;
exports.cleanupZombiesOnStartup = cleanupZombiesOnStartup;
const drizzle_1 = require("../database/drizzle");
const schema_1 = require("../database/schema");
const drizzle_orm_1 = require("drizzle-orm");
const logger_1 = require("./logger");
const crypto_1 = require("./crypto");
const cancellation_manager_1 = require("./cancellation-manager");
// ═════════════════════════════════════════════════════════════════════════════
// QUEUE CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════
const QUEUE_CONFIG = {
    maxConcurrent: 1, // Process ONE at a time (512MB RAM)
    pollIntervalMs: 2000, // Frontend polls every 2 seconds
    maxQueueSize: 50, // Maximum pending requests
    staleTimeoutMs: 20 * 60 * 1000, // 20 minutes - comprehensive analysis takes longer
    estimatedTimePerRequest: 90, // ~90 seconds per analysis with all methods
};
// ═════════════════════════════════════════════════════════════════════════════
// IN-MEMORY STATE (minimal - just tracking current job)
// ═════════════════════════════════════════════════════════════════════════════
let currentProcessingId = null;
let isProcessorRunning = false;
// ═════════════════════════════════════════════════════════════════════════════
// QUEUE OPERATIONS
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Add a new request to the queue
 * Returns queue position and estimated wait time
 */
async function addToQueue(sessionId) {
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
        await drizzle_1.db.update(schema_1.sessions)
            .set({
            status: 'queued',
            updatedAt: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId));
        // Get position in queue
        const position = await getQueuePosition(sessionId);
        const estimatedWait = position * QUEUE_CONFIG.estimatedTimePerRequest;
        logger_1.logger.info('Request added to queue', {
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
    }
    catch (error) {
        logger_1.logger.error('Failed to add to queue', error);
        return {
            success: false,
            error: 'Failed to queue request',
        };
    }
}
/**
 * Get current queue position for a session
 */
async function getQueuePosition(sessionId) {
    try {
        // Get all queued sessions ordered by creation time
        const queued = await drizzle_1.db.select({ id: schema_1.sessions.id })
            .from(schema_1.sessions)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.sessions.status, 'queued'), (0, drizzle_orm_1.eq)(schema_1.sessions.status, 'processing')))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.sessions.createdAt));
        const index = queued.findIndex(s => s.id === sessionId);
        return index === -1 ? 0 : index;
    }
    catch (error) {
        logger_1.logger.error('Failed to get queue position', error);
        return 0;
    }
}
/**
 * Get full queue status for a session
 */
async function getQueueStatus(sessionId) {
    try {
        const session = await drizzle_1.db.select()
            .from(schema_1.sessions)
            .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId))
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
            status: s.status,
            position,
            estimatedWaitSeconds: position * QUEUE_CONFIG.estimatedTimePerRequest,
            totalInQueue,
            createdAt: s.createdAt || '',
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to get queue status', error);
        return null;
    }
}
/**
 * Get count of queued + processing requests
 */
async function getQueuedCount() {
    try {
        const result = await drizzle_1.db.select({ id: schema_1.sessions.id })
            .from(schema_1.sessions)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.sessions.status, 'queued'), (0, drizzle_orm_1.eq)(schema_1.sessions.status, 'processing')));
        return result.length;
    }
    catch (error) {
        return 0;
    }
}
/**
 * Get next session to process (FIFO)
 */
async function getNextInQueue() {
    try {
        // Check for both 'pending' (new submissions) and 'queued' status
        const next = await drizzle_1.db.select({ id: schema_1.sessions.id })
            .from(schema_1.sessions)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.sessions.status, 'pending'), (0, drizzle_orm_1.eq)(schema_1.sessions.status, 'queued')))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.sessions.createdAt))
            .limit(1);
        return next.length > 0 ? next[0].id : null;
    }
    catch (error) {
        logger_1.logger.error('Failed to get next in queue', error);
        return null;
    }
}
/**
 * Mark session as processing
 */
async function markAsProcessing(sessionId) {
    await drizzle_1.db.update(schema_1.sessions)
        .set({
        status: 'processing',
        updatedAt: new Date().toISOString(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId));
    currentProcessingId = sessionId;
}
/**
 * Mark session as complete with results
 */
async function markAsComplete(sessionId, results) {
    await drizzle_1.db.update(schema_1.sessions)
        .set({
        status: 'complete',
        rectifiedTime: results.rectifiedTime,
        accuracy: results.accuracy,
        confidence: results.confidence,
        analysisResult: results.analysisResult,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId));
    if (currentProcessingId === sessionId) {
        currentProcessingId = null;
    }
    logger_1.logger.info('Session marked complete', { sessionId });
}
/**
 * Mark session as failed
 */
async function markAsFailed(sessionId, error) {
    await drizzle_1.db.update(schema_1.sessions)
        .set({
        status: 'failed',
        errorMessage: error,
        updatedAt: new Date().toISOString(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId));
    if (currentProcessingId === sessionId) {
        currentProcessingId = null;
    }
    logger_1.logger.error('Session marked failed', { sessionId, error });
}
/**
 * Update session timestamp to prevent it from being marked as stale
 */
async function heartbeat(sessionId) {
    await drizzle_1.db.update(schema_1.sessions)
        .set({
        updatedAt: new Date().toISOString(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId));
}
/**
 * Cancel a session
 */
async function cancelSession(sessionId) {
    try {
        const session = await drizzle_1.db.select().from(schema_1.sessions).where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId)).limit(1);
        if (!session.length)
            return false;
        // Only cancel if queued or processing
        if (session[0].status !== 'queued' && session[0].status !== 'processing') {
            return false;
        }
        // 🛑 ABORT the running process (this will cancel fetch requests!)
        (0, cancellation_manager_1.abortSession)(sessionId);
        await drizzle_1.db.update(schema_1.sessions)
            .set({
            status: 'failed',
            errorMessage: 'Cancelled by user',
            updatedAt: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId));
        if (currentProcessingId === sessionId) {
            currentProcessingId = null;
        }
        logger_1.logger.info('Session cancelled by user', { sessionId });
        return true;
    }
    catch (error) {
        logger_1.logger.error('Failed to cancel session', error);
        return false;
    }
}
// ═════════════════════════════════════════════════════════════════════════════
// QUEUE PROCESSOR
// ═════════════════════════════════════════════════════════════════════════════
// Import seconds-precision analysis function for ultimate accuracy
const seconds_precision_btr_1 = require("./seconds-precision-btr");
/**
 * Start the queue processor
 * Runs in background, processes one request at a time
 */
function startQueueProcessor() {
    if (isProcessorRunning) {
        return; // Already running
    }
    isProcessorRunning = true;
    processQueue();
}
/**
 * Main queue processing loop
 */
async function processQueue() {
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
            logger_1.logger.info('Starting to process request', { sessionId: nextId });
            // Get session data
            const session = await drizzle_1.db.select()
                .from(schema_1.sessions)
                .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, nextId))
                .limit(1);
            if (session.length === 0) {
                await markAsFailed(nextId, 'Session not found');
                continue;
            }
            const s = session[0];
            // 🛑 Create AbortController for this session
            const abortController = (0, cancellation_manager_1.createAbortController)(nextId);
            // Process the analysis
            try {
                // 🔐 Decrypt sensitive data using clerkId (encryption key)
                const decryptedLifeEvents = JSON.parse((0, crypto_1.decryptData)(s.lifeEvents, s.clerkId));
                const decryptedPhysicalTraits = s.physicalTraits
                    ? JSON.parse((0, crypto_1.decryptData)(s.physicalTraits, s.clerkId))
                    : undefined;
                const result = await (0, seconds_precision_btr_1.processSecondsPrecisionBTR)({
                    sessionId: nextId,
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
                await markAsComplete(nextId, result);
                (0, cancellation_manager_1.cleanupController)(nextId); // Cleanup on success
            }
            catch (error) {
                // Check if this was a cancellation
                if ((0, cancellation_manager_1.isCancellationError)(error)) {
                    logger_1.logger.info('Session processing cancelled', { sessionId: nextId });
                    (0, cancellation_manager_1.cleanupController)(nextId);
                    // Status already set to 'failed' by cancelSession, no need to update
                }
                else {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    await markAsFailed(nextId, errorMsg);
                    (0, cancellation_manager_1.cleanupController)(nextId);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Queue processor error', error);
            await sleep(5000); // Wait before retry on error
        }
    }
}
/**
 * Cleanup stale requests (stuck in processing for too long)
 */
async function cleanupStaleRequests() {
    try {
        const staleThreshold = new Date(Date.now() - QUEUE_CONFIG.staleTimeoutMs).toISOString();
        // Find processing requests that are too old
        const stale = await drizzle_1.db.select({ id: schema_1.sessions.id })
            .from(schema_1.sessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.sessions.status, 'processing'), (0, drizzle_orm_1.lt)(schema_1.sessions.updatedAt, staleThreshold)));
        for (const s of stale) {
            await markAsFailed(s.id, 'Request timed out');
            logger_1.logger.warn('Cleaned up stale request', { sessionId: s.id });
        }
    }
    catch (error) {
        logger_1.logger.error('Cleanup stale requests failed', error);
    }
}
/**
 * Stop the queue processor (for graceful shutdown)
 */
function stopQueueProcessor() {
    isProcessorRunning = false;
    logger_1.logger.info('Queue processor stopped');
}
/**
 * Get queue statistics
 */
async function getQueueStats() {
    try {
        const queued = await drizzle_1.db.select({ id: schema_1.sessions.id })
            .from(schema_1.sessions)
            .where((0, drizzle_orm_1.eq)(schema_1.sessions.status, 'queued'));
        const processing = await drizzle_1.db.select({ id: schema_1.sessions.id })
            .from(schema_1.sessions)
            .where((0, drizzle_orm_1.eq)(schema_1.sessions.status, 'processing'));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString();
        const completed = await drizzle_1.db.select({ id: schema_1.sessions.id })
            .from(schema_1.sessions)
            .where((0, drizzle_orm_1.eq)(schema_1.sessions.status, 'complete'));
        return {
            queuedCount: queued.length,
            processingCount: processing.length,
            completedToday: completed.length,
            averageWaitTime: QUEUE_CONFIG.estimatedTimePerRequest,
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to get queue stats', error);
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
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Cleanup processing sessions on startup (Zombie killer)
 * Resets any session stuck in 'processing' state to 'failed'
 */
async function cleanupZombiesOnStartup() {
    try {
        const zombies = await drizzle_1.db.select({ id: schema_1.sessions.id })
            .from(schema_1.sessions)
            .where((0, drizzle_orm_1.eq)(schema_1.sessions.status, 'processing'));
        if (zombies.length > 0) {
            logger_1.logger.warn(`Found ${zombies.length} zombie sessions from previous run. Cleaning up...`);
            for (const zombie of zombies) {
                await markAsFailed(zombie.id, 'Process interrupted (Server Restart)');
            }
        }
    }
    catch (error) {
        logger_1.logger.error('Zombie cleanup failed', error);
    }
}
//# sourceMappingURL=queue-manager.js.map