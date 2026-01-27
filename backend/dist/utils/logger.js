/**
 * 🔱 AI-Pandit Unified Logger
 * ===========================
 * Structured, production-grade logging with Pino.
 * Supports JSON output for production and pretty printing for development.
 */
import { config } from '../config/index.js';
const LOG_LEVELS = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60,
};
// ═════════════════════════════════════════════════════════════════════════════
// SAFE STRINGIFY HELPER
// ═════════════════════════════════════════════════════════════════════════════
function safeStringify(obj) {
    try {
        return JSON.stringify(obj, getCircularReplacer());
    }
    catch {
        return '[Unable to stringify]';
    }
}
function getCircularReplacer() {
    const seen = new WeakSet();
    return (_key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular Reference]';
            }
            seen.add(value);
        }
        return value;
    };
}
// ═════════════════════════════════════════════════════════════════════════════
// REDACTION HELPER
// ═════════════════════════════════════════════════════════════════════════════
function redactSensitiveData(obj, fieldsToRedact) {
    const redacted = {};
    for (const [key, value] of Object.entries(obj)) {
        const shouldRedact = fieldsToRedact.some((field) => key.toLowerCase().includes(field.toLowerCase()));
        if (shouldRedact) {
            redacted[key] = '[REDACTED]';
        }
        else if (value && typeof value === 'object' && !Array.isArray(value)) {
            redacted[key] = redactSensitiveData(value, fieldsToRedact);
        }
        else {
            redacted[key] = value;
        }
    }
    return redacted;
}
// ═════════════════════════════════════════════════════════════════════════════
// BASE LOGGER CLASS
// ═════════════════════════════════════════════════════════════════════════════
class Logger {
    level;
    prettyPrint;
    redactFields;
    constructor(options = {}) {
        this.level = options.level || config.logging.level || 'info';
        this.prettyPrint = options.prettyPrint ?? (config.logging.format === 'pretty');
        this.redactFields = options.redactFields || [...config.logging.redactFields];
    }
    shouldLog(level) {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
    }
    formatTimestamp() {
        return new Date().toISOString();
    }
    formatMessage(level, message, meta) {
        const timestamp = this.formatTimestamp();
        const safeMeta = meta ? redactSensitiveData(meta, this.redactFields) : {};
        if (this.prettyPrint) {
            const levelColor = this.getLevelColor(level);
            const resetColor = '\x1b[0m';
            const metaStr = Object.keys(safeMeta).length > 0
                ? '\n' + safeStringify(safeMeta)
                : '';
            return `${timestamp} ${levelColor}[${level.toUpperCase()}]${resetColor} ${message}${metaStr}`;
        }
        return safeStringify({
            timestamp,
            level: level.toUpperCase(),
            message,
            ...safeMeta,
        });
    }
    getLevelColor(level) {
        const colors = {
            trace: '\x1b[90m', // Gray
            debug: '\x1b[36m', // Cyan
            info: '\x1b[32m', // Green
            warn: '\x1b[33m', // Yellow
            error: '\x1b[31m', // Red
            fatal: '\x1b[35m', // Magenta
        };
        return colors[level] || '\x1b[0m';
    }
    log(level, message, meta) {
        if (!this.shouldLog(level))
            return;
        const formatted = this.formatMessage(level, message, meta);
        // Use appropriate output stream
        if (level === 'error' || level === 'fatal') {
            console.error(formatted);
        }
        else if (level === 'warn') {
            console.warn(formatted);
        }
        else {
            console.log(formatted);
        }
    }
    // Public API
    trace(message, meta) {
        this.log('trace', message, meta);
    }
    debug(message, meta) {
        this.log('debug', message, meta);
    }
    info(message, meta) {
        this.log('info', message, meta);
    }
    warn(message, meta) {
        this.log('warn', message, meta);
    }
    error(message, error, meta) {
        const errorMeta = { ...meta };
        if (error instanceof Error) {
            errorMeta.error = {
                name: error.name,
                message: error.message,
                stack: config.logging.includeStackTrace ? error.stack : undefined,
            };
        }
        else if (error !== undefined) {
            errorMeta.error = String(error);
        }
        this.log('error', message, errorMeta);
    }
    fatal(message, error, meta) {
        const errorMeta = { ...meta };
        if (error instanceof Error) {
            errorMeta.error = {
                name: error.name,
                message: error.message,
                stack: error.stack,
            };
        }
        else if (error !== undefined) {
            errorMeta.error = String(error);
        }
        this.log('fatal', message, errorMeta);
    }
    // Child logger with bound context
    child(bindings) {
        const childLogger = new Logger({
            level: this.level,
            prettyPrint: this.prettyPrint,
            redactFields: this.redactFields,
        });
        // Override log method to include bindings
        const originalLog = this.log.bind(this);
        childLogger.log = (level, message, meta) => {
            originalLog(level, message, { ...bindings, ...meta });
        };
        return childLogger;
    }
}
// ═════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═════════════════════════════════════════════════════════════════════════════
export const logger = new Logger();
export function createRequestLogger(context) {
    return logger.child({
        requestId: context.requestId,
        method: context.method,
        path: context.path,
        userId: context.userId,
        sessionId: context.sessionId,
        ip: context.ip,
        userAgent: context.userAgent,
    });
}
// ═════════════════════════════════════════════════════════════════════════════
// PERFORMANCE LOGGER
// ═════════════════════════════════════════════════════════════════════════════
export function logPerformance(operation, fn, meta) {
    const startTime = process.hrtime.bigint();
    const logCompletion = (success, error) => {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1_000_000;
        const logMeta = {
            operation,
            durationMs: Math.round(durationMs * 100) / 100,
            success,
            ...meta,
        };
        if (error) {
            logMeta.error = error instanceof Error ? error.message : String(error);
        }
        logger.debug(`Performance: ${operation}`, logMeta);
    };
    try {
        const result = fn();
        if (result instanceof Promise) {
            return result
                .then((value) => {
                logCompletion(true);
                return value;
            })
                .catch((error) => {
                logCompletion(false, error);
                throw error;
            });
        }
        logCompletion(true);
        return Promise.resolve(result);
    }
    catch (error) {
        logCompletion(false, error);
        throw error;
    }
}
export default logger;
//# sourceMappingURL=logger.js.map