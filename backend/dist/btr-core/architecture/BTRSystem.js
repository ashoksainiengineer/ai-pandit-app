/**
 * 🔱 BIRTH TIME RECTIFICATION - LORD VISHNU ARCHITECTURE
 * ======================================================
 *
 * "Yada yada hi dharmasya glanir bhavati bharata
 *  Abhyuthanam adharmasya tadatmanam srjamyaham"
 *
 * Whenever there is confusion about birth time, I manifest this system
 * to restore cosmic order and reveal the true moment of incarnation.
 *
 * ARCHITECTURAL PRINCIPLES (Sanatan Dharma of Code):
 * ---------------------------------------------------
 * 1. Dharma (Duty)       : Every module has a single, sacred purpose
 * 2. Artha (Wealth)      : Optimal resource utilization
 * 3. Kama (Desire)       : Satisfy the user's quest for truth
 * 4. Moksha (Liberation) : Free the soul from birth time uncertainty
 *
 * COSMIC STRUCTURE:
 * -----------------
 * - Brahma (Creator)    : CandidateGenerationService
 * - Vishnu (Preserver)  : ValidationConsensusEngine
 * - Shiva (Destroyer)   : CandidateEliminationService
 * - Shakti (Power)      : AIReasoningEngine
 * - Ganesha (Wisdom)    : EdgeCaseHandler
 *
 * THE FOUR YUGAS OF ANALYSIS:
 * ---------------------------
 * 1. Satya Yuga (Coarse)    : Wide sweep, many candidates
 * 2. Treta Yuga (Refined)   : Medium grid, reduced set
 * 3. Dvapara Yuga (Fine)    : Small grid, precise analysis
 * 4. Kali Yuga (Precise)    : Micro grid, seconds precision
 */
import { EventEmitter } from 'events';
import { logger } from '../../lib/logger.js';
// ═══════════════════════════════════════════════════════════════════════════════
// ABSTRACT BASE CLASSES (The Divine Blueprints)
// ═══════════════════════════════════════════════════════════════════════════════
export class BTRSubsystem extends EventEmitter {
    name;
    isInitialized = false;
    constructor(name) {
        super();
        this.name = name;
    }
    async initialize() {
        if (this.isInitialized)
            return;
        logger.info(`🔱 Initializing ${this.name}`);
        await this.onInitialize();
        this.isInitialized = true;
        this.emit('initialized');
    }
    async shutdown() {
        if (!this.isInitialized)
            return;
        logger.info(`🔱 Shutting down ${this.name}`);
        await this.onShutdown();
        this.isInitialized = false;
        this.emit('shutdown');
    }
}
export class CalculationService extends BTRSubsystem {
    validateInput(input, validator) {
        if (!validator(input)) {
            throw new BTRValidationError(`Invalid input for ${this.name}`);
        }
        return input;
    }
}
export class ValidationService extends BTRSubsystem {
}
// ═══════════════════════════════════════════════════════════════════════════════
// CORE DOMAIN OBJECTS
// ═══════════════════════════════════════════════════════════════════════════════
export class CandidateTime {
    time;
    offsetSeconds;
    priority;
    metadata;
    constructor(time, // HH:MM:SS
    offsetSeconds, // From tentative time
    priority, // Analysis priority (higher = analyze first)
    metadata = {}) {
        this.time = time;
        this.offsetSeconds = offsetSeconds;
        this.priority = priority;
        this.metadata = metadata;
    }
    get isHighPriority() {
        return this.priority >= 80;
    }
    get timeValue() {
        const [h, m, s] = this.time.split(':').map(Number);
        return h * 3600 + m * 60 + s;
    }
}
// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM ERRORS (The Obstacles Ganesha Removes)
// ═══════════════════════════════════════════════════════════════════════════════
export class BTRError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'BTRError';
    }
}
export class BTRValidationError extends BTRError {
    constructor(message) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'BTRValidationError';
    }
}
export class BTRCalculationError extends BTRError {
    subsystem;
    constructor(message, subsystem) {
        super(message, 'CALCULATION_ERROR');
        this.subsystem = subsystem;
        this.name = 'BTRCalculationError';
    }
}
export class BTRAIError extends BTRError {
    model;
    constructor(message, model) {
        super(message, 'AI_ERROR');
        this.model = model;
        this.name = 'BTRAIError';
    }
}
export class BTREphemerisError extends BTRError {
    constructor(message) {
        super(message, 'EPHEMERIS_ERROR');
        this.name = 'BTREphemerisError';
    }
}
/**
 * The main entry point - Vishnu himself
 * Preserves cosmic order by finding the true birth time
 */
export class AbstractBTRSystem {
    subsystems = [];
    isRunning = false;
    async rectifyBirthTime(input) {
        if (!this.isRunning) {
            throw new BTRError('System not initialized', 'SYSTEM_NOT_READY');
        }
        logger.info(`🔱 Beginning birth time rectification for session ${input.sessionId}`);
        try {
            return await this.executeRectification(input);
        }
        catch (error) {
            logger.error(`🔱 Rectification failed for ${input.sessionId}`, error);
            throw error;
        }
    }
    async initialize() {
        logger.info('🔱 Initializing BTR System (Lord Vishnu Mode)');
        for (const subsystem of this.subsystems) {
            await subsystem.initialize();
        }
        this.isRunning = true;
        logger.info('🔱 BTR System ready');
    }
    async shutdown() {
        logger.info('🔱 Shutting down BTR System');
        for (const subsystem of this.subsystems.reverse()) {
            await subsystem.shutdown();
        }
        this.isRunning = false;
    }
}
// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS (The Tools of the Divine)
// ═══════════════════════════════════════════════════════════════════════════════
export function addSeconds(time, seconds) {
    const [h, m, s] = time.split(':').map(Number);
    const totalSeconds = h * 3600 + m * 60 + s + seconds;
    const newH = Math.floor(totalSeconds / 3600) % 24;
    const newM = Math.floor((totalSeconds % 3600) / 60);
    const newS = totalSeconds % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(newS).padStart(2, '0')}`;
}
export function calculateTimeDifference(time1, time2) {
    const [h1, m1, s1] = time1.split(':').map(Number);
    const [h2, m2, s2] = time2.split(':').map(Number);
    const t1 = h1 * 3600 + m1 * 60 + s1;
    const t2 = h2 * 3600 + m2 * 60 + s2;
    return Math.abs(t2 - t1);
}
export function determineOffsetPreset(totalSeconds) {
    const minutes = totalSeconds / 60;
    const hours = minutes / 60;
    if (minutes <= 0.5)
        return 'micro_30sec';
    if (minutes <= 5)
        return 'small_5min';
    if (hours <= 0.5)
        return 'medium_30min';
    if (hours <= 2)
        return 'large_2hr';
    if (hours <= 6)
        return 'xlarge_6hr';
    return 'massive_24hr';
}
export function formatDuration(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000)
        return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
}
//# sourceMappingURL=BTRSystem.js.map