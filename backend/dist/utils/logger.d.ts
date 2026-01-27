/**
 * 🔱 AI-Pandit Unified Logger
 * ===========================
 * Structured, production-grade logging with Pino.
 * Supports JSON output for production and pretty printing for development.
 */
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
interface LoggerOptions {
    level?: LogLevel;
    prettyPrint?: boolean;
    redactFields?: string[];
}
declare class Logger {
    private level;
    private prettyPrint;
    private redactFields;
    constructor(options?: LoggerOptions);
    private shouldLog;
    private formatTimestamp;
    private formatMessage;
    private getLevelColor;
    private log;
    trace(message: string, meta?: Record<string, unknown>): void;
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void;
    fatal(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void;
    child(bindings: Record<string, unknown>): Logger;
}
export declare const logger: Logger;
export interface RequestContext {
    requestId: string;
    method: string;
    path: string;
    userId?: string;
    sessionId?: string;
    ip?: string;
    userAgent?: string;
}
export declare function createRequestLogger(context: RequestContext): Logger;
export declare function logPerformance<T>(operation: string, fn: () => T | Promise<T>, meta?: Record<string, unknown>): Promise<T>;
export default logger;
//# sourceMappingURL=logger.d.ts.map