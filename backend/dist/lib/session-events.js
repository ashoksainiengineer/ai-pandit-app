"use strict";
// backend/src/lib/session-events.ts
// Global EventEmitter for real-time session progress streaming
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionEvents = void 0;
exports.emitProgress = emitProgress;
exports.emitAIThinking = emitAIThinking;
exports.emitEphemeris = emitEphemeris;
exports.emitCandidateScore = emitCandidateScore;
exports.emitComplete = emitComplete;
exports.emitError = emitError;
exports.emitAIContext = emitAIContext;
const events_1 = require("events");
// ═════════════════════════════════════════════════════════════════════════════
// GLOBAL SESSION EVENT EMITTER
// ═════════════════════════════════════════════════════════════════════════════
class SessionEventManager {
    emitters = new Map();
    /**
     * Get or create an emitter for a session
     */
    getEmitter(sessionId) {
        if (!this.emitters.has(sessionId)) {
            const emitter = new events_1.EventEmitter();
            emitter.setMaxListeners(10); // Allow multiple SSE connections
            this.emitters.set(sessionId, emitter);
        }
        return this.emitters.get(sessionId);
    }
    /**
     * Emit an event for a session
     */
    emit(sessionId, event) {
        const emitter = this.emitters.get(sessionId);
        if (emitter) {
            emitter.emit('event', event);
        }
    }
    /**
     * Clean up emitter when session completes
     */
    cleanup(sessionId) {
        const emitter = this.emitters.get(sessionId);
        if (emitter) {
            emitter.removeAllListeners();
            this.emitters.delete(sessionId);
        }
    }
    /**
     * Check if session has active listeners
     */
    hasListeners(sessionId) {
        const emitter = this.emitters.get(sessionId);
        return emitter ? emitter.listenerCount('event') > 0 : false;
    }
}
// Global singleton
exports.sessionEvents = new SessionEventManager();
// ═════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════
function emitProgress(sessionId, step, stepIndex, totalSteps, message, details) {
    exports.sessionEvents.emit(sessionId, {
        type: 'progress',
        step,
        stepIndex,
        totalSteps,
        percentage: Math.round((stepIndex / totalSteps) * 100),
        message,
        details,
    });
}
function emitAIThinking(sessionId, chunk, stage, candidateTime) {
    exports.sessionEvents.emit(sessionId, {
        type: 'ai_thinking',
        chunk,
        stage,
        candidateTime,
    });
}
function emitEphemeris(sessionId, candidateTime, ascendant, moonSign, moonNakshatra) {
    exports.sessionEvents.emit(sessionId, {
        type: 'ephemeris',
        candidateTime,
        ascendant,
        moonSign,
        moonNakshatra,
    });
}
function emitCandidateScore(sessionId, time, score, stage, rank) {
    console.log(`⚡ Emit Candidate Score: ${sessionId} | ${time} | ${score}`);
    exports.sessionEvents.emit(sessionId, {
        type: 'candidate_score_v2',
        time,
        score,
        stage,
        rank,
    });
}
function emitComplete(sessionId, rectifiedTime, accuracy, confidence) {
    exports.sessionEvents.emit(sessionId, {
        type: 'complete',
        rectifiedTime,
        accuracy,
        confidence,
    });
    // Cleanup after a delay to allow final event delivery
    setTimeout(() => exports.sessionEvents.cleanup(sessionId), 5000);
}
function emitError(sessionId, message, stage) {
    exports.sessionEvents.emit(sessionId, {
        type: 'error',
        message,
        stage,
    });
}
function emitAIContext(sessionId, data) {
    exports.sessionEvents.emit(sessionId, {
        type: 'ai_context',
        ...data
    });
}
//# sourceMappingURL=session-events.js.map