export type QueueStatus = 'queued' | 'processing' | 'complete' | 'failed';
export interface QueuePosition {
    sessionId: string;
    status: QueueStatus;
    position: number;
    estimatedWaitSeconds: number;
    totalInQueue: number;
    createdAt: string;
    session?: any;
}
export interface QueueSubmitResult {
    success: boolean;
    sessionId?: string;
    position?: number;
    estimatedWaitSeconds?: number;
    error?: string;
}
/**
 * Add a new request to the queue
 * Returns queue position and estimated wait time
 */
export declare function addToQueue(sessionId: string): Promise<QueueSubmitResult>;
/**
 * Get current queue position for a session
 */
export declare function getQueuePosition(sessionId: string): Promise<number>;
/**
 * Get full queue status for a session
 */
export declare function getQueueStatus(sessionId: string): Promise<QueuePosition | null>;
/**
 * Mark session as complete with results
 */
export declare function markAsComplete(sessionId: string, results: {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
    analysisResult: string;
}): Promise<void>;
/**
 * Mark session as failed
 */
export declare function markAsFailed(sessionId: string, error: string): Promise<void>;
/**
 * Update session timestamp to prevent it from being marked as stale
 */
export declare function heartbeat(sessionId: string): Promise<void>;
/**
 * Cancel a session
 */
export declare function cancelSession(sessionId: string): Promise<boolean>;
/**
 * Start the queue processor
 * Runs in background, processes one request at a time
 */
export declare function startQueueProcessor(): void;
/**
 * Stop the queue processor (for graceful shutdown)
 */
export declare function stopQueueProcessor(): void;
/**
 * Get queue statistics
 */
export declare function getQueueStats(): Promise<{
    queuedCount: number;
    processingCount: number;
    completedToday: number;
    averageWaitTime: number;
}>;
/**
 * Cleanup processing sessions on startup (Zombie killer)
 * Resets any session stuck in 'processing' state to 'failed'
 */
export declare function cleanupZombiesOnStartup(): Promise<void>;
//# sourceMappingURL=queue-manager.d.ts.map