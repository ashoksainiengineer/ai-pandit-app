'use client';

/**
 * useStreamProgress - Production-Grade SSE/Polling Hook
 * ======================================================
 * 
 * Provides real-time progress updates for BTR analysis via:
 * - Server-Sent Events (SSE) as primary connection
 * - Automatic fallback to polling if SSE fails
 * - Race condition protection with mount tracking
 * - Memory leak prevention with proper cleanup
 * 
 * @version 4.0.0
 * @author AI Pandit Engineering Team
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { logger } from './secure-logger';
import type { IAdvancedSignals } from '@/components/rectify/advanced-signals/types';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface StreamProgress {
    step: string;
    stepIndex: number;
    totalSteps: number;
    percentage: number;
    message: string;
    details?: string[];
}

export interface AIThinking {
    stage: number;
    candidateTime?: string;
    chunks: string[];
    fullText: string;
}

export interface AIContextData {
    stage: number;
    candidateTime: string;
    planetaryInfo: {
        ascendant: string;
        sun: string;
        moon: string;
        [key: string]: string;
    };
    dasha: string;
    divCharts?: string;
    groundTruth?: unknown;
}

export interface CandidateScore {
    time: string;
    score: number;
    stage: number;
    rank?: number;
    offsetMinutes?: number;
    minifiedEph?: { sun: string; moon: string; ascendant: string };
}

export interface StageStat {
    stage: number;
    candidateCount: number;
    description: string;
}

export interface StreamResult {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
}

export interface StreamMetadata {
    fullName?: string;
    dateOfBirth?: string;
    tentativeTime?: string;
    birthPlace?: string;
    timezone?: string;
    status?: string;
    lifeEvents?: unknown[];
    physicalTraits?: unknown;
    offsetConfig?: { preset: string; minutes?: number };
}

export interface StreamStep {
    id: string;
    name: string;
    icon?: string;
}

export interface StreamState {
    isConnected: boolean;
    isComplete: boolean;
    error: string | null;
    progress: StreamProgress | null;
    aiThinking: AIThinking | null;
    aiContext: AIContextData | null;
    candidateScores: CandidateScore[];
    stageStats: StageStat[];
    result: StreamResult | null;
    metadata?: StreamMetadata;
    allCandidates: Map<string, AIThinking>;
    displayedCandidate: string | null;
    stageHistory: Map<number, string>;
    analyzedCount: number;
    totalCandidates: number;
    startedAt?: string;
    estimatedTimeRemaining?: number;
    allSteps: StreamStep[];
    advancedSignals: IAdvancedSignals | null;
}

type ConnectionStatus = 'idle' | 'connecting' | 'streaming' | 'polling' | 'finished' | 'error';

interface ConnectionState {
    status: ConnectionStatus;
    url: string;
    lastError: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const FALLBACK_STEPS: StreamStep[] = [
    { id: 'prana', name: 'Prana Mapping' },
    { id: 'discovery', name: 'Discovery Tournament' },
    { id: 'convergence', name: 'Temporal Convergence' },
    { id: 'audit', name: 'Micro-Audit (D60)' },
    { id: 'seal', name: 'God-Tier Lock' }
];

const POLLING_INTERVAL_MS = 2500;
const POLLING_MAX_DELAY_MS = 45000;
const SSE_TIMEOUT_MS = 15000;
const MAX_RETRY_COUNT = 5;

// ═══════════════════════════════════════════════════════════════════════════════
// INITIAL STATE FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

function createInitialState(): StreamState {
    return {
        isConnected: false,
        isComplete: false,
        error: null,
        progress: null,
        aiThinking: null,
        aiContext: null,
        candidateScores: [],
        stageStats: [],
        result: null,
        metadata: undefined,
        allCandidates: new Map(),
        displayedCandidate: null,
        stageHistory: new Map(),
        analyzedCount: 0,
        totalCandidates: 0,
        startedAt: undefined,
        estimatedTimeRemaining: undefined,
        allSteps: FALLBACK_STEPS,
        advancedSignals: null,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

export function useStreamProgress(
    sessionId: string | null,
    backendUrl: string = '',
    getToken?: () => Promise<string | null>
): StreamState & { connectionState: ConnectionState } {

    const [state, setState] = useState<StreamState>(createInitialState);
    const [connectionState, setConnectionState] = useState<ConnectionState>({
        status: 'idle',
        url: '',
        lastError: null,
    });

    // Refs for cleanup and mount tracking
    const isMountedRef = useRef(true);
    const eventSourceRef = useRef<EventSource | null>(null);
    const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const retryCountRef = useRef(0);

    // Safe state updater that checks mount status
    const safeSetState = useCallback((updater: (prev: StreamState) => StreamState) => {
        if (isMountedRef.current) {
            setState(updater);
        }
    }, []);

    // Cleanup function
    const cleanup = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        if (pollingTimerRef.current) {
            clearTimeout(pollingTimerRef.current);
            pollingTimerRef.current = null;
        }
    }, []);

    /**
     * Handle incoming SSE/polling event data
     */
    const handleEventData = useCallback((eventData: Record<string, unknown>) => {
        if (!isMountedRef.current) return;

        const eventType = String(eventData.type || '');

        switch (eventType) {
            case 'connected':
                safeSetState(prev => ({ ...prev, isConnected: true }));
                break;

            case 'progress':
                safeSetState(prev => ({
                    ...prev,
                    progress: eventData.data as StreamProgress,
                }));
                break;

            case 'ai_thinking':
                safeSetState(prev => {
                    const thinking = eventData.data as AIThinking;
                    const newCandidates = new Map(prev.allCandidates);
                    if (thinking.candidateTime) {
                        newCandidates.set(thinking.candidateTime, thinking);
                    }
                    return {
                        ...prev,
                        aiThinking: thinking,
                        allCandidates: newCandidates,
                        displayedCandidate: thinking.candidateTime || prev.displayedCandidate,
                    };
                });
                break;

            case 'ai_context':
                safeSetState(prev => ({
                    ...prev,
                    aiContext: eventData.data as AIContextData,
                }));
                break;

            case 'candidate_scores':
                safeSetState(prev => ({
                    ...prev,
                    candidateScores: eventData.data as CandidateScore[],
                }));
                break;

            case 'stage_stats':
                safeSetState(prev => ({
                    ...prev,
                    stageStats: eventData.data as StageStat[],
                }));
                break;

            case 'advanced_signals':
                safeSetState(prev => ({
                    ...prev,
                    advancedSignals: eventData.data as IAdvancedSignals,
                }));
                break;

            case 'metadata':
                safeSetState(prev => ({
                    ...prev,
                    metadata: eventData.data as StreamMetadata,
                }));
                break;

            case 'complete':
            case 'result':
                safeSetState(prev => ({
                    ...prev,
                    isComplete: true,
                    isConnected: false,
                    result: eventData.data as StreamResult,
                }));
                setConnectionState(prev => ({ ...prev, status: 'finished' }));
                cleanup();
                break;

            case 'error':
                safeSetState(prev => ({
                    ...prev,
                    error: String(eventData.message || 'Unknown error'),
                    isConnected: false,
                }));
                setConnectionState(prev => ({
                    ...prev,
                    status: 'error',
                    lastError: String(eventData.message || 'Unknown error'),
                }));
                cleanup();
                break;

            default:
                logger.debug('Unknown event type', { eventType });
        }
    }, [safeSetState, cleanup]);

    /**
     * Fetch progress via polling (fallback mechanism)
     */
    const fetchProgressViaPolling = useCallback(async (sid: string, baseUrl: string): Promise<boolean> => {
        if (!isMountedRef.current) return false;

        try {
            const token = getToken ? await getToken() : null;
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`/api/queue/progress?sessionId=${sid}`, { headers });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.data) {
                handleEventData({
                    type: data.data.status === 'complete' ? 'complete' : 'progress',
                    data: data.data,
                });

                // Continue polling if not complete
                return data.data.status !== 'complete' && data.data.status !== 'failed';
            }

            return true; // Continue polling
        } catch (error) {
            logger.warn('Polling fetch failed', { error });
            retryCountRef.current++;

            if (retryCountRef.current >= MAX_RETRY_COUNT) {
                handleEventData({
                    type: 'error',
                    message: 'Connection lost after multiple retries',
                });
                return false;
            }

            return true; // Retry
        }
    }, [getToken, handleEventData]);

    /**
     * Start polling loop
     */
    const startPolling = useCallback((sid: string, baseUrl: string) => {
        const poll = async () => {
            if (!isMountedRef.current || connectionState.status !== 'polling') return;

            const shouldContinue = await fetchProgressViaPolling(sid, baseUrl);

            if (shouldContinue && isMountedRef.current) {
                const delay = Math.min(
                    POLLING_INTERVAL_MS * Math.pow(1.5, retryCountRef.current),
                    POLLING_MAX_DELAY_MS
                );
                pollingTimerRef.current = setTimeout(poll, delay);
            }
        };

        poll();
    }, [fetchProgressViaPolling, connectionState.status]);

    /**
     * Connect via SSE
     */
    const connectSSE = useCallback(async (sid: string, baseUrl: string) => {
        cleanup();
        setConnectionState({ status: 'connecting', url: '', lastError: null });
        retryCountRef.current = 0;

        try {
            const token = getToken ? await getToken() : null;
            const queryToken = token ? `?token=${encodeURIComponent(token)}` : '';
            const url = `/api/stream/${sid}${queryToken}`;

            setConnectionState(prev => ({ ...prev, url }));

            const eventSource = new EventSource(url);
            eventSourceRef.current = eventSource;

            // Connection timeout
            const timeoutId = setTimeout(() => {
                if (eventSourceRef.current?.readyState !== EventSource.OPEN) {
                    logger.info('SSE connection timeout, switching to polling');
                    cleanup();
                    setConnectionState({ status: 'polling', url, lastError: 'Connection timeout' });
                    startPolling(sid, baseUrl);
                }
            }, SSE_TIMEOUT_MS);

            eventSource.onopen = () => {
                clearTimeout(timeoutId);
                logger.info('SSE connection established');
                safeSetState(prev => ({ ...prev, isConnected: true }));
                setConnectionState(prev => ({ ...prev, status: 'streaming', lastError: null }));
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleEventData(data);
                } catch (e) {
                    logger.warn('Failed to parse SSE message', { error: e });
                }
            };

            eventSource.onerror = () => {
                clearTimeout(timeoutId);
                logger.warn('SSE error, switching to polling');
                cleanup();
                setConnectionState({ status: 'polling', url, lastError: 'SSE error' });
                startPolling(sid, baseUrl);
            };

        } catch (error) {
            logger.error('SSE initialization failed', { error });
            setConnectionState({ status: 'polling', url: '', lastError: 'SSE init failed' });
            startPolling(sid, baseUrl);
        }
    }, [getToken, cleanup, handleEventData, startPolling, safeSetState]);

    // Main effect: connect when sessionId changes
    useEffect(() => {
        isMountedRef.current = true;

        if (!sessionId) {
            cleanup();
            setState(createInitialState());
            setConnectionState({ status: 'idle', url: '', lastError: null });
            return;
        }

        connectSSE(sessionId, '');

        return () => {
            isMountedRef.current = false;
            cleanup();
        };
    }, [sessionId, connectSSE, cleanup]);

    // Memoize return value to prevent unnecessary re-renders
    return useMemo(() => ({
        ...state,
        connectionState,
    }), [state, connectionState]);
}

export default useStreamProgress;
