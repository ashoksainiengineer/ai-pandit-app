/**
 * Redis Event Store
 * Persistent event storage using Redis for session events
 * 
 * This module provides Redis-based storage for session events,
 * replacing in-memory buffers with a distributed, persistent store.
 */

import { logger } from '../utils/logger.js';

// Redis client interface (will be injected)
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  lpush(key: string, ...values: string[]): Promise<number>;
  rpop(key: string, count?: number): Promise<string[]>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  llen(key: string): Promise<number>;
  ltrim(key: string, start: number, stop: number): Promise<void>;
  hset(key: string, field: string, value: string): Promise<number>;
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  hdel(key: string, ...fields: string[]): Promise<number>;
  expire(key: string, seconds: number): Promise<boolean>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  publish(channel: string, message: string): Promise<number>;
  subscribe(channel: string, callback: (message: string) => void): Promise<void>;
}

// Configuration
const DEFAULT_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const MAX_LIST_LENGTH = 2000;
const KEY_PREFIX = 'session-events:';

// Key patterns
const KEYS = {
  eventLog: (sessionId: string) => `${KEY_PREFIX}log:${sessionId}`,
  thinkingBuffer: (sessionId: string) => `${KEY_PREFIX}thinking:${sessionId}`,
  calculationLog: (sessionId: string) => `${KEY_PREFIX}calc:${sessionId}`,
  candidateScore: (sessionId: string) => `${KEY_PREFIX}scores:${sessionId}`,
  decisionBuffer: (sessionId: string) => `${KEY_PREFIX}decisions:${sessionId}`,
  context: (sessionId: string) => `${KEY_PREFIX}context:${sessionId}`,
  sequence: (sessionId: string) => `${KEY_PREFIX}seq:${sessionId}`,
  lastActivity: (sessionId: string) => `${KEY_PREFIX}activity:${sessionId}`,
};

/**
 * Redis Event Store
 */
export class RedisEventStore {
  private redis: RedisClient | null = null;
  private persistenceDisabled: boolean;

  constructor(redis?: RedisClient) {
    this.redis = redis || null;
    this.persistenceDisabled = process.env.NODE_ENV === 'test' || !redis;
  }

