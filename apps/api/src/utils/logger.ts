/**
 * 🔱 AI-Pandit Unified Logger
 * ===========================
 * Structured, production-grade logging with Pino.
 * Supports JSON output for production and pretty printing for development.
 */

import { config } from '../config/index.js';
import fs from 'fs';
import { appendFile } from 'fs/promises';
import path from 'path';

const defaultLoggingConfig = {
  level: 'info',
  format: 'json',
  redactFields: ['password', 'token', 'secret', 'authorization'],
  includeStackTrace: true,
};
const loggingConfig = {
  ...defaultLoggingConfig,
  ...(config as { logging?: Partial<typeof defaultLoggingConfig> }).logging,
};

const LOG_DIR = path.join(process.cwd(), 'logs');
let _logDirEnsured = false;
function ensureLogDir(): void {
  if (!_logDirEnsured) {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    _logDirEnsured = true;
  }
}

// LOG LEVELS

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

// LOGGER OPTIONS

interface LoggerOptions {
  level?: LogLevel;
  prettyPrint?: boolean;
  redactFields?: string[];
}

// SAFE STRINGIFY HELPER

function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, getCircularReplacer());
  } catch {
    return '[Unable to stringify]';
  }
}

function getCircularReplacer(): (key: string, value: unknown) => unknown {
  const seen = new WeakSet();
  return (_key: string, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    return value;
  };
}

// REDACTION HELPER

function redactSensitiveData(
  obj: Record<string, unknown>,
  fieldsToRedact: string[]
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const shouldRedact = fieldsToRedact.some(
      (field) => key.toLowerCase().includes(field.toLowerCase())
    );

    if (shouldRedact) {
      redacted[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      redacted[key] = redactSensitiveData(value as Record<string, unknown>, fieldsToRedact);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

// BASE LOGGER CLASS

class Logger {
  private level: LogLevel;
  private prettyPrint: boolean;
  private redactFields: string[];

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || (loggingConfig.level as LogLevel) || 'info';
    this.prettyPrint = options.prettyPrint ?? (loggingConfig.format === 'pretty');
    this.redactFields = options.redactFields || [...loggingConfig.redactFields];
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>
  ): string {
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

  private getLevelColor(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      trace: '\x1b[90m',  // Gray
      debug: '\x1b[36m',  // Cyan
      info: '\x1b[32m',   // Green
      warn: '\x1b[33m',   // Yellow
      error: '\x1b[31m',  // Red
      fatal: '\x1b[35m',  // Magenta
    };
    return colors[level] || '\x1b[0m';
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message, meta);

    // Use appropriate output stream
    if (level === 'error' || level === 'fatal') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }

    this.appendToFile(level, message, meta);
  }

  private appendToFile(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    try {
      const timestamp = this.formatTimestamp();
      const safeMeta = meta ? redactSensitiveData(meta, this.redactFields) : {};

      let category = 'system';
      if (meta?.stage) category = `stage-${meta.stage}`;
      else if (meta?.operation) category = `op-${String(meta.operation).replace(/[^a-zA-Z0-9-]/g, '_')}`;
      else if (meta?.requestId) category = `req-${meta.requestId}`;
      else if (meta?.type) category = `type-${meta.type}`;

      const logEntry = JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        message,
        ...safeMeta,
      }) + '\n';

      ensureLogDir();
      appendFile(path.join(LOG_DIR, `${category}.log`), logEntry).catch(() => {});

      // Master log
      appendFile(path.join(LOG_DIR, 'master.log'), logEntry).catch(() => {});
    } catch (err) {
      // Fail silently to not crash the app
    }
  }

  // Public API
  trace(message: string, meta?: Record<string, unknown>): void {
    this.log('trace', message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    const errorMeta: Record<string, unknown> = { ...meta };

    if (error instanceof Error) {
      errorMeta.error = {
        name: error.name,
        message: error.message,
        stack: loggingConfig.includeStackTrace ? error.stack : undefined,
      };
    } else if (error !== undefined) {
      errorMeta.error = String(error);
    }

    this.log('error', message, errorMeta);
  }

  fatal(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    const errorMeta: Record<string, unknown> = { ...meta };

    if (error instanceof Error) {
      errorMeta.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error !== undefined) {
      errorMeta.error = String(error);
    }

    this.log('fatal', message, errorMeta);
  }

  // 🌐 HTTP Logging for Middleware (Morgan)
  http(message: string, meta?: Record<string, unknown>): void {
    this.log('info', `🌐 ${message}`, { ...meta, type: 'http' });
  }

  // Child logger with bound context
  child(bindings: Record<string, unknown>): Logger {
    const childLogger = new Logger({
      level: this.level,
      prettyPrint: this.prettyPrint,
      redactFields: this.redactFields,
    });

    // Override log method to include bindings
    const originalLog = this.log.bind(this);
    childLogger.log = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
      originalLog(level, message, { ...bindings, ...meta });
    };

    return childLogger;
  }
}

export const logger = new Logger();


export interface RequestContext {
  requestId: string;
  method: string;
  path: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
}

export function createRequestLogger(context: RequestContext): Logger {
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

export function logPerformance<T>(
  operation: string,
  fn: () => T | Promise<T>,
  meta?: Record<string, unknown>
): Promise<T> {
  const startTime = process.hrtime.bigint();

  const logCompletion = (success: boolean, error?: unknown) => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    const logMeta: Record<string, unknown> = {
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
  } catch (error) {
    logCompletion(false, error);
    throw error;
  }
}

export default logger;
