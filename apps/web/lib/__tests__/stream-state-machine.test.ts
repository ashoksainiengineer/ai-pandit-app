import { describe, it, expect } from 'vitest';
import { createStreamStateMachine, DEFAULT_CONFIG } from '../stream-state-machine';

describe('stream-state-machine', () => {
  it('should create with default config', () => {
    const machine = createStreamStateMachine();
    expect(machine.getState().status).toBe('idle');
    expect(machine.getCurrentSessionId()).toBeNull();
  });

  it('should create with custom config', () => {
    const machine = createStreamStateMachine({ backendUrl: 'https://api.example.com' });
    expect(machine.getState().status).toBe('idle');
  });

  describe('session lifecycle', () => {
    it('should transition to connecting on session change', () => {
      const machine = createStreamStateMachine();
      const result = machine.onSessionChange('session-123');
      expect(result.state.status).toBe('connecting');
      expect(result.effects).toEqual([]);
    });

    it('should reset to idle on null session', () => {
      const machine = createStreamStateMachine();
      machine.onSessionChange('session-123');
      const result = machine.onSessionChange(null);
      expect(result.state.status).toBe('idle');
      expect(result.effects.some(e => e.type === 'CLEANUP')).toBe(true);
    });

    it('should track current session id', () => {
      const machine = createStreamStateMachine();
      machine.onSessionChange('session-123');
      expect(machine.getCurrentSessionId()).toBe('session-123');
    });
  });

  describe('connect start', () => {
    it('should prefer sse by default', () => {
      const machine = createStreamStateMachine();
      machine.onSessionChange('session-123');
      const result = machine.onConnectStart('session-123', { forcePolling: false, skipSse: false });
      expect(result.state.status).toBe('connecting');
      expect(result.effects).toEqual([]);
    });

    it('should fallback to polling when forced', () => {
      const machine = createStreamStateMachine();
      machine.onSessionChange('session-123');
      const result = machine.onConnectStart('session-123', { forcePolling: true, skipSse: false });
      expect(result.state.status).toBe('connecting');
      expect(result.effects.some(e => e.type === 'START_POLLING')).toBe(true);
    });

    it('should fallback to polling when sse is skipped', () => {
      const machine = createStreamStateMachine();
      machine.onSessionChange('session-123');
      const result = machine.onConnectStart('session-123', { forcePolling: false, skipSse: true });
      expect(result.state.status).toBe('connecting');
      expect(result.effects.some(e => e.type === 'START_POLLING')).toBe(true);
    });
  });

  describe('SSE lifecycle', () => {
    it('should transition to streaming on SSE open', () => {
      const machine = createStreamStateMachine();
      machine.onSessionChange('session-123');
      machine.onConnectStart('session-123', { forcePolling: false, skipSse: false });
      const result = machine.onSseOpened('wss://example.com');
      expect(result.state.status).toBe('streaming');
      expect(result.effects.some(e => e.type === 'DISPATCH_EVENT' && e.eventType === 'connected')).toBe(true);
    });

    it('should dispatch events on SSE message', () => {
      const machine = createStreamStateMachine();
      machine.onSessionChange('session-123');
      const result = machine.onSseMessage({ type: 'progress', data: { step: 1 } });
      expect(result.effects.some(e => e.type === 'DISPATCH_EVENT')).toBe(true);
    });

    it('should schedule reconnect on SSE timeout', () => {
      const machine = createStreamStateMachine();
      machine.onSessionChange('session-123');
      machine.onConnectStart('session-123', { forcePolling: false, skipSse: false });
      const result = machine.onSseTimeout();
      expect(result.state.status).toBe('polling');
      expect(result.effects.some(e => e.type === 'START_POLLING')).toBe(true);
    });
  });

  describe('polling lifecycle', () => {
    it('should start polling when forced', () => {
      const machine = createStreamStateMachine();
      machine.onSessionChange('session-123');
      const result = machine.onConnectStart('session-123', { forcePolling: true, skipSse: false });
      expect(result.effects.some(e => e.type === 'START_POLLING')).toBe(true);
    });

    it('should dispatch progress on poll result', async () => {
      const machine = createStreamStateMachine();
      machine.onSessionChange('session-123');
      const result = await machine.onPollResult(
        'session-123',
        { status: 200, ok: true, json: async () => ({ progress: { step: 1 } }) },
        {},
        5000,
        'token'
      );
      expect(result.effects.some(e => e.type === 'DISPATCH_EVENT')).toBe(true);
    });

    it('should transition to finished on complete poll result', async () => {
      const machine = createStreamStateMachine();
      machine.onSessionChange('session-123');
      const result = await machine.onPollResult(
        'session-123',
        { status: 200, ok: true, json: async () => ({ status: 'complete', data: { status: 'complete' } }) },
        {},
        5000,
        'token'
      );
      expect(result.state.status).toBe('finished');
    });

    it('should schedule reconnect on poll error', () => {
      const machine = createStreamStateMachine();
      machine.onSessionChange('session-123');
      const result = machine.onPollError(new Error('Network error'), 'session-123', 5000);
      expect(result.effects.some(e => e.type === 'SCHEDULE_RECONNECT' || e.type === 'SCHEDULE_POLL')).toBe(true);
    });
  });

  describe('auth', () => {
    it('should track auth retry count', () => {
      const machine = createStreamStateMachine();
      machine.onSessionChange('session-123');
      machine.onAuthError('AUTH_FAILED');
      const result = machine.onAuthRetry('session-123');
      expect(result.state.status).toBe('connecting');
    });

    it('should force error after max auth retries', () => {
      const machine = createStreamStateMachine({ maxSessionNotFoundRetries: 2 });
      machine.onSessionChange('session-123');
      machine.onAuthError('AUTH_FAILED');
      machine.onAuthRetry('session-123');
      machine.onAuthError('AUTH_FAILED');
      machine.onAuthRetry('session-123');
      const result = machine.onAuthError('AUTH_FAILED');
      expect(result.effects.some(e => e.type === 'FORCE_ERROR')).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should return cleanup effect', () => {
      const machine = createStreamStateMachine();
      machine.onSessionChange('session-123');
      machine.onConnectStart('session-123', { forcePolling: false, skipSse: false });
      const result = machine.onCleanup();
      expect(result.effects.some(e => e.type === 'CLEANUP')).toBe(true);
    });
  });

  describe('token cache', () => {
    it('should cache and retrieve token', () => {
      const machine = createStreamStateMachine();
      machine.setCachedToken('my-token');
      expect(machine.getCachedToken()).toBe('my-token');
    });

    it('should clear token on null', () => {
      const machine = createStreamStateMachine();
      machine.setCachedToken('my-token');
      machine.setCachedToken(null);
      expect(machine.getCachedToken()).toBeNull();
    });
  });

  describe('terminal state', () => {
    it('should track terminal state received', () => {
      const machine = createStreamStateMachine();
      machine.onSessionChange('session-123');
      machine.onIncomingEvent({ type: 'complete' });
      expect(machine.isTerminalReceived()).toBe(true);
    });
  });
});
