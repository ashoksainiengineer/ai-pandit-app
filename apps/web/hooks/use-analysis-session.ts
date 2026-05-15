'use client';

import { useState, useEffect } from 'react';
import { useStreamProgress } from '@/lib/use-stream-progress';
import { useStreamStore } from '@/lib/store/stream-store';
import { useShallow } from 'zustand/react/shallow';
import { useTestMode } from '@/lib/test-mode-context';

export function useAnalysisSession(
    sessionId: string | null,
    isLoaded: boolean,
    isSignedIn: boolean,
    getToken: () => Promise<string | null>
) {
    const isTestMode = useTestMode();

    const { connectionState } = useStreamProgress(
        (isLoaded && isSignedIn) || isTestMode ? sessionId : null,
        undefined,
        getToken
    );

    const {
        isComplete,
        streamError,
        progress,
        candidateScores,
        result,
        startedAt,
        allSteps,
        metadata,
        activeAIStage,
        candidatesByStage,
        stageHistory,
    } = useStreamStore(useShallow(state => ({
        isComplete: state.isComplete,
        streamError: state.error,
        progress: state.progress,
        candidateScores: state.candidateScores,
        result: state.result,
        startedAt: state.startedAt,
        allSteps: state.allSteps,
        metadata: state.metadata,
        activeAIStage: state.activeAIStage,
        candidatesByStage: state.candidatesByStage,
        stageHistory: state.stageHistory,
    })));

    const isConnected = connectionState.status === 'streaming' || connectionState.status === 'polling';

    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    useEffect(() => {
        if (!startedAt) { setElapsedSeconds(0); return; }
        const startMs = new Date(startedAt).getTime();
        if (isNaN(startMs)) { setElapsedSeconds(0); return; }
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
        const interval = setInterval(() => {
            setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
        }, 1000);
        return () => clearInterval(interval);
    }, [startedAt]);

    const hasError = streamError || connectionState.status === 'error';
    const errorMessage = streamError || connectionState.lastError || 'Unknown error';
    const hasData = progress || candidateScores.length > 0 || Object.keys(candidatesByStage).length > 0;

    return {
        connectionState,
        isConnected,
        isComplete,
        streamError,
        progress,
        candidateScores,
        result,
        startedAt,
        allSteps,
        metadata,
        activeAIStage,
        candidatesByStage,
        stageHistory,
        elapsedSeconds,
        hasError,
        errorMessage,
        hasData,
    };
}
