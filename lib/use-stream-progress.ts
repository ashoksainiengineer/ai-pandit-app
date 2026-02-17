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
import { getTokenWithRetry } from './auth-utils';
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
    calculationLogs?: any[]; // For LiveCalculationPanel
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
    planetaryInfo?: { sun: string; moon: string; ascendant: string };
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
    offsetConfig?: { preset: string; customMinutes?: number; minutes?: number };
    aiModel?: string; // Added dynamic AI model name
    updatedAt?: string; // 🛡️ Added for robust timer fallback
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
    const sseSourceRef = useRef<EventSource | null>(null);
    const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
    const connectionAttemptedRef = useRef<boolean>(false);
    const streamCleanupRef = useRef<boolean>(false);
    const currentSessionRef = useRef<string | null>(null);
    const authRetryRef = useRef<boolean>(false);

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
                setState(prev => ({ ...prev, isConnected: true }));
                setConnectionState({ status: 'streaming', url, lastError: null });
            };

            sse.onmessage = (event) => {
                if (!mountedRef.current || currentSessionRef.current !== sid) return;
                try {
                    const data = JSON.parse(event.data);
                    handleEvent(data);
                } catch (e) {
                    logger.warn('Failed to parse SSE message');
                }
            };

            // Listen for named 'error' events (custom backend events)
            sse.addEventListener('error', (event: any) => {
                if (!mountedRef.current || currentSessionRef.current !== sid) return;
                try {
                    const errorData = JSON.parse(event.data);
                    console.error('🔥 [SSE] Received named error event:', errorData);

                    if (errorData.code === 'AUTH_FAILED' && !authRetryRef.current) {
                        console.warn('🔄 [SSE] Authentication failed. Attempting one-time token refresh...');
                        authRetryRef.current = true;
                        cleanup();
                        // Small delay before reconnecting with fresh token
                        setTimeout(() => connect(sid, { skipCache: true }), 500);
                        return;
                    }

                    // Terminal error
                    cleanup();
                    setState(prev => ({
                        ...prev,
                        error: errorData.error || 'Authentication failed',
                        isConnected: false
                    }));
                    setConnectionState({
                        status: 'error',
                        url: '',
                        lastError: errorData.error || 'Authentication failed'
                    });
                } catch (e) {
                    logger.warn('Failed to parse SSE error event data');
                }
            });

            sse.onerror = (err) => {
                console.error('❌ [SSE] Connection generic ERROR occurred', err);
                if (!mountedRef.current || currentSessionRef.current !== sid) return;

                if (sseConnected) {
                    console.warn('⚠️ [SSE] Lost connection, browser will handle auto-retry...');
                } else {
                    // Only switch to polling if it's NOT a terminal named error (caught above)
                    // and we haven't already started a retry/cleanup.
                    setTimeout(() => {
                        if (mountedRef.current && currentSessionRef.current === sid && !sseSourceRef.current && connectionState.status !== 'error') {
                            console.error('🔥 [SSE] Initial connection failed. Switching to polling...');
                            cleanup();
                            setConnectionState({ status: 'polling', url: '', lastError: 'Initial SSE connection failed' });
                            poll(sid);
                        }
                    }, 100);
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
    // 🛡️ PROACTIVE TOKEN REFRESH (God-Tier Fix)
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

    return useMemo(() => ({
        ...state,
        connectionState,
    }), [state, connectionState]);
}

export default useStreamProgress;
