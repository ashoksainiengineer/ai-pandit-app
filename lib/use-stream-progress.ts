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

import { useState, useEffect, useRef, useMemo } from 'react';
import { logger } from './secure-logger';
import type { IAdvancedSignals } from '@/components/rectify/advanced-signals/types';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
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
    planetaryInfo: Record<string, string>;
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

type ConnectionStatus = 'idle' | 'connecting' | 'streaming' | 'polling' | 'rate_limited' | 'finished' | 'error';

interface ConnectionState {
    status: ConnectionStatus;
    url: string;
    lastError: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_STEPS: StreamStep[] = [
    { id: 'prana', name: 'Prana Mapping' },
    { id: 'discovery', name: 'Discovery Tournament' },
    { id: 'convergence', name: 'Temporal Convergence' },
    { id: 'audit', name: 'Micro-Audit (D60)' },
    { id: 'seal', name: 'God-Tier Lock' },
];

const POLL_INTERVAL = 5000;      // 5 seconds
const MAX_POLL_INTERVAL = 60000; // 60 seconds
const SSE_TIMEOUT = 10000;       // 10 seconds to establish SSE
const RATE_LIMIT_WAIT = 30000;   // 30 seconds on 429

// Direct backend URL for SSE — bypasses Vercel serverless timeout (10-60s limit)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════════════════════
// INITIAL STATE
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
        allSteps: DEFAULT_STEPS,
        advancedSignals: null,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useStreamProgress(
    sessionId: string | null,
    backendUrl: string = BACKEND_URL,
    getToken?: () => Promise<string | null>
): StreamState & { connectionState: ConnectionState } {

    const [state, setState] = useState<StreamState>(createInitialState);
    const [connectionState, setConnectionState] = useState<ConnectionState>({
        status: 'idle',
        url: '',
        lastError: null,
    });

    // Refs for cleanup
    const mountedRef = useRef(true);
    const eventSourceRef = useRef<EventSource | null>(null);
    const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
    const connectionAttemptedRef = useRef(false);
    const currentSessionRef = useRef<string | null>(null);

    // Cleanup function
    const cleanup = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    };

    // Handle incoming event data
    const handleEvent = (data: Record<string, unknown>) => {
        if (!mountedRef.current) return;

        const type = String(data.type || '');

        setState(prev => {
            switch (type) {
                case 'connected':
                case 'initial_state':
                    return { ...prev, isConnected: true };

                case 'progress':
                    return { ...prev, progress: data.data as StreamProgress };

                case 'ai_thinking': {
                    const thinking = data.data as AIThinking;
                    const newCandidates = new Map(prev.allCandidates);
                    if (thinking?.candidateTime) {
                        newCandidates.set(thinking.candidateTime, thinking);
                    }
                    return {
                        ...prev,
                        aiThinking: thinking,
                        allCandidates: newCandidates,
                        displayedCandidate: thinking?.candidateTime || prev.displayedCandidate,
                    };
                }

                case 'ai_context':
                    return { ...prev, aiContext: data.data as AIContextData };

                case 'candidate_scores':
                    return { ...prev, candidateScores: data.data as CandidateScore[] };

                case 'stage_stats':
                    return { ...prev, stageStats: data.data as StageStat[] };

                case 'advanced_signals':
                    return { ...prev, advancedSignals: data.data as IAdvancedSignals };

                case 'metadata':
                    return { ...prev, metadata: data.data as StreamMetadata };

                case 'complete':
                case 'result':
                    cleanup();
                    setConnectionState(cs => ({ ...cs, status: 'finished' }));
                    return {
                        ...prev,
                        isComplete: true,
                        isConnected: false,
                        result: data.data as StreamResult,
                    };

                case 'error':
                    cleanup();
                    setConnectionState(cs => ({
                        ...cs,
                        status: 'error',
                        lastError: String(data.message || 'Unknown error'),
                    }));
                    return {
                        ...prev,
                        error: String(data.message || 'Unknown error'),
                        isConnected: false,
                    };

                default:
                    return prev;
            }
        });
    };

