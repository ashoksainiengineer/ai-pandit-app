'use client';

// lib/use-stream-progress.ts
// Custom hook for consuming SSE progress stream from BTR analysis

import { useState, useEffect, useCallback, useRef } from 'react';

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

export interface AIContextData {
    stage: number;
    candidateTime: string;
    planetaryInfo: {
        sun: string;
        moon: string;
        ascendant: string;
    };
    dasha: string;
    divCharts?: string;
}

export interface CandidateScore {
    time: string;
    score: number;
    stage: number;
    rank?: number;
}

export interface StageStat {
    stage: number;
    candidateCount: number;
    description: string;
}

export interface CalculationLog {
    logId: string; // 🆔 Unique ID for deduplication
    candidateTime: string;
    sunPos: string;
    moonPos: string;
    ascendant: string;
    dashaObj?: string;
    timestamp: number;
}

export interface StreamResult {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
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
    stageStats: StageStat[]; // ⚡ New: Pipeline Tracking
    result: StreamResult | null;
    metadata?: {
        fullName?: string;
        dateOfBirth?: string;
        tentativeTime?: string;
        birthPlace?: string;
        timezone?: string;
        status?: string;
        lifeEvents?: any[];
        physicalTraits?: any;
        offsetConfig?: {
            preset: string;
            minutes?: number;
        };
    };
    // Enhanced UX: Multi-candidate tracking
    allCandidates: Map<string, AIThinking>; // All active candidates' thinking
    displayedCandidate: string | null; // Currently shown candidate time
    stageHistory: Map<number, string>; // History of thinking per stage (Stage ID -> Full Text)
    analyzedCount: number; // For counter: "5/15"
    totalCandidates: number;
    // Enhanced Diagnostics
    url?: string;
    readyState?: number;
    lastError?: string | null;
}

// ═════════════════════════════════════════════════════════════════════════════
// HOOK
// ═════════════════════════════════════════════════════════════════════════════

