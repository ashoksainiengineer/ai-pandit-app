import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
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

  it('should return connection state', () => {
    const { result } = renderHook(() => useStreamProgress('test-session'));
    
    expect(result.current.connectionState).toBeDefined();
    expect(result.current.connectionState.status).toBeDefined();
    expect(result.current.connectionState.url).toBeDefined();
    expect(result.current.connectionState.lastError).toBeDefined();
  });

  it('should transition to connecting when session provided', () => {
    const { result } = renderHook(() => useStreamProgress('test-session'));
    
    expect(result.current.connectionState.status).toBe('connecting');
  });

  it('should reset to idle on null session', () => {
    const { result, rerender } = renderHook(
      ({ sessionId }) => useStreamProgress(sessionId),
      { initialProps: { sessionId: 'test-session' as string | null } }
    );
    
    rerender({ sessionId: null });
    expect(result.current.connectionState.status).toBe('idle');
  });

  it('should update state when session changes', () => {
    const { result, rerender } = renderHook(
      ({ sessionId }) => useStreamProgress(sessionId),
      { initialProps: { sessionId: null as string | null } }
    );
    
    expect(result.current.connectionState.status).toBe('idle');
    
    rerender({ sessionId: 'test-session' });
    expect(result.current.connectionState.status).toBe('connecting');
  });
});
