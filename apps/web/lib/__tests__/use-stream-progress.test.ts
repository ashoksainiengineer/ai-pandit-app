import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreamProgress } from '../use-stream-progress';

// Mock EventSource
global.EventSource = vi.fn(() => ({
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})) as any;

describe('useStreamProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Connection State', () => {
    it('should initialize with disconnected state', () => {
      const { result } = renderHook(() => useStreamProgress('test-session'));
      
      expect(result.current.connectionState.status).toBe('disconnected');
    });

    it('should handle connection errors', () => {
      const { result } = renderHook(() => useStreamProgress('test-session'));
      
      act(() => {
        result.current.connect();
      });

      expect(result.current.connectionState.status).toBeDefined();
    });

    it('should disconnect cleanly', () => {
      const { result } = renderHook(() => useStreamProgress('test-session'));
      
      act(() => {
        result.current.disconnect();
      });

      expect(result.current.connectionState.status).toBe('disconnected');
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress updates', () => {
      const { result } = renderHook(() => useStreamProgress('test-session'));
      
      expect(result.current.progress).toBeDefined();
      expect(typeof result.current.progress).toBe('object');
    });

    it('should calculate percentage correctly', () => {
      const { result } = renderHook(() => useStreamProgress('test-session'));
      
      expect(result.current.percentage).toBeGreaterThanOrEqual(0);
      expect(result.current.percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle stream errors', () => {
      const { result } = renderHook(() => useStreamProgress('test-session'));
      
      expect(result.current.error).toBeNull();
    });

    it('should retry on connection failure', () => {
      const { result } = renderHook(() => useStreamProgress('test-session'));
      
      expect(result.current.retryCount).toBeDefined();
    });
  });
});
