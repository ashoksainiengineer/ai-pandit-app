'use client';

// lib/use-stream-progress-fixed.ts
// Production-grade SSE progress hook with race condition protection,
// memory leak prevention, and secure logging

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { logger, streamLogger } from './secure-logger';

// ═════════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════════

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

export interface PlanetaryInfo {
    sun: string;
    moon: string;
    ascendant: string;
}

export interface AIContextData {
    stage: number;
    candidateTime: string;
    planetaryInfo: PlanetaryInfo;
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
    minifiedEph?: {
        sun: string;
        moon: string;
        ascendant: string;
    };
}

export interface StageStat {
    stage: number;
    candidateCount: number;
    description: string;
}

export interface CalculationLog {
    logId: string;
    candidateTime: string;
    sunPos: string;
    moonPos: string;
    ascendant: string;
    dashaObj?: string;
    timestamp: number;
    message: string;
    log: string;
    level: 1 | 2 | 3;
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
    offsetConfig?: {
        preset: string;
        minutes?: number;
    };
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
    calculationLogs: CalculationLog[];
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
}

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

const POLLING_BASE_DELAY = 2000;
const POLLING_MAX_DELAY = 30000;
const SSE_CONNECTION_TIMEOUT = 8000;
const HEARTBEAT_INTERVAL = 30000;
const HEARTBEAT_STALE_THRESHOLD = 60000;
const ROTATION_INTERVAL = 5000;

// ═════════════════════════════════════════════════════════════════════════════
// HOOK
// ═════════════════════════════════════════════════════════════════════════════

