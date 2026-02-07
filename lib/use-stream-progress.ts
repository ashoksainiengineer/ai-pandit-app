'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { logger, streamLogger } from './secure-logger';
import { sanitizeAIContent } from './xss-sanitizer';

// ... (interfaces are the same)

// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

const FALLBACK_STEPS: StreamStep[] = [
    { id: 'prana', name: 'Prana Mapping' },
    { id: 'discovery', name: 'Discovery Tournament' },
    { id: 'convergence', name: 'Temporal Convergence' },
    { id: 'audit', name: 'Micro-Audit (D60)' },
    { id: 'seal', name: 'God-Tier Lock' }
];

const POLLING_BASE_DELAY = 2500;
const POLLING_MAX_DELAY = 45000;
const SSE_CONNECTION_TIMEOUT = 10000;
const HEARTBEAT_INTERVAL = 30000;
const HEARTBEAT_STALE_THRESHOLD = 70000;
const ROTATION_INTERVAL = 5000;

type ConnectionStatus = 'idle' | 'connecting' | 'streaming' | 'polling' | 'finished' | 'error';

// ═════════════════════════════════════════════════════════════════════════════
// HOOK
// ═════════════════════════════════════════════════════════════════════════════

export function useStreamProgress(
    sessionId: string | null,
    backendUrl: string = '',
    getToken?: () => Promise<string | null>
): StreamState & { connectionState: { status: ConnectionStatus; url: string; lastError: string | null; } } {

    const [state, setState] = useState<StreamState>({
        isConnected: false,
        isComplete: false,
        error: null,
        progress: null,
        aiThinking: null,
        aiContext: null,
        candidateScores: [],
        calculationLogs: [],
        stageStats: [],
        result: null,
        allCandidates: new Map(),
        displayedCandidate: null,
        stageHistory: new Map(),
        analyzedCount: 0,
        totalCandidates: 0,
        estimatedTimeRemaining: 0,
        allSteps: FALLBACK_STEPS,
    });

    const [connectionState, setConnectionState] = useState({
        status: 'idle' as ConnectionStatus,
        url: '',
        lastError: null as string | null,
    });

    const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());
    const isMountedRef = useRef<boolean>(true);
    const abortControllerRef = useRef<AbortController | null>(null);

    const addTimer = (timer: NodeJS.Timeout) => timersRef.current.add(timer);
    const clearTimers = () => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current.clear();
    };

    const cleanup = useCallback(() => {
        streamLogger.debug('Cleaning up stream resources');
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        clearTimers();
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            cleanup();
        };
    }, [cleanup]);


    // State updater function
    const updateState = useCallback((updater: (prevState: StreamState) => StreamState) => {
        if (isMountedRef.current) {
            setState(updater);
        }
    }, []);


    const fetchProgress = useCallback(async (sid: string, baseUrl: string = '') => {
        // ... (fetchProgress implementation - no change)
    }, [getToken, updateState]);


    const pollLoop = useCallback((sid: string, baseUrl: string) => {
        let errorCount = 0;
        const executePoll = async () => {
            if (!isMountedRef.current || connectionState.status !== 'polling') return;

            try {
                const proceed = await fetchProgress(sid, baseUrl);
                if (proceed) {
                    errorCount = 0;
                    const timer = setTimeout(executePoll, POLLING_BASE_DELAY);
                    addTimer(timer);
                } else {
                    updateState(prev => ({ ...prev, isComplete: true, isConnected: false }));
                    setConnectionState({ ...connectionState, status: 'finished' });
                }
            } catch (err) {
                errorCount++;
                const delay = Math.min(POLLING_BASE_DELAY * Math.pow(1.8, errorCount), POLLING_MAX_DELAY);
                streamLogger.warn(`Polling error, retrying in ${delay}ms`, { errorCount });
                const timer = setTimeout(executePoll, delay);
                addTimer(timer);
            }
        };
        executePoll();
    }, [fetchProgress, connectionState, updateState]);


    // ... (handleEvent implementation - no change, but ensure it uses updateState)

    // Main effect
    useEffect(() => {
        if (!sessionId) {
            setConnectionState({ status: 'idle', url: '', lastError: null });
            return;
        }

        let eventSource: EventSource | null = null;

        const connect = async () => {
            if (connectionState.status !== 'idle' && connectionState.status !== 'error') return;

            cleanup();
            setConnectionState({ status: 'connecting', url: '', lastError: null });

            try {
                const token = getToken ? await getToken() : null;
                const queryToken = token ? `?token=${encodeURIComponent(token)}` : '';
                const url = `${backendUrl}/api/stream/${sessionId}${queryToken}`;
                setConnectionState(prev => ({ ...prev, url }));

                eventSource = new EventSource(url);

                const connectionTimeout = setTimeout(() => {
                    streamLogger.warn('SSE connection timeout, switching to polling.');
                    eventSource?.close();
                    setConnectionState({ status: 'polling', url, lastError: 'Connection timeout' });
                    pollLoop(sessionId, backendUrl);
                }, SSE_CONNECTION_TIMEOUT);
                addTimer(connectionTimeout);


                eventSource.onopen = () => {
                    clearTimeout(connectionTimeout);
                    streamLogger.info('SSE connection established.');
                    updateState(prev => ({ ...prev, isConnected: true }));
                    setConnectionState(prev => ({ ...prev, status: 'streaming', lastError: null }));
                };

                eventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        // handleEvent(data); // This now needs to be called within updateState if it modifies state
                    } catch (e) {
                        streamLogger.warn('Failed to parse SSE event');
                    }
                };

                eventSource.onerror = () => {
                    streamLogger.error('SSE stream error. Switching to polling.');
                    eventSource?.close();
                    setConnectionState({ status: 'polling', url, lastError: 'SSE error' });
                    pollLoop(sessionId, backendUrl);
                };

            } catch (error) {
                streamLogger.error('Failed to initialize SSE, switching to polling', error);
                setConnectionState({ status: 'polling', url: '', lastError: 'SSE initialization failed' });
                pollLoop(sessionId, backendUrl);
            }
        };

        connect();

        return () => {
            eventSource?.close();
            cleanup();
        };

    }, [sessionId, backendUrl, getToken, cleanup, pollLoop, connectionState.status, updateState]);

    return useMemo(() => ({
        ...state,
        connectionState: {
            status: connectionState.status,
            url: connectionState.url,
            lastError: connectionState.lastError,
        },
    }), [state, connectionState]);
}

export default useStreamProgress;
