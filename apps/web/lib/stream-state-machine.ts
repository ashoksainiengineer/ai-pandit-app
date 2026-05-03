'use client';

/**
 * Stream State Machine - Pure state management for stream connections
 * ================================================================
 *
 * Separates transport concern decisions from UI binding.
 * The hook (use-stream-progress.ts) executes I/O side-effects;
 * this module decides WHAT to do based on events.
 *
 * @version 1.0.0
 */

import { logger } from './secure-logger';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ConnectionStatus = 'idle' | 'connecting' | 'streaming' | 'polling' | 'rate_limited' | 'finished' | 'error';

export interface ConnectionState {
    status: ConnectionStatus;
    url: string;
    lastError: string | null;
}

export interface PollOptions {
    skipCache?: boolean;
    hasRetriedAuth?: boolean;
    forceLegacyProgressPath?: boolean;
    hasRetriedRequeue?: boolean;
}

export type TransportDecision = 'sse' | 'polling';

export type Effect =
    | { type: 'CLEANUP' }
    | { type: 'START_SSE'; sid: string; url: string }
    | { type: 'START_POLLING'; sid: string; delay?: number }
    | { type: 'SCHEDULE_POLL'; sid: string; delay: number }
    | { type: 'SCHEDULE_RECONNECT'; sid: string; delay: number }
    | { type: 'FORCE_ERROR'; message: string }
    | { type: 'DISPATCH_EVENT'; eventType: string; data: Record<string, unknown> }
    | { type: 'SET_LAST_EVENT_ID'; seq: number };

export interface StateMachineConfig {
    backendUrl: string;
    pollInterval: number;
    maxPollInterval: number;
    sseTimeout: number;
    rateLimitWait: number;
    sessionNotFoundRetryDelay: number;
    maxSessionNotFoundRetries: number;
    analysisProgressProxyPath: string;
}

