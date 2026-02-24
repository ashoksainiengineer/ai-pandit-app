'use client';

/**
 * useStreamProgress - Bulletproof Real-Time Progress Hook
 * ========================================================
 * 
 * SIMPLE architecture:
 * 1. Try SSE once
 * 2. If SSE fails, use polling
 * 3. On 404 (session not found), stop and show error
 * 4. On 429 (rate limit), wait 30s and retry
 * 
 * @version 7.0.0 - Bulletproof rewrite
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { logger } from './secure-logger';
import { env } from './config';
import { getTokenWithRetry } from './auth-utils';
import type { IAdvancedSignals } from '@/components/rectify/advanced-signals/types';

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

type ConnectionStatus = 'idle' | 'connecting' | 'streaming' | 'polling' | 'rate_limited' | 'finished' | 'error';

interface ConnectionState {
    status: ConnectionStatus;
    url: string;
    lastError: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
const POLL_INTERVAL = 5000;      // 5 seconds
const MAX_POLL_INTERVAL = 60000; // 60 seconds
const SSE_TIMEOUT = 10000;       // 10 seconds to establish SSE
const RATE_LIMIT_WAIT = 30000;   // 30 seconds on 429

// Direct backend URL for SSE and Polling — bypasses Vercel serverless timeout
const BACKEND_URL = env.api.backendUrl.replace(/\/$/, '');

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

import { useStreamStore } from './store/stream-store';

export function useStreamProgress(
    sessionId: string | null,
    backendUrl: string = BACKEND_URL,
    getToken?: () => Promise<string | null>
): { connectionState: ConnectionState } {

    const dispatchStreamEvent = useStreamStore(state => state.dispatchStreamEvent);
    const setSessionId = useStreamStore(state => state.setSessionId);
    const forceError = useStreamStore(state => state.forceError);
    const markComplete = useStreamStore(state => state.markComplete);

    const [connectionState, setConnectionState] = useState<ConnectionState>({
        status: 'idle',
        url: '',
        lastError: null,
    });

    // Refs for cleanup
    const mountedRef = useRef(true);
    const sseSourceRef = useRef<EventSource | null>(null);
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const connectionAttemptedRef = useRef<boolean>(false);
    const streamCleanupRef = useRef<boolean>(false);
    const currentSessionRef = useRef<string | null>(null);
    const authRetryRef = useRef<boolean>(false);
    const terminalStateReceivedRef = useRef<boolean>(false); // Track if we got terminal state

    // Cleanup function
    const cleanup = () => {
        if (sseSourceRef.current) {
            logger.info('[SSE] Closing active connection', { sessionId: currentSessionRef.current });
            sseSourceRef.current.close();
            sseSourceRef.current = null;
        }

        // Mark as cleaned up to prevent async connect() from opening new ones
        streamCleanupRef.current = true;

        if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    };

    // Handle incoming event data
    const handleEvent = (data: Record<string, unknown>) => {
        if (!mountedRef.current) return;
        const type = String(data.type || '');

        // Push payload to Zustand instantly
        dispatchStreamEvent(type, data);

        // Update local connector connection status UI
        if (type === 'complete' || type === 'result') {
            cleanup();
            setConnectionState(cs => ({ ...cs, status: 'finished' }));
        } else if (type === 'error') {
            cleanup();
            setConnectionState(cs => ({
                ...cs,
                status: 'error',
                lastError: String(data.message || 'Unknown error'),
            }));
        } else if (type === 'terminal_state') {
            const termData = (data.data as any) || data;
            terminalStateReceivedRef.current = true;
            cleanup();
            const isErr = termData.status === 'failed' || termData.status === 'error' || termData.status === 'cancelled';
            setConnectionState(cs => ({
                ...cs,
                status: isErr ? 'error' : 'finished',
                lastError: isErr ? (termData.errorMessage || termData.message) : null
            }));
        }
    };

    // Single polling function
    const poll = async (sid: string, interval: number = POLL_INTERVAL, options: any = {}) => {
        if (!mountedRef.current || currentSessionRef.current !== sid) return;

        try {
            // RETRY TOKEN ACQUISITION
            const token = getToken ? await getTokenWithRetry(getToken, options) : null;

            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            else if (getToken) logger.warn('[Polling] Missing token after retries');

            const sseBaseUrl = backendUrl || BACKEND_URL;
            if (!sseBaseUrl) {
                throw new Error('Backend URL not configured');
            }
            const separator = '&'; // sessionId is already there
            const pollUrl = `${sseBaseUrl}/api/queue/progress?sessionId=${sid}${token ? `${separator}token=${encodeURIComponent(token)}` : ''}`;

            const res = await fetch(pollUrl, {
                headers,
                cache: 'no-store',
            });

            if (!mountedRef.current || currentSessionRef.current !== sid) return;

            // Handle 404 - session not in queue (maybe completed or never started)
            if (res.status === 404) {
                logger.warn('Session not found in queue (404)');
                setConnectionState({ status: 'error', url: '', lastError: 'Session not found - analysis may have already completed' });
                forceError('Session not found. Start a new analysis.');
                return; // Stop polling
            }

            // Handle 429 - rate limited
            if (res.status === 429) {
                logger.warn('Rate limited (429), waiting 30s');
                setConnectionState({ status: 'rate_limited', url: '', lastError: 'Rate limited' });
                pollTimerRef.current = setTimeout(() => poll(sid, interval), RATE_LIMIT_WAIT);
                return;
            }

            // Handle other errors
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const result = await res.json();

            // Update state
            setConnectionState(cs => ({ ...cs, status: 'polling', lastError: null }));

            if (result.success !== false) {
                const status = result.status || result.data?.status;
                const isComplete = ['complete', 'success', 'finished'].includes(status);
                const isFailed = ['failed', 'error', 'cancelled'].includes(status);

                // ═══════════════════════════════════════════════════════════════
                // INDUSTRY FIX: Extract result.progress (the actual ProgressData)
                // Polling returns {sessionId, status, progress:{currentStep,...}, metadata:{...}}
                // The store expects PollingProgressData shape at the top level,
                // not the entire polling response wrapper.
                // ═══════════════════════════════════════════════════════════════
                const progressPayload = result.progress || result.data?.progress || result.data || result;

                // Always send progress data first (has candidateScores, startedAt, etc.)
                handleEvent({ type: 'progress', data: progressPayload });

                if (isComplete) {
                    // For complete: the StreamResult (rectifiedTime, etc.) comes from SSE.
                    // In polling mode, we mark complete to trigger redirect to results page.
                    handleEvent({ type: 'complete', data: progressPayload });
                }

                if (isFailed) {
                    handleEvent({
                        type: 'terminal_state',
                        data: { status, message: result.errorMessage || `Session ${status}` },
                    });
                }

                if (result.metadata) {
                    // 🔧 FIX: Merge top-level status and error into metadata payload
                    // This ensures store's metadata.status is preserved during polling
                    const enrichedMetadata = {
                        ...result.metadata,
                        status: result.status,
                        errorMessage: result.errorMessage || result.metadata.errorMessage,
                        updatedAt: result.metadata.updatedAt || result.updatedAt || new Date().toISOString()
                    };
                    handleEvent({ type: 'metadata', data: enrichedMetadata });
                }

                // 🔧 FIX: Also dispatch terminal_state if polling detects end of session
                // This syncs state.isComplete and state.error store-wide
                if (['complete', 'failed', 'cancelled'].includes(result.status)) {
                    handleEvent({
                        type: 'terminal_state',
                        data: {
                            status: result.status,
                            errorMessage: result.errorMessage || result.metadata?.errorMessage
                        }
                    });
                }

                // Stop if complete or failed
                if (isComplete || isFailed) return;
            }

            // Schedule next poll
            pollTimerRef.current = setTimeout(() => poll(sid, interval), interval);

        } catch (error) {
            logger.warn('Polling failed', { error });

            // CAPTURE STACK TRACE FOR DEBUGGING
            const err = error as Error;
            const stackMsg = err.message + (err.stack ? '\n' + err.stack : '');
            if (err.name === 'RangeError' || err.message.includes('Invalid time value')) {
                forceError(stackMsg);
            }

            // Retry with backoff
            const nextInterval = Math.min(interval * 1.5, MAX_POLL_INTERVAL);
            pollTimerRef.current = setTimeout(() => poll(sid, nextInterval), nextInterval);
        }
    };

    // Connect — SSE directly to backend (bypasses Vercel serverless timeout)
    const connect = async (sid: string, options: any = {}) => {
        if (!sid || sid === 'undefined') return;

        // Guard against stale connections during rapid navigation/unmount
        if (!mountedRef.current || streamCleanupRef.current) {
            logger.debug('[SSE] Ignoring stale connection attempt', { sid, mounted: mountedRef.current, cleanedUp: streamCleanupRef.current });
            return;
        }

        cleanup(); // Clean up any previous connections for this hook instance
        streamCleanupRef.current = false;
        currentSessionRef.current = sid;
        setConnectionState({ status: 'connecting', url: '', lastError: null });
        terminalStateReceivedRef.current = false; // Reset for new connection
        authRetryRef.current = false; // Reset auth retry flag for new connection attempt

        try {
            // RETRY TOKEN ACQUISITION
            const token = getToken ? await getTokenWithRetry(getToken, options) : null;

            if (!token && getToken) {
                logger.warn('Token acquisition failed after maximum retries');
            }

            const query = token ? `?token=${encodeURIComponent(token)}` : '';

            // Direct connection to backend — no Vercel proxy, no timeout limit
            const sseBaseUrl = backendUrl || BACKEND_URL;
            if (!sseBaseUrl) {
                throw new Error('Backend URL not configured');
            }
            const url = `${sseBaseUrl}/api/stream/${sid}${query}`;

            logger.info('Opening direct SSE connection', {
                url: url.replace(/token=[^&]+/, 'token=***'),
                sessionId: sid
            });

            const sse = new EventSource(url);
            sseSourceRef.current = sse;

            let sseConnected = false;

            // Timeout — if SSE doesn't connect in 10s, fall back to polling
            const timeout = setTimeout(() => {
                if (!sseConnected && mountedRef.current && currentSessionRef.current === sid) {
                    console.warn('⚠️ [SSE] Connection timeout (10s), falling back to polling fallback...');
                    if (sseSourceRef.current) {
                        sseSourceRef.current.close();
                        sseSourceRef.current = null;
                    }
                    setConnectionState({ status: 'polling', url: '', lastError: 'SSE timeout' });
                    poll(sid);
                }
            }, SSE_TIMEOUT);

            sse.onopen = () => {
                if (!mountedRef.current || currentSessionRef.current !== sid) {
                    sse.close();
                    return;
                }
                sseConnected = true;
                clearTimeout(timeout);
                console.log('✅ [SSE] Connection OPENED successfully');
                dispatchStreamEvent('connected', {});
                setConnectionState({ status: 'streaming', url, lastError: null });
            };

            sse.onmessage = (event) => {
                if (!mountedRef.current || currentSessionRef.current !== sid) return;
                try {
                    const data = JSON.parse(event.data);

                    // INDUSTRY SSE: Track Last-Event-ID for reconnection replay
                    // Native EventSource auto-sends this as header on reconnect
                    if (event.lastEventId) {
                        const seq = parseInt(event.lastEventId, 10);
                        if (!isNaN(seq)) {
                            useStreamStore.getState().lastEventId = seq;
                        }
                    }

                    // 🔧 FIX: Handle auth errors sent as regular messages
                    if (data.type === 'error' && (data.code === 'AUTH_FAILED' || data.code === 'UNAUTHORIZED')) {
                        console.error('🔥 [SSE] Auth error received:', data);

                        if (!authRetryRef.current) {
                            console.warn('🔄 [SSE] Authentication failed. Attempting one-time token refresh...');
                            authRetryRef.current = true;
                            cleanup();
                            setTimeout(() => connect(sid, { skipCache: true }), 500);
                            return;
                        }

                        // Terminal error after retry
                        cleanup();
                        forceError(data.error || 'Authentication failed');
                        setConnectionState({
                            status: 'error',
                            url: '',
                            lastError: data.error || 'Authentication failed'
                        });
                        return;
                    }

                    handleEvent(data);
                } catch (e) {
                    logger.warn('Failed to parse SSE message');
                }
            };

            sse.onerror = (err: any) => {
                if (!mountedRef.current || currentSessionRef.current !== sid) return;

                // Check if we already received a terminal state - if so, this error is expected
                // Use ref instead of state to avoid stale closure issues
                if (terminalStateReceivedRef.current) {
                    console.log('📤 [SSE] Connection closed after terminal state (expected)');
                    return;
                }

                // 🔧 FIX: Check for HTTP error status from EventSource
                // EventSource readyState: 0=CONNECTING, 1=OPEN, 2=CLOSED
                const readyState = sse.readyState;
                console.error(`❌ [SSE] Connection error (readyState: ${readyState})`, err);

                if (sseConnected && readyState === EventSource.OPEN) {
                    console.warn('⚠️ [SSE] Transient error, browser will auto-retry...');
                } else if (readyState === EventSource.CLOSED) {
                    // Connection was closed - check if we need to retry with fresh token
                    if (!authRetryRef.current) {
                        console.warn('🔄 [SSE] Connection closed. Attempting one-time token refresh and reconnect...');
                        authRetryRef.current = true;
                        cleanup();
                        setTimeout(() => connect(sid, { skipCache: true }), 1000);
                        return;
                    }

                    // Already retried - fall back to polling
                    console.error('🔥 [SSE] Connection failed after retry. Switching to polling...');
                    cleanup();
                    setConnectionState({ status: 'polling', url: '', lastError: 'SSE connection failed, using polling' });
                    poll(sid);
                } else {
                    // Still connecting - wait a bit before deciding
                    setTimeout(() => {
                        if (mountedRef.current && currentSessionRef.current === sid && !sseSourceRef.current && !terminalStateReceivedRef.current) {
                            console.error('🔥 [SSE] Initial connection timeout. Switching to polling...');
                            cleanup();
                            setConnectionState({ status: 'polling', url: '', lastError: 'SSE timeout' });
                            poll(sid);
                        }
                    }, 500);
                }
            };

        } catch (error) {
            logger.error('Connection failed', { error });
            // CAPTURE STACK TRACE FOR DEBUGGING
            const err = error as Error;
            const stackMsg = err.message + (err.stack ? '\n' + err.stack : '');
            if (err.name === 'RangeError' || err.message.includes('Invalid time value')) {
                forceError(stackMsg);
            }

            setConnectionState({ status: 'polling', url: '', lastError: 'Connection failed' });
            pollTimerRef.current = setTimeout(() => poll(sid), 2000);
        }
    };

    // Main effect
    useEffect(() => {
        mountedRef.current = true;
        connectionAttemptedRef.current = false;

        if (!sessionId) {
            cleanup();
            currentSessionRef.current = null;
            setConnectionState({ status: 'idle', url: '', lastError: null });
            return;
        }

        // Initialize Store State
        setSessionId(sessionId);

        // Don't start a new connection if we already have one for the same session
        if (connectionAttemptedRef.current && currentSessionRef.current === sessionId) {
            return;
        }

        connectionAttemptedRef.current = true;

        // Start Connection
        connect(sessionId, { skipCache: false });

        return () => {
            mountedRef.current = false;
            cleanup();
        };
    }, [sessionId, backendUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    // PROACTIVE TOKEN REFRESH (Standard Session Maintenance)
    // Long-running analysis (20+ mins) can cause tokens to expire silently.
    // We refresh the token every 45 minutes to ensure the session remains valid.
    useEffect(() => {
        if (!getToken) return;

        const REFRESH_INTERVAL = 45 * 60 * 1000; // 45 minutes
        logger.info('[Token] Setting up proactive token refresh service');

        const interval = setInterval(async () => {
            try {
                logger.debug('[Token] 🔄 Proactively refreshing Clerk token...');
                await getTokenWithRetry(getToken, { skipCache: true });
                logger.info('[Token] ✅ Token refreshed successfully');
            } catch (err) {
                logger.warn('[Token] ⚠️ Failed to refresh token proactively', err);
            }
        }, REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, [getToken]);

    return { connectionState };
}

export default useStreamProgress;
