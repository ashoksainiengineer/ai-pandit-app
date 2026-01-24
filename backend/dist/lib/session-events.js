"use strict";
// backend/src/lib/session-events.ts
// Global EventEmitter for real-time session progress streaming
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionEvents = void 0;
exports.emitProgress = emitProgress;
exports.emitAIThinking = emitAIThinking;
exports.emitEphemeris = emitEphemeris;
exports.emitCandidateScore = emitCandidateScore;
exports.emitComplete = emitComplete;
exports.emitError = emitError;
exports.emitAIContext = emitAIContext;
exports.emitCalculationLog = emitCalculationLog;
exports.emitStageStats = emitStageStats;
exports.emitEstimatedTime = emitEstimatedTime;
const events_1 = require("events");
const crypto_1 = __importDefault(require("crypto"));
// ═════════════════════════════════════════════════════════════════════════════
// GLOBAL SESSION EVENT EMITTER
// ═════════════════════════════════════════════════════════════════════════════
class SessionEventManager {
    emitters = new Map();
    lastContexts = new Map();
    // 🧠 Store accumulated thinking text per session { sessionId: { stage: number, text: string } }
    thinkingBuffers = new Map();
    // 🧮 Store recent calculation logs for immediate UI feedback on connect (Circular Buffer-ish)
    calculationLogBuffers = new Map();
    // ⏱️ Track last activity for garbage collection
    lastActive = new Map();
    constructor() {
        // Run garbage collection every 10 minutes
        setInterval(() => this.garbageCollect(), 10 * 60 * 1000);
    }
    /**
     * Get or create an emitter for a session
     */
    getEmitter(sessionId) {
        this.touch(sessionId);
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
        this.touch(sessionId);
        const emitter = this.emitters.get(sessionId);
        if (emitter) {
            emitter.emit('event', event);
        }
        if (event.type === 'ai_context') {
            this.lastContexts.set(sessionId, event);
        }
        if (event.type === 'calculation_log') {
            this.appendToCalculationBuffer(sessionId, event);
        }
    }
    /**
     * Clean up emitter when session completes
     */
    cleanup(sessionId) {
        console.log(`🧹 Cleaning up session resources: ${sessionId?.slice(0, 8)}`);
        const emitter = this.emitters.get(sessionId);
        if (emitter) {
            emitter.removeAllListeners();
            this.emitters.delete(sessionId);
        }
        this.lastContexts.delete(sessionId);
        this.thinkingBuffers.delete(sessionId);
        this.calculationLogBuffers.delete(sessionId);
        this.lastActive.delete(sessionId);
    }
    /**
     * Check if session has active listeners
     */
    hasListeners(sessionId) {
        const emitter = this.emitters.get(sessionId);
        return emitter ? emitter.listenerCount('event') > 0 : false;
    }
    /**
     * Get the last AI Context for a session
     */
    getLastContext(sessionId) {
        this.touch(sessionId);
        return this.lastContexts.get(sessionId);
    }
    /**
     * Append text to thinking buffer or start new
     */
    appendToThinkingBuffer(sessionId, stage, text, candidateTime) {
        this.touch(sessionId);
        const current = this.thinkingBuffers.get(sessionId);
        // If new stage or no buffer, start flesh
        if (!current || current.stage !== stage) {
            console.log(`📝 Starting New Thinking Buffer: ${sessionId?.slice(0, 8)} | Stage ${stage}`);
            this.thinkingBuffers.set(sessionId, { stage, text, candidateTime });
        }
        else {
            // Append to existing
            // Don't log every append, too noisy
            current.text += text;
            current.candidateTime = candidateTime || current.candidateTime;
        }
    }
    /**
     * Get accumulated thinking text
     */
    getThinkingBuffer(sessionId) {
        this.touch(sessionId);
        const buffer = this.thinkingBuffers.get(sessionId);
        console.log(`📖 Reading Thinking Buffer: ${sessionId?.slice(0, 8)} | Found=${!!buffer} | Len=${buffer?.text?.length}`);
        return buffer;
    }
    /**
     * Append to calculation log buffer (Keep last 50)
     */
    appendToCalculationBuffer(sessionId, log) {
        // No need to touch() here as it's called by emit() which touches
        if (!this.calculationLogBuffers.has(sessionId)) {
            this.calculationLogBuffers.set(sessionId, []);
        }
        const buffer = this.calculationLogBuffers.get(sessionId);
        buffer.push(log);
        // Keep last 50 logs to prevent memory leak but ensure context
        if (buffer.length > 50) {
            buffer.shift();
        }
    }
    /**
     * Get recent calculation logs
     */
    getCalculationBuffer(sessionId) {
        this.touch(sessionId);
        return this.calculationLogBuffers.get(sessionId);
    }
    /**
     * Update last active timestamp
     */
    touch(sessionId) {
        this.lastActive.set(sessionId, Date.now());
    }
    /**
     * Remove stale sessions (> 1 hour inactive)
     */
    garbageCollect() {
        const now = Date.now();
        const timeout = 60 * 60 * 1000; // 1 Hour TTL
        let cleaned = 0;
        for (const [sessionId, lastActive] of this.lastActive.entries()) {
            if (now - lastActive > timeout) {
                console.log(`🗑️ Robust Garbage Collection: Removing stale session ${sessionId?.slice(0, 8)}`);
                this.cleanup(sessionId);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            console.log(`🧹 GC Complete: Cleaned ${cleaned} stale sessions.`);
        }
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
    // console.log('🔥 emitAIThinking called:', { sessionId: sessionId?.slice(0, 8), stage, chunkLen: chunk?.length, candidateTime });
    // 🧠 Store content for reconnects
    exports.sessionEvents.appendToThinkingBuffer(sessionId, stage, chunk, candidateTime);
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
    console.log('🎉 emitComplete CALLED:', { sessionId: sessionId?.slice(0, 8), rectifiedTime, accuracy, confidence });
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
function emitCalculationLog(sessionId, data) {
    exports.sessionEvents.emit(sessionId, {
        type: 'calculation_log',
        logId: crypto_1.default.randomUUID(),
        ...data
    });
}
function emitStageStats(sessionId, stage, candidateCount, description) {
    exports.sessionEvents.emit(sessionId, {
        type: 'stage_stats',
        stage,
        candidateCount,
        description
    });
}
function emitEstimatedTime(sessionId, seconds) {
    exports.sessionEvents.emit(sessionId, {
        type: 'estimated_time',
        seconds
    });
}
//# sourceMappingURL=session-events.js.map