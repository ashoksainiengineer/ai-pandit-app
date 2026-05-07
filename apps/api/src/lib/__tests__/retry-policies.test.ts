import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  deriveRetryReasonCode,
  getRetryDelay,
  mapReasonToDependency,
  RETRY_CONFIG,
} from '../retry-policies.js';

beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0); });
afterEach(() => { vi.restoreAllMocks(); });

describe('retry-policies', () => {
  describe('deriveRetryReasonCode', () => {
    it('should detect rate limit errors', () => {
      expect(deriveRetryReasonCode(new Error('Rate limit exceeded'))).toBe('rate_limited');
      expect(deriveRetryReasonCode(new Error('HTTP 429'))).toBe('rate_limited');
    });

    it('should detect timeout errors', () => {
      expect(deriveRetryReasonCode(new Error('Connection timeout'))).toBe('upstream_timeout');
      expect(deriveRetryReasonCode(new Error('ETIMEDOUT'))).toBe('upstream_timeout');
    });

    it('should detect network errors', () => {
      expect(deriveRetryReasonCode(new Error('ECONNREFUSED'))).toBe('network_error');
      expect(deriveRetryReasonCode(new Error('Network unreachable'))).toBe('network_error');
    });

    it('should detect service unavailable', () => {
      expect(deriveRetryReasonCode(new Error('Service temporarily unavailable'))).toBe('service_unavailable');
    });

    it('should detect database busy', () => {
      expect(deriveRetryReasonCode(new Error('database is locked'))).toBe('database_busy');
    });

    it('should default to processing_error', () => {
      expect(deriveRetryReasonCode(new Error('Something went wrong'))).toBe('processing_error');
    });
  });

  describe('getRetryDelay', () => {
    it('should calculate exponential backoff', () => {
      expect(getRetryDelay(0)).toBe(RETRY_CONFIG.baseDelayMs);
      expect(getRetryDelay(1)).toBe(RETRY_CONFIG.baseDelayMs * 2);
      expect(getRetryDelay(2)).toBe(RETRY_CONFIG.baseDelayMs * 4);
    });

    it('should cap at max delay', () => {
      expect(getRetryDelay(100)).toBe(RETRY_CONFIG.maxDelayMs);
    });
  });

  describe('mapReasonToDependency', () => {
    it('should map database_busy to database', () => {
      expect(mapReasonToDependency('database_busy')).toBe('database');
    });

    it('should map rate_limited to ai_provider', () => {
      expect(mapReasonToDependency('rate_limited')).toBe('ai_provider');
    });

    it('should map network_error to network', () => {
      expect(mapReasonToDependency('network_error')).toBe('network');
    });

    it('should map processing_error to processing', () => {
      expect(mapReasonToDependency('processing_error')).toBe('processing');
    });
  });
});
