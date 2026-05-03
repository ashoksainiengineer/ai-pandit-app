'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStreamProgress } from '@/lib/use-stream-progress';
import { useStreamStore } from '@/lib/store/stream-store';
import { useShallow } from 'zustand/react/shallow';
import type { CandidateScore } from '@/lib/store/stream-types';
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
        advancedSignals,
        result,
        startedAt,
        allSteps,
        metadata,
        activeAIStage,
        analyzedCount,
        totalCandidates,
        candidatesByStage,
        stageHistory,
        stageStats,
    } = useStreamStore(useShallow(state => ({
        isComplete: state.isComplete,
        streamError: state.error,
        progress: state.progress,
        candidateScores: state.candidateScores,
        advancedSignals: state.advancedSignals,
        result: state.result,
        startedAt: state.startedAt,
        allSteps: state.allSteps,
        metadata: state.metadata,
        activeAIStage: state.activeAIStage,
        analyzedCount: state.analyzedCount,
        totalCandidates: state.totalCandidates,
        candidatesByStage: state.candidatesByStage,
        stageHistory: state.stageHistory,
        stageStats: state.stageStats,
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

    const sortedCandidateScores = useMemo(() => {
        if (!candidateScores || candidateScores.length === 0) return [];
        const maxStage = Math.max(...candidateScores.map(s => s.stage));
        const uniqueMap = new Map<string, CandidateScore>();
        const latestStageScores = candidateScores.filter(s => s.stage === maxStage);
        latestStageScores.forEach(s => {
            const existing = uniqueMap.get(s.time);
            if (!existing || s.score > existing.score) {
                uniqueMap.set(s.time, s);
            }
        });
        return Array.from(uniqueMap.values()).sort((a, b) => b.score - a.score);
    }, [candidateScores]);

    const offsetMinutes = useMemo(() => {
        return metadata?.offsetConfig?.customMinutes ??
            (metadata?.offsetConfig?.preset === '30min' ? 30 :
                metadata?.offsetConfig?.preset === '1hour' ? 60 :
                    metadata?.offsetConfig?.preset === '2hours' ? 120 :
                        metadata?.offsetConfig?.preset === '4hours' ? 240 :
                            metadata?.offsetConfig?.preset === '6hours' ? 360 :
                                metadata?.offsetConfig?.preset === '12hours' ? 720 : 60);
    }, [metadata?.offsetConfig]);

    const handleStageClick = useCallback((stageId: number) => {
        const el = document.getElementById(`stage-${stageId}`);
        if (el) {
            const headerOffset = 100;
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    }, []);

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
        advancedSignals,
        result,
        startedAt,
        allSteps,
        metadata,
        activeAIStage,
        analyzedCount,
        totalCandidates,
        candidatesByStage,
        stageHistory,
        stageStats,
        elapsedSeconds,
        sortedCandidateScores,
        offsetMinutes,
        handleStageClick,
        hasError,
        errorMessage,
        hasData,
    };
}
