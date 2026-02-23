/**
 * 🔱 EXHAUSTIVE SECURE LOGGER TESTS
 * Tests SecureLogger: sanitization, redaction, log levels,
 * sampling, object sanitization, group logging, child logger
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test the logger module which imports 'react' for useLogger hook
// Mock react's useMemo
vi.mock('react', () => ({
    useMemo: (fn: () => any) => fn(),
}));

// Import after mocking
import logger, { streamLogger } from '../../lib/secure-logger';

// ═══════════════════════════════════════════════════════════════════════════
// LOG LEVEL FILTERING
// ═══════════════════════════════════════════════════════════════════════════

describe('SecureLogger - Log Level Filtering', () => {
    let debugSpy: any;
    let infoSpy: any;
    let warnSpy: any;
    let errorSpy: any;

    beforeEach(() => {
        debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => { });
        infoSpy = vi.spyOn(console, 'info').mockImplementation(() => { });
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should have debug, info, warn, error methods', () => {
        expect(typeof logger.debug).toBe('function');
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.warn).toBe('function');
        expect(typeof logger.error).toBe('function');
    });

    it('debug should call console.debug in non-production', () => {
        logger.debug('test debug');
        // In test env (non-production), debug level is enabled
        expect(debugSpy).toHaveBeenCalled();
    });

    it('info should call console.info in non-production', () => {
        logger.info('test info');
        expect(infoSpy).toHaveBeenCalled();
    });

    it('warn should call console.warn in non-production', () => {
        logger.warn('test warn');
        expect(warnSpy).toHaveBeenCalled();
    });

    it('error should call console.error in non-production', () => {
        logger.error('test error');
        expect(errorSpy).toHaveBeenCalled();
    });

    it('error should include error details for Error objects', () => {
        const err = new Error('Test error message');
        logger.error('Something failed', err);
        expect(errorSpy).toHaveBeenCalled();
        const callArg = errorSpy.mock.calls[0][0];
        expect(callArg).toContain('Something failed');
    });

    it('error should handle non-Error objects', () => {
        logger.error('Something failed', 'string error');
        expect(errorSpy).toHaveBeenCalled();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// PII SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════

describe('SecureLogger - PII Sanitization', () => {
    let infoSpy: any;

    beforeEach(() => {
        infoSpy = vi.spyOn(console, 'info').mockImplementation(() => { });
    });

    afterEach(() => vi.restoreAllMocks());

    it('should redact email addresses in messages', () => {
        logger.info('User email: john@example.com logged in');
        const logOutput = infoSpy.mock.calls[0][0];
        expect(logOutput).not.toContain('john@example.com');
        expect(logOutput).toContain('[REDACTED]');
    });

    it('should redact phone numbers', () => {
        logger.info('Phone: 123-456-7890');
        const logOutput = infoSpy.mock.calls[0][0];
        expect(logOutput).not.toContain('123-456-7890');
    });

    it('should redact SSN patterns', () => {
        logger.info('SSN: 123-45-6789');
        const logOutput = infoSpy.mock.calls[0][0];
        expect(logOutput).not.toContain('123-45-6789');
    });

    it('should redact JWT tokens', () => {
        const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123';
        logger.info(`Token: ${jwt}`);
        const logOutput = infoSpy.mock.calls[0][0];
        expect(logOutput).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    });

    it('should redact sensitive keys in meta objects', () => {
        logger.info('User action', { password: 'secret123', action: 'login' });
        const logOutput = infoSpy.mock.calls[0][0];
        expect(logOutput).not.toContain('secret123');
        expect(logOutput).toContain('[REDACTED]');
        expect(logOutput).toContain('login');
    });

    it('should redact nested sensitive objects', () => {
        logger.info('Data', { user: { email: 'test@test.com', role: 'admin' } });
        const logOutput = infoSpy.mock.calls[0][0];
        expect(logOutput).not.toContain('test@test.com');
    });

    it('should redact fullName, firstName, lastName keys', () => {
        logger.info('Session data', { fullName: 'John Doe', sessionId: '123' });
        const logOutput = infoSpy.mock.calls[0][0];
        expect(logOutput).not.toContain('John Doe');
        expect(logOutput).toContain('[REDACTED]');
    });

    it('should redact birthDate/dob keys', () => {
        logger.info('Birth', { dob: '1990-01-01' });
        const logOutput = infoSpy.mock.calls[0][0];
        expect(logOutput).toContain('[REDACTED]');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// GROUP LOGGING
// ═══════════════════════════════════════════════════════════════════════════

describe('SecureLogger - Group Logging', () => {
    let groupSpy: any;
    let groupEndSpy: any;

    beforeEach(() => {
        groupSpy = vi.spyOn(console, 'group').mockImplementation(() => { });
        groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => { });
    });

    afterEach(() => vi.restoreAllMocks());

    it('should open console group', () => {
        const grp = logger.group('Test Group');
        expect(groupSpy).toHaveBeenCalled();
        grp.end();
        expect(groupEndSpy).toHaveBeenCalled();
    });

    it('should sanitize group label', () => {
        logger.group('Group: john@example.com');
        const label = groupSpy.mock.calls[0][0];
        expect(label).not.toContain('john@example.com');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// CHILD LOGGER & STREAM LOGGER
// ═══════════════════════════════════════════════════════════════════════════

describe('SecureLogger - Child Logger & Exports', () => {
    it('should create child logger', () => {
        const child = logger.child({ component: 'TestComponent' });
        expect(typeof child.debug).toBe('function');
        expect(typeof child.info).toBe('function');
    });

    it('streamLogger should be a SecureLogger instance', () => {
        expect(typeof streamLogger.debug).toBe('function');
        expect(typeof streamLogger.error).toBe('function');
    });

    it('default export should be logger', () => {
        expect(logger).toBeDefined();
        expect(typeof logger.info).toBe('function');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// META FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

describe('SecureLogger - Message Formatting', () => {
    let infoSpy: any;

    beforeEach(() => {
        infoSpy = vi.spyOn(console, 'info').mockImplementation(() => { });
    });

    afterEach(() => vi.restoreAllMocks());

    it('should format with timestamp and level', () => {
        logger.info('test message');
        const output = infoSpy.mock.calls[0][0];
        expect(output).toMatch(/\[\d{4}-\d{2}-\d{2}T/); // ISO timestamp
        expect(output).toContain('[INFO]');
    });

    it('should include meta as JSON when provided', () => {
        logger.info('test', { action: 'click', count: 5 });
        const output = infoSpy.mock.calls[0][0];
        expect(output).toContain('click');
        expect(output).toContain('5');
    });
});
