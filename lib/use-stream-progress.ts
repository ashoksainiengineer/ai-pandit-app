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
import { env } from './config';
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

// Data coming from SSE 'ai_thinking' event
interface AIThinkingEventData {
    chunk: string;
    stage: number;
    candidateTime?: string;
}

// Data coming from polling progress endpoint
interface PollingProgressData {
    currentStep: number;
    totalSteps: number;
    percentage: number;
    liveMessage?: string;
    message?: string;
    steps?: Array<{
        id: string;
        name: string;
        details?: string[];
    }>;
    candidateScores?: CandidateScore[];
    startedAt?: string;
    estimatedTimeRemaining?: number;
}

export interface AIContextData {
    stage: number;
    candidateTime: string;
    planetaryInfo?: Record<string, string>;
    dasha?: string;
    divCharts?: string;
    candidatesInBatch?: number | Array<{
        time: string;
        ascendant?: string;
        moon?: string;
    }>;
    lifeEventsCount?: number;
    hasForensicTraits?: boolean;
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

export interface AnalysisDecision {
    stage: number;
    time: string;
    verdict: 'promoted' | 'rejected';
    score: number;
    reason: string;
    batch?: number;
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
    errorMessage?: string;
    lifeEvents?: unknown[];
    physicalTraits?: unknown;
    offsetConfig?: { preset: string; minutes?: number };
    aiModel?: string; // Added dynamic AI model name
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
    aiThinking: Record<string, AIThinking>; // Changed to record for multi-stream
    aiContext: AIContextData | null;
    candidateScores: CandidateScore[];
    stageStats: StageStat[];
    result: StreamResult | null;
    metadata?: StreamMetadata;
    allCandidates: Map<string, AIThinking>;
    displayedCandidate: string | null;
    persistentCandidates: any[]; // Bulletproof accumulator for parallel batches
    stageHistory: Map<number, string>;
    analyzedCount: number;
    totalCandidates: number;
    startedAt?: string;
    estimatedTimeRemaining?: number;
    allSteps: StreamStep[];
    advancedSignals: IAdvancedSignals | null;
    decisions: AnalysisDecision[];
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
    { id: 'init', name: 'Initializing Engine' },
    { id: 'grid', name: 'Stage 1: Grid Generation' },
    { id: 'coarse', name: 'Stage 2: Batch Tournament' },
    { id: 'fine', name: 'Stage 3: Refinement Grid' },
    { id: 'deep', name: 'Stage 4: Deep Analysis' },
    { id: 'micro', name: 'Stage 5: Micro Precision' },
    { id: 'final', name: 'Final Verdict' },
];

const POLL_INTERVAL = 5000;      // 5 seconds
const MAX_POLL_INTERVAL = 60000; // 60 seconds
const SSE_TIMEOUT = 10000;       // 10 seconds to establish SSE
const RATE_LIMIT_WAIT = 30000;   // 30 seconds on 429

// Direct backend URL for SSE and Polling — bypasses Vercel serverless timeout
const BACKEND_URL = env.api.backendUrl.replace(/\/$/, '');

// ═══════════════════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════════════

function createInitialState(): StreamState {
    return {
        isConnected: false,
        isComplete: false,
        error: null,
        progress: null,
        aiThinking: {},
        aiContext: null,
        candidateScores: [],
        stageStats: [],
        result: null,
        metadata: undefined,
        allCandidates: new Map(),
        displayedCandidate: null,
        persistentCandidates: [],
        stageHistory: new Map(),
        analyzedCount: 0,
        totalCandidates: 0,
        startedAt: undefined,
        estimatedTimeRemaining: undefined,
        allSteps: DEFAULT_STEPS,
        advancedSignals: null,
        decisions: [],
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
                case 'initial_state': {
                    const progressData = data.progress as PollingProgressData;
                    return {
                        ...prev,
                        isConnected: true,
                        progress: progressData ? {
                            step: progressData.steps?.[progressData.currentStep || 0]?.id || 'unknown',
                            stepIndex: progressData.currentStep || 0,
                            totalSteps: progressData.totalSteps || 7,
                            percentage: progressData.percentage || 0,
                            message: progressData.message || progressData.liveMessage || '',
                            details: progressData.steps?.[progressData.currentStep || 0]?.details || []
                        } : prev.progress,
                        candidateScores: progressData?.candidateScores || prev.candidateScores,
                        startedAt: progressData?.startedAt || prev.startedAt,
                        estimatedTimeRemaining: progressData?.estimatedTimeRemaining || prev.estimatedTimeRemaining
                    };
                }

                case 'connected':
                    return { ...prev, isConnected: true };

                case 'progress': {
                    const progressData = (data.data as PollingProgressData) || (data as unknown as PollingProgressData);
                    return {
                        ...prev,
                        progress: {
                            step: progressData.steps?.[progressData.currentStep || 0]?.id || 'unknown',
                            stepIndex: progressData.currentStep || 0,
                            totalSteps: progressData.totalSteps || 7,
                            percentage: progressData.percentage || 0,
                            message: progressData.message || progressData.liveMessage || '',
                            details: progressData.steps?.[progressData.currentStep || 0]?.details || []
                        }
                    };
                }

                case 'ai_thinking': {
                    const thinkingEvent = (data.data as AIThinkingEventData) || (data as unknown as AIThinkingEventData);
                    const chunk = thinkingEvent?.chunk || '';
                    const stage = thinkingEvent?.stage || 1;
                    const candidateTime = thinkingEvent?.candidateTime || 'general';

                    const existing = prev.aiThinking[candidateTime] || {
                        stage,
                        candidateTime,
                        chunks: [],
                        fullText: ''
                    };

                    const updatedThinking: AIThinking = {
                        ...existing,
                        stage,
                        fullText: existing.fullText + chunk,
                        chunks: [...existing.chunks, chunk]
                    };

                    return {
                        ...prev,
                        aiThinking: {
                            ...prev.aiThinking,
                            [candidateTime]: updatedThinking
                        },
                        displayedCandidate: candidateTime,
                    };
                }

                case 'ai_context': {
                    const context = (data.data as AIContextData) || (data as unknown as AIContextData);
                    let updatedPersistent = prev.persistentCandidates;

                    if (context?.candidatesInBatch && Array.isArray(context.candidatesInBatch)) {
                        const incoming = context.candidatesInBatch as Array<{ time: string; ascendant?: string; moon?: string }>;
                        const now = Date.now();
                        const newMap = new Map<string, any>();
                        // Add old ones
                        prev.persistentCandidates.forEach(c => newMap.set(c.time, c));
                        // Add/overwrite incoming
                        incoming.forEach(c => newMap.set(c.time, { ...c, lastUpdated: now }));
                        // Sort by lastUpdated desc
                        updatedPersistent = Array.from(newMap.values()).sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
                    }

                    return { ...prev, aiContext: context, persistentCandidates: updatedPersistent };
                }

                case 'candidate_score':
                case 'candidate_score_v2': {
                    const score = (data.data as CandidateScore) || (data as unknown as CandidateScore);
                    if (!score || !score.time) return prev;

                    // Ensure we don't add duplicates for the same time and stage
                    const exists = prev.candidateScores.some(s => s.time === score.time && s.stage === score.stage);
                    if (exists) return prev;

                    return {
                        ...prev,
                        candidateScores: [...prev.candidateScores, score]
                    };
                }

                case 'candidate_scores': {
                    const scores = (data.data as CandidateScore[]) || (data as unknown as CandidateScore[]);
                    return { ...prev, candidateScores: scores };
                }

                case 'decision': {
                    const decision = (data.data as AnalysisDecision) || (data as unknown as AnalysisDecision);
                    if (!decision || !decision.time) return prev;

                    // Deduplicate and keep most recent
                    const filtered = prev.decisions.filter(d => !(d.time === decision.time && d.stage === decision.stage));
                    return {
                        ...prev,
                        decisions: [...filtered, decision]
                    };
                }

                case 'estimated_time': {
                    const d = (data.data as any) || data;
                    return { ...prev, estimatedTimeRemaining: d?.seconds || 0 };
                }

                case 'stage_stats': {
                    const payload = (data.data as any) || data;
                    let newStats: StageStat[] = [];

                    if (Array.isArray(payload)) {
                        newStats = payload as StageStat[];
                    } else if (payload && typeof payload === 'object') {
                        // Single stat update
                        const stat = payload as StageStat;
                        const exists = prev.stageStats.some(s => s.stage === stat.stage);
                        if (exists) {
                            newStats = prev.stageStats.map(s => s.stage === stat.stage ? stat : s);
                        } else {
                            newStats = [...prev.stageStats, stat];
                        }
                    } else {
                        newStats = prev.stageStats;
                    }
                    return { ...prev, stageStats: newStats };
                }

                case 'advanced_signals': {
                    const signals = (data.data as IAdvancedSignals) || (data as unknown as IAdvancedSignals);
                    return { ...prev, advancedSignals: signals };
                }

                case 'metadata': {
                    const metadata = (data.data as StreamMetadata) || (data as unknown as StreamMetadata);
                    return { ...prev, metadata: metadata };
                }

                case 'complete':
                case 'result': {
                    const resData = (data.data as StreamResult) || (data as unknown as StreamResult);
                    cleanup();
                    setConnectionState(cs => ({ ...cs, status: 'finished' }));
                    return {
                        ...prev,
                        isComplete: true,
                        isConnected: false,
                        result: resData,
                    };
                }

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

            const sseBaseUrl = backendUrl || BACKEND_URL;
            if (!sseBaseUrl) {
                throw new Error('Backend URL not configured');
            }
            const pollUrl = `${sseBaseUrl}/api/queue/progress?sessionId=${sid}`;

            const res = await fetch(pollUrl, {
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
            if (!sseBaseUrl) {
                throw new Error('Backend URL not configured');
            }
            const url = `${sseBaseUrl}/api/stream/${sid}${query}`;

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
