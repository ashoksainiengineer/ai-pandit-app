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
    candidateScores: CandidateScore[];
    result: StreamResult | null;
}

// ═════════════════════════════════════════════════════════════════════════════
// HOOK
// ═════════════════════════════════════════════════════════════════════════════

export function useStreamProgress(
    sessionId: string | null,
    backendUrl: string = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
): StreamState {
    const [state, setState] = useState<StreamState>({
        isConnected: false,
        isComplete: false,
        error: null,
        progress: null,
        aiThinking: null,
        candidateScores: [],
        result: null,
    });

    const eventSourceRef = useRef<EventSource | null>(null);

    // Handle incoming SSE events
    const handleEvent = useCallback((eventData: any) => {
        switch (eventData.type) {
            case 'connected':
                setState(prev => ({ ...prev, isConnected: true }));
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

            case 'ai_thinking':
                setState(prev => {
                    const current = prev.aiThinking;

                    // Lock onto a single candidate to prevent scrambled text from parallel streams
                    if (current && current.stage === eventData.stage && current.candidateTime && eventData.candidateTime && current.candidateTime !== eventData.candidateTime) {
                        // Ignore interleaved chunks from other parallel candidates for visual clarity
                        return prev;
                    }

                    return {
                        ...prev,
                        aiThinking: {
                            stage: eventData.stage,
                            candidateTime: eventData.candidateTime || current?.candidateTime,
                            chunks: [...(current?.chunks || []), eventData.chunk],
                            fullText: (current?.candidateTime === eventData.candidateTime ? (current?.fullText || '') : '') + eventData.chunk,
                        },
                    };
                });
                break;

            case 'candidate_score':
                setState(prev => ({
                    ...prev,
                    candidateScores: [
                        ...prev.candidateScores.filter(c => c.time !== eventData.time),
                        {
                            time: eventData.time,
                            score: eventData.score,
                            stage: eventData.stage,
                            rank: eventData.rank,
                        },
                    ],
                }));
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
                    }));
                }
                break;
        }
    }, []);

    useEffect(() => {
        if (!sessionId) return;

        // Create EventSource connection
        const url = `${backendUrl}/api/stream/${sessionId}`;
        console.log('Connecting to SSE stream:', url);

        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleEvent(data);
            } catch (error) {
                console.error('Failed to parse SSE event:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            setState(prev => ({
                ...prev,
                isConnected: false,
                error: 'Connection lost. Retrying...',
            }));
        };

        eventSource.onopen = () => {
            console.log('SSE connection established');
            setState(prev => ({ ...prev, isConnected: true, error: null }));
        };

        // Cleanup on unmount
        return () => {
            console.log('Closing SSE connection');
            eventSource.close();
            eventSourceRef.current = null;
        };
    }, [sessionId, backendUrl, handleEvent]);

    return state;
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