export interface StateMachineSnapshot {
    readonly state: ConnectionState;
    readonly currentSessionId: string | null;
    readonly terminalStateReceived: boolean;
    readonly authRetryCount: number;
    readonly pollRetryCount: number;
    readonly sessionNotFoundRetryCount: number;
    readonly autoRequeueAttempted: boolean;
    readonly cachedToken: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_CONFIG: StateMachineConfig = {
    backendUrl: '',
    pollInterval: 5000,
    maxPollInterval: 60000,
    sseTimeout: 10000,
    rateLimitWait: 30000,
    sessionNotFoundRetryDelay: 1500,
    maxSessionNotFoundRetries: 4,
    analysisProgressProxyPath: '/api/analysis/progress',
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATE MACHINE FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export interface StreamStateMachine {
    getState(): ConnectionState;
    getSnapshot(): StateMachineSnapshot;
    getCurrentSessionId(): string | null;
    isTerminalReceived(): boolean;
    canConnect(sid: string): boolean;

    // Session lifecycle
    onSessionChange(sid: string | null): { state: ConnectionState; effects: Effect[] };
    onConnectStart(sid: string, options: { forcePolling: boolean; skipSse: boolean }): { state: ConnectionState; effects: Effect[] };

    // SSE lifecycle
    onSseOpened(url: string): { state: ConnectionState; effects: Effect[] };
    onSseMessage(data: Record<string, unknown>, lastEventId?: string): { state: ConnectionState; effects: Effect[] };
    onSseError(readyState: number, sseConnected: boolean): { state: ConnectionState; effects: Effect[] };
    onSseTimeout(): { state: ConnectionState; effects: Effect[] };

    // Polling lifecycle
    onPollResult(
        sid: string,
        res: { status: number; ok: boolean; json: () => Promise<Record<string, unknown>> | Record<string, unknown> },
        options: PollOptions,
        interval: number,
        token: string | null
    ): Promise<{ state: ConnectionState; effects: Effect[] }>;
    onPollError(error: Error, sid: string, interval: number): { state: ConnectionState; effects: Effect[] };

    // Generic event handling (shared between SSE and polling)
    onIncomingEvent(data: Record<string, unknown>): { state: ConnectionState; effects: Effect[] };

    // Auth
    onAuthError(code: string, message?: string): { state: ConnectionState; effects: Effect[] };
    onAuthRetry(sid: string): { state: ConnectionState; effects: Effect[] };

    // Connection error
    onConnectError(error: Error, sid: string): { state: ConnectionState; effects: Effect[] };

    // Cleanup
    onCleanup(): { state: ConnectionState; effects: Effect[] };

    // Token
    setCachedToken(token: string | null): void;
    getCachedToken(): string | null;
}

export function createStreamStateMachine(
    config: Partial<StateMachineConfig> = {}
): StreamStateMachine {
    const machineConfig: StateMachineConfig = { ...DEFAULT_CONFIG, ...config };

    let state: ConnectionState = { status: 'idle', url: '', lastError: null };
    let currentSessionId: string | null = null;
    let terminalStateReceived = false;
    let authRetryCount = 0;
    let pollRetryCount = 0;
    let sessionNotFoundRetryCount = 0;
    let autoRequeueAttempted = false;
    let cachedToken: string | null = null;
    let connectionAttemptedForSession: string | null = null;
    // ── helpers ───────────────────────────────────────────────────────────────

    function setConnectionStatus(next: Partial<ConnectionState>): ConnectionState {
        state = { ...state, ...next };
        return state;
    }

function resetForNewSession(sid: string): void {
currentSessionId = sid;
pollRetryCount = 0;
sessionNotFoundRetryCount = 0;
        autoRequeueAttempted = false;
        connectionAttemptedForSession = null;
}

    function resetRetryCounters(): void {
        authRetryCount = 0;
    }

    function nextPollInterval(current: number): number {
        return Math.min(current * 1.5, machineConfig.maxPollInterval);
    }

    function decideTransport(forcePolling: boolean, skipSse: boolean): TransportDecision {
        if (forcePolling || skipSse) return 'polling';
        return 'sse';
    }

    // ── parse polling result into stream events ───────────────────────────────

    async function parsePollingResult(
        sid: string,
        result: Record<string, unknown>
    ): Promise<{ state: ConnectionState; effects: Effect[] }> {
        const effects: Effect[] = [];

        const status = result.status || (result.data as Record<string, unknown>)?.status;
        const isComplete = ['complete', 'success', 'finished'].includes(status as string);
        const isFailed = ['failed', 'error', 'cancelled'].includes(status as string);

        const progressPayload =
            (result.progress as Record<string, unknown>) ||
            ((result.data as Record<string, unknown>)?.progress as Record<string, unknown>) ||
            (result.data as Record<string, unknown>) ||
            result;

        // Always send progress data first
        effects.push({ type: 'DISPATCH_EVENT', eventType: 'progress', data: progressPayload });

        if (isComplete) {
            const completionResult =
                (result.result as Record<string, unknown>) ||
                ((result.data as Record<string, unknown>)?.result as Record<string, unknown>) ||
                (result.rectifiedTime
                    ? {
                          rectifiedTime: result.rectifiedTime,
                          accuracy: result.accuracy,
                          confidence: result.confidence,
                      }
                    : undefined);
            effects.push({
                type: 'DISPATCH_EVENT',
                eventType: 'complete',
                data: (completionResult || progressPayload) as Record<string, unknown>,
            });
        }

        if (isFailed) {
            effects.push({
                type: 'DISPATCH_EVENT',
                eventType: 'terminal_state',
                data: {
                    status,
                    message: result.errorMessage || `Session ${status}`,
                } as Record<string, unknown>,
            });
        }

        if (result.metadata) {
            const enrichedMetadata = {
                ...(result.metadata as Record<string, unknown>),
                status: result.status,
                errorMessage: result.errorMessage || (result.metadata as Record<string, unknown>)?.errorMessage,
                updatedAt:
                    (result.metadata as Record<string, unknown>)?.updatedAt ||
                    result.updatedAt ||
                    new Date().toISOString(),
            };
            effects.push({ type: 'DISPATCH_EVENT', eventType: 'metadata', data: enrichedMetadata });
        }

        if (['complete', 'failed', 'cancelled'].includes(result.status as string)) {
            effects.push({
                type: 'DISPATCH_EVENT',
                eventType: 'terminal_state',
                data: {
                    status: result.status,
                    errorMessage: result.errorMessage || (result.metadata as Record<string, unknown>)?.errorMessage,
                    result: result.result || (result.data as Record<string, unknown>)?.result,
                } as Record<string, unknown>,
            });
        }

        if (isComplete || isFailed) {
            return { state: setConnectionStatus({ status: 'finished', lastError: null }), effects };
        }

        return { state: setConnectionStatus({ status: 'polling', lastError: null }), effects };
    }

    // ── public API ────────────────────────────────────────────────────────────

    const machine: StreamStateMachine = {
        getState: () => state,

getSnapshot: (): StateMachineSnapshot => ({
state,
currentSessionId,
terminalStateReceived,
authRetryCount,
pollRetryCount,
sessionNotFoundRetryCount,
autoRequeueAttempted,
cachedToken,
}),

getCurrentSessionId: () => currentSessionId,
isTerminalReceived: () => terminalStateReceived,
        canConnect: (sid: string) => {
            if (currentSessionId === sid && terminalStateReceived) return false;
            return true;
        },

        // ── Session lifecycle ─────────────────────────────────────────────────

        onSessionChange: (sid: string | null) => {
            if (!sid || sid === 'undefined') {
                currentSessionId = null;
                terminalStateReceived = false;
                return {
                    state: setConnectionStatus({ status: 'idle', url: '', lastError: null }),
                    effects: [{ type: 'CLEANUP' }],
                };
            }
            resetForNewSession(sid);
            return {
                state: setConnectionStatus({ status: 'connecting', url: '', lastError: null }),
                effects: [],
            };
        },

        onConnectStart: (sid: string, options: { forcePolling: boolean; skipSse: boolean }) => {
            if (terminalStateReceived) {
                return {
                    state,
                    effects: [{ type: 'CLEANUP' }],
                };
            }

            const transport = decideTransport(options.forcePolling, options.skipSse);
            resetForNewSession(sid);
            resetRetryCounters();
            connectionAttemptedForSession = sid;
            state = { status: 'connecting', url: '', lastError: null };

            if (transport === 'polling') {
                return {
                    state,
                    effects: [{ type: 'START_POLLING', sid, delay: undefined }],
                };
            }
            return { state, effects: [] };
        },

        // ── SSE lifecycle ─────────────────────────────────────────────────────

        onSseOpened: (url: string) => {
            state = { status: 'streaming', url, lastError: null };
            return {
                state,
                effects: [
                    { type: 'DISPATCH_EVENT', eventType: 'connected', data: {} },
                ],
            };
        },

        onSseMessage: (data: Record<string, unknown>, lastEventId?: string) => {
            const effects: Effect[] = [];

            if (lastEventId) {
                const seq = parseInt(lastEventId, 10);
                if (!isNaN(seq)) {
                    effects.push({ type: 'SET_LAST_EVENT_ID', seq });
                }
            }

            const type = String(data.type || '');

            if (type === 'error' && (data.code === 'AUTH_FAILED' || data.code === 'UNAUTHORIZED')) {
                return machine.onAuthError(String(data.code), String(data.message || data.error || ''));
            }

            const eventResult = machine.onIncomingEvent(data);
            return {
                state: eventResult.state,
                effects: [...effects, ...eventResult.effects],
            };
        },

        onSseError: (readyState: number, sseConnected: boolean) => {
            if (terminalStateReceived) {
                return { state, effects: [{ type: 'CLEANUP' }] };
            }

            if (sseConnected && readyState === EventSource.OPEN) {
                // Transient error, browser will auto-retry
                return { state, effects: [] };
            }

            if (readyState === EventSource.CLOSED) {
                if (authRetryCount === 0) {
                    authRetryCount += 1;
                    return {
                        state: setConnectionStatus({ status: 'connecting', url: '', lastError: null }),
                        effects: [{ type: 'SCHEDULE_RECONNECT', sid: currentSessionId!, delay: 1000 }],
                    };
                }
                // Already retried - fall back to polling
                return {
                    state: setConnectionStatus({
                        status: 'polling',
                        url: '',
                        lastError: 'SSE connection failed, using polling',
                    }),
                    effects: [{ type: 'START_POLLING', sid: currentSessionId!, delay: undefined }],
                };
            }

            // Still connecting - wait a bit before deciding
            return {
                state,
                effects: [
                    {
                        type: 'SCHEDULE_RECONNECT',
                        sid: currentSessionId!,
                        delay: 500,
                    },
                ],
            };
        },

        onSseTimeout: () => {
            return {
                state: setConnectionStatus({
                    status: 'polling',
                    url: '',
                    lastError: 'SSE timeout',
                }),
                effects: [{ type: 'START_POLLING', sid: currentSessionId!, delay: undefined }],
            };
        },

        onConnectError: (error: Error, sid: string) => {
            logger.error('Connection failed', { error: error.message, sessionId: sid });
            return {
                state: setConnectionStatus({
                    status: 'polling',
                    url: '',
                    lastError: 'Connection failed',
                }),
                effects: [
                    { type: 'CLEANUP' },
                    { type: 'START_POLLING', sid, delay: 2000 },
                ],
            };
        },

        // ── Polling lifecycle ─────────────────────────────────────────────────

        onPollResult: async (
            sid: string,
            res: { status: number; ok: boolean; json: () => Promise<Record<string, unknown>> | Record<string, unknown> },
            options: PollOptions,
            interval: number,
            token: string | null
        ) => {
            // Handle 404 - session not in queue
            if (res.status === 404) {
                if (!options.forceLegacyProgressPath) {
                    return {
                        state: setConnectionStatus({ status: 'polling', url: '', lastError: 'Session lookup delayed, retrying...' }),
                        effects: [
                            {
                                type: 'SCHEDULE_POLL',
                                sid,
                                delay: machineConfig.sessionNotFoundRetryDelay,
                            },
                        ],
                    };
                }

                sessionNotFoundRetryCount += 1;
                const retryAttempt = sessionNotFoundRetryCount;
                const shouldRetry = retryAttempt <= machineConfig.maxSessionNotFoundRetries;

                if (shouldRetry) {
                    logger.warn('Session not found in queue (404), retrying', {
                        sessionId: sid,
                        retryAttempt,
                        maxRetries: machineConfig.maxSessionNotFoundRetries,
                    });
                    return {
                        state: setConnectionStatus({
                            status: 'polling',
                            url: '',
                            lastError: 'Session lookup delayed, retrying...',
                        }),
                        effects: [{ type: 'SCHEDULE_POLL', sid, delay: machineConfig.sessionNotFoundRetryDelay }],
                    };
                }

                logger.warn('Session not found in queue after retries', {
                    sessionId: sid,
                    retries: retryAttempt,
                });

                if (!autoRequeueAttempted) {
                    autoRequeueAttempted = true;
                    return {
                        state: setConnectionStatus({
                            status: 'polling',
                            url: '',
                            lastError: 'Session was not active. Auto-requeue triggered, retrying...',
                        }),
                    effects: [{ type: 'SCHEDULE_POLL', sid, delay: machineConfig.sessionNotFoundRetryDelay }],
                    };
                }

                return {
                    state: setConnectionStatus({
                        status: 'error',
                        url: '',
                        lastError: 'Session not found - analysis may have already completed',
                    }),
                    effects: [
                        {
                            type: 'FORCE_ERROR',
                            message: 'Session not found. Start a new analysis.',
                        },
                    ],
                };
            }

            sessionNotFoundRetryCount = 0;

            // Handle 429 - rate limited
            if (res.status === 429) {
                logger.warn('Rate limited (429), waiting 30s');
                return {
                    state: setConnectionStatus({ status: 'rate_limited', url: '', lastError: 'Rate limited' }),
                    effects: [{ type: 'SCHEDULE_POLL', sid, delay: machineConfig.rateLimitWait }],
                };
            }

            // Handle 401 - auth expired
            if (res.status === 401) {
                cachedToken = null;
                if (!options.hasRetriedAuth) {
                    return {
                        state,
                        effects: [{ type: 'SCHEDULE_POLL', sid, delay: interval }],
                    };
                }
                return {
                    state: setConnectionStatus({ status: 'error', url: '', lastError: 'Authentication expired' }),
                    effects: [{ type: 'FORCE_ERROR', message: 'Authentication expired. Please retry.' }],
                };
            }

            // Handle other errors
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const result = await res.json();

            if (result.success === false) {
                return {
                    state: setConnectionStatus({ status: 'polling', lastError: null }),
                    effects: [{ type: 'SCHEDULE_POLL', sid, delay: interval }],
                };
            }

            const parsed = await parsePollingResult(sid, result);
            if (parsed.state.status === 'finished') {
                return parsed;
            }

            // Schedule next poll
            return {
                state: parsed.state,
                effects: [...parsed.effects, { type: 'SCHEDULE_POLL', sid, delay: interval }],
            };
        },

        onPollError: (error: Error, sid: string, interval: number) => {
            logger.warn('Polling failed', { error });

            const err = error;
            const stackMsg = err.message + (err.stack ? '\n' + err.stack : '');
            const effects: Effect[] = [];

            if (err.name === 'RangeError' || err.message.includes('Invalid time value')) {
                effects.push({ type: 'FORCE_ERROR', message: stackMsg });
            }

            const nextInterval = nextPollInterval(interval);
            effects.push({ type: 'SCHEDULE_POLL', sid, delay: nextInterval });

            return { state, effects };
        },

        // ── Generic event handling ────────────────────────────────────────────

        onIncomingEvent: (data: Record<string, unknown>) => {
            const type = String(data.type || '');
            const effects: Effect[] = [];

            effects.push({ type: 'DISPATCH_EVENT', eventType: type, data });

            if (type === 'complete' || type === 'result') {
                terminalStateReceived = true;
                return {
                    state: setConnectionStatus({ status: 'finished', url: '', lastError: null }),
                    effects: [...effects, { type: 'CLEANUP' }],
                };
            }

            if (type === 'error') {
                terminalStateReceived = true;
                return {
                    state: setConnectionStatus({
                        status: 'error',
                        url: '',
                        lastError: String(data.message || data.error || 'Unknown error'),
                    }),
                    effects: [...effects, { type: 'CLEANUP' }],
                };
            }

            if (type === 'terminal_state') {
                const termData = (data.data as Record<string, unknown>) || data;
                terminalStateReceived = true;
                const isErr =
                    termData.status === 'failed' || termData.status === 'error' || termData.status === 'cancelled';
                return {
                    state: setConnectionStatus({
                        status: isErr ? 'error' : 'finished',
                        url: '',
                        lastError: isErr ? String(termData.errorMessage || termData.message || '') : null,
                    }),
                    effects: [...effects, { type: 'CLEANUP' }],
                };
            }

            return { state, effects };
        },

        // ── Auth ──────────────────────────────────────────────────────────────

        onAuthError: (code: string, message?: string) => {
            if (authRetryCount === 0) {
                authRetryCount += 1;
                logger.warn('[SSE] Authentication failed. Retrying with fresh token');
                return {
                    state: setConnectionStatus({ status: 'connecting', url: '', lastError: null }),
                    effects: [
                        { type: 'CLEANUP' },
                        {
                            type: 'SCHEDULE_RECONNECT',
                            sid: currentSessionId!,
                            delay: 500,
                        },
                    ],
                };
            }

            const authErrorMessage = message || 'Authentication failed';
            return {
                state: setConnectionStatus({
                    status: 'error',
                    url: '',
                    lastError: authErrorMessage,
                }),
                effects: [
                    { type: 'CLEANUP' },
                    { type: 'FORCE_ERROR', message: authErrorMessage },
                ],
            };
        },

        onAuthRetry: (sid: string) => {
            authRetryCount += 1;
            return {
                state: setConnectionStatus({ status: 'connecting', url: '', lastError: null }),
                effects: [
                    { type: 'CLEANUP' },
                    { type: 'SCHEDULE_RECONNECT', sid, delay: 1000 },
                ],
            };
        },

        // ── Cleanup ───────────────────────────────────────────────────────────

        onCleanup: () => {
            connectionAttemptedForSession = null;
return {
state,
effects: [{ type: 'CLEANUP' }],
};
},

        // ── Token ─────────────────────────────────────────────────────────────

        setCachedToken: (token: string | null) => {
            cachedToken = token;
        },

        getCachedToken: () => cachedToken,
    };

    return machine;
}

export default createStreamStateMachine;
