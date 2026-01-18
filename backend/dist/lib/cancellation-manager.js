"use strict";
// backend/src/lib/cancellation-manager.ts
// Manages AbortControllers for session cancellation
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancellationError = void 0;
exports.createAbortController = createAbortController;
exports.getAbortSignal = getAbortSignal;
exports.abortSession = abortSession;
exports.cleanupController = cleanupController;
exports.isSessionCancelled = isSessionCancelled;
exports.throwIfCancelled = throwIfCancelled;
exports.isCancellationError = isCancellationError;
const drizzle_1 = require("../database/drizzle");
const schema_1 = require("../database/schema");
const drizzle_orm_1 = require("drizzle-orm");
const logger_1 = require("./logger");
// ═════════════════════════════════════════════════════════════════════════════
// CANCELLATION MANAGER
// ═════════════════════════════════════════════════════════════════════════════
// Store AbortControllers for each active session
const activeControllers = new Map();
/**
 * Create an AbortController for a session
 */
function createAbortController(sessionId) {
    // Clean up any existing controller
    const existing = activeControllers.get(sessionId);
    if (existing) {
        existing.abort();
    }
    const controller = new AbortController();
    activeControllers.set(sessionId, controller);
    logger_1.logger.info('AbortController created', { sessionId });
    return controller;
}
/**
 * Get the AbortSignal for a session
 */
function getAbortSignal(sessionId) {
    return activeControllers.get(sessionId)?.signal;
}
/**
 * Abort a session's processing
 */
function abortSession(sessionId) {
    const controller = activeControllers.get(sessionId);
    if (controller) {
        controller.abort();
        activeControllers.delete(sessionId);
        logger_1.logger.info('Session aborted', { sessionId });
        return true;
    }
    return false;
}
/**
 * Clean up controller when session completes
 */
function cleanupController(sessionId) {
    activeControllers.delete(sessionId);
}
/**
 * Check if session is cancelled (from database)
 */
async function isSessionCancelled(sessionId) {
    try {
        const result = await drizzle_1.db.select({ status: schema_1.sessions.status })
            .from(schema_1.sessions)
            .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId))
            .limit(1);
        if (result.length === 0)
            return true; // Session not found = treat as cancelled
        const status = result[0].status;
        return status === 'failed' || status === 'complete';
    }
    catch (error) {
        logger_1.logger.error('Failed to check session status', { sessionId, error });
        return false;
    }
}
/**
 * Throw if session is cancelled
 * Use this at checkpoints in long-running operations
 */
async function throwIfCancelled(sessionId, signal) {
    // Check AbortSignal first (immediate)
    if (signal?.aborted) {
        throw new CancellationError('Session cancelled');
    }
    // Then check database (for user-initiated cancellation)
    const cancelled = await isSessionCancelled(sessionId);
    if (cancelled) {
        abortSession(sessionId); // Ensure controller is also aborted
        throw new CancellationError('Session cancelled by user');
    }
}
/**
 * Custom error for cancellation
 */
class CancellationError extends Error {
    constructor(message = 'Operation cancelled') {
        super(message);
        this.name = 'CancellationError';
    }
}
exports.CancellationError = CancellationError;
/**
 * Check if error is a cancellation error
 */
function isCancellationError(error) {
    return error instanceof CancellationError ||
        (error instanceof Error && error.name === 'AbortError');
}
//# sourceMappingURL=cancellation-manager.js.map