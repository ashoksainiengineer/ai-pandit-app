"use strict";
// lib/queue-manager.ts
// Efficient queue system for high-performance AI backend
// Design: Process multiple requests concurrently based on system capacity
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
const drizzle_js_1 = require("../database/drizzle.js");
const schema_js_1 = require("../database/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const logger_js_1 = require("./logger.js");
const crypto_js_1 = require("./crypto.js");
const cancellation_manager_js_1 = require("./cancellation-manager.js");
const session_events_js_1 = require("./session-events.js");
const progress_tracker_js_1 = require("./progress-tracker.js");
// ═════════════════════════════════════════════════════════════════════════════
// QUEUE CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════
const QUEUE_CONFIG = {
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '2'), // Process N sessions concurrently (Lowered for HF)
    pollIntervalMs: 3000,
    maxQueueSize: 500,
    staleTimeoutMs: 2 * 60 * 60 * 1000, // 🔱 2 HOURS - for long God-Tier analyses (was 30 min)
    baseAnalysisTime: 240, // 4 Mins for God-Tier analysis (1 user)
    contentionMultiplier: 0.3, // Moderate per-user overhead
};
// ═════════════════════════════════════════════════════════════════════════════
// IN-MEMORY STATE (minimal - just tracking current jobs)
// ═════════════════════════════════════════════════════════════════════════════
// Track multiple concurrent processing IDs
const activeProcessingIds = new Set();
const processingStartTimes = new Map(); // sessionId -> timestamp
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
        await drizzle_js_1.db.update(schema_js_1.sessions)
            .set({
            status: 'queued',
            updatedAt: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.sessions.id, sessionId));
        // Start processor if not running
        startQueueProcessor();
        const status = await getQueueStatus(sessionId);
        logger_js_1.logger.info('Request added to queue', {
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
    }
    catch (error) {
        logger_js_1.logger.error('Failed to add to queue', error);
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
        // Get all active sessions (processing or queued) ordered by creation time
        const active = await drizzle_js_1.db.select({ id: schema_js_1.sessions.id, status: schema_js_1.sessions.status })
            .from(schema_js_1.sessions)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_js_1.sessions.status, 'queued'), (0, drizzle_orm_1.eq)(schema_js_1.sessions.status, 'processing')))
            .orderBy((0, drizzle_orm_1.asc)(schema_js_1.sessions.createdAt));
        const item = active.find(s => s.id === sessionId);
        if (!item)
            return 0;
        // If already processing, position is effectively 0
        if (item.status === 'processing')
            return 0;
        // Find index among ONLY queued items, BUT only those that aren't in the top 'maxConcurrent' spots
        const index = active.findIndex(s => s.id === sessionId);
        // Position = Rank - active_slots + 1
        // Example: indices 0,1,2 are active. Index 3 is next (Position 1).
        const position = Math.max(1, index - QUEUE_CONFIG.maxConcurrent + 1);
        return position;
    }
    catch (error) {
        logger_js_1.logger.error('Failed to get queue position', error);
        return 0;
    }
}
/**
 * Get full queue status for a session
 */
async function getQueueStatus(sessionId) {
    try {
        const session = await drizzle_js_1.db.select()
            .from(schema_js_1.sessions)
            .where((0, drizzle_orm_1.eq)(schema_js_1.sessions.id, sessionId))
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
            status: s.status,
            position,
            estimatedWaitSeconds,
            totalInQueue,
            createdAt: s.createdAt || '',
            session: s,
        };
    }
    catch (error) {
        logger_js_1.logger.error('Failed to get queue status', error);
        return null;
    }
}
/**
 * Get count of queued + processing requests
 */
