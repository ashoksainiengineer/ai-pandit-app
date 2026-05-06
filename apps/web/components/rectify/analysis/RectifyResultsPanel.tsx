'use client';

import { memo } from 'react';
import { Activity, Brain, Gem } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { CandidateScore, StreamProgress, StreamStep, AIThinking } from '@/lib/store/stream-types';
import type { IAdvancedSignals } from '@/components/rectify/advanced-signals/types';
import { SectionErrorBoundary } from '@/components/rectify/AnalysisErrorBoundary';

const SimplifiedPipeline = dynamic(() => import('@/components/rectify/analysis/SimplifiedPipeline').then(mod => mod.SimplifiedPipeline), { ssr: false });
const StageLeaderboard = dynamic(() => import('@/components/rectify/analysis/StageLeaderboard').then(mod => mod.StageLeaderboard), { ssr: false });
const UnifiedAIPanel = dynamic(() => import('@/components/rectify/UnifiedAIPanel').then(mod => mod.UnifiedAIPanel), { ssr: false });
const AdvancedSignalsDashboard = dynamic(() => import('@/components/rectify/advanced-signals/AdvancedSignalsDashboard'), { ssr: false });

interface StageStats {
    stage: number;
    candidateCount: number;
}

interface RectifyResultsPanelProps {
    progress: StreamProgress | null;
    isComplete: boolean;
    isConnected: boolean;
    cancelled: boolean;
    candidateScores: CandidateScore[];
    sortedCandidateScores: CandidateScore[];
    candidatesByStage: Record<number, Record<string, AIThinking>>;
    stageHistory: Record<number, string>;
    stageStats: StageStats[];
    allSteps: StreamStep[];
    activeAIStage: number | null;
    offsetMinutes: number;
    sessionId: string;
    advancedSignals: IAdvancedSignals | null;
    onStageClick: (stageId: number) => void;
}

export const RectifyResultsPanel = memo(function RectifyResultsPanel({
    progress,
    isComplete,
    isConnected,
    cancelled,
    candidateScores,
    sortedCandidateScores,
    candidatesByStage,
    stageHistory,
    stageStats,
    allSteps,
    activeAIStage,
    offsetMinutes,
    sessionId,
    advancedSignals,
    onStageClick,
}: RectifyResultsPanelProps) {
    const currentStageIndex = Math.max(progress?.stepIndex ?? 0, activeAIStage ?? 0);

    const incomingStageNumbers = Object.keys(candidatesByStage).map(Number).filter(n => n > 0);
    const activeStageNumbers = new Set([1, 2, 3, 4, 5, 6].filter(n => n <= currentStageIndex || incomingStageNumbers.includes(n)));
    const sortedStages = Array.from(activeStageNumbers).sort((a, b) => b - a);

    return (
        <>
            {!cancelled && (
                <SectionErrorBoundary sectionName="Pipeline" icon={<Activity className="w-5 h-5" />}>
                    <SimplifiedPipeline
                        currentStage={progress?.stepIndex ?? 0}
                        isComplete={isComplete}
                        isConnected={isConnected}
                        activeAIStage={activeAIStage}
                        offsetMinutes={offsetMinutes}
                        onStageClick={onStageClick}
                    />
                </SectionErrorBoundary>
            )}

            {!cancelled && sortedCandidateScores.length > 0 && (
                <SectionErrorBoundary sectionName="Top Candidates" icon={<Brain className="w-5 h-5" />}>
                    <StageLeaderboard
                        stage={Math.max(...sortedCandidateScores.map(s => s.stage))}
                        scores={sortedCandidateScores}
                        isCompleted={isComplete}
                        sessionId={sessionId}
                    />
                </SectionErrorBoundary>
            )}

            <div className="flex flex-col gap-6 lg:gap-8 w-full">
                <div className="space-y-4 sm:space-y-6">
                    {(Object.keys(candidatesByStage).length > 0 || (progress?.stepIndex ?? 0) >= 1) && !cancelled && (
                        <SectionErrorBoundary sectionName="AI Reasoning" icon={<Brain className="w-5 h-5" />}>
                            {sortedStages.map((stageNum) => {
                                const stageCandidates = candidatesByStage?.[stageNum] || {};
                                const isStageCompleted = stageNum < currentStageIndex;
                                const actualCandidatesOut = stageStats?.find(s => s.stage === stageNum)?.candidateCount || 0;
                                const candidateCount = Object.keys(stageCandidates).length || actualCandidatesOut;
                                const isCurrentStage = stageNum === currentStageIndex || (!isStageCompleted && incomingStageNumbers.includes(stageNum));

                                const stepDef = allSteps?.[stageNum] ? allSteps[stageNum] : { id: `stage-${stageNum}`, name: `Stage ${stageNum}` };
                                const isAIStage = [2, 4, 6].includes(stageNum);

                                if (candidateCount === 0 && !isCurrentStage && !isStageCompleted) return null;

                                return (
                                    <div
                                        key={stepDef.id}
                                        id={`stage-${stageNum}`}
                                        className={`mb-12 last:mb-0 border-l-2 pl-4 sm:pl-6 py-2 transition-colors duration-500 relative
                                            ${isCurrentStage ? 'border-amber-200 bg-amber-50/5' : 'border-stone-100'}
                                        `}
                                        style={{ contain: 'paint', minHeight: isCurrentStage ? '400px' : 'auto' }}
                                    >
                                        <div className="flex items-center gap-2 mb-4 -ml-7 sm:-ml-9">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium border-2 transition-all duration-500
                                                ${isCurrentStage
                                                    ? 'bg-amber-500 border-amber-200 text-white shadow-sm ring-4 ring-amber-500/10'
                                                    : isStageCompleted
                                                        ? 'bg-[#184131] border-[#184131]/20 text-white'
                                                        : 'bg-white border-stone-200 text-stone-400'
                                                }`}
                                            >
                                                {stageNum}
                                            </div>
                                            <h3 className={`text-xs font-medium uppercase tracking-widest ${isCurrentStage ? 'text-amber-700' : 'text-stone-500'}`}>
                                                {stepDef.name}
                                            </h3>
                                        </div>

                                        {isAIStage ? (
                                            <UnifiedAIPanel
                                                thinking={isCurrentStage && !isStageCompleted && stageCandidates
                                                    ? (() => {
                                                        const entries = Object.values(stageCandidates);
                                                        if (entries.length === 0) return null;
                                                        return entries.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
                                                    })()
                                                    : null}
                                                stageHistory={stageHistory}
                                                isActive={isCurrentStage && !isStageCompleted}
                                                isCompleted={isStageCompleted}
                                                stage={stageNum}
                                                allCandidates={stageCandidates}
                                                candidateScores={candidateScores}
                                                title={stepDef.name}
                                                offsetMinutes={offsetMinutes}
                                            />
                                        ) : (
                                            <div className="bg-white/50 rounded-xl border border-stone-100 p-4 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${isCurrentStage ? 'bg-blue-500 animate-pulse' : 'bg-stone-300'}`} />
                                                        <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider">
                                                            {isCurrentStage ? 'Computing Mathematical Grids...' : 'Computation Complete'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-stone-400">
                                                        {candidateCount} variations generated
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </SectionErrorBoundary>
                    )}
                </div>

                <div className="space-y-4 sm:space-y-6 w-full">
                    {advancedSignals && (
                        <SectionErrorBoundary sectionName="Advanced Signals" icon={<Gem className="w-5 h-5" />}>
                            <AdvancedSignalsDashboard signals={advancedSignals} isComplete={isComplete} />
                        </SectionErrorBoundary>
                    )}
                </div>
            </div>
        </>
    );
});
