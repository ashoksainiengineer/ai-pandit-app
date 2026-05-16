import { EventEmitter } from 'events';
import crypto from 'crypto';
import { appendJobEvent, getLatestJobForSession } from '@ai-pandit/db/jobs';
import { getRedisEventStore, type RedisClient, type RedisEventStore } from '@ai-pandit/shared/event-store';
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
    BatchConclusionEvent,
    StageConclusionEvent,
    SessionEvent
} from '@ai-pandit/shared/types';

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
    BatchConclusionEvent,
    StageConclusionEvent,
    SessionEvent
};

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
    'ai_thinking',
    'candidate_score_v2',
    'candidate_scores',
    'decision',
    'ai_context',
    'batch_conclusion',
    'stage_conclusion',
]);

function extractPersistenceErrorCode(error: unknown): string | null {
    if (!error || typeof error !== 'object') return null;
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
    private thinkingBuffers: Map<string, Map<string, { stage: number; text: string; candidateTime: string }>> = new Map();
    private calculationLogBuffers: Map<string, CalculationLogEvent[]> = new Map();
    private candidateScoreBuffers: Map<string, CandidateScoreEvent[]> = new Map();
    private decisionBuffers: Map<string, DecisionEvent[]> = new Map();
    private thinkingBroadcastBuffer: Map<string, Array<{ chunk: string; stage: number; candidateTime?: string }>> = new Map();
    private scoreBroadcastBuffer: Map<string, CandidateScoreEvent[]> = new Map();
    private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
    private persistenceDisabled: boolean = process.env.NODE_ENV === 'test';
    private lastActive: Map<string, number> = new Map();
    private eventSequences: Map<string, number> = new Map();
    private eventLogs: Map<string, SequencedEvent[]> = new Map();
    private redisSubscriber: RedisClient | null = null;
    private subscribedSessions: Set<string> = new Set();

    private get redisStore(): RedisEventStore {
        return getRedisEventStore();
    }
    private useRedis: boolean = true;
    private redisPublishedCount = 0;
    private redisReceivedCount = 0;
    private redisBridgeHealthy = false;

    constructor() {
        setInterval(() => this.garbageCollect(), 10 * 60 * 1000);
    }

    enableRedis(redis: RedisClient, subscriber?: RedisClient): void {
        this.redisStore.setRedisClient(redis);
        if (subscriber) {
            this.redisSubscriber = subscriber;
        }
        this.useRedis = true;
        console.info('[SessionEventManager] Redis event storage enabled');
    }

    getNextSeq(sessionId: string): number {
        const current = this.eventSequences.get(sessionId) || 0;
        const next = current + 1;
        this.eventSequences.set(sessionId, next);
        return next;
    }

    getCurrentSeq(sessionId: string): number {
        return this.eventSequences.get(sessionId) || 0;
    }

    logEvent(sessionId: string, seq: number, event: SessionEvent): void {
        const skipLogTypes = ['ping', 'connected'];
        const eventType = event.type;
        if (skipLogTypes.includes(eventType)) return;
        if (!this.eventLogs.has(sessionId)) {
            this.eventLogs.set(sessionId, []);
        }
        const log = this.eventLogs.get(sessionId)!;
        log.push({ seq, event });
        if (log.length > MAX_EVENT_LOG_SIZE) {
            const evictCount = Math.floor(MAX_EVENT_LOG_SIZE * 0.2);
            log.splice(0, evictCount);
        }
    }

    getEventsSince(sessionId: string, lastSeq: number): SequencedEvent[] {
        const log = this.eventLogs.get(sessionId);
        if (!log || log.length === 0) return [];
        let lo = 0, hi = log.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (log[mid].seq <= lastSeq) lo = mid + 1;
            else hi = mid;
        }
        return log.slice(lo);
    }

    getEmitter(sessionId: string): EventEmitter {
        this.touch(sessionId);
        if (!this.emitters.has(sessionId)) {
            const emitter = new EventEmitter();
            emitter.setMaxListeners(50);
            this.emitters.set(sessionId, emitter);
        }
        return this.emitters.get(sessionId)!;
    }

    emit(sessionId: string, event: SessionEvent): void {
        this.touch(sessionId);
        const skipSeqTypes = ['ping', 'connected'];
        const eventType = event.type;

        if (!skipSeqTypes.includes(eventType)) {
            const seq = this.getNextSeq(sessionId);
            (event as SessionEvent & { seq?: number }).seq = seq;
            this.logEvent(sessionId, seq, event);
            void this.persistEvent(sessionId, seq, event);
        }

        const emitter = this.emitters.get(sessionId);
        if (emitter) {
            emitter.emit('event', event);
        }

        if (event.type === 'ai_context') {
            this.lastContexts.set(sessionId, event as AIContextEvent);
        }
        if (event.type === 'calculation_log') {
            this.appendToCalculationBuffer(sessionId, event as CalculationLogEvent);
        }
        if (event.type === 'candidate_score_v2' || event.type === 'candidate_score') {
            this.appendToCandidateScoreBuffer(sessionId, event as CandidateScoreEvent);
        }
        if (event.type === 'decision') {
            this.appendToDecisionBuffer(sessionId, event as DecisionEvent);
        }
    }

    private async persistEvent(sessionId: string, seq: number, event: SessionEvent): Promise<void> {
        if (this.persistenceDisabled) return;
        if (NON_PERSISTED_EVENT_TYPES.has(event.type)) return;
        if (!PERSISTED_EVENT_TYPES.has(event.type)) return;

        try {
            const job = await getLatestJobForSession(sessionId);
            if (!job) {
                console.warn('[SessionEventManager] No job found for session, skipping persist', { sessionId, eventType: event.type, seq });
                return;
            }

            const stage = 'stage' in event && typeof event.stage !== 'undefined'
                ? String(event.stage) : null;

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
            console.warn('[SessionEventManager] Failed to persist job event', {
                sessionId,
                eventType: event.type,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    private startBroadcastLoop(sessionId: string): void {
        if (this.updateIntervals.has(sessionId)) return;
        const interval = setInterval(() => {
            this.flushBroadcastBuffers(sessionId);
        }, 200);
        this.updateIntervals.set(sessionId, interval);
    }

    private flushBroadcastBuffers(sessionId: string): void {
        const thinkingBatch = this.thinkingBroadcastBuffer.get(sessionId);
        if (thinkingBatch && thinkingBatch.length > 0) {
            this.thinkingBroadcastBuffer.set(sessionId, []);
            if (thinkingBatch.length > 50) {
                console.info(`[SessionEventManager] High volume flush: ${thinkingBatch.length} thinking chunks for session ${sessionId.slice(0, 8)}`);
            }
            const grouped = new Map<string, { chunk: string; stage: number; candidateTime?: string }>();
            for (const item of thinkingBatch) {
                const key = `${item.stage}_${item.candidateTime || 'general'}`;
                const existing = grouped.get(key);
                if (existing) existing.chunk += item.chunk;
                else grouped.set(key, { ...item });
            }
            for (const merged of grouped.values()) {
                this.emit(sessionId, { type: 'ai_thinking', ...merged });
            }
        }

        const scoreBatch = this.scoreBroadcastBuffer.get(sessionId);
        if (scoreBatch && scoreBatch.length > 0) {
            this.scoreBroadcastBuffer.set(sessionId, []);
            this.emit(sessionId, { type: 'candidate_scores', data: scoreBatch } as CandidateScoresEvent);
        }
    }

    bufferThinking(sessionId: string, chunk: string, stage: number, candidateTime?: string): void {
        this.touch(sessionId);
        this.startBroadcastLoop(sessionId);
        if (!this.thinkingBroadcastBuffer.has(sessionId)) {
            this.thinkingBroadcastBuffer.set(sessionId, []);
        }
        this.thinkingBroadcastBuffer.get(sessionId)!.push({ chunk, stage, candidateTime });
    }

    bufferScore(sessionId: string, score: CandidateScoreEvent): void {
        this.touch(sessionId);
        this.startBroadcastLoop(sessionId);
        this.appendToCandidateScoreBuffer(sessionId, score);
        if (!this.scoreBroadcastBuffer.has(sessionId)) {
            this.scoreBroadcastBuffer.set(sessionId, []);
        }
        this.scoreBroadcastBuffer.get(sessionId)!.push(score);
    }

    cleanup(sessionId: string): void {
        console.info(`[SessionEventManager] Cleaning up session: ${sessionId?.slice(0, 8)}`);
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
        this.eventSequences.delete(sessionId);
        this.eventLogs.delete(sessionId);
        this.subscribedSessions.delete(sessionId);
    }

    async subscribeToSession(sessionId: string, retries = 5): Promise<void> {
        for (let attempt = 0; attempt < retries; attempt++) {
            if (this.redisSubscriber && this.useRedis) break;
            if (attempt < retries - 1) {
                await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
            } else {
                console.warn('[SessionEventManager] Redis subscriber not available, skipping subscription', {
                    sessionId: sessionId.slice(0, 8),
                });
                return;
            }
        }
        if (this.subscribedSessions.has(sessionId)) return;
        this.subscribedSessions.add(sessionId);
        const channel = `session:events:${sessionId}`;
        try {
            await this.redisSubscriber!.subscribe(channel, (message: string) => {
                try {
                    this.redisReceivedCount++;
                    const event = JSON.parse(message);
                    event._fromBridge = true;
                    this.emit(sessionId, event as SessionEvent);
                } catch (parseError) {
                    console.error('[SessionEventManager] Failed to parse Redis event', {
                        sessionId: sessionId.slice(0, 8),
                        error: parseError instanceof Error ? parseError.message : String(parseError),
                    });
                }
            });
            console.info(`[SessionEventManager] Subscribed to Redis events for ${sessionId.slice(0, 8)}`);
        } catch (error) {
            console.error('[SessionEventManager] Failed to subscribe to Redis', {
                sessionId: sessionId.slice(0, 8),
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    async shutdown(): Promise<void> {
        console.info('[SessionEventManager] Cleaning up resources...');
        this.subscribedSessions.clear();
        const tasks: Promise<void>[] = [];
        if (this.redisSubscriber) {
            const subscriber = (this.redisSubscriber as any)._client || this.redisSubscriber;
            if (typeof (subscriber as any).quit === 'function') {
                tasks.push((subscriber as any).quit());
            }
            this.redisSubscriber = null;
        }
        await Promise.all(tasks).catch(err => {
            console.error('[SessionEventManager] Error during cleanup', err);
        });
        console.info('[SessionEventManager] Cleanup complete');
    }

    checkRedisBridgeHealth(): { healthy: boolean; published: number; received: number } {
        this.redisBridgeHealthy = this.redisPublishedCount > 0 || this.redisReceivedCount > 0;
        return { healthy: this.redisBridgeHealthy, published: this.redisPublishedCount, received: this.redisReceivedCount };
    }

    hasListeners(sessionId: string): boolean {
        const emitter = this.emitters.get(sessionId);
        return emitter ? emitter.listenerCount('event') > 0 : false;
    }

    getLastContext(sessionId: string): AIContextEvent | undefined {
        this.touch(sessionId);
        return this.lastContexts.get(sessionId);
    }

    appendToThinkingBuffer(sessionId: string, stage: number, text: string, candidateTime: string = 'general'): void {
        this.touch(sessionId);
        if (!this.thinkingBuffers.has(sessionId)) {
            this.thinkingBuffers.set(sessionId, new Map());
        }
        const sessionBufferMap = this.thinkingBuffers.get(sessionId)!;
        const key = `${stage}_${candidateTime}`;
        const current = sessionBufferMap.get(key);
        if (!current) sessionBufferMap.set(key, { stage, text, candidateTime });
        else current.text += text;
    }

    getThinkingBuffers(sessionId: string): Array<{ stage: number; text: string; candidateTime: string }> {
        this.touch(sessionId);
        const map = this.thinkingBuffers.get(sessionId);
        return map ? Array.from(map.values()) : [];
    }

    appendToCalculationBuffer(sessionId: string, log: CalculationLogEvent): void {
        this.touch(sessionId);
        if (!this.calculationLogBuffers.has(sessionId)) {
            this.calculationLogBuffers.set(sessionId, []);
        }
        const buffer = this.calculationLogBuffers.get(sessionId)!;
        buffer.push(log);
        if (buffer.length > 50) buffer.shift();
    }

    appendToCandidateScoreBuffer(sessionId: string, scoreEvent: CandidateScoreEvent): void {
        this.touch(sessionId);
        if (!this.candidateScoreBuffers.has(sessionId)) {
            this.candidateScoreBuffers.set(sessionId, []);
        }
        const buffer = this.candidateScoreBuffers.get(sessionId)!;
        const existingIdx = buffer.findIndex(c => c.time === scoreEvent.time);
        if (existingIdx >= 0) buffer[existingIdx] = scoreEvent;
        else buffer.push(scoreEvent);
    }

    appendToDecisionBuffer(sessionId: string, decision: DecisionEvent): void {
        this.touch(sessionId);
        if (!this.decisionBuffers.has(sessionId)) {
            this.decisionBuffers.set(sessionId, []);
        }
        const buffer = this.decisionBuffers.get(sessionId)!;
        buffer.push(decision);
        if (buffer.length > 200) buffer.shift();
    }

    getDecisionBuffer(sessionId: string): DecisionEvent[] | undefined {
        this.touch(sessionId);
        return this.decisionBuffers.get(sessionId);
    }

    getCandidateScoreBuffer(sessionId: string): CandidateScoreEvent[] | undefined {
        this.touch(sessionId);
        return this.candidateScoreBuffers.get(sessionId);
    }

    getCalculationBuffer(sessionId: string): CalculationLogEvent[] | undefined {
        this.touch(sessionId);
        return this.calculationLogBuffers.get(sessionId);
    }

    private touch(sessionId: string): void {
        this.lastActive.set(sessionId, Date.now());
    }

    private garbageCollect(): void {
        const now = Date.now();
        const timeout = 60 * 60 * 1000;
        const memoryUsage = process.memoryUsage();
        console.info(`[Memory Tracker] GC Run. RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB, Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB, Active Sessions: ${this.lastActive.size}`);
        let cleaned = 0;
        for (const [sessionId, lastActive] of this.lastActive.entries()) {
            if (now - lastActive > timeout) {
                console.info(`GC: Removing stale session ${sessionId?.slice(0, 8)}`);
                this.cleanup(sessionId);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            console.info(`GC Complete: Cleaned ${cleaned} stale sessions.`);
        }
    }
}

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
    sessionEvents.emit(sessionId, { type: 'ephemeris', candidateTime, ascendant, moonSign, moonNakshatra });
}

export function emitCandidateScore(
    sessionId: string,
    time: string,
    score: number,
    stage: number,
    rank?: number,
    minifiedEph?: { sun: string; moon: string; ascendant: string },
    fullEph?: Record<string, string>,
    batch?: number,
    reason?: string // AI's one-line batch verdict, extracted from <FINAL_SCORES>
): void {
    console.info(`[SessionEventManager] Buffer Candidate Score: ${sessionId?.slice(0, 8)} | ${time} | ${score}`);
    const scoreEvent: CandidateScoreEvent = {
        type: 'candidate_score_v2',
        time, score, stage, batch, rank, minifiedEph, fullEph, reason,
    };
    sessionEvents.bufferScore(sessionId, scoreEvent);
}

export function emitComplete(
    sessionId: string,
    rectifiedTime: string,
    accuracy: number,
    confidence: string
): void {
    console.info('[SessionEventManager] emitComplete called', { sessionId: sessionId?.slice(0, 8), rectifiedTime, accuracy, confidence });
    sessionEvents.emit(sessionId, { type: 'complete', rectifiedTime, accuracy, confidence });
    setTimeout(() => sessionEvents.cleanup(sessionId), 5000);
}

export function emitError(sessionId: string, message: string, stage?: string) {
    sessionEvents.emit(sessionId, { type: 'error', message, stage });
    setTimeout(() => sessionEvents.cleanup(sessionId), 5000);
}

export function emitAIContext(sessionId: string, data: Omit<AIContextEvent, 'type'>): void {
    sessionEvents.emit(sessionId, { type: 'ai_context', ...data } as AIContextEvent);
}

export function emitCalculationLog(sessionId: string, data: Omit<CalculationLogEvent, 'type' | 'logId'>): void {
    sessionEvents.emit(sessionId, { type: 'calculation_log', logId: crypto.randomUUID(), ...data } as CalculationLogEvent);
}

export function emitStageStats(sessionId: string, stage: number, candidateCount: number, description: string): void {
    sessionEvents.emit(sessionId, { type: 'stage_stats', stage, candidateCount, description });
}

export function emitEstimatedTime(sessionId: string, seconds: number): void {
    sessionEvents.emit(sessionId, { type: 'estimated_time', seconds });
}

export function emitDecision(sessionId: string, data: Omit<DecisionEvent, 'type'>): void {
    sessionEvents.emit(sessionId, { type: 'decision', ...data } as DecisionEvent);
}

export function emitBatchConclusion(
    sessionId: string,
    data: Omit<BatchConclusionEvent, 'type'>
): void {
    sessionEvents.emit(sessionId, { type: 'batch_conclusion', ...data } as BatchConclusionEvent);
}

export function emitStageConclusion(
    sessionId: string,
    data: Omit<StageConclusionEvent, 'type'>
): void {
    sessionEvents.emit(sessionId, { type: 'stage_conclusion', ...data } as StageConclusionEvent);
}

export function cleanupSession(sessionId: string): void {
    sessionEvents.cleanup(sessionId);
}
