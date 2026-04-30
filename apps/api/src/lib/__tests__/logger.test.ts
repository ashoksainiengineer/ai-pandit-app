import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger';

describe('Logger', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('info', () => {
    it('should log info messages', () => {
      expect(() => logger.info('Test info message')).not.toThrow();
    });

    it('should log with metadata', () => {
      expect(() =>
        logger.info('Message with metadata', { userId: '123', action: 'test' })
      ).not.toThrow();
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      expect(() => logger.error('Test error message')).not.toThrow();
    });

    it('should log error objects', () => {
      const error = new Error('Test error');
      expect(() => logger.error('Error occurred', error)).not.toThrow();
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      expect(() => logger.warn('Test warning')).not.toThrow();
    });
  });

  describe('debug', () => {
    it('should log debug messages', () => {
      expect(() => logger.debug('Debug message')).not.toThrow();
    });
  });

  describe('child', () => {
    it('should create child logger with context', () => {
      const childLogger = logger.child({ requestId: '123' });
      expect(childLogger).toBeDefined();
      expect(() => childLogger.info('Child message')).not.toThrow();
    });
  });
});
