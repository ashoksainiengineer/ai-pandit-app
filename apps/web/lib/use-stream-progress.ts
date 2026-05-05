'use client';

/**
 * useStreamProgress - Bulletproof Real-Time Progress Hook
 * ========================================================
 *
 * THIN React wrapper around stream-state-machine.
 * All transport decisions live in the state machine;
 * this file only binds to React lifecycle and executes I/O.
 *
 * @version 7.1.0 - Extracted state machine
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from './secure-logger';
import { env } from './config';
import { getTokenWithRetry } from './auth-utils';
import { useTestMode } from './test-mode-context';
import { useStreamStore } from './store/stream-store';
import {
    createStreamStateMachine,
    type ConnectionState,
    type Effect,
    type StateMachineConfig,
    type PollOptions,
} from './stream-state-machine';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AIThinking {
    stage: number;
    candidateTime?: string;
    chunks: string[];
    fullText: string;
}

export interface CandidateScore {
    time: string;
    score: number;
    stage: number;
    rank?: number;
    offsetMinutes?: number;
    minifiedEph?: { sun: string; moon: string; ascendant: string };
}

export function useStreamProgress(
    sessionId: string | null,
    backendUrl: string = env.api.backendUrl.replace(/\/$/, ''),
    getToken?: () => Promise<string | null>
): { connectionState: ConnectionState } {

    const dispatchStreamEvent = useStreamStore(state => state.dispatchStreamEvent);
    const setSessionId = useStreamStore(state => state.setSessionId);
    const setLastEventId = useStreamStore(state => state.setLastEventId);
    const forceError = useStreamStore(state => state.forceError);

    const [connectionState, setConnectionState] = useState<ConnectionState>({
        status: 'idle',
        url: '',
        lastError: null,
    });

    // Refs for cleanup
    const mountedRef = useRef(true);
    const sseSourceRef = useRef<EventSource | null>(null);
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isTestMode = useTestMode();

    const MAX_SESSION_NOT_FOUND_RETRIES = isTestMode ? 1 : 4;

    const machineConfigRef = useRef<StateMachineConfig>({
        backendUrl,
        pollInterval: 5000,
        maxPollInterval: 60000,
        sseTimeout: 10000,
        rateLimitWait: 30000,
        sessionNotFoundRetryDelay: 1500,
        maxSessionNotFoundRetries: MAX_SESSION_NOT_FOUND_RETRIES,
        analysisProgressProxyPath: '/api/analysis/progress',
    });

    // Update config ref when backendUrl changes
    machineConfigRef.current.backendUrl = backendUrl;
    machineConfigRef.current.maxSessionNotFoundRetries = MAX_SESSION_NOT_FOUND_RETRIES;

    const machineRef = useRef(createStreamStateMachine(machineConfigRef.current));
    const machine = machineRef.current;

    const forcePollingTransport = false;

    // ── helpers ───────────────────────────────────────────────────────────────

    const applyEffects = useCallback((effects: Effect[]) => {
        const config = machineConfigRef.current;

        for (const effect of effects) {
            switch (effect.type) {
case 'CLEANUP':
if (sseTimeoutRef.current) {
clearTimeout(sseTimeoutRef.current);
sseTimeoutRef.current = null;
}
if (reconnectTimeoutRef.current) {
clearTimeout(reconnectTimeoutRef.current);
reconnectTimeoutRef.current = null;
}
if (sseSourceRef.current) {
sseSourceRef.current.close();
sseSourceRef.current = null;
}
if (pollTimerRef.current) {
clearTimeout(pollTimerRef.current);
pollTimerRef.current = null;
}
break;

                case 'START_SSE': {
                    const { sid, url } = effect;
                    const sse = new EventSource(url);
                    sseSourceRef.current = sse;
                    let sseConnected = false;

                    sseTimeoutRef.current = setTimeout(() => {
                        if (!sseConnected && mountedRef.current && machine.getCurrentSessionId() === sid) {
                            logger.warn('[SSE] Connection timeout (10s), falling back to polling');
                            const result = machine.onSseTimeout();
                            setConnectionState(result.state);
                            applyEffects(result.effects);
                        }
                    }, config.sseTimeout);

                    sse.onopen = () => {
                        if (!mountedRef.current || machine.getCurrentSessionId() !== sid) {
                            sse.close();
                            return;
                        }
                        sseConnected = true;
                        if (sseTimeoutRef.current) {
                            clearTimeout(sseTimeoutRef.current);
                            sseTimeoutRef.current = null;
}
                        logger.info('[SSE] Connection opened');
                        const result = machine.onSseOpened(url);
                        setConnectionState(result.state);
                        applyEffects(result.effects);
                    };

                    sse.onmessage = (event) => {
                        if (!mountedRef.current || machine.getCurrentSessionId() !== sid) return;
                        try {
                            const data = JSON.parse(event.data);
                            const result = machine.onSseMessage(data, event.lastEventId);
                            setConnectionState(result.state);
                            applyEffects(result.effects);
                        } catch (e) {
                            // Non-critical: malformed SSE data — skip and continue streaming
                            logger.warn('Failed to parse SSE message');
                        }
                    };

sse.onerror = () => {
if (!mountedRef.current || machine.getCurrentSessionId() !== sid) return;
if (sse.readyState === EventSource.CLOSED) {
// Clear stale ref so reconnect can proceed
sseSourceRef.current = null;
}
const readyState = sse.readyState;
const result = machine.onSseError(readyState, sseConnected);
setConnectionState(result.state);
applyEffects(result.effects);
};
                    break;
                }

                case 'START_POLLING': {
                    const { sid, delay } = effect;
                    if (delay) {
                        pollTimerRef.current = setTimeout(() => poll(sid), delay);
                    } else {
                        poll(sid);
                    }
                    break;
                }

                case 'SCHEDULE_POLL': {
                    const { sid, delay } = effect;
                    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
                    pollTimerRef.current = setTimeout(() => poll(sid), delay);
                    break;
                }

case 'SCHEDULE_RECONNECT': {
const { sid, delay } = effect;
                    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = setTimeout(() => connect(sid, { skipCache: true }), delay);
break;
                }

                case 'FORCE_ERROR': {
if (sseSourceRef.current) { sseSourceRef.current.close(); sseSourceRef.current = null; }
if (sseTimeoutRef.current) { clearTimeout(sseTimeoutRef.current); sseTimeoutRef.current = null; }
if (reconnectTimeoutRef.current) { clearTimeout(reconnectTimeoutRef.current); reconnectTimeoutRef.current = null; }
if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null; }
forceError(effect.message);
break;
}

                case 'DISPATCH_EVENT':
                    dispatchStreamEvent(effect.eventType, effect.data);
                    break;

                case 'SET_LAST_EVENT_ID':
                    setLastEventId(effect.seq);
                    break;

                default:
                    // Unknown effect type — silently ignore
                    break;
            }
        }
    }, [machine, dispatchStreamEvent, setLastEventId, forceError]);

    // ── token / ticket helpers ────────────────────────────────────────────────

    const requestStreamTicket = async (sid: string, token: string | null): Promise<string> => {
        if (!token) {
            throw new Error('Missing auth token for stream ticket');
        }
        const sseBaseUrl = backendUrl || machineConfigRef.current.backendUrl;
        if (!sseBaseUrl) {
            throw new Error('Backend URL not configured');
        }

        const ticketResponse = await fetch(`${sseBaseUrl}/api/stream/ticket/${encodeURIComponent(sid)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
            credentials: 'include',
        });

        if (!ticketResponse.ok) {
            throw new Error(`Failed to create stream ticket: HTTP ${ticketResponse.status}`);
        }

        const ticketBody = await ticketResponse.json();
        const ticket = ticketBody?.ticket;
        if (typeof ticket !== 'string' || !ticket) {
            throw new Error('Invalid stream ticket response');
        }

        return ticket;
    };

    const tryAutoRequeue = async (sid: string, token: string | null): Promise<boolean> => {
        if (forcePollingTransport) {
            try {
                const res = await fetch('/api/analysis/requeue', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: sid }),
                    cache: 'no-store',
                    credentials: 'same-origin',
                });
                if (!res.ok) {
                    logger.warn('[Polling] Auto-requeue via proxy failed', { sessionId: sid, status: res.status });
                    return false;
                }
                logger.info('[Polling] Auto-requeue via proxy triggered successfully', { sessionId: sid });
                return true;
            } catch (error) {
                logger.warn('[Polling] Auto-requeue via proxy errored', { sessionId: sid, error });
                return false;
            }
        }

        if (!token) {
            logger.warn('[Polling] Auto-requeue skipped: missing auth token', { sessionId: sid });
            return false;
        }
        const sseBaseUrl = backendUrl || machineConfigRef.current.backendUrl;
        if (!sseBaseUrl) return false;

        try {
            const res = await fetch(`${sseBaseUrl}/api/queue/requeue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ sessionId: sid }),
                cache: 'no-store',
            });
            if (!res.ok) {
                logger.warn('[Polling] Auto-requeue failed', { sessionId: sid, status: res.status });
                return false;
            }
            logger.info('[Polling] Auto-requeue triggered successfully', { sessionId: sid });
            return true;
        } catch (error) {
            logger.warn('[Polling] Auto-requeue request errored', { sessionId: sid, error });
            return false;
        }
    };

    const resolvePollToken = async (shouldUseProxyProgress: boolean, options: PollOptions): Promise<string | null> => {
        if (shouldUseProxyProgress) return null;

        const cached = machine.getCachedToken();
        if (cached) return cached;

        if (isTestMode) {
            return 'mock-token';
        }

        if (!getToken) return null;

        return getTokenWithRetry(getToken, options as Record<string, unknown>);
    };

    const buildPollUrl = (sid: string, shouldUseProxyProgress: boolean, options: PollOptions): string => {
        const sseBaseUrl = backendUrl || machineConfigRef.current.backendUrl;

        if (shouldUseProxyProgress) {
            return `${machineConfigRef.current.analysisProgressProxyPath}?sessionId=${encodeURIComponent(sid)}`;
        }

        if (options.forceLegacyProgressPath) {
            return `${sseBaseUrl}/api/queue/progress/${encodeURIComponent(sid)}`;
        }

        return `${sseBaseUrl}/api/queue/progress?sessionId=${encodeURIComponent(sid)}`;
    };

    const resolveConnectToken = async (options: { skipCache?: boolean }): Promise<string | null> => {
        if (isTestMode) {
            return 'mock-token';
        }

        if (!getToken) return null;

        return getTokenWithRetry(getToken, options as Record<string, unknown>);
    };
    // ── polling ───────────────────────────────────────────────────────────────

    const poll = async (sid: string, interval: number = machineConfigRef.current.pollInterval, options: PollOptions = {}) => {
        if (!mountedRef.current || machine.getCurrentSessionId() !== sid) return;

        try {
            const shouldUseProxyProgress = forcePollingTransport;
            const token = shouldUseProxyProgress
                ? null
                : machine.getCachedToken() ??
                    (isTestMode
                        ? 'mock-token'
                        : (getToken ? await getTokenWithRetry(getToken, options as Record<string, unknown>) : null));

            if (token) machine.setCachedToken(token);

            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            else if (getToken && !shouldUseProxyProgress) logger.warn('[Polling] Missing token after retries');

            const sseBaseUrl = backendUrl || machineConfigRef.current.backendUrl;
            const pollUrl = shouldUseProxyProgress
                ? `${machineConfigRef.current.analysisProgressProxyPath}?sessionId=${encodeURIComponent(sid)}`
                : options.forceLegacyProgressPath
                    ? `${sseBaseUrl}/api/queue/progress/${encodeURIComponent(sid)}`
                    : `${sseBaseUrl}/api/queue/progress?sessionId=${encodeURIComponent(sid)}`;

            const res = await fetch(pollUrl, { headers, cache: 'no-store' });

            if (!mountedRef.current || machine.getCurrentSessionId() !== sid) return;

            // Handle 404 with legacy path fallback (original behavior)
            if (res.status === 404 && !shouldUseProxyProgress && !options.forceLegacyProgressPath) {
                await poll(sid, interval, { ...options, forceLegacyProgressPath: true });
                return;
            }

            const result = await machine.onPollResult(
                sid,
                { status: res.status, ok: res.ok, json: () => res.json() },
                options,
                interval,
                token
            );
            setConnectionState(result.state);
            applyEffects(result.effects);

        } catch (error) {
            const result = machine.onPollError(error as Error, sid, interval);
            setConnectionState(result.state);
            applyEffects(result.effects);
        }
    };

    // ── connect ───────────────────────────────────────────────────────────────

    const connect = async (sid: string, options: { skipCache?: boolean } = {}) => {
        if (!sid || sid === 'undefined') return;

        const skipSse = isTestMode;
        const startResult = machine.onConnectStart(sid, { forcePolling: forcePollingTransport, skipSse });
        setConnectionState(startResult.state);

if (startResult.effects.length > 0) {
applyEffects(startResult.effects);
// Prevent SSE from starting if polling was just started
if (startResult.effects.some(e => e.type === 'START_POLLING' || e.type === 'SCHEDULE_POLL')) {
return;
}
return;
}

        // SSE path
        if (!mountedRef.current) {
            logger.debug('[SSE] Ignoring stale connection attempt', { sid, mounted: mountedRef.current });
            return;
        }

        if (sseSourceRef.current && machine.getCurrentSessionId() === sid) {
            logger.debug('[SSE] Connection already exists for this session, skipping duplicate', { sid });
            return;
        }

        try {
            const token = await resolveConnectToken(options);

            if (!token && getToken) {
                logger.warn('Token acquisition failed after maximum retries');
            }
            machine.setCachedToken(token ?? null);

            const query = isTestMode
                ? '?ticket=test-ticket'
                : `?ticket=${encodeURIComponent(await requestStreamTicket(sid, token))}`;

            const sseBaseUrl = backendUrl || machineConfigRef.current.backendUrl;
            if (!sseBaseUrl) {
                throw new Error('Backend URL not configured');
            }
            const url = `${sseBaseUrl}/api/stream/${sid}${query}`;
            logger.info('[SSE] Opening EventSource stream', { sessionId: sid });

            applyEffects([{ type: 'START_SSE', sid, url }]);
        } catch (error) {
            const result = machine.onConnectError(error as Error, sid);
            setConnectionState(result.state);
            applyEffects(result.effects);
        }
    };

    // ── main effect ───────────────────────────────────────────────────────────

    useEffect(() => {
        mountedRef.current = true;

        if (!sessionId) {
            const result = machine.onSessionChange(null);
            setConnectionState(result.state);
            applyEffects(result.effects);
            return;
        }

        setSessionId(sessionId);

        const result = machine.onSessionChange(sessionId);
        setConnectionState(result.state);
        connect(sessionId, { skipCache: false });

        return () => {
            mountedRef.current = false;
            const cleanupResult = machine.onCleanup();
            applyEffects(cleanupResult.effects);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, backendUrl, forcePollingTransport]);

    // ── proactive token refresh ───────────────────────────────────────────────

    useEffect(() => {
        if (!getToken) return;

        const REFRESH_INTERVAL = 45 * 60 * 1000; // 45 minutes
        logger.info('[Token] Setting up proactive token refresh service');

        const refresh = async () => {
            try {
                logger.debug('[Token] Proactively refreshing Clerk token...');
                const refreshedToken = await getTokenWithRetry(getToken, { skipCache: true });
                if (refreshedToken) {
                    machine.setCachedToken(refreshedToken);
                }
                logger.info('[Token] Token refreshed successfully');
            } catch (err) {
                logger.warn('[Token] Failed to refresh token proactively', err instanceof Error ? { message: err.message } : undefined);
            }
        };

        if (isTestMode) {
            const timeout = setTimeout(() => {
                refresh().catch(() => undefined);
            }, REFRESH_INTERVAL);
            return () => clearTimeout(timeout);
        }

        const interval = setInterval(() => {
            refresh().catch(() => undefined);
        }, REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, [getToken]);

    return { connectionState };
}

export default useStreamProgress;
