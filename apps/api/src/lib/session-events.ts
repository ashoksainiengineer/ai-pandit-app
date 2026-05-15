// backend/src/lib/session-events.ts
// Global EventEmitter for real-time session progress streaming
// Now with Redis-backed persistent storage

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { appendJobEvent, getLatestJobForSession } from '@ai-pandit/db/jobs';
import { logger } from '../utils/logger.js';
import { getRedisEventStore, type RedisClient, type RedisEventStore } from './redis-event-store.js';
import type {
    ProgressEvent,
    AIThinkingEvent,
    EphemerisEvent,
    CandidateScoreEvent,
    CandidateScoresEvent,
    CompleteEvent,
    ErrorEvent,
    AIContextEvent,
    CalculationLogEvent,
    StageStatsEvent,
    EstimatedTimeEvent,
    DecisionEvent,
    SessionEvent
} from '@ai-pandit/shared';
export type {
    ProgressEvent,
    AIThinkingEvent,
    EphemerisEvent,
    CandidateScoreEvent,
    CandidateScoresEvent,
    CompleteEvent,
    ErrorEvent,
    AIContextEvent,
    CalculationLogEvent,
    StageStatsEvent,
    EstimatedTimeEvent,
    DecisionEvent,
    SessionEvent
};
// Max events to retain per session for Last-Event-ID replay
const MAX_EVENT_LOG_SIZE = 2000;
const NON_PERSISTED_EVENT_TYPES = new Set(['ping', 'connected', 'metadata', 'initial_state', 'terminal_state']);
const PERSISTED_EVENT_TYPES = new Set([
    'progress',
    'stage_stats',
    'complete',
    'error',
    'job.queued',
    'job.started',
    'job.recovered',
]);

function extractPersistenceErrorCode(error: unknown): string | null {
    if (!error || typeof error !== 'object') {
        return null;
    }

    if ('code' in error && typeof (error as { code?: unknown }).code === 'string') {
        return (error as { code: string }).code;
    }

    if ('cause' in error) {
        return extractPersistenceErrorCode((error as { cause?: unknown }).cause);
    }

    return null;
}

interface SequencedEvent {
    seq: number;
    event: SessionEvent;
}

class SessionEventManager {
    private emitters: Map<string, EventEmitter> = new Map();
    private lastContexts: Map<string, AIContextEvent> = new Map();
    // 🧠 Multi-Stream Thinking Buffers: { sessionId: Map<candidateTime, { stage, text }> }
    private thinkingBuffers: Map<string, Map<string, { stage: number; text: string; candidateTime: string }>> = new Map();
    // 🧮 Store recent calculation logs for immediate UI feedback on connect
    private calculationLogBuffers: Map<string, CalculationLogEvent[]> = new Map();
    // 📊 Store ALL candidate scores for session history replay
    private candidateScoreBuffers: Map<string, CandidateScoreEvent[]> = new Map();
    // ⚖️ Store decision logs for "Funnel of Truth"
    private decisionBuffers: Map<string, DecisionEvent[]> = new Map();
    // 秤 Batch Buffers for performance (Industry Standard for Free Tiers)
    private thinkingBroadcastBuffer: Map<string, Array<{ chunk: string; stage: number; candidateTime?: string }>> = new Map();
    private scoreBroadcastBuffer: Map<string, CandidateScoreEvent[]> = new Map();
    private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
    private persistenceDisabled: boolean = process.env.NODE_ENV === 'test';

    // ⏱️ Track last activity for garbage collection
    private lastActive: Map<string, number> = new Map();

    // ═══ LAST-EVENT-ID PROTOCOL (Industry SSE Standard) ═══
    // Per-session monotonic sequence counter for event ordering
    private eventSequences: Map<string, number> = new Map();
    // Per-session ordered event log for reconnection replay
    private eventLogs: Map<string, SequencedEvent[]> = new Map();
    // 📡 Redis Pub/Sub subscriptions for cross-process sync
    private redisSubscriber: RedisClient | null = null;
    private subscribedSessions: Set<string> = new Set();

    // ═══ REDIS BACKUP STORE ═══
    // Redis-backed persistent storage for crash recovery
    // Use getter to always resolve the current global singleton
    // (initRedisEventStore() may replace it after module load).
    private get redisStore(): RedisEventStore {
        return getRedisEventStore();
    }
    private useRedis: boolean = true; // Always use Redis when available

