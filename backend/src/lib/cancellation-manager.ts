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
const activeControllers = new Map<string, AbortController>();

/**
 * Create an AbortController for a session
 */
export function createAbortController(sessionId: string): AbortController {
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
export function getAbortSignal(sessionId: string): AbortSignal | undefined {
    return activeControllers.get(sessionId)?.signal;
}

/**
 * Abort a session's processing
 */
export function abortSession(sessionId: string): boolean {
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
export function cleanupController(sessionId: string): void {
    activeControllers.delete(sessionId);
}

/**
 * Check if session was explicitly cancelled by the user.
 * Returns true ONLY for user-initiated cancellations — never for completed or
 * naturally failed sessions. This prevents race conditions where a successfully
 * completed session is mistakenly treated as cancelled during parallel checks.
 */
export async function isSessionCancelled(sessionId: string): Promise<boolean> {
    try {
        const result = await db.select({
            status: sessions.status,
            errorMessage: sessions.errorMessage
        })
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

        // Session not found in DB — treat as cancelled to stop processing
        if (result.length === 0) return true;

        const { status, errorMessage } = result[0];

        // Only treat as cancelled if user explicitly requested cancellation
        if (status === 'failed' && errorMessage?.includes('Cancelled by user')) return true;

        return false;
    } catch (error) {
        logger.error('Failed to check session status', { sessionId, error });
        // Fail-open: don't cancel on transient DB errors
        return false;
    }
}

/**
 * Throw if session is cancelled
 * Use this at checkpoints in long-running operations
 */
export async function throwIfCancelled(sessionId: string, signal?: AbortSignal): Promise<void> {
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
    constructor(message: string = 'Operation cancelled') {
        super(message);
        this.name = 'CancellationError';
    }
}

/**
 * Check if error is a cancellation error
 */
export function isCancellationError(error: unknown): boolean {
    return error instanceof CancellationError ||
        (error instanceof Error && error.name === 'AbortError');
}
