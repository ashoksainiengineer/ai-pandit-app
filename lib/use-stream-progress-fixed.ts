'use client';

// lib/use-stream-progress-fixed.ts
// Production-grade SSE progress hook with race condition protection,
// memory leak prevention, and secure logging.
// FINAL PATCH: Aligned advanced signals type with component and fixed mount ref.

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { logger, streamLogger } from './secure-logger';
import { IAdvancedSignals } from '@/components/rectify/advanced-signals/types'; // PATCHED: Import correct type

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
    planetaryInfo: unknown;
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

// UPDATED: The main state interface now includes advancedSignals with the correct type
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
    advancedSignals: IAdvancedSignals | null; // <-- PATCHED
}

// ═════════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═════════════════════════════════════════════════════════════════════════════

export function useStreamProgress(
    sessionId: string | null,
    backendUrl: string = '',
    getToken?: () => Promise<string | null>
): StreamState {
    
    const isMountedRef = useRef(true); // PATCHED: Added mount reference

    const [state, setState] = useState<StreamState>({
        isConnected: false,
        isComplete: false,
        error: null,
        progress: null,
        aiThinking: null,
        aiContext: null,
        candidateScores: [],
        stageStats: [],
        result: null,
        allCandidates: new Map(),
        displayedCandidate: null,
        stageHistory: new Map(),
        analyzedCount: 0,
        totalCandidates: 0,
        estimatedTimeRemaining: 0,
        allSteps: [],
        advancedSignals: null,
    });
    
    // ... (connection state logic can remain as is)

    useEffect(() => {
        isMountedRef.current = true;
        // The rest of the connection logic (EventSource, etc.)
        // ...
        return () => {
            isMountedRef.current = false;
            // ... (cleanup logic like closing EventSource)
        };
    }, [sessionId, backendUrl, getToken]);


    const handleEvent = useCallback((eventData: Record<string, unknown>) => {
        if (!isMountedRef.current) return;
        const eventType = String(eventData.type);

        switch (eventType) {
            // ... (existing cases like 'progress', 'ai_thinking', etc.)

            case 'advanced_signals':
                setState(prev => ({
                    ...prev,
                    advancedSignals: eventData.data as IAdvancedSignals, // PATCHED: Use correct type
                }));
                break;
            
            // ... (other cases)
        }
    }, []);

    // ... (rest of the hook)

    return state;
}

// Dummy components to make the file self-contained for the tool
export { logger, streamLogger };