async function getQueuedCount() {
    try {
        const result = await drizzle_js_1.db.select({ id: schema_js_1.sessions.id })
            .from(schema_js_1.sessions)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_js_1.sessions.status, 'queued'), (0, drizzle_orm_1.eq)(schema_js_1.sessions.status, 'processing')));
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
        const next = await drizzle_js_1.db.select({ id: schema_js_1.sessions.id })
            .from(schema_js_1.sessions)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_js_1.sessions.status, 'pending'), (0, drizzle_orm_1.eq)(schema_js_1.sessions.status, 'queued')))
            .orderBy((0, drizzle_orm_1.asc)(schema_js_1.sessions.createdAt))
            .limit(1);
        return next.length > 0 ? next[0].id : null;
    }
    catch (error) {
        logger_js_1.logger.error('Failed to get next in queue', error);
        return null;
    }
}
/**
 * Mark session as processing
 */
async function markAsProcessing(sessionId) {
    await drizzle_js_1.db.update(schema_js_1.sessions)
        .set({
        status: 'processing',
        updatedAt: new Date().toISOString(),
    })
        .where((0, drizzle_orm_1.eq)(schema_js_1.sessions.id, sessionId));
    activeProcessingIds.add(sessionId);
    processingStartTimes.set(sessionId, Date.now());
}
/**
 * Mark session as complete with results
 */
async function markAsComplete(sessionId, results) {
    await drizzle_js_1.db.update(schema_js_1.sessions)
        .set({
        status: 'complete',
        rectifiedTime: results.rectifiedTime,
        accuracy: results.accuracy,
        confidence: results.confidence,
        analysisResult: results.analysisResult,
        reasoningLogs: results.reasoningLogs,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    })
        .where((0, drizzle_orm_1.eq)(schema_js_1.sessions.id, sessionId));
    activeProcessingIds.delete(sessionId);
    processingStartTimes.delete(sessionId);
    logger_js_1.logger.info('Session marked complete', { sessionId });
    // ⚡ Emit Complete Event so frontend gets the result!
    (0, session_events_js_1.emitComplete)(sessionId, results.rectifiedTime, results.accuracy, results.confidence);
}
/**
 * Mark session as failed
 */
async function markAsFailed(sessionId, error) {
    await drizzle_js_1.db.update(schema_js_1.sessions)
        .set({
        status: 'failed',
        errorMessage: error,
        updatedAt: new Date().toISOString(),
    })
        .where((0, drizzle_orm_1.eq)(schema_js_1.sessions.id, sessionId));
    activeProcessingIds.delete(sessionId);
    processingStartTimes.delete(sessionId);
    logger_js_1.logger.error('Session marked failed', { sessionId, error });
}
/**
 * Update session timestamp to prevent it from being marked as stale
 */
async function heartbeat(sessionId) {
    await drizzle_js_1.db.update(schema_js_1.sessions)
        .set({
        updatedAt: new Date().toISOString(),
    })
        .where((0, drizzle_orm_1.eq)(schema_js_1.sessions.id, sessionId));
}
/**
 * Cancel a session
 */
