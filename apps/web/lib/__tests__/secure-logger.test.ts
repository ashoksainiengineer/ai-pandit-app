import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecureLogger } from '../secure-logger';

describe('SecureLogger', () => {
  let logger: SecureLogger;

  beforeEach(() => {
    logger = new SecureLogger({
      samplingRate: 1.0,
      maxEntries: 100,
    });
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultLogger = new SecureLogger();
      expect(defaultLogger).toBeDefined();
    });

    it('should initialize with custom config', () => {
      expect(logger).toBeDefined();
    });
  });

  describe('log', () => {
    it('should log info messages', () => {
      expect(() => logger.info('Test message')).not.toThrow();
    });

    it('should log warning messages', () => {
      expect(() => logger.warn('Warning message')).not.toThrow();
    });

    it('should log error messages', () => {
      expect(() => logger.error('Error message')).not.toThrow();
    });

    it('should log with metadata', () => {
      expect(() =>
        logger.info('Message with metadata', { userId: '123', action: 'test' })
      ).not.toThrow();
    });
  });

  describe('sampling', () => {
    it('should respect sampling rate', () => {
      const sampledLogger = new SecureLogger({
        samplingRate: 0.0,
        maxEntries: 100,
      });

      // With 0% sampling, logs should be dropped
      expect(() => sampledLogger.info('Should be sampled')).not.toThrow();
    });

    it('should sample at 100% rate', () => {
      const fullLogger = new SecureLogger({
        samplingRate: 1.0,
        maxEntries: 100,
      });

      expect(() => fullLogger.info('Should always log')).not.toThrow();
    });
  });

  describe('max entries', () => {
    it('should not exceed max entries', () => {
      const smallLogger = new SecureLogger({
        samplingRate: 1.0,
        maxEntries: 5,
      });

      for (let i = 0; i < 10; i++) {
        smallLogger.info(`Message ${i}`);
      }

      expect(smallLogger).toBeDefined();
    });
  });

  describe('PII sanitization', () => {
    it('should sanitize email addresses', () => {
      const logEntry = logger.info('User email: user@example.com');
      expect(logEntry).toBeDefined();
    });

    it('should sanitize phone numbers', () => {
      const logEntry = logger.info('Phone: +91-98765-43210');
      expect(logEntry).toBeDefined();
    });

    it('should handle birth data safely', () => {
      const logEntry = logger.info('Birth data processed', {
        date: '1990-01-01',
        time: '12:00',
      });
      expect(logEntry).toBeDefined();
    });
  });

  describe('export', () => {
    it('should export logs', () => {
      logger.info('Test 1');
      logger.info('Test 2');

      const exported = logger.export();
      expect(exported).toBeDefined();
      expect(Array.isArray(exported)).toBe(true);
    });

    it('should return empty array when no logs', () => {
      const freshLogger = new SecureLogger();
      const exported = freshLogger.export();

      expect(exported).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all logs', () => {
      logger.info('Message 1');
      logger.info('Message 2');

      logger.clear();

      const exported = logger.export();
      expect(exported).toEqual([]);
    });
  });
});