    private redisPublishedCount = 0;
    private redisReceivedCount = 0;
    private redisBridgeHealthy = false;

    constructor() {
        // Run garbage collection every 10 minutes
        setInterval(() => this.garbageCollect(), 10 * 60 * 1000);
    }

    /**
     * Enable Redis for persistent event storage
     */
    enableRedis(redis: RedisClient, subscriber?: RedisClient): void {
        this.redisStore.setRedisClient(redis);
        if (subscriber) {
            this.redisSubscriber = subscriber;
        }
        this.useRedis = true;
        logger.info('[SessionEventManager] Redis event storage enabled');
    }

    /**
     * Get the next sequence number for a session (monotonically increasing)
     */
    getNextSeq(sessionId: string): number {
        const current = this.eventSequences.get(sessionId) || 0;
        const next = current + 1;
        this.eventSequences.set(sessionId, next);
        return next;
    }

    /**
     * Get current sequence number without incrementing
     */
    getCurrentSeq(sessionId: string): number {
        return this.eventSequences.get(sessionId) || 0;
    }

    /**
     * Log an event with its sequence number for replay on reconnect.
     * Capped at MAX_EVENT_LOG_SIZE to prevent unbounded memory growth.
     * Lightweight events (pings, connected) are NOT logged.
     */
    logEvent(sessionId: string, seq: number, event: SessionEvent): void {
        const skipLogTypes = ['ping', 'connected'];
        const eventType = event.type;
        if (skipLogTypes.includes(eventType)) return;

        if (!this.eventLogs.has(sessionId)) {
            this.eventLogs.set(sessionId, []);
        }
        const log = this.eventLogs.get(sessionId)!;
        log.push({ seq, event });

        // Evict oldest events when over capacity
        if (log.length > MAX_EVENT_LOG_SIZE) {
            // Remove oldest 20% to avoid frequent shifts
            const evictCount = Math.floor(MAX_EVENT_LOG_SIZE * 0.2);
            log.splice(0, evictCount);
        }
    }

    /**
     * Get all events after a given sequence number (for Last-Event-ID replay).
     * Returns events in order, starting from lastSeq + 1.
     */
    getEventsSince(sessionId: string, lastSeq: number): SequencedEvent[] {
        const log = this.eventLogs.get(sessionId);
        if (!log || log.length === 0) return [];

        // Binary search for the first event with seq > lastSeq
        // Log is always sorted by seq (appended monotonically)
        let lo = 0, hi = log.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (log[mid].seq <= lastSeq) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        return log.slice(lo);
    }

    /**
     * Get or create an emitter for a session
     */
    getEmitter(sessionId: string): EventEmitter {
        this.touch(sessionId);
        if (!this.emitters.has(sessionId)) {
            const emitter = new EventEmitter();
            emitter.setMaxListeners(50); // Increased for high concurrency
            this.emitters.set(sessionId, emitter);
        }
        return this.emitters.get(sessionId)!;
    }

    /**
     * Emit an event for a session.
     * Automatically handles monotonic sequencing and logging for the Last-Event-ID protocol.
     */
    emit(sessionId: string, event: SessionEvent): void {
        this.touch(sessionId);

        // 1. Assign sequence and log for replay (IF loggable)
        const skipSeqTypes = ['ping', 'connected'];
        const eventType = event.type;

        if (!skipSeqTypes.includes(eventType)) {
            const seq = this.getNextSeq(sessionId);
            (event as SessionEvent & { seq?: number }).seq = seq; // Attach sequence to event for easier handling
            this.logEvent(sessionId, seq, event);
            void this.persistEvent(sessionId, seq, event);
        }

        // 2. Broadcast to all active SSE listeners
        const emitter = this.emitters.get(sessionId);
        if (emitter) {
            emitter.emit('event', event);
        }

        // 2.1 Cross-Process Bridge: Publish to Redis
        // Skip pings and high-volume raw chunks (batching handled via bufferThinking)
        const skipBridgeTypes = ['ping', 'connected', 'ai_thinking_chunk'];
        if (this.useRedis && this.redisStore.isAvailable() && !skipBridgeTypes.includes(eventType)) {
            // Internal prevent-loop flag: don't re-publish events that we just received from Redis
            if (!(event as any)._fromBridge) {
                void this.redisStore.publishEvent(sessionId, event);
                this.redisPublishedCount++;
            }
        }

        // 3. Update persistent buffers for fresh connects
        if (event.type === 'ai_context') {
            this.lastContexts.set(sessionId, event as AIContextEvent);
        }
        if (event.type === 'calculation_log') {
            this.appendToCalculationBuffer(sessionId, event as CalculationLogEvent);
        }
        if (event.type === 'candidate_score_v2' || event.type === 'candidate_score') {
            this.appendToCandidateScoreBuffer(sessionId, event as CandidateScoreEvent);
        }
        if (event.type === 'candidate_scores') {
            // Replay from broadcast batch - already appended to buffer via bufferScore()
            // No action needed here to avoid double-processing
        }
        if (event.type === 'decision') {
            this.appendToDecisionBuffer(sessionId, event as DecisionEvent);
        }
    }