    // Single polling function
    const poll = async (sid: string, interval: number = POLL_INTERVAL) => {
        if (!mountedRef.current || currentSessionRef.current !== sid) return;

        try {
            const token = getToken ? await getToken() : null;
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/queue/progress?sessionId=${sid}`, {
                headers,
                cache: 'no-store',
            });

            if (!mountedRef.current || currentSessionRef.current !== sid) return;

            // Handle 404 - session not in queue (maybe completed or never started)
            if (res.status === 404) {
                logger.warn('Session not found in queue (404)');
                setConnectionState({ status: 'error', url: '', lastError: 'Session not found - analysis may have already completed' });
                setState(prev => ({ ...prev, error: 'Session not found. Start a new analysis.', isConnected: false }));
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

                handleEvent({
                    type: isComplete ? 'complete' : 'progress',
                    data: result.data || result,
                });

                if (result.metadata) {
                    handleEvent({ type: 'metadata', data: result.metadata });
                }

                // Stop if complete or failed
                if (isComplete || isFailed) return;
            }

            // Schedule next poll
            pollTimerRef.current = setTimeout(() => poll(sid, interval), interval);

        } catch (error) {
            logger.warn('Polling failed', { error });

            // Retry with backoff
            const nextInterval = Math.min(interval * 1.5, MAX_POLL_INTERVAL);
            pollTimerRef.current = setTimeout(() => poll(sid, nextInterval), nextInterval);
        }
    };

    // Connect — SSE directly to backend (bypasses Vercel serverless timeout)
    const connect = async (sid: string) => {
        if (!mountedRef.current) return;

        cleanup();
        connectionAttemptedRef.current = true;
        currentSessionRef.current = sid;

        setConnectionState({ status: 'connecting', url: '', lastError: null });

        try {
            const token = getToken ? await getToken() : null;
            const query = token ? `?token=${encodeURIComponent(token)}` : '';

            // Direct connection to backend — no Vercel proxy, no timeout limit
            const sseBaseUrl = backendUrl || BACKEND_URL;
            const url = sseBaseUrl
                ? `${sseBaseUrl}/api/stream/${sid}${query}`
                : `/api/stream/${sid}${query}`; // Local dev fallback

            logger.info('Opening direct SSE connection', { url: url.replace(/token=[^&]+/, 'token=***') });

            const eventSource = new EventSource(url);
            eventSourceRef.current = eventSource;

            let sseConnected = false;

            // Timeout — if SSE doesn't connect in 10s, fall back to polling
            const timeout = setTimeout(() => {
                if (!sseConnected && mountedRef.current && currentSessionRef.current === sid) {
                    logger.info('SSE timeout, falling back to polling');
                    eventSource.close();
                    eventSourceRef.current = null;
                    setConnectionState({ status: 'polling', url: '', lastError: 'SSE timeout' });
                    poll(sid);
                }
            }, SSE_TIMEOUT);

            eventSource.onopen = () => {
                if (!mountedRef.current) return;
                sseConnected = true;
                clearTimeout(timeout);
                logger.info('SSE connected (direct to backend)');
                setState(prev => ({ ...prev, isConnected: true }));
                setConnectionState({ status: 'streaming', url, lastError: null });
            };

            eventSource.onmessage = (event) => {
                if (!mountedRef.current) return;
                try {
                    const data = JSON.parse(event.data);
                    handleEvent(data);
                } catch (e) {
                    logger.warn('Failed to parse SSE message');
                }
            };

            eventSource.onerror = () => {
                if (!mountedRef.current || currentSessionRef.current !== sid) return;
                clearTimeout(timeout);

                // Close SSE and fall back to polling (via Vercel proxy — quick requests, no timeout issue)
                if (eventSourceRef.current) {
                    logger.warn('SSE error, falling back to polling');
                    eventSource.close();
                    eventSourceRef.current = null;
                    setConnectionState({ status: 'polling', url: '', lastError: 'SSE error' });
                    pollTimerRef.current = setTimeout(() => poll(sid), 2000);
                }
            };

        } catch (error) {
            logger.error('Connection failed', { error });
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
            setState(createInitialState());
            setConnectionState({ status: 'idle', url: '', lastError: null });
            return;
        }

        // Connect after a small delay to debounce
        const timer = setTimeout(() => {
            if (mountedRef.current && !connectionAttemptedRef.current) {
                connect(sessionId);
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            mountedRef.current = false;
            currentSessionRef.current = null;
            cleanup();
        };
    }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

    return useMemo(() => ({
        ...state,
        connectionState,
    }), [state, connectionState]);
}

export default useStreamProgress;
