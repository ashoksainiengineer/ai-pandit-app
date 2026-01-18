// backend/src/lib/cancellation-manager.ts
// Manages AbortControllers for session cancellation

import { db } from '../database/drizzle';
import { sessions } from '../database/schema';
import { eq } from 'drizzle-orm';
import { logger } from './logger';

// ═════════════════════════════════════════════════════════════════════════════
// CANCELLATION MANAGER
// ═════════════════════════════════════════════════════════════════════════════

// Store AbortControllers for each active session
const activeControllers = new Map<string, AbortController>();

/**
 * Create an AbortController for a session
 */
export function createAbortController(sessionId: string): AbortController {
    // Clean up any existing controller
    const existing = activeControllers.get(sessionId);
    if (existing) {
        existing.abort();
    }

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
 * Check if session is cancelled (from database)
 */
export async function isSessionCancelled(sessionId: string): Promise<boolean> {
    try {
        const result = await db.select({ status: sessions.status })
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

        if (result.length === 0) return true; // Session not found = treat as cancelled

        const status = result[0].status;
        return status === 'failed' || status === 'complete';
    } catch (error) {
        logger.error('Failed to check session status', { sessionId, error });
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