export function useStreamProgress(
    sessionId: string | null,
    backendUrl: string = '', // Empty = use relative path (proxy at /api/stream)
    getToken?: () => Promise<string | null> // 🔒 AUTH: Passing token provider
): StreamState {
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
        // Enhanced UX
        allCandidates: new Map(),
        displayedCandidate: null,
        stageHistory: new Map(),
        analyzedCount: 0,
        totalCandidates: 0,
    });

    const [connectionState, setConnectionState] = useState<{
        url: string;
        readyState: number; // 0=CONNECTING, 1=OPEN, 2=CLOSED, 3=POLLING
        lastError: string | null;
        usingFallback: boolean;
    }>({
        url: '',
        readyState: 0,
        lastError: null,
        usingFallback: false
    });

    const eventSourceRef = useRef<EventSource | null>(null);
    const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);
    const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Fetch Session Metadata (Birth Data)
    const fetchSessionData = useCallback(async (sid: string) => {
        try {
            console.log('📦 [Stream] Fetching session metadata for', sid);
            const token = getToken ? await getToken() : null;
            const headers: HeadersInit = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/sessions/${sid}`, { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    const s = data.data;
                    setState(prev => ({
                        ...prev,
                        metadata: {
                            fullName: s.birthData.fullName,
                            dateOfBirth: s.birthData.dateOfBirth,
                            tentativeTime: s.birthData.tentativeTime,
                            birthPlace: s.birthData.birthPlace,
                            timezone: s.birthData.timezone,
                            status: s.status,
                            lifeEvents: s.lifeEvents,
                            physicalTraits: s.physicalTraits,
                            offsetConfig: s.offsetConfig
                        }
                    }));
                }
            }
        } catch (e) {
            console.warn('[Metadata] Failed to load session details:', e);
        }
    }, [getToken]);

    // Polling fetch function - Memoized to prevent stale closures
    const fetchProgress = useCallback(async (sid: string, baseUrl: string = ''): Promise<boolean> => {
        try {
            const url = `${baseUrl}/api/queue/progress?sessionId=${sid}`;

            // 🔐 AUTH: Get Token if provider exists
            const token = getToken ? await getToken() : null;
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(url, { headers });

            // Handle 404/500 separately
            if (!res.ok) {
                if (res.status === 404) throw new Error('Session not found');
                throw new Error(`Polling failed: ${res.status}`);
            }

            const data = await res.json();
            const progressData = data.progress;

            let displayMessage = progressData.liveMessage || '';

            // Inject Queue Status into message if queued
            if (data.status === 'queued' && data.position > 0) {
                const waitTime = data.estimatedWaitSeconds ? Math.ceil(data.estimatedWaitSeconds / 60) : 1;
                displayMessage = `Waiting in queue (Position: ${data.position}, Est. wait: ${waitTime} min)`;
            }

            if (data.status === 'complete' || data.status === 'failed') {
                // Stop polling if done
                return false;
            }

            if (progressData.lastAIThinking) {
                // console.log('✅ [Poll] AI Data:', progressData.lastAIThinking.stage);
            }

            // Reuse the 'initial_state' logic to update UI
            setState(prev => {
                const newState = {
                    ...prev,
                    isConnected: true,
                    progress: {
                        step: progressData.steps[progressData.currentStep]?.id || '',
                        stepIndex: progressData.currentStep,
                        totalSteps: progressData.totalSteps,
                        percentage: progressData.percentage,
                        message: displayMessage,
                        details: progressData.steps[progressData.currentStep]?.details,
                    },
                    candidateScores: progressData.candidateScores || [],
                    analyzedCount: (progressData.candidateScores || []).length,
                    // 🧠 Restore Reasoning from Polling
                    aiThinking: progressData.lastAIThinking || prev.aiThinking,
                    // 📋 Capture session metadata for Blueprint display
                    metadata: data.metadata || prev.metadata,
                };

                // 🧠 Hydrate allCandidates Map for UI Display
                if (progressData.lastAIThinking) {
                    const thinking = progressData.lastAIThinking;
                    const candidateTime = thinking.candidateTime || 'unknown';

                    // Update map
                    const stringMap = new Map(prev.allCandidates);
                    stringMap.set(candidateTime, thinking);
                    newState.allCandidates = stringMap;

                    // Ensure something is displayed
                    if (!newState.displayedCandidate) {
                        newState.displayedCandidate = candidateTime;
                    }
                }

                // 🧠 Hydrate stageHistory Map for UI Re-synchronization (God-Tier Re-sync)
                if (progressData.stageHistory) {
                    const historyMap = new Map<number, string>();
                    Object.entries(progressData.stageHistory).forEach(([stage, text]) => {
                        historyMap.set(parseInt(stage), text as string);
                    });
                    newState.stageHistory = historyMap;
                }

                return newState;
            });

            // Handle completion from polling in case we missed the status above
            if (data.status === 'complete' && data.data?.analysisResult) {
                setState(prev => ({
                    ...prev,
                    isComplete: true,
                    result: data.data
                }));
                return false;
            }

            return true; // Continue polling

        } catch (err: any) {
            // Handle 404 (Session not found / Dead session) - Non-retryable
            const is404 = err.message?.includes('404') || err.message?.includes('Session not found');

            if (is404) {
                console.error('Session 404 - Stopping Polling');
                setState(prev => ({
                    ...prev,
                    error: 'Session expired. Please start a new analysis.',
                    isConnected: false,
                    isComplete: true
                }));
                return false; // Stop
            }

            // Network Errors (Retryable) - Throw to trigger Backoff
            throw err;
        }
    }, [getToken]); // Dependency on getToken ensures we use latest auth

    // Polling function with Robust Exponential Backoff
    const startPolling = useCallback((sid: string) => {
        // Prevent concurrent polling loops
        if (pollingIntervalRef.current) return;

        console.log('🔄 [Stream] Switching to Polling Mode for', sid);

        // Determine effective backend URL
        let effectiveUrl = backendUrl;
        if (!effectiveUrl && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            effectiveUrl = 'http://127.0.0.1:8080';
        }

        setConnectionState(prev => ({
            ...prev,
            readyState: 3, // Custom status for Polling
            usingFallback: true,
            url: effectiveUrl || '/api/queue/progress'
        }));

        // Recursive Polling Loop with Exponential Backoff
        let errorCount = 0;
        const maxDelay = 30000; // Cap at 30s
        const baseDelay = 2000; // Start at 2s

        const pollLoop = async () => {
            // Basic stop condition
            if (state.isComplete || state.error?.includes('Session expired')) {
                return;
            }

            try {
                const proceed = await fetchProgress(sid, effectiveUrl);

                if (proceed) {
                    errorCount = 0; // Reset on success
                    // Continue polling
                    pollingIntervalRef.current = setTimeout(pollLoop, baseDelay);
                } else {
                    // Stop polling (complete/failed)
                    pollingIntervalRef.current = null;
                }
            } catch (err: any) {
                errorCount++;
                const delay = Math.min(baseDelay * Math.pow(1.5, errorCount), maxDelay);
                console.warn(`[Poll] Network Error. Retrying in ${delay}ms...`);

                // Retry
                pollingIntervalRef.current = setTimeout(pollLoop, delay);
            }
        };

        // Start loop
        pollLoop();

    }, [backendUrl, state.isComplete, state.error, fetchProgress]); // backendUrl dependency if used in fetchProgress



    // Handle incoming SSE events
    const handleEvent = useCallback((eventData: any) => {
        // console.log('Stream event:', eventData.type); // Comment out to reduce noise
        switch (eventData.type) {
            case 'connected':
                setState(prev => ({ ...prev, isConnected: true }));
                setConnectionState(prev => ({ ...prev, readyState: 1 }));
                break;

            case 'progress':
                setState(prev => ({
                    ...prev,
                    // Clear previous AI thinking when moving to a new step
                    aiThinking: prev.progress?.step !== eventData.step ? null : prev.aiThinking,
                    progress: {
                        step: eventData.step,
                        stepIndex: eventData.stepIndex,
                        totalSteps: eventData.totalSteps,
                        percentage: eventData.percentage,
                        message: eventData.message,
                        details: eventData.details,
                    },
                }));
                break;

            case 'ai_context':
                setState(prev => ({
                    ...prev,
                    aiContext: eventData,
                    displayedCandidate: eventData.candidateTime || prev.displayedCandidate
                }));
                break;

            case 'ai_thinking':
                // 🧩 Diagnostics: Track missing tokens
                if (eventData.chunk) console.log(`🧠 [Stream] Received AI Chunk (${eventData.chunk.length} chars)`);

                setState(prev => {
                    const candidateTime = eventData.candidateTime || 'unknown';

                    // Check if we moved to a new stage (all candidates in map should belong to same stage)
                    const firstExisting = prev.allCandidates.values().next().value;
                    const isNewStage = firstExisting && firstExisting.stage !== eventData.stage;

                    // Store thinking for ALL candidates (for rotation)
                    // If new stage, clear old candidates to focus on current stage
                    const updatedCandidates = isNewStage ? new Map() : new Map(prev.allCandidates);
                    const existing = updatedCandidates.get(candidateTime);

                    updatedCandidates.set(candidateTime, {
                        stage: eventData.stage,
                        candidateTime,
                        chunks: [...(existing?.chunks || []), eventData.chunk],
                        fullText: (existing?.fullText || '') + eventData.chunk,
                    });

                    // Set first candidate as displayed if none selected OR if current displayed is no longer in map (stage switch)
                    const displayed = (!prev.displayedCandidate || !updatedCandidates.has(prev.displayedCandidate))
                        ? candidateTime
                        : prev.displayedCandidate;

                    const displayedThinking = updatedCandidates.get(displayed);

                    // 🛡️ STREAM ISOLATION: Only append to the main stage history if this candidate is the one being displayed.
                    // This prevents parallel candidates from interleaving their tokens in the global log.
                    const newStageHistory = new Map(prev.stageHistory);
                    if (candidateTime === displayed) {
                        const currentStageText = newStageHistory.get(eventData.stage) || '';
                        const textToAppend = eventData.chunk;
                        newStageHistory.set(eventData.stage, currentStageText + textToAppend);
                    }

                    return {
                        ...prev,
                        allCandidates: updatedCandidates,
                        displayedCandidate: displayed,
                        stageHistory: newStageHistory,
                        // Show the currently displayed candidate's thinking (Isolated)
                        aiThinking: updatedCandidates.get(displayed) || prev.aiThinking,
                    };
                });
                break;

            case 'candidate_score':
            case 'candidate_score_v2':
                console.log('✅ Received Candidate Score:', eventData);
                setState(prev => {
                    const newScores = [
                        ...prev.candidateScores.filter(c => c.time !== eventData.time),
                        {
                            time: eventData.time,
                            score: eventData.score,
                            stage: eventData.stage,
                            rank: eventData.rank,
                        },
                    ];

                    // Remove completed candidate from active pool
                    const updatedCandidates = new Map(prev.allCandidates);
                    updatedCandidates.delete(eventData.time);

                    return {
                        ...prev,
                        candidateScores: newScores,
                        allCandidates: updatedCandidates,
                        analyzedCount: newScores.filter(s => s.stage === eventData.stage).length,
                    };
                });
                break;

            case 'ephemeris':
                // Ephemeris data can be added to state if needed for display
                console.log('Ephemeris data:', eventData);
                break;

            case 'calculation_log':
                console.log('🧮 [Stream] Received Calculation Log:', eventData.candidateTime);
                setState(prev => {
                    // 🛡️ Robust Deduplication: Check if logId already exists
                    if (eventData.logId && prev.calculationLogs.some(log => log.logId === eventData.logId)) {
                        return prev;
                    }

                    return {
                        ...prev,
                        calculationLogs: [
                            ...prev.calculationLogs,
                            {
                                logId: eventData.logId,
                                candidateTime: eventData.candidateTime,
                                sunPos: eventData.sunPos,
                                moonPos: eventData.moonPos,
                                ascendant: eventData.ascendant,
                                dashaObj: eventData.dashaObj,
                                timestamp: Date.now()
                            }
                        ].slice(-100) // Keep last 100 logs
                    };
                });
                break;

            case 'stage_stats':
                setState(prev => {
                    const exists = prev.stageStats.find(s => s.stage === eventData.stage);
                    if (exists) return prev; // Avoid duplicates
                    return {
                        ...prev,
                        stageStats: [...prev.stageStats, {
                            stage: eventData.stage,
                            candidateCount: eventData.candidateCount,
                            description: eventData.description
                        }].sort((a, b) => a.stage - b.stage)
                    };
                });
                break;

            case 'complete':
                setState(prev => ({
                    ...prev,
                    isComplete: true,
                    result: {
                        rectifiedTime: eventData.rectifiedTime,
                        accuracy: eventData.accuracy,
                        confidence: eventData.confidence,
                    },
                }));
                break;

            case 'error':
                setState(prev => ({
                    ...prev,
                    error: eventData.message,
                }));
                break;

            case 'ping':
                // Keep-alive, no action needed
                break;

            case 'initial_state':
                // Apply initial progress state if provided
                if (eventData.progress) {
                    setState(prev => ({
                        ...prev,
                        progress: {
                            step: eventData.progress.steps[eventData.progress.currentStep]?.id || '',
                            stepIndex: eventData.progress.currentStep,
                            totalSteps: eventData.progress.totalSteps,
                            percentage: eventData.progress.percentage,
                            message: eventData.progress.liveMessage || '',
                        },
                        // Load persisted candidate scores
                        candidateScores: eventData.progress.candidateScores || [],
                        analyzedCount: (eventData.progress.candidateScores || []).length,
                        // 🏛️ Hydrate stageHistory on initial sync
                        stageHistory: eventData.progress.stageHistory ? new Map(Object.entries(eventData.progress.stageHistory).map(([k, v]) => [parseInt(k), v as string])) : prev.stageHistory,
                    }));
                }
                break;
        }
    }, []);

    useEffect(() => {
        if (!sessionId) return;

        // 1. Load session metadata immediately
        fetchSessionData(sessionId);

        // 🛡️ [GOD-TIER] DUAL-PATH INITIALIZATION
        // Start a single polling fetch immediately to clear the "Connecting..." screen
        // while the SSE stream negotiates its way through proxies.
        console.log('🛡️ [Stream] God-Tier Dual-Path Init for', sessionId);

        let isInitialFetchDone = false;
        fetchProgress(sessionId, backendUrl).then(() => {
            isInitialFetchDone = true;
        }).catch(e => console.warn('[Poll-Init] Failed, relying on SSE:', e));

        // Don't restart SSE if already polling or complete
        if (connectionState.usingFallback || state.isComplete) return;

        // Create EventSource connection
        const url = `${backendUrl}/api/stream/${sessionId}`;
        console.log('📡 [SSE] Connecting to stream:', url);

        setConnectionState(prev => ({ ...prev, url, readyState: 0, lastError: null }));

        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        // 🏁 Connection Race: If SSE doesn't open in 5s, switch to full polling mode
        connectionTimeoutRef.current = setTimeout(() => {
            if (eventSource.readyState !== 1) { // Not OPEN
                console.warn('⚠️ [SSE] Negotiation slow. Escalating to Polling Mode...');
                eventSource.close();
                startPolling(sessionId);
            }
        }, 8000); // 8s tolerance for slow HF Cold Starts

        // 💓 HEARTBEAT MONITOR: If no activity for 60s, force refresh
        let lastActivity = Date.now();
        const activityCheck = setInterval(() => {
            if (state.isComplete) {
                clearInterval(activityCheck);
                return;
            }
            if (Date.now() - lastActivity > 60000 && eventSource.readyState === 1) {
                console.warn('💓 [Heartbeat] Connection stale. Refreshing...');
                eventSource.close();
                startPolling(sessionId);
            }
        }, 30000);

        eventSource.onmessage = (event) => {
            lastActivity = Date.now();
            try {
                const data = JSON.parse(event.data);
                handleEvent(data);
            } catch (error) {
                console.error('Failed to parse SSE event:', error);
            }
        };

        eventSource.onerror = (err: any) => {
            console.error('📡 [SSE] Stream Error:', err);
            // If we get an auth error (401/403), we might need to refresh token
            if (err?.status === 401 || err?.status === 403) {
                console.log('🔒 [Auth] Token might be expired. Retrying polling path...');
                eventSource.close();
                startPolling(sessionId);
            }
        };

        eventSource.onopen = () => {
            console.log('📡 [SSE] Connection Established Successfully');
            if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
            setConnectionState(prev => ({ ...prev, readyState: 1, lastError: null }));
        };

        // 🔄 [GOD-TIER] VISIBILITY & ONLINE SYNC
        // Auto-reconnect when user returns to tab or internet returns
        const handleSync = () => {
            const isVisible = document.visibilityState === 'visible';
            if (isVisible) {
                console.log('🌐 [Sync] tab focused/back online! Re-calibrating...');

                // Always do a quick poll check on focus to ensure we didn't miss completion
                fetchProgress(sessionId, backendUrl);

                if (eventSource.readyState !== 1 && !state.isComplete) {
                    eventSource.close();
                    if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
                    startPolling(sessionId);
                }
            }
        };

        window.addEventListener('online', handleSync);
        document.addEventListener('visibilitychange', handleSync);

        return () => {
            eventSource.close();
            clearInterval(activityCheck);
            if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
            window.removeEventListener('online', handleSync);
            document.removeEventListener('visibilitychange', handleSync);
        };
    }, [sessionId, backendUrl, startPolling, fetchProgress, state.isComplete]);

    // Rotation Effect: Switch displayed candidate every 5 seconds
    useEffect(() => {
        if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);

        rotationTimerRef.current = setInterval(() => {
            setState(prev => {
                const candidates = Array.from(prev.allCandidates.keys());
                if (candidates.length <= 1) return prev; // No rotation needed

                const currentKey = prev.displayedCandidate || '';
                const currentIndex = candidates.indexOf(currentKey);
                // Cycle to next, handling -1 by going to 0
                const nextIndex = (currentIndex + 1) % candidates.length;
                const nextCandidate = candidates[nextIndex];

                return {
                    ...prev,
                    displayedCandidate: nextCandidate,
                    aiThinking: prev.allCandidates.get(nextCandidate) || prev.aiThinking
                };
            });
        }, 5000); // Rotate every 5 seconds

        return () => {
            if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
        };
    }, []);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
    }, []);

    return { ...state, ...connectionState };
}

// ═════════════════════════════════════════════════════════════════════════════
// HELPER: Reset AI thinking when stage changes
// ═════════════════════════════════════════════════════════════════════════════

export function resetAIThinking(
    setState: React.Dispatch<React.SetStateAction<StreamState>>
): void {
    setState(prev => ({
        ...prev,
        aiThinking: null,
    }));
}
