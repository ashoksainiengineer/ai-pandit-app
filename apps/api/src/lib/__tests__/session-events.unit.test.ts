/**
 * Session Events Unit Tests
 * 
 * Industry-standard unit tests for SessionEventManager.
 * Uses real timers to match implementation behavior.
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach
} from 'vitest';
import { EventEmitter } from 'events';
import { 
  sessionEvents, 
  emitProgress, 
  emitAIThinking, 
  emitCandidateScore,
  emitComplete,
  emitError
} from '../session-events.js';
import { waitFor, TEST_TIMEOUTS } from './test-utils.js';

describe('SessionEventManager - Unit Tests', () => {
  const TEST_SESSION_ID = 'test-session-events';

  beforeEach(() => {
    // Clean up before each test
    sessionEvents.cleanup(TEST_SESSION_ID);
  });

  afterEach(() => {
    // Clean up after each test
    sessionEvents.cleanup(TEST_SESSION_ID);
  });

  describe('Given a new session', () => {
    describe('When getting an emitter', () => {
      it('Then should create and return an EventEmitter', () => {
        const emitter = sessionEvents.getEmitter(TEST_SESSION_ID);
        
        expect(emitter).toBeInstanceOf(EventEmitter);
      });

      it('Then should return the same emitter on subsequent calls', () => {
        const emitter1 = sessionEvents.getEmitter(TEST_SESSION_ID);
        const emitter2 = sessionEvents.getEmitter(TEST_SESSION_ID);
        
        expect(emitter1).toBe(emitter2);
      });
    });

    describe('When checking for listeners', () => {
      it('Then should report no listeners initially', () => {
        sessionEvents.getEmitter(TEST_SESSION_ID);
        
        expect(sessionEvents.hasListeners(TEST_SESSION_ID)).toBe(false);
      });

      it('Then should report listeners after subscription', () => {
        const emitter = sessionEvents.getEmitter(TEST_SESSION_ID);
        emitter.on('event', () => {});
        
        expect(sessionEvents.hasListeners(TEST_SESSION_ID)).toBe(true);
      });
    });
  });

  describe('Given an active session', () => {
    describe('When emitting events', () => {
      it('Then should emit events to subscribers', () => {
        const emitter = sessionEvents.getEmitter(TEST_SESSION_ID);
        const received: any[] = [];
        
        emitter.on('event', (data) => received.push(data));
        
        sessionEvents.emit(TEST_SESSION_ID, { 
          type: 'progress', 
          step: 'test',
          percentage: 50 
        } as any);
        
        expect(received).toHaveLength(1);
        expect(received[0].type).toBe('progress');
      });

      it('Then should not throw when emitting to session with no listeners', () => {
        expect(() => {
          sessionEvents.emit(TEST_SESSION_ID, { type: 'ping' } as any);
        }).not.toThrow();
      });
    });

    describe('When emitting progress', () => {
      it('Then should emit progress event immediately', () => {
        const emitter = sessionEvents.getEmitter(TEST_SESSION_ID);
        const received: any[] = [];
        
        emitter.on('event', (data) => received.push(data));
        
        emitProgress(TEST_SESSION_ID, 'grid', 2, 5, 'Testing');
        
        expect(received).toHaveLength(1);
        expect(received[0].type).toBe('progress');
        expect(received[0].step).toBe('grid');
        expect(received[0].percentage).toBe(40); // 2/5 * 100
      });
    });

    describe('When emitting AI thinking', () => {
      it('Then should buffer thinking chunks and emit after batch window', async () => {
        const emitter = sessionEvents.getEmitter(TEST_SESSION_ID);
        const received: any[] = [];
        
        emitter.on('event', (data) => received.push(data));
        
        // Emit thinking chunks
        emitAIThinking(TEST_SESSION_ID, 'Analyzing...', 1, '10:30:00');
        emitAIThinking(TEST_SESSION_ID, ' More analysis...', 1, '10:30:00');
        
        // Should be buffered, not yet emitted
        expect(received).toHaveLength(0);
        
        // Wait for batch window (200ms)
        await waitFor(250);
        
        // Should now have one merged event
        expect(received).toHaveLength(1);
        expect(received[0].type).toBe('ai_thinking');
        expect(received[0].chunk).toContain('Analyzing...');
        expect(received[0].chunk).toContain('More analysis');
      }, TEST_TIMEOUTS.UNIT);

      it('Then should accumulate thinking in buffer for retrieval', async () => {
        emitAIThinking(TEST_SESSION_ID, 'Part 1: Analysis ', 1, '10:30:00');
        emitAIThinking(TEST_SESSION_ID, 'Part 2: Complete', 1, '10:30:00');
        
        const buffers = sessionEvents.getThinkingBuffers(TEST_SESSION_ID);
        
        expect(buffers).toHaveLength(1);
        expect(buffers[0].text).toContain('Part 1');
        expect(buffers[0].text).toContain('Part 2');
        expect(buffers[0].candidateTime).toBe('10:30:00');
        expect(buffers[0].stage).toBe(1);
      });

      it('Then should isolate different candidate streams', () => {
        emitAIThinking(TEST_SESSION_ID, 'Candidate A analysis', 1, '10:30:00');
        emitAIThinking(TEST_SESSION_ID, 'Candidate B analysis', 1, '11:00:00');
        
        const buffers = sessionEvents.getThinkingBuffers(TEST_SESSION_ID);
        
        expect(buffers).toHaveLength(2);
      });
    });

    describe('When emitting candidate scores', () => {
      it('Then should buffer scores and emit after batch window', async () => {
        const newSessionId = `test-session-${Date.now()}`;
        const emitter = sessionEvents.getEmitter(newSessionId);
        const received: any[] = [];
        
        emitter.on('event', (data) => received.push(data));
        
        emitCandidateScore(newSessionId, '10:30:00', 85, 2, 1);
        
        // Wait for batch window
        await waitFor(250);
        
        expect(received.length).toBeGreaterThanOrEqual(1);
        expect(received.some(e => e.type === 'candidate_scores')).toBe(true);
        
        // Cleanup
        sessionEvents.cleanup(newSessionId);
      }, TEST_TIMEOUTS.UNIT);

      it('Then should store scores in buffer for retrieval', async () => {
        emitCandidateScore(TEST_SESSION_ID, '10:30:00', 85, 2, 1);
        
        // Wait for buffer to be updated
        await waitFor(50);
        
        const scores = sessionEvents.getCandidateScoreBuffer(TEST_SESSION_ID);
        
        expect(scores).toBeDefined();
        expect(scores).toHaveLength(1);
        expect(scores![0].time).toBe('10:30:00');
        expect(scores![0].score).toBe(85);
      });

      it('Then should update existing candidate scores', async () => {
        emitCandidateScore(TEST_SESSION_ID, '10:30:00', 85, 2, 1);
        emitCandidateScore(TEST_SESSION_ID, '10:30:00', 95, 3, 1); // Update
        
        await waitFor(50);
        
        const scores = sessionEvents.getCandidateScoreBuffer(TEST_SESSION_ID);
        
        expect(scores).toHaveLength(1);
        expect(scores![0].score).toBe(95); // Updated score
      });
    });

    describe('When completing a session', () => {
      it('Then should emit complete event immediately', () => {
        const emitter = sessionEvents.getEmitter(TEST_SESSION_ID);
        const received: any[] = [];
        
        emitter.on('event', (data) => received.push(data));
        
        emitComplete(TEST_SESSION_ID, '14:30:00', 95, 'HIGH');
        
        expect(received).toHaveLength(1);
        expect(received[0].type).toBe('complete');
        expect(received[0].rectifiedTime).toBe('14:30:00');
        expect(received[0].accuracy).toBe(95);
        expect(received[0].confidence).toBe('HIGH');
      });
    });

    describe('When emitting errors', () => {
      it('Then should emit error event immediately', () => {
        const emitter = sessionEvents.getEmitter(TEST_SESSION_ID);
        const received: any[] = [];
        
        emitter.on('event', (data) => received.push(data));
        
        emitError(TEST_SESSION_ID, 'Analysis failed', 'stage2');
        
        expect(received).toHaveLength(1);
        expect(received[0].type).toBe('error');
        expect(received[0].message).toBe('Analysis failed');
        expect(received[0].stage).toBe('stage2');
      });
    });
  });

  describe('Given session cleanup', () => {
    describe('When cleaning up a session', () => {
      it('Then should remove emitter and buffers', () => {
        // Setup
        sessionEvents.getEmitter(TEST_SESSION_ID);
        emitAIThinking(TEST_SESSION_ID, 'test', 1, '10:30');
        
        // Cleanup
        sessionEvents.cleanup(TEST_SESSION_ID);
        
        // Verify
        const buffers = sessionEvents.getThinkingBuffers(TEST_SESSION_ID);
        expect(buffers).toEqual([]);
      });
    });
  });

  describe('Given sequence counter', () => {
    describe('When getting sequence numbers', () => {
      it('Then should return monotonically increasing sequence numbers', () => {
        const seq1 = sessionEvents.getNextSeq(TEST_SESSION_ID);
        const seq2 = sessionEvents.getNextSeq(TEST_SESSION_ID);
        const seq3 = sessionEvents.getNextSeq(TEST_SESSION_ID);
        
        expect(seq2).toBe(seq1 + 1);
        expect(seq3).toBe(seq2 + 1);
      });

      it('Then should return current sequence without incrementing', () => {
        sessionEvents.getNextSeq(TEST_SESSION_ID); // 1
        sessionEvents.getNextSeq(TEST_SESSION_ID); // 2
        
        const current = sessionEvents.getCurrentSeq(TEST_SESSION_ID);
        
        expect(current).toBe(2);
      });
    });
  });
});
