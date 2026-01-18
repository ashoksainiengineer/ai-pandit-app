/**
 * Create an AbortController for a session
 */
export declare function createAbortController(sessionId: string): AbortController;
/**
 * Get the AbortSignal for a session
 */
export declare function getAbortSignal(sessionId: string): AbortSignal | undefined;
/**
 * Abort a session's processing
 */
export declare function abortSession(sessionId: string): boolean;
/**
 * Clean up controller when session completes
 */
export declare function cleanupController(sessionId: string): void;
/**
 * Check if session is cancelled (from database)
 */
export declare function isSessionCancelled(sessionId: string): Promise<boolean>;
/**
 * Throw if session is cancelled
 * Use this at checkpoints in long-running operations
 */
export declare function throwIfCancelled(sessionId: string, signal?: AbortSignal): Promise<void>;
/**
 * Custom error for cancellation
 */
export declare class CancellationError extends Error {
    constructor(message?: string);
}
/**
 * Check if error is a cancellation error
 */
export declare function isCancellationError(error: unknown): boolean;
//# sourceMappingURL=cancellation-manager.d.ts.map