    private async persistEvent(sessionId: string, seq: number, event: SessionEvent): Promise<void> {
        if (this.persistenceDisabled) {
            return;
        }

        if (NON_PERSISTED_EVENT_TYPES.has(event.type)) {
            return;
        }

        if (!PERSISTED_EVENT_TYPES.has(event.type)) {
            return;
        }

        try {
            const job = await getLatestJobForSession(sessionId);
            if (!job) {
                return;
            }

            const stage =
                'stage' in event && typeof event.stage !== 'undefined'
                    ? String(event.stage)
                    : null;

            await appendJobEvent({
                id: crypto.randomUUID(),
                jobId: job.id,
                sessionId,
                sequenceNo: seq,
                eventType: event.type,
                stage,
                payloadJson: event as unknown as Record<string, unknown>,
            });
        } catch (error) {
            const errorCode = extractPersistenceErrorCode(error);
            if (errorCode === 'ECONNREFUSED' || errorCode === 'SQLITE_CANTOPEN' || errorCode === 'SQLITE_BUSY') {
                this.persistenceDisabled = true;
            }
            logger.warn('[SessionEventManager] Failed to persist job event', {
                sessionId,
                eventType: event.type,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Start the broadcast interval for a session if not already running
     */
    private startBroadcastLoop(sessionId: string): void {
        if (this.updateIntervals.has(sessionId)) return;

        const interval = setInterval(() => {
            this.flushBroadcastBuffers(sessionId);
        }, 200); // 200ms batching window (Industry Standard balance)

        this.updateIntervals.set(sessionId, interval);
    }

    /**
     * Flush all batched events to the frontend
     */
    private flushBroadcastBuffers(sessionId: string): void {
        // 1. Flush AI Thinking
        const thinkingBatch = this.thinkingBroadcastBuffer.get(sessionId);
        if (thinkingBatch && thinkingBatch.length > 0) {
            // Swap: replace with fresh buffer BEFORE processing to avoid losing
            // entries added by synchronous emit handlers during iteration.
            this.thinkingBroadcastBuffer.set(sessionId, []);

            if (thinkingBatch.length > 50) {
                logger.info(`[SessionEventManager] High volume flush: ${thinkingBatch.length} thinking chunks for session ${sessionId.slice(0, 8)}`);
            }
            // Group by candidateTime and stage to send fewer messages
            const grouped = new Map<string, { chunk: string; stage: number; candidateTime?: string }>();
            for (const item of thinkingBatch) {
                const key = `${item.stage}_${item.candidateTime || 'general'}`;
                const existing = grouped.get(key);
                if (existing) {
                    existing.chunk += item.chunk;
                } else {
                    grouped.set(key, { ...item });
                }
            }

            // Emit merged chunks
            for (const merged of grouped.values()) {
                this.emit(sessionId, {
                    type: 'ai_thinking',
                    ...merged
                });
            }
        }

        // 2. Flush Scores
        const scoreBatch = this.scoreBroadcastBuffer.get(sessionId);
        if (scoreBatch && scoreBatch.length > 0) {
            // Swap: replace with fresh buffer BEFORE emitting to avoid losing
            // entries added by synchronous emit handlers.
            this.scoreBroadcastBuffer.set(sessionId, []);

            this.emit(sessionId, {
                type: 'candidate_scores',
                data: scoreBatch
            } as CandidateScoresEvent);
        }
    }

    /**
     * Buffer a thinking chunk for later broadcast
     */
    bufferThinking(sessionId: string, chunk: string, stage: number, candidateTime?: string): void {
        this.touch(sessionId);
        this.startBroadcastLoop(sessionId);

        if (!this.thinkingBroadcastBuffer.has(sessionId)) {
            this.thinkingBroadcastBuffer.set(sessionId, []);
        }
        this.thinkingBroadcastBuffer.get(sessionId)!.push({ chunk, stage, candidateTime });
    }

    /**
     * Buffer a candidate score for later broadcast.
     * Persistence buffer is updated immediately.
     */
    bufferScore(sessionId: string, score: CandidateScoreEvent): void {
        this.touch(sessionId);
        this.startBroadcastLoop(sessionId);

        // Update persistence buffer immediately so fresh connects get data before flush
        this.appendToCandidateScoreBuffer(sessionId, score);

        if (!this.scoreBroadcastBuffer.has(sessionId)) {
            this.scoreBroadcastBuffer.set(sessionId, []);
        }
        this.scoreBroadcastBuffer.get(sessionId)!.push(score);
    }

    /**
     * Clean up emitter when session completes
     */
    cleanup(sessionId: string): void {
        logger.info(`Cleaning up session resources: ${sessionId?.slice(0, 8)}`);

        // Stop broadcast loop
        const interval = this.updateIntervals.get(sessionId);
        if (interval) {
            clearInterval(interval);
            this.updateIntervals.delete(sessionId);
        }

        const emitter = this.emitters.get(sessionId);
        if (emitter) {
            emitter.removeAllListeners();
            this.emitters.delete(sessionId);
        }
        this.lastContexts.delete(sessionId);
        this.thinkingBuffers.delete(sessionId);
        this.calculationLogBuffers.delete(sessionId);
        this.candidateScoreBuffers.delete(sessionId);
        this.decisionBuffers.delete(sessionId);
        this.lastActive.delete(sessionId);
        // Last-Event-ID cleanup
        this.eventSequences.delete(sessionId);
        this.eventLogs.delete(sessionId);
        this.subscribedSessions.delete(sessionId);
    }

    /**
     * Subscribe to cross-process Redis events for a session.
     * Essential for worker-to-API event bridging in distributed environments.
     */
    async subscribeToSession(sessionId: string): Promise<void> {
        if (!this.redisSubscriber || !this.useRedis) return;
        if (this.subscribedSessions.has(sessionId)) return;

        this.subscribedSessions.add(sessionId);
        // Subscribe directly on the dedicated subscriber client instead of
        // the command client (redisStore). Using the command client for
        // Pub/Sub would switch it to subscriber mode and break all regular
        // Redis operations (set, get, ping, etc.).
        const channel = `session:events:${sessionId}`;
        try {
            await this.redisSubscriber.subscribe(channel, (message: string) => {
                try {
                    this.redisReceivedCount++;
                    const event = JSON.parse(message);
                    event._fromBridge = true;
                    this.emit(sessionId, event as SessionEvent);
                } catch (parseError) {
                    logger.error('[SessionEventManager] Failed to parse Redis event', {
                        sessionId: sessionId.slice(0, 8),
                        error: parseError instanceof Error ? parseError.message : String(parseError),
                    });
                }
            });
            logger.info(`[SessionEventManager] Subscribed to Redis events for ${sessionId.slice(0, 8)}`);
        } catch (error) {
            logger.error('[SessionEventManager] Failed to subscribe to Redis', {
                sessionId: sessionId.slice(0, 8),
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Gracefully close all Redis connections and release global resources.
     * Essential for clean shutdowns and preventing connection leaks.
     */
    async shutdown(): Promise<void> {
        logger.info('[SessionEventManager] Cleaning up resources...');
        this.subscribedSessions.clear();
        
        const tasks: Promise<void>[] = [];
        
        if (this.redisSubscriber) {
            // Check for quit method on the underlying client
            const subscriber = (this.redisSubscriber as any)._client || this.redisSubscriber;
            if (typeof (subscriber as any).quit === 'function') {
                tasks.push((subscriber as any).quit());
            }
            this.redisSubscriber = null;
        }
        
        await Promise.all(tasks).catch(err => {
            logger.error('[SessionEventManager] Error during cleanup', err);
        });
        logger.info('[SessionEventManager] Cleanup complete');
    }

    checkRedisBridgeHealth(): { healthy: boolean; published: number; received: number } {
        this.redisBridgeHealthy = this.redisPublishedCount > 0 || this.redisReceivedCount > 0;
        return {
            healthy: this.redisBridgeHealthy,
            published: this.redisPublishedCount,
            received: this.redisReceivedCount,
        };
    }

    /**
     * Check if session has active listeners
     */
    hasListeners(sessionId: string): boolean {
        const emitter = this.emitters.get(sessionId);
        return emitter ? emitter.listenerCount('event') > 0 : false;
    }

    /**
     * Get the last AI Context for a session
     */
    getLastContext(sessionId: string): AIContextEvent | undefined {
        this.touch(sessionId);
        return this.lastContexts.get(sessionId);
    }

    /**
     * Append text to specific candidate buffer
     */
    appendToThinkingBuffer(sessionId: string, stage: number, text: string, candidateTime: string = 'general'): void {
        this.touch(sessionId);
        if (!this.thinkingBuffers.has(sessionId)) {
            this.thinkingBuffers.set(sessionId, new Map());
        }

        const sessionBufferMap = this.thinkingBuffers.get(sessionId)!;
        const key = `${stage}_${candidateTime}`;
        const current = sessionBufferMap.get(key);

        if (!current) {
            sessionBufferMap.set(key, { stage, text, candidateTime });
        } else {
            current.text += text;
        }
    }

    /**
     * Get all accumulated thinking streams for a session
     */
    getThinkingBuffers(sessionId: string): Array<{ stage: number; text: string; candidateTime: string }> {
        this.touch(sessionId);
        const map = this.thinkingBuffers.get(sessionId);
        return map ? Array.from(map.values()) : [];
    }

    /**
     * Append to calculation log buffer (Keep last 50)
     */
    appendToCalculationBuffer(sessionId: string, log: CalculationLogEvent): void {
        this.touch(sessionId);
        if (!this.calculationLogBuffers.has(sessionId)) {
            this.calculationLogBuffers.set(sessionId, []);
        }
        const buffer = this.calculationLogBuffers.get(sessionId)!;
        buffer.push(log);
        if (buffer.length > 50) {
            buffer.shift();
        }
    }

    /**
     * Append to candidate score buffer (Persistence for Sync)
     */
    appendToCandidateScoreBuffer(sessionId: string, scoreEvent: CandidateScoreEvent): void {
        this.touch(sessionId);
        if (!this.candidateScoreBuffers.has(sessionId)) {
            this.candidateScoreBuffers.set(sessionId, []);
        }
        const buffer = this.candidateScoreBuffers.get(sessionId)!;

        const existingIdx = buffer.findIndex(c => c.time === scoreEvent.time);
        if (existingIdx >= 0) {
            buffer[existingIdx] = scoreEvent;
        } else {
            buffer.push(scoreEvent);
        }
    }

    /**
     * Append to decision buffer
     */
    appendToDecisionBuffer(sessionId: string, decision: DecisionEvent): void {
        this.touch(sessionId);
        if (!this.decisionBuffers.has(sessionId)) {
            this.decisionBuffers.set(sessionId, []);
        }
        const buffer = this.decisionBuffers.get(sessionId)!;
        buffer.push(decision);
        // Limit to last 200 decisions to prevent unbounded memory growth
        if (buffer.length > 200) {
            buffer.shift();
        }
    }

    /**
     * Get decision buffer
     */
    getDecisionBuffer(sessionId: string): DecisionEvent[] | undefined {
        this.touch(sessionId);
        return this.decisionBuffers.get(sessionId);
    }

    /**
     * Get all candidate scores for sync
     */
    getCandidateScoreBuffer(sessionId: string): CandidateScoreEvent[] | undefined {
        this.touch(sessionId);
        return this.candidateScoreBuffers.get(sessionId);
    }

    /**
     * Get recent calculation logs
     */
    getCalculationBuffer(sessionId: string): CalculationLogEvent[] | undefined {
        this.touch(sessionId);
        return this.calculationLogBuffers.get(sessionId);
    }

    /**
     * Update last active timestamp
     */
    private touch(sessionId: string): void {
        this.lastActive.set(sessionId, Date.now());
    }

    /**
     * Remove stale sessions (> 1 hour inactive)
     */
    private garbageCollect(): void {
        const now = Date.now();
        const timeout = 60 * 60 * 1000; // 1 Hour TTL
        const memoryUsage = process.memoryUsage();

        logger.info(`[Memory Tracker] GC Run. RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB, Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB, Active Sessions: ${this.lastActive.size}`);

        let cleaned = 0;
        for (const [sessionId, lastActive] of this.lastActive.entries()) {
            if (now - lastActive > timeout) {
                logger.info(`GC: Removing stale session ${sessionId?.slice(0, 8)}`);
                this.cleanup(sessionId);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            logger.info(`GC Complete: Cleaned ${cleaned} stale sessions.`);
        }
    }
}

// Global singleton
export const sessionEvents = new SessionEventManager();



export function emitProgress(
    sessionId: string,
    step: string,
    stepIndex: number,
    totalSteps: number,
    message: string,
    details?: string[],
    startedAt?: string
): void {
    sessionEvents.emit(sessionId, {
        type: 'progress',
        step,
        stepIndex,
        totalSteps,
        percentage: Math.round((stepIndex / totalSteps) * 100),
        message,
        details,
        startedAt,
    });
}

export function emitAIThinking(
    sessionId: string,
    chunk: string,
    stage: number,
    candidateTime?: string
): void {
    sessionEvents.appendToThinkingBuffer(sessionId, stage, chunk, candidateTime);
    sessionEvents.bufferThinking(sessionId, chunk, stage, candidateTime);
}

export function emitEphemeris(
    sessionId: string,
    candidateTime: string,
    ascendant: { sign: string; degree: number },
    moonSign: string,
    moonNakshatra: string
): void {
    sessionEvents.emit(sessionId, {
        type: 'ephemeris',
        candidateTime,
        ascendant,
        moonSign,
        moonNakshatra,
    });
}

export function emitCandidateScore(
    sessionId: string,
    time: string,
    score: number,
    stage: number,
    rank?: number,
    minifiedEph?: { sun: string; moon: string; ascendant: string },
    fullEph?: Record<string, string>,
    batch?: number
): void {
    logger.info(`Buffer Candidate Score: ${sessionId?.slice(0, 8)} | ${time} | ${score}`);
    sessionEvents.bufferScore(sessionId, {
        type: 'candidate_score_v2',
        time,
        score,
        stage,
        batch,
        rank,
        minifiedEph,
        fullEph,
    });
}

export function emitComplete(
    sessionId: string,
    rectifiedTime: string,
    accuracy: number,
    confidence: string
): void {
    logger.info('emitComplete called', { sessionId: sessionId?.slice(0, 8), rectifiedTime, accuracy, confidence });
    sessionEvents.emit(sessionId, {
        type: 'complete',
        rectifiedTime,
        accuracy,
        confidence,
    });
    // Cleanup after a delay to allow final event delivery
    setTimeout(() => sessionEvents.cleanup(sessionId), 5000);
}

export function emitError(
    sessionId: string,
    message: string,
    stage?: string
) {
    sessionEvents.emit(sessionId, {
        type: 'error',
        message,
        stage,
    });
    // Cleanup after a delay to allow final event delivery
    setTimeout(() => sessionEvents.cleanup(sessionId), 5000);
}
export function emitAIContext(
    sessionId: string,
    data: Omit<AIContextEvent, 'type'>
): void {
    sessionEvents.emit(sessionId, {
        type: 'ai_context',
        ...data
    } as AIContextEvent);
}

export function emitCalculationLog(
    sessionId: string,
    data: Omit<CalculationLogEvent, 'type' | 'logId'>
): void {
    sessionEvents.emit(sessionId, {
        type: 'calculation_log',
        logId: crypto.randomUUID(),
        ...data
    } as CalculationLogEvent);
}

export function emitStageStats(
    sessionId: string,
    stage: number,
    candidateCount: number,
    description: string
): void {
    sessionEvents.emit(sessionId, {
        type: 'stage_stats',
        stage,
        candidateCount,
        description
    });
}

export function emitEstimatedTime(
    sessionId: string,
    seconds: number
): void {
    sessionEvents.emit(sessionId, {
        type: 'estimated_time',
        seconds
    });
}

export function emitDecision(
    sessionId: string,
    data: Omit<DecisionEvent, 'type'>
): void {
    sessionEvents.emit(sessionId, {
        type: 'decision',
        ...data
    } as DecisionEvent);
}

/**
 * Manually cleanup session resources (used for re-queuing)
 */
export function cleanupSession(sessionId: string): void {
    sessionEvents.cleanup(sessionId);
}