export function useStreamProgress(
    sessionId: string | null,
    backendUrl: string = '',
    getToken?: () => Promise<string | null>
): StreamState & { connectionState: { url: string; readyState: number; lastError: string | null; usingFallback: boolean } } {

    // ═════════════════════════════════════════════════════════════════════════
    // STATE
    // ═════════════════════════════════════════════════════════════════════════

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
        url: '',
        readyState: 0,
        lastError: null as string | null,
        usingFallback: false,
    });

    // ═════════════════════════════════════════════════════════════════════════
    // REFS (For values that need to be accessed without triggering re-renders)
    // ═════════════════════════════════════════════════════════════════════════

    const eventSourceRef = useRef<EventSource | null>(null);
    const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);
    const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const activityCheckRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());
    const isMountedRef = useRef<boolean>(true);
    const abortControllerRef = useRef<AbortController | null>(null);
    const stateRef = useRef<StreamState>(state);
    const pollingErrorCountRef = useRef<number>(0);
    const isPollingRef = useRef<boolean>(false);

    // Keep stateRef in sync
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // ═════════════════════════════════════════════════════════════════════════
    // CLEANUP HELPER
    // ═════════════════════════════════════════════════════════════════════════

    const cleanup = useCallback(() => {
        streamLogger.debug('Cleaning up stream resources');

        // Abort any in-flight requests
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // Close EventSource
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        // Clear all timers
        if (rotationTimerRef.current) {
            clearInterval(rotationTimerRef.current);
            rotationTimerRef.current = null;
        }

        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
        }

        if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
        }

        if (activityCheckRef.current) {
            clearInterval(activityCheckRef.current);
            activityCheckRef.current = null;
        }

        isPollingRef.current = false;
        pollingErrorCountRef.current = 0;
    }, []);

    // ═════════════════════════════════════════════════════════════════════════
    // FETCH SESSION METADATA
    // ═════════════════════════════════════════════════════════════════════════

    const fetchSessionData = useCallback(async (sid: string) => {
        if (!isMountedRef.current) return;

        try {
            const token = getToken ? await getToken() : null;
            const headers: HeadersInit = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/sessions/${sid}`, { headers });

            if (!isMountedRef.current) return;

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    const s = data.data;
                    setState(prev => ({
                        ...prev,
                        metadata: {
                            fullName: s.birthData?.fullName,
                            dateOfBirth: s.birthData?.dateOfBirth,
                            tentativeTime: s.birthData?.tentativeTime,
                            birthPlace: s.birthData?.birthPlace,
                            timezone: s.birthData?.timezone,
                            status: s.status,
                            lifeEvents: s.lifeEvents,
                            physicalTraits: s.physicalTraits,
                            offsetConfig: s.offsetConfig,
                        },
                    }));
                }
            }
        } catch (e) {
            streamLogger.warn('Failed to load session metadata', { error: String(e) });
        }
    }, [getToken]);

    // ═════════════════════════════════════════════════════════════════════════
    // POLLING FETCH
    // ═════════════════════════════════════════════════════════════════════════

    const fetchProgress = useCallback(async (sid: string, baseUrl: string = ''): Promise<boolean> => {
        if (!isMountedRef.current) return false;

        // Prevent concurrent fetches
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            const url = `${baseUrl}/api/queue/progress?sessionId=${encodeURIComponent(sid)}`;
            const token = getToken ? await getToken() : null;
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(url, {
                headers,
                signal: abortControllerRef.current.signal,
            });

            if (!isMountedRef.current) return false;

            if (!res.ok) {
                if (res.status === 404) throw new Error('Session not found');
                throw new Error(`Polling failed: ${res.status}`);
            }

            const data = await res.json();

            if (!isMountedRef.current) return false;

            const progressData = data.progress;
            let displayMessage = progressData?.liveMessage || '';

            if (data.status === 'queued' && data.position > 0) {
                const waitTime = data.estimatedWaitSeconds
                    ? Math.ceil(data.estimatedWaitSeconds / 60)
                    : 1;
                displayMessage = `Waiting in queue (Position: ${data.position}, Est. wait: ${waitTime} min)`;
            }

            if (data.status === 'complete' || data.status === 'failed') {
                return false; // Stop polling
            }

            // Update state with functional update to avoid stale closures
            setState(prev => {
                const newState: StreamState = {
                    ...prev,
                    isConnected: true,
                    progress: progressData ? {
                        step: progressData.steps?.[progressData.currentStep]?.id || '',
                        stepIndex: progressData.currentStep || 0,
                        totalSteps: progressData.totalSteps || 5,
                        percentage: progressData.percentage || 0,
                        message: displayMessage,
                        details: progressData.steps?.[progressData.currentStep]?.details,
                    } : prev.progress,
                    candidateScores: progressData?.candidateScores || prev.candidateScores,
                    analyzedCount: (progressData?.candidateScores || []).length,
                    aiThinking: progressData?.lastAIThinking || prev.aiThinking,
                    metadata: data.metadata || prev.metadata,
                    startedAt: progressData?.startedAt || prev.startedAt,
                    allSteps: progressData?.steps || prev.allSteps,
                };

                // Update allCandidates map
                if (progressData?.lastAIThinking) {
                    const thinking = progressData.lastAIThinking;
                    const candidateTime = thinking.candidateTime || 'unknown';
                    const updatedMap = new Map(prev.allCandidates);
                    updatedMap.set(candidateTime, thinking);
                    newState.allCandidates = updatedMap;

                    if (!newState.displayedCandidate) {
                        newState.displayedCandidate = candidateTime;
                    }
                }

                // Update stage history
                if (progressData?.stageHistory) {
                    const historyMap = new Map<number, string>();
                    Object.entries(progressData.stageHistory).forEach(([stage, text]) => {
                        historyMap.set(parseInt(stage, 10), String(text));
                    });
                    newState.stageHistory = historyMap;
                }

                return newState;
            });

            if (data.status === 'complete' && data.data?.analysisResult) {
                setState(prev => ({
                    ...prev,
                    isComplete: true,
                    result: data.data,
                }));
                return false;
            }

            return true; // Continue polling

        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                return false; // Aborted, don't continue
            }

            const errorMessage = err instanceof Error ? err.message : String(err);
            const is404 = errorMessage.includes('404') || errorMessage.includes('Session not found');

            if (is404 && isMountedRef.current) {
                setState(prev => ({
                    ...prev,
                    error: 'Session expired. Please start a new analysis.',
                    isConnected: false,
                    isComplete: true,
                }));
                return false;
            }

            throw err; // Re-throw for retry logic
        }
    }, [getToken]);

    // ═════════════════════════════════════════════════════════════════════════
    // POLLING LOOP
    // ═════════════════════════════════════════════════════════════════════════

    const pollLoop = useCallback((sid: string, baseUrl: string) => {
        if (isPollingRef.current) return; // Prevent concurrent loops

        isPollingRef.current = true;
        pollingErrorCountRef.current = 0;

        const executePoll = async () => {
            // Use ref to check current state instead of closure
            const currentState = stateRef.current;

            if (!isMountedRef.current || currentState.isComplete || currentState.error?.includes('Session expired')) {
                isPollingRef.current = false;
                return;
            }

            try {
                const proceed = await fetchProgress(sid, baseUrl);

                if (!isMountedRef.current) return;

                if (proceed) {
                    pollingErrorCountRef.current = 0;
                    pollingTimeoutRef.current = setTimeout(executePoll, POLLING_BASE_DELAY);
                } else {
                    isPollingRef.current = false;
                }
            } catch (err) {
                if (!isMountedRef.current) return;

                pollingErrorCountRef.current++;
                const delay = Math.min(
                    POLLING_BASE_DELAY * Math.pow(1.5, pollingErrorCountRef.current),
                    POLLING_MAX_DELAY
                );

                streamLogger.warn('Polling error, will retry', {
                    errorCount: pollingErrorCountRef.current,
                    nextDelay: delay,
                });

                pollingTimeoutRef.current = setTimeout(executePoll, delay);
            }
        };

        executePoll();
    }, [fetchProgress]);

    // ═════════════════════════════════════════════════════════════════════════
    // EVENT HANDLER
    // ═════════════════════════════════════════════════════════════════════════

    const handleEvent = useCallback((eventData: Record<string, unknown>) => {
        if (!isMountedRef.current) return;

        const eventType = String(eventData.type);

        switch (eventType) {
            case 'connected':
                setState(prev => ({ ...prev, isConnected: true }));
                setConnectionState(prev => ({ ...prev, readyState: 1 }));
                break;

            case 'progress':
                setState(prev => ({
                    ...prev,
                    aiThinking: prev.progress?.step !== eventData.step ? null : prev.aiThinking,
                    progress: {
                        step: String(eventData.step || ''),
                        stepIndex: Number(eventData.stepIndex) || 0,
                        totalSteps: Number(eventData.totalSteps) || 5,
                        percentage: Number(eventData.percentage) || 0,
                        message: String(eventData.message || ''),
                        details: Array.isArray(eventData.details) ? eventData.details : undefined,
                    },
                    startedAt: String(eventData.startedAt || prev.startedAt || ''),
                }));
                break;

            case 'ai_context':
                setState(prev => ({
                    ...prev,
                    aiContext: eventData as unknown as AIContextData,
                    displayedCandidate: String(eventData.candidateTime || prev.displayedCandidate || ''),
                }));
                break;

            case 'ai_thinking': {
                const candidateTime = String(eventData.candidateTime || 'unknown');
                const chunk = String(eventData.chunk || '');
                const stage = Number(eventData.stage) || 0;

                setState(prev => {
                    const firstExisting = prev.allCandidates.values().next().value as AIThinking | undefined;
                    const isNewStage = firstExisting && firstExisting.stage !== stage;

                    const updatedCandidates = isNewStage
                        ? new Map<string, AIThinking>()
                        : new Map(prev.allCandidates);

                    const existing = updatedCandidates.get(candidateTime);
                    updatedCandidates.set(candidateTime, {
                        stage,
                        candidateTime,
                        chunks: [...(existing?.chunks || []), chunk],
                        fullText: (existing?.fullText || '') + chunk,
                    });

                    const displayed = (!prev.displayedCandidate || !updatedCandidates.has(prev.displayedCandidate))
                        ? candidateTime
                        : prev.displayedCandidate;

                    const newStageHistory = new Map(prev.stageHistory);
                    if (candidateTime === displayed) {
                        const currentStageText = newStageHistory.get(stage) || '';
                        newStageHistory.set(stage, currentStageText + chunk);
                    }

                    return {
                        ...prev,
                        allCandidates: updatedCandidates,
                        displayedCandidate: displayed,
                        stageHistory: newStageHistory,
                        aiThinking: updatedCandidates.get(displayed) || prev.aiThinking,
                    };
                });
                break;
            }

            case 'candidate_score':
            case 'candidate_score_v2': {
                const time = String(eventData.time || '');
                const score = Number(eventData.score) || 0;
                const stage = Number(eventData.stage) || 0;

                setState(prev => {
                    const newScores = [
                        ...prev.candidateScores.filter(c => c.time !== time),
                        {
                            time,
                            score,
                            stage,
                            rank: Number(eventData.rank) || undefined,
                            offsetMinutes: Number(eventData.offsetMinutes) || undefined,
                            minifiedEph: eventData.minifiedEph as { sun: string; moon: string; ascendant: string } | undefined,
                        },
                    ];

                    const updatedCandidates = new Map(prev.allCandidates);
                    updatedCandidates.delete(time);

                    return {
                        ...prev,
                        candidateScores: newScores,
                        allCandidates: updatedCandidates,
                        analyzedCount: newScores.filter(s => s.stage === stage).length,
                    };
                });
                break;
            }

            case 'calculation_log': {
                const logId = String(eventData.logId || '');

                setState(prev => {
                    if (logId && prev.calculationLogs.some(log => log.logId === logId)) {
                        return prev; // Deduplicate
                    }

                    return {
                        ...prev,
                        calculationLogs: [
                            ...prev.calculationLogs,
                            {
                                logId,
                                candidateTime: String(eventData.candidateTime || ''),
                                sunPos: String(eventData.sunPos || ''),
                                moonPos: String(eventData.moonPos || ''),
                                ascendant: String(eventData.ascendant || ''),
                                dashaObj: String(eventData.dashaObj || ''),
                                timestamp: Date.now(),
                                message: `Log for ${eventData.candidateTime || 'unknown'}`,
                                log: `Processed ${eventData.candidateTime || 'unknown'}`,
                                level: (Number(eventData.level) || 1) as 1 | 2 | 3,
                            },
                        ],
                    };
                });
                break;
            }

            case 'stage_stats': {
                const stageNum = Number(eventData.stage);
                setState(prev => {
                    if (prev.stageStats.some(s => s.stage === stageNum)) return prev;

                    return {
                        ...prev,
                        stageStats: [...prev.stageStats, {
                            stage: stageNum,
                            candidateCount: Number(eventData.candidateCount) || 0,
                            description: String(eventData.description || ''),
                        }].sort((a, b) => a.stage - b.stage),
                    };
                });
                break;
            }

            case 'complete':
                streamLogger.info('Stream completed', {
                    rectifiedTime: eventData.rectifiedTime,
                    accuracy: eventData.accuracy,
                });
                setState(prev => ({
                    ...prev,
                    isConnected: false,
                    isComplete: true,
                    result: {
                        rectifiedTime: String(eventData.rectifiedTime || ''),
                        accuracy: Number(eventData.accuracy) || 0,
                        confidence: String(eventData.confidence || ''),
                    },
                }));
                break;

            case 'error':
                setState(prev => ({
                    ...prev,
                    error: String(eventData.message || 'Unknown error'),
                }));
                break;

            case 'initial_state': {
                const progress = eventData.progress as Record<string, unknown> | undefined;
                if (progress) {
                    setState(prev => ({
                        ...prev,
                        progress: {
                            step: String(progress.steps?.[(progress.currentStep as number) || 0]?.id || ''),
                            stepIndex: (progress.currentStep as number) || 0,
                            totalSteps: (progress.totalSteps as number) || 5,
                            percentage: (progress.percentage as number) || 0,
                            message: String(progress.liveMessage || ''),
                        },
                        candidateScores: (progress.candidateScores as CandidateScore[]) || [],
                        analyzedCount: ((progress.candidateScores as CandidateScore[]) || []).length,
                        stageHistory: progress.stageHistory
                            ? new Map(Object.entries(progress.stageHistory as Record<string, string>)
                                .map(([k, v]) => [parseInt(k, 10), v]))
                            : prev.stageHistory,
                        startedAt: String(progress.startedAt || prev.startedAt || ''),
                        estimatedTimeRemaining: (progress.estimatedTimeRemaining as number) || prev.estimatedTimeRemaining,
                        allSteps: (progress.steps as StreamStep[]) || prev.allSteps,
                    }));
                }
                break;
            }

            case 'estimated_time':
                setState(prev => ({
                    ...prev,
                    estimatedTimeRemaining: Number(eventData.seconds) || 0,
                }));
                break;

            default:
                // Unknown event type - log at debug level only
                streamLogger.debug('Unknown event type', { type: eventType });
        }
    }, []);

    // ═════════════════════════════════════════════════════════════════════════
    // MAIN EFFECT: Connection Management
    // ═════════════════════════════════════════════════════════════════════════

    useEffect(() => {
        if (!sessionId) return;

        isMountedRef.current = true;

        // Initial session data fetch
        fetchSessionData(sessionId);

        // Initial polling fetch (dual-path)
        const initialFetch = fetchProgress(sessionId, backendUrl).catch(() => {
            // Silent fail - SSE will handle it
        });

        // Setup SSE connection
        const initSSE = async () => {
            try {
                const token = getToken ? await getToken() : null;
                const queryToken = token ? `?token=${encodeURIComponent(token)}` : '';
                const effectiveUrl = backendUrl || '';
                const url = `${effectiveUrl}/api/stream/${sessionId}${queryToken}`;

                setConnectionState(prev => ({ ...prev, url, readyState: 0, lastError: null }));

                const eventSource = new EventSource(url);
                eventSourceRef.current = eventSource;

                // Connection timeout fallback
                connectionTimeoutRef.current = setTimeout(() => {
                    if (eventSource.readyState !== EventSource.OPEN) {
                        streamLogger.warn('SSE connection timeout, switching to polling');
                        eventSource.close();
                        setConnectionState(prev => ({ ...prev, usingFallback: true, readyState: 3 }));
                        pollLoop(sessionId, backendUrl);
                    }
                }, SSE_CONNECTION_TIMEOUT);

                // Heartbeat monitor
                activityCheckRef.current = setInterval(() => {
                    const currentState = stateRef.current;

                    if (currentState.isComplete) {
                        if (activityCheckRef.current) {
                            clearInterval(activityCheckRef.current);
                            activityCheckRef.current = null;
                        }
                        return;
                    }

                    if (Date.now() - lastActivityRef.current > HEARTBEAT_STALE_THRESHOLD &&
                        eventSource.readyState === EventSource.OPEN) {
                        streamLogger.warn('Connection stale, refreshing');
                        eventSource.close();
                        pollLoop(sessionId, backendUrl);
                    }
                }, HEARTBEAT_INTERVAL);

                eventSource.onmessage = (event) => {
                    lastActivityRef.current = Date.now();
                    try {
                        const data = JSON.parse(event.data);
                        handleEvent(data);
                    } catch {
                        streamLogger.warn('Failed to parse SSE event');
                    }
                };

                eventSource.onerror = (err) => {
                    streamLogger.error('SSE stream error', err);
                    // Check if auth error
                    if (eventSource.readyState === EventSource.CLOSED) {
                        eventSource.close();
                        pollLoop(sessionId, backendUrl);
                    }
                };

                eventSource.onopen = () => {
                    streamLogger.info('SSE connection established');
                    if (connectionTimeoutRef.current) {
                        clearTimeout(connectionTimeoutRef.current);
                        connectionTimeoutRef.current = null;
                    }
                    setConnectionState(prev => ({ ...prev, readyState: 1, lastError: null }));
                };

            } catch (err) {
                streamLogger.error('Failed to initialize SSE', err);
                pollLoop(sessionId, backendUrl);
            }
        };

        initSSE();

        // Visibility/online sync handlers
        const handleSync = () => {
            if (document.visibilityState === 'visible') {
                const currentState = stateRef.current;

                if (!currentState.isComplete) {
                    fetchProgress(sessionId, backendUrl);

                    if (eventSourceRef.current?.readyState !== EventSource.OPEN) {
                        cleanup();
                        pollLoop(sessionId, backendUrl);
                    }
                }
            }
        };

        window.addEventListener('online', handleSync);
        document.addEventListener('visibilitychange', handleSync);

        // Cleanup on unmount
        return () => {
            isMountedRef.current = false;
            cleanup();
            window.removeEventListener('online', handleSync);
            document.removeEventListener('visibilitychange', handleSync);
        };
    }, [sessionId, backendUrl, getToken, fetchSessionData, fetchProgress, handleEvent, cleanup, pollLoop]);

    // ═════════════════════════════════════════════════════════════════════════
    // ROTATION EFFECT
    // ═════════════════════════════════════════════════════════════════════════

    useEffect(() => {
        if (state.isComplete) {
            if (rotationTimerRef.current) {
                clearInterval(rotationTimerRef.current);
                rotationTimerRef.current = null;
            }
            return;
        }

        if (rotationTimerRef.current) {
            clearInterval(rotationTimerRef.current);
        }

        rotationTimerRef.current = setInterval(() => {
            const currentState = stateRef.current;

            if (currentState.isComplete) {
                if (rotationTimerRef.current) {
                    clearInterval(rotationTimerRef.current);
                    rotationTimerRef.current = null;
                }
                return;
            }

            const candidates = Array.from(currentState.allCandidates.keys());
            if (candidates.length <= 1) return;

            const currentKey = currentState.displayedCandidate || '';
            const currentIndex = candidates.indexOf(currentKey);
            const nextIndex = (currentIndex + 1) % candidates.length;
            const nextCandidate = candidates[nextIndex];

            setState(prev => ({
                ...prev,
                displayedCandidate: nextCandidate,
                aiThinking: prev.allCandidates.get(nextCandidate) || prev.aiThinking,
            }));
        }, ROTATION_INTERVAL);

        return () => {
            if (rotationTimerRef.current) {
                clearInterval(rotationTimerRef.current);
                rotationTimerRef.current = null;
            }
        };
    }, [state.isComplete]);

    // ═════════════════════════════════════════════════════════════════════════
    // STOP POLLING ON COMPLETION
    // ═════════════════════════════════════════════════════════════════════════

    useEffect(() => {
        if (state.isComplete && isPollingRef.current) {
            streamLogger.debug('Stopping polling due to completion');
            if (pollingTimeoutRef.current) {
                clearTimeout(pollingTimeoutRef.current);
                pollingTimeoutRef.current = null;
            }
            isPollingRef.current = false;
        }
    }, [state.isComplete]);

    // ═════════════════════════════════════════════════════════════════════════
    // RETURN
    // ═════════════════════════════════════════════════════════════════════════

    return useMemo(() => ({
        ...state,
        connectionState,
    }), [state, connectionState]);
}

// ═════════════════════════════════════════════════════════════════════════
// HELPER: Reset AI thinking
// ═════════════════════════════════════════════════════════════════════════

export function resetAIThinking(
    setState: React.Dispatch<React.SetStateAction<StreamState>>
): void {
    setState(prev => ({ ...prev, aiThinking: null }));
}

export default useStreamProgress;
