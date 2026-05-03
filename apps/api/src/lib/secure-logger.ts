/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SECURE LOGGER MODULE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * SECURITY FEATURES:
 * - Automatic redaction of sensitive fields (API keys, secrets, tokens, passwords)
 * - Structured logging with sanitization
 * - Prevention of log injection attacks
 * - Context-aware logging
 *
 * REDACTED FIELDS:
 * - apiKey, api_key, api-key
 * - secret, secrets, secretKey, secret_key
 * - token, tokens, authToken, auth_token
 * - password, passwords, pwd
 * - authorization (when contains Bearer)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LoggerConfig {
  minLevel: LogLevel;
  redactFields: string[];
  redactionString: string;
  enableConsole: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_REDACT_FIELDS = [
  // API Keys
  'apiKey',
  'api_key',
  'api-key',
  'apikey',
  // Secrets
  'secret',
  'secrets',
  'secretKey',
  'secret_key',
  'secret-key',
  'clientSecret',
  'client_secret',
  // Tokens
  'token',
  'tokens',
  'authToken',
  'auth_token',
  'auth-token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'idToken',
  'id_token',
  // Passwords
  'password',
  'passwords',
  'pwd',
  'pass',
  'passwd',
  // Credentials
  'credential',
  'credentials',
  'authorization',
  'auth',
  'clerkSecretKey',
  'clerk_secret_key',
  'encryptionSecret',
  'encryption_secret',
  // Database
  'databaseUrl',
  'database_url',
  'dbUrl',
  'db_url',
  // Private Keys
  'privateKey',
  'private_key',
  'private-key',
  'key',
  'secretKey',
];

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ═══════════════════════════════════════════════════════════════════════════════
// REDACTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Checks if a key should be redacted based on configured patterns
 */
function shouldRedact(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return DEFAULT_REDACT_FIELDS.some((field) =>
    lowerKey.includes(field.toLowerCase())
  );
}

/**
 * Redacts sensitive values from a string
 */
function redactString(value: string): string {
  if (!value || typeof value !== 'string') return value;

  // Redact Bearer tokens
  if (value.startsWith('Bearer ')) {
    return 'Bearer [REDACTED]';
  }

  // Redact Basic auth
  if (value.startsWith('Basic ')) {
    return 'Basic [REDACTED]';
  }

  // If the string looks like a key/token (long alphanumeric)
  if (/^[a-zA-Z0-9_\-]{20,}$/.test(value)) {
    return '[REDACTED]';
  }

  return value;
}

/**
 * Deep redaction of objects - recursively sanitizes all sensitive fields
 */
function deepRedact(obj: unknown, seen = new WeakSet()): unknown {
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle strings
  if (typeof obj === 'string') {
    return redactString(obj);
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle circular references
  if (seen.has(obj)) {
    return '[Circular]';
  }
  seen.add(obj);

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => deepRedact(item, seen));
  }

  // Handle objects
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (shouldRedact(key)) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = deepRedact(value, seen);
    }
  }

  return redacted;
}

/**
 * Sanitizes log messages to prevent log injection attacks
 * Removes/replaces characters that could manipulate log parsing
 */
function sanitizeMessage(message: string): string {
  return message
    .replace(/\r?\n/g, '\\n') // Newlines
    .replace(/\t/g, '\\t') // Tabs
    .replace(/\x00/g, '') // Null bytes
    .replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Control characters
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class SecureLogger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      minLevel: 'info',
      redactFields: DEFAULT_REDACT_FIELDS,
      redactionString: '[REDACTED]',
      enableConsole: true,
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel];
  }

  private formatLog(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const sanitizedMessage = sanitizeMessage(message);

    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message: sanitizedMessage,
      ...(context && { context: deepRedact(context) }),
    };

    return JSON.stringify(logEntry);
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatLog(level, message, context);

    if (this.config.enableConsole) {
      switch (level) {
        case 'debug':
          console.debug(formatted);
          break;
        case 'info':
          console.info(formatted);
          break;
        case 'warn':
          console.warn(formatted);
          break;
        case 'error':
          console.error(formatted);
          break;
        default:
          console.log(formatted);
          break;
    }
  }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  /**
   * Creates a child logger with additional context
   */
  child(defaultContext: LogContext): SecureLogger {
    const childLogger = new SecureLogger(this.config);
    const originalLog = childLogger.log.bind(childLogger);

    childLogger.log = (level: LogLevel, message: string, context?: LogContext) => {
      originalLog(level, message, { ...defaultContext, ...context });
    };

    return childLogger;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

export const secureLogger = new SecureLogger();

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { deepRedact, shouldRedact, redactString, sanitizeMessage };
export type { LogLevel, LogContext, LoggerConfig };
