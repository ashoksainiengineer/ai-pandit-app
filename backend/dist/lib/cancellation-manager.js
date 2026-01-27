// backend/src/lib/cancellation-manager.ts
// Manages AbortControllers for session cancellation
import { db } from '../database/drizzle.js';
import { sessions } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from './logger.js';
// ═════════════════════════════════════════════════════════════════════════════
// CANCELLATION MANAGER
// ═════════════════════════════════════════════════════════════════════════════
// Store AbortControllers for each active session
const activeControllers = new Map();
/**
 * Create an AbortController for a session
 */
export function createAbortController(sessionId) {
    // Clean up any existing controller (don't abort - just replace)
    // Aborting the old one would trigger cancellation checks
    activeControllers.delete(sessionId);
    const controller = new AbortController();
    activeControllers.set(sessionId, controller);
    logger.info('AbortController created', { sessionId });
    return controller;
}
/**
 * Get the AbortSignal for a session
 */
export function getAbortSignal(sessionId) {
    return activeControllers.get(sessionId)?.signal;
}
/**
 * Abort a session's processing
 */
export function abortSession(sessionId) {
    const controller = activeControllers.get(sessionId);
    if (controller) {
        controller.abort();
        activeControllers.delete(sessionId);
        logger.info('Session aborted', { sessionId });
        return true;
    }
    return false;
}
/**
 * Clean up controller when session completes
 */
export function cleanupController(sessionId) {
    activeControllers.delete(sessionId);
}
/**
 * Check if session is cancelled by user (from database)
 * Only returns true if user explicitly cancelled, not if failed for other reasons
 */
export async function isSessionCancelled(sessionId) {
    try {
        const result = await db.select({
            status: sessions.status,
            errorMessage: sessions.errorMessage
        })
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);
        if (result.length === 0)
            return true; // Session not found = treat as cancelled
        const { status, errorMessage } = result[0];
        // Only treat as cancelled if:
        // 1. User explicitly cancelled (specific error message)
        // 2. Session is complete (processing done)
        if (status === 'complete')
            return true;
        if (status === 'failed' && errorMessage?.includes('Cancelled by user'))
            return true;
        return false;
    }
    catch (error) {
        logger.error('Failed to check session status', { sessionId, error });
        return false;
    }
}
/**
 * Throw if session is cancelled
 * Use this at checkpoints in long-running operations
 */
export async function throwIfCancelled(sessionId, signal) {
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
export class CancellationError extends Error {
    constructor(message = 'Operation cancelled') {
        super(message);
        this.name = 'CancellationError';
    }
}
/**
 * Check if error is a cancellation error
 */
export function isCancellationError(error) {
    return error instanceof CancellationError ||
        (error instanceof Error && error.name === 'AbortError');
}
//# sourceMappingURL=cancellation-manager.js.map