  /**
   * Set Redis client (for lazy initialization)
   */
  setRedisClient(client: RedisClient): void {
    this.redis = client;
    this.persistenceDisabled = false;
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.redis !== null && !this.persistenceDisabled;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT LOG (Last-Event-ID support)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get next sequence number for a session
   */
  async getNextSeq(sessionId: string): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const key = KEYS.sequence(sessionId);
      const current = await this.redis!.get(key);
      const next = (parseInt(current || '0', 10)) + 1;
      await this.redis!.set(key, next.toString(), DEFAULT_TTL_SECONDS);
      return next;
    } catch (error) {
      logger.error('[RedisEventStore] Failed to get next seq', { sessionId, error });
      return 0;
    }
  }

  /**
   * Get current sequence number
   */
  async getCurrentSeq(sessionId: string): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const current = await this.redis!.get(KEYS.sequence(sessionId));
      return parseInt(current || '0', 10);
    } catch (error) {
      logger.error('[RedisEventStore] Failed to get current seq', { sessionId, error });
      return 0;
    }
  }

  /**
   * Log an event for replay
   */
  async logEvent(sessionId: string, seq: number, event: unknown): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const key = KEYS.eventLog(sessionId);
      const eventData = JSON.stringify({ seq, event, timestamp: Date.now() });
      
      // Add to list
      await this.redis!.lpush(key, eventData);
      
      // Trim to max length
      await this.redis!.ltrim(key, 0, MAX_LIST_LENGTH - 1);
      
      // Set TTL
      await this.redis!.expire(key, DEFAULT_TTL_SECONDS);
      
      // Update activity timestamp
      await this.redis!.set(KEYS.lastActivity(sessionId), Date.now().toString(), DEFAULT_TTL_SECONDS);
    } catch (error) {
      logger.error('[RedisEventStore] Failed to log event', { sessionId, seq, error });
    }
  }

  /**
   * Get events since a sequence number
   */
  async getEventsSince(sessionId: string, lastSeq: number): Promise<Array<{ seq: number; event: unknown }>> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const key = KEYS.eventLog(sessionId);
      const events = await this.redis!.lrange(key, 0, MAX_LIST_LENGTH - 1);
      
      const parsed = events
        .map(e => {
          try {
            return JSON.parse(e);
          } catch {
            return null;
          }
        })
        .filter((e): e is { seq: number; event: unknown; timestamp: number } => 
          e !== null && typeof e.seq === 'number' && e.seq > lastSeq
        )
        .sort((a, b) => a.seq - b.seq);
      
      return parsed.map(e => ({ seq: e.seq, event: e.event }));
    } catch (error) {
      logger.error('[RedisEventStore] Failed to get events since', { sessionId, lastSeq, error });
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THINKING BUFFERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Store thinking data
   */
  async storeThinking(
    sessionId: string,
    candidateTime: string,
    data: { stage: number; text: string }
  ): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const key = KEYS.thinkingBuffer(sessionId);
      await this.redis!.hset(key, candidateTime, JSON.stringify(data));
      await this.redis!.expire(key, DEFAULT_TTL_SECONDS);
    } catch (error) {
      logger.error('[RedisEventStore] Failed to store thinking', { sessionId, candidateTime, error });
    }
  }

  /**
   * Get thinking data for a session
   */
  async getThinking(sessionId: string): Promise<Map<string, { stage: number; text: string }>> {
    if (!this.isAvailable()) {
      return new Map();
    }

    try {
      const key = KEYS.thinkingBuffer(sessionId);
      const data = await this.redis!.hgetall(key);
      
      const result = new Map<string, { stage: number; text: string }>();
      for (const [candidateTime, value] of Object.entries(data)) {
        try {
          const parsed = JSON.parse(value);
          result.set(candidateTime, parsed);
        } catch {
          // Skip invalid entries
        }
      }
      return result;
    } catch (error) {
      logger.error('[RedisEventStore] Failed to get thinking', { sessionId, error });
      return new Map();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULATION LOG BUFFERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Append calculation log
   */
  async appendCalculationLog(sessionId: string, log: unknown): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const key = KEYS.calculationLog(sessionId);
      await this.redis!.lpush(key, JSON.stringify(log));
      await this.redis!.ltrim(key, 0, 99); // Keep last 100
      await this.redis!.expire(key, DEFAULT_TTL_SECONDS);
    } catch (error) {
      logger.error('[RedisEventStore] Failed to append calculation log', { sessionId, error });
    }
  }

  /**
   * Get calculation logs
   */
  async getCalculationLogs(sessionId: string): Promise<unknown[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const key = KEYS.calculationLog(sessionId);
      const logs = await this.redis!.lrange(key, 0, 99);
      return logs
        .map(l => {
          try {
            return JSON.parse(l);
          } catch {
            return null;
          }
        })
        .filter((l): l is unknown => l !== null);
    } catch (error) {
      logger.error('[RedisEventStore] Failed to get calculation logs', { sessionId, error });
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CANDIDATE SCORE BUFFERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Store candidate score
   */
  async storeCandidateScore(sessionId: string, score: unknown): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const key = KEYS.candidateScore(sessionId);
      await this.redis!.lpush(key, JSON.stringify(score));
      await this.redis!.ltrim(key, 0, 499); // Keep last 500
      await this.redis!.expire(key, DEFAULT_TTL_SECONDS);
    } catch (error) {
      logger.error('[RedisEventStore] Failed to store candidate score', { sessionId, error });
    }
  }

  /**
   * Get candidate scores
   */
  async getCandidateScores(sessionId: string): Promise<unknown[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const key = KEYS.candidateScore(sessionId);
      const scores = await this.redis!.lrange(key, 0, 499);
      return scores
        .map(s => {
          try {
            return JSON.parse(s);
          } catch {
            return null;
          }
        })
        .filter((s): s is unknown => s !== null)
        .reverse(); // Return in chronological order
    } catch (error) {
      logger.error('[RedisEventStore] Failed to get candidate scores', { sessionId, error });
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DECISION BUFFERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Store decision
   */
  async storeDecision(sessionId: string, decision: unknown): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const key = KEYS.decisionBuffer(sessionId);
      await this.redis!.lpush(key, JSON.stringify(decision));
      await this.redis!.ltrim(key, 0, 99); // Keep last 100
      await this.redis!.expire(key, DEFAULT_TTL_SECONDS);
    } catch (error) {
      logger.error('[RedisEventStore] Failed to store decision', { sessionId, error });
    }
  }

  /**
   * Get decisions
   */
  async getDecisions(sessionId: string): Promise<unknown[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const key = KEYS.decisionBuffer(sessionId);
      const decisions = await this.redis!.lrange(key, 0, 99);
      return decisions
        .map(d => {
          try {
            return JSON.parse(d);
          } catch {
            return null;
          }
        })
        .filter((d): d is unknown => d !== null)
        .reverse();
    } catch (error) {
      logger.error('[RedisEventStore] Failed to get decisions', { sessionId, error });
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT STORAGE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Store AI context
   */
  async storeContext(sessionId: string, context: unknown): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const key = KEYS.context(sessionId);
      await this.redis!.set(key, JSON.stringify(context), DEFAULT_TTL_SECONDS);
    } catch (error) {
      logger.error('[RedisEventStore] Failed to store context', { sessionId, error });
    }
  }

  /**
   * Get AI context
   */
  async getContext(sessionId: string): Promise<unknown | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const key = KEYS.context(sessionId);
      const data = await this.redis!.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('[RedisEventStore] Failed to get context', { sessionId, error });
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GARBAGE COLLECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Clean up old session data
   */
  async cleanupSession(sessionId: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const keys = [
        KEYS.eventLog(sessionId),
        KEYS.thinkingBuffer(sessionId),
        KEYS.calculationLog(sessionId),
        KEYS.candidateScore(sessionId),
        KEYS.decisionBuffer(sessionId),
        KEYS.context(sessionId),
        KEYS.sequence(sessionId),
        KEYS.lastActivity(sessionId),
      ];

      for (const key of keys) {
        await this.redis!.del(key);
      }

      logger.info('[RedisEventStore] Cleaned up session', { sessionId });
    } catch (error) {
      logger.error('[RedisEventStore] Failed to cleanup session', { sessionId, error });
    }
  }

  /**
   * Get inactive sessions (for garbage collection)
   */
  async getInactiveSessions(_thresholdMs: number): Promise<string[]> {
    if (!this.isAvailable()) {
      return [];
    }

    // BUG-FIX NOTE: Scanning keys in Redis is expensive; TTL-based expiration is the intended strategy
    // getInactiveSessions is a stub — session cleanup relies on Redis key TTL expiration
    return [];
  }
}

// Singleton instance
let globalStore: RedisEventStore | null = null;

/**
 * Get global Redis event store instance
 */
export function getRedisEventStore(): RedisEventStore {
  if (!globalStore) {
    globalStore = new RedisEventStore();
  }
  return globalStore;
}

/**
 * Initialize Redis event store with client
 */
export function initRedisEventStore(redis: RedisClient): RedisEventStore {
  globalStore = new RedisEventStore(redis);
  return globalStore;
}

// Export types
export type { RedisClient };