async function cancelSession(sessionId) {
    try {
        const session = await drizzle_js_1.db.select().from(schema_js_1.sessions).where((0, drizzle_orm_1.eq)(schema_js_1.sessions.id, sessionId)).limit(1);
        if (!session.length)
            return false;
        // Only cancel if pending, queued or processing
        if (session[0].status !== 'pending' && session[0].status !== 'queued' && session[0].status !== 'processing') {
            logger_js_1.logger.warn(`Cannot cancel session ${sessionId}: status is '${session[0].status}' (expected pending, queued or processing)`);
            return false;
        }
        // 🛑 ABORT the running process (this will cancel fetch requests!)
        (0, cancellation_manager_js_1.abortSession)(sessionId);
        await drizzle_js_1.db.update(schema_js_1.sessions)
            .set({
            status: 'failed',
            errorMessage: 'Cancelled by user',
            updatedAt: new Date().toISOString(),
            // 🗑️ HARD WIPE: Clear heavy data to save Turso Free Tier limit
            progressData: null,
            analysisResult: null,
            reasoningLogs: null
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.sessions.id, sessionId));
        activeProcessingIds.delete(sessionId);
        processingStartTimes.delete(sessionId);
        logger_js_1.logger.info('Session cancelled by user (Hard Wipe Complete)', { sessionId });
        return true;
    }
    catch (error) {
        logger_js_1.logger.error('Failed to cancel session', error);
        return false;
    }
}
// ═════════════════════════════════════════════════════════════════════════════
// QUEUE PROCESSOR
// ═════════════════════════════════════════════════════════════════════════════
// Import seconds-precision analysis function for ultimate accuracy
const seconds_precision_btr_js_1 = require("./seconds-precision-btr.js");
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
    logger_js_1.logger.info('Queue processor loop started');
    while (isProcessorRunning) {
        try {
            // Check for stale processing requests (crashed mid-process)
            await cleanupStaleRequests();
            // 🚀 GOD-TIER: Dynamic Pressure Throttling
            const memory = process.memoryUsage();
            const heapUsedPercent = (memory.heapUsed / memory.heapTotal);
            const heapUsedGB = memory.heapUsed / 1024 / 1024 / 1024;
            let effectiveMaxConcurrent = QUEUE_CONFIG.maxConcurrent;
            // Only trigger pressure restriction if:
            // 1. Percentage is high (>85%) AND
            // 2. Absolute heap usage is significant (>4GB)
            // This prevents false positives when the total heap is small (idle state).
            if (heapUsedPercent > 0.85 && heapUsedGB > 4) {
                logger_js_1.logger.warn(`[PRESSURE] Genuine RAM Pressure (${(heapUsedPercent * 100).toFixed(1)}%, ${heapUsedGB.toFixed(2)}GB), restricting concurrency to 1`);
                effectiveMaxConcurrent = 1;
            }
            // Check concurrent limit
            if (activeProcessingIds.size >= effectiveMaxConcurrent) {
                // High frequency logging for wait state
                const queuedCount = await getQueuedCount();
                if (queuedCount > activeProcessingIds.size) {
                    logger_js_1.logger.debug('Queue blocked: all slots full', {
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
        }
        catch (error) {
            logger_js_1.logger.error('Queue processor error', error);
            await sleep(5000); // Wait before retry on error
        }
    }
}
/**
 * Process a single session (async worker)
 */
async function processSessionAsync(sessionId) {
    try {
        logger_js_1.logger.info('Starting to process request', { sessionId });
        // Get session data
        const session = await drizzle_js_1.db.select()
            .from(schema_js_1.sessions)
            .where((0, drizzle_orm_1.eq)(schema_js_1.sessions.id, sessionId))
            .limit(1);
        if (session.length === 0) {
            await markAsFailed(sessionId, 'Session not found');
            return;
        }
        const s = session[0];
        // 🛑 Create AbortController for this session
        const abortController = (0, cancellation_manager_js_1.createAbortController)(sessionId);
        // Process the analysis
        try {
            // 🔐 Decrypt sensitive data using clerkId (encryption key)
            const decryptedLifeEvents = JSON.parse((0, crypto_js_1.decryptData)(s.lifeEvents, s.clerkId));
            const decryptedPhysicalTraits = s.physicalTraits
                ? JSON.parse((0, crypto_js_1.decryptData)(s.physicalTraits, s.clerkId))
                : undefined;
            const decryptedForensicTraits = s.forensicTraits
                ? JSON.parse((0, crypto_js_1.decryptData)(s.forensicTraits, s.clerkId))
                : undefined;
            const result = await (0, seconds_precision_btr_js_1.processSecondsPrecisionBTR)({
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
            let reasoningLogs = null;
            let optimizedAnalysisStr = "";
            try {
                const tracker = progress_tracker_js_1.ProgressTracker.getInstance(sessionId);
                if (tracker) {
                    const history = tracker.getProgress().stageHistory;
                    reasoningLogs = JSON.stringify(history);
                }
                optimizedAnalysisStr = JSON.stringify(result.analysisResult);
            }
            catch (e) {
                logger_js_1.logger.warn('Failed to serialize analysis result', e);
                optimizedAnalysisStr = JSON.stringify({ error: "Serialization failed" });
            }
            await markAsComplete(sessionId, {
                ...result,
                analysisResult: optimizedAnalysisStr,
                reasoningLogs
            });
            (0, cancellation_manager_js_1.cleanupController)(sessionId); // Cleanup on success
        }
        catch (error) {
            // Check if this was a cancellation
            if ((0, cancellation_manager_js_1.isCancellationError)(error)) {
                logger_js_1.logger.info('Session processing cancelled', { sessionId });
                (0, cancellation_manager_js_1.cleanupController)(sessionId);
                // Status already set to 'failed' by cancelSession, no need to update
            }
            else {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                await markAsFailed(sessionId, errorMsg);
                (0, cancellation_manager_js_1.cleanupController)(sessionId);
            }
        }
    }
    catch (error) {
        logger_js_1.logger.error('Async worker error', error);
    }
    finally {
        // 🛡️ Ensure slot is ALWAYS released
        activeProcessingIds.delete(sessionId);
        // 🚀 GOD-TIER MEMORY RECOVERY
        // Manually trigger Garbage Collection if --expose-gc is enabled
        if (global.gc) {
            logger_js_1.logger.info('[MEMORY] Triggering manual GC after session recovery');
            global.gc();
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
        const stale = await drizzle_js_1.db.select({ id: schema_js_1.sessions.id })
            .from(schema_js_1.sessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.sessions.status, 'processing'), (0, drizzle_orm_1.lt)(schema_js_1.sessions.updatedAt, staleThreshold)));
        for (const s of stale) {
            await markAsFailed(s.id, 'Request timed out');
            logger_js_1.logger.warn('Cleaned up stale request', { sessionId: s.id });
        }
    }
    catch (error) {
        logger_js_1.logger.error('Cleanup stale requests failed', error);
    }
}
/**
 * Stop the queue processor (for graceful shutdown)
 */
function stopQueueProcessor() {
    isProcessorRunning = false;
    logger_js_1.logger.info('Queue processor stopped');
}
/**
 * Get queue statistics
 */
async function getQueueStats() {
    try {
        const queued = await drizzle_js_1.db.select({ id: schema_js_1.sessions.id })
            .from(schema_js_1.sessions)
            .where((0, drizzle_orm_1.eq)(schema_js_1.sessions.status, 'queued'));
        const processing = await drizzle_js_1.db.select({ id: schema_js_1.sessions.id })
            .from(schema_js_1.sessions)
            .where((0, drizzle_orm_1.eq)(schema_js_1.sessions.status, 'processing'));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString();
        const completed = await drizzle_js_1.db.select({ id: schema_js_1.sessions.id })
            .from(schema_js_1.sessions)
            .where((0, drizzle_orm_1.eq)(schema_js_1.sessions.status, 'complete'));
        return {
            queuedCount: queued.length,
            processingCount: processing.length,
            completedToday: completed.length,
            averageWaitTime: QUEUE_CONFIG.baseAnalysisTime,
        };
    }
    catch (error) {
        logger_js_1.logger.error('Failed to get queue stats', error);
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
        const zombies = await drizzle_js_1.db.select({ id: schema_js_1.sessions.id })
            .from(schema_js_1.sessions)
            .where((0, drizzle_orm_1.eq)(schema_js_1.sessions.status, 'processing'));
        if (zombies.length > 0) {
            logger_js_1.logger.warn(`Found ${zombies.length} zombie sessions from previous run. Cleaning up...`);
            for (const zombie of zombies) {
                await markAsFailed(zombie.id, 'Process interrupted (Server Restart)');
            }
        }
    }
    catch (error) {
        logger_js_1.logger.error('Zombie cleanup failed', error);
    }
}
//# sourceMappingURL=queue-manager.js.map