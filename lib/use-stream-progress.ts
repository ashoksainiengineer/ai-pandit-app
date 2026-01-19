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
    result: StreamResult | null;
    // Enhanced UX: Multi-candidate tracking
    allCandidates: Map<string, AIThinking>; // All active candidates' thinking
    displayedCandidate: string | null; // Currently shown candidate time
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
    backendUrl: string = '' // Empty = use relative path (proxy at /api/stream)
): StreamState {
    const [state, setState] = useState<StreamState>({
        isConnected: false,
        isComplete: false,
        error: null,
        progress: null,
        aiThinking: null,
        aiContext: null,
        candidateScores: [],
        result: null,
        // Enhanced UX
        allCandidates: new Map(),
        displayedCandidate: null,
        analyzedCount: 0,
        totalCandidates: 0,
    });

    // Enhanced State with Polling
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

    // Polling function
    const startPolling = useCallback((sid: string) => {
        if (pollingIntervalRef.current) return;

        console.log('🔄 [Stream] Switching to Polling Mode for', sid);
        setConnectionState(prev => ({
            ...prev,
            readyState: 3, // Custom status for Polling
            usingFallback: true
        }));

        // Immediate fetch
        fetchProgress(sid);

        pollingIntervalRef.current = setInterval(() => {
            fetchProgress(sid);
        }, 2000);
    }, [backendUrl]); // backendUrl dependency if used in fetchProgress

    const fetchProgress = async (sid: string) => {
        try {
            const url = `${backendUrl}/api/queue/progress/${sid}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Polling failed: ${res.status}`);

            const data = await res.json();
            const progressData = data.progress;

            if (data.status === 'complete' || data.status === 'failed') {
                // Stop polling if done
                if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            }

            // Reuse the 'initial_state' logic to update UI
            setState(prev => ({
                ...prev,
                isConnected: true,
                progress: {
                    step: progressData.steps[progressData.currentStep]?.id || '',
                    stepIndex: progressData.currentStep,
                    totalSteps: progressData.totalSteps,
                    percentage: progressData.percentage,
                    message: progressData.liveMessage || '',
                    details: progressData.steps[progressData.currentStep]?.details,
                },
                candidateScores: progressData.candidateScores || [],
                analyzedCount: (progressData.candidateScores || []).length,
            }));

            // Handle completion from polling
            if (data.status === 'complete' && data.data?.analysisResult) {
                setState(prev => ({
                    ...prev,
                    isComplete: true,
                    result: data.data
                }));
            }

        } catch (err) {
            console.error('Polling error:', err);
        }
    };

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
                    aiContext: eventData
                }));
                break;

            case 'ai_thinking':
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

                    return {
                        ...prev,
                        allCandidates: updatedCandidates,
                        displayedCandidate: displayed,
                        // Show the currently displayed candidate's thinking
                        aiThinking: displayedThinking || prev.aiThinking,
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
                    }));
                }
                break;
        }
    }, []);

    useEffect(() => {
        if (!sessionId) return;

        // 🚀 FORCE POLLING MODE
        console.log('🚀 [Stream] Force-starting Polling Mode');
        startPolling(sessionId);
        return;

        // Don't restart SSE if already polling
        if (connectionState.usingFallback) return;

        // Create EventSource connection
        const url = `${backendUrl}/api/stream/${sessionId}`;
        console.log('Connecting to SSE stream:', url);

        setConnectionState(prev => ({ ...prev, url, readyState: 0, lastError: null }));

        // Create EventSource connection without credentials (for Public HF Space)
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        // Connection Timeout Check (Increased to 20s for Cloud cold starts)
        connectionTimeoutRef.current = setTimeout(() => {
            if (eventSource.readyState !== 1) { // Not OPEN
                console.warn('⚠️ [SSE] Connection timeout. Switching to polling...');
                eventSource.close();
                startPolling(sessionId);
            }
        }, 15000); // 15s timeout before switching to polling

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleEvent(data);
            } catch (error) {
                console.error('Failed to parse SSE event:', error);
            }
        };

        eventSource.onerror = (error) => {
            // ...
        };

        eventSource.onopen = () => {
            // ...
        };

        // Cleanup on unmount
        return () => {
            // Cleanup if needed
        };
        */
    }, [sessionId, backendUrl, startPolling]);

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
