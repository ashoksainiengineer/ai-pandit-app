import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    StreamState,
    StreamStep,
    AIThinkingEventData,
    PollingProgressData,
    AIContextData,
    CandidateScore,
    AnalysisDecision,
    StageStat,
    StreamResult,
    StreamMetadata
} from './stream-types';

const DEFAULT_STEPS: StreamStep[] = [
    { id: 'init', name: 'Initializing Engine' },
    { id: 'grid', name: 'Stage 1: Grid Generation' },
    { id: 'coarse', name: 'Stage 2: Batch Tournament' },
    { id: 'fine', name: 'Stage 3: Refinement Grid' },
    { id: 'deep', name: 'Stage 4: Deep Analysis' },
    { id: 'micro', name: 'Stage 5: Micro Precision' },
    { id: 'final', name: 'Final Verdict' },
];

export const createInitialState = (): StreamState => ({
    sessionId: null,
    isComplete: false,
    error: null,
    progress: null,
    aiThinking: {},
    aiContext: null,
    candidateScores: [],
    stageStats: [],
    result: null,
    metadata: undefined,
    allCandidates: {},
    candidatesByStage: {},
    displayedCandidate: null,
    persistentCandidates: [],
    stageHistory: {},
    analyzedCount: 0,
    totalCandidates: 0,
    startedAt: undefined,
    estimatedTimeRemaining: undefined,
    allSteps: DEFAULT_STEPS,
    advancedSignals: null,
    decisions: [],
});

interface StreamStore extends StreamState {
    setSessionId: (id: string | null) => void;
    clearStore: () => void;
    dispatchStreamEvent: (type: string, payload: any) => void;
    forceError: (msg: string) => void;
    markComplete: () => void;
}

export const useStreamStore = create<StreamStore>()(
    persist(
        (set, get) => ({
            ...createInitialState(),

            setSessionId: (id) => set({ sessionId: id }),

            clearStore: () => {
                set({ ...createInitialState() });
            },

            forceError: (msg) => {
                set({ error: msg, isComplete: false });
            },

            markComplete: () => {
                set({ isComplete: true });
            },

            dispatchStreamEvent: (type: string, data: any) => {
                set((prev) => {
                    const payload = data.data || data; // handle wrapped `{ data: ...}` or direct raw payload

                    switch (type) {
                        case 'initial_state': {
                            const progressData = data.progress as PollingProgressData;
                            return {
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

                        case 'progress': {
                            const progressData = payload as PollingProgressData;
                            return {
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
                            const thinkingEvent = payload as AIThinkingEventData;
                            const chunk = thinkingEvent?.chunk || '';
                            const stage = thinkingEvent?.stage || 1;
                            const candidateTime = thinkingEvent?.candidateTime || 'general';

                            const currentStageMap = prev.candidatesByStage[stage] || {};
                            const existingInStage = currentStageMap[candidateTime] || {
                                stage,
                                candidateTime,
                                chunks: [],
                                fullText: ''
                            };

                            const updatedThinking = {
                                ...existingInStage,
                                fullText: existingInStage.fullText + chunk,
                                chunks: [...existingInStage.chunks, chunk]
                            };

                            const newCandidatesByStage = {
                                ...prev.candidatesByStage,
                                [stage]: {
                                    ...prev.candidatesByStage[stage],
                                    [candidateTime]: updatedThinking
                                }
                            };

                            const newStageHistory = {
                                ...prev.stageHistory,
                                [stage]: (prev.stageHistory[stage] || '') + chunk
                            };

                            let updatedProgress = prev.progress;
                            const currentStepIndex = prev.progress?.stepIndex || 0;
                            if (prev.progress && stage > currentStepIndex && stage <= prev.progress.totalSteps) {
                                updatedProgress = {
                                    ...prev.progress,
                                    stepIndex: stage,
                                    step: prev.progress.totalSteps > stage ? 'advancing...' : prev.progress.step,
                                    message: `AI Processing: Stage ${stage}`
                                };
                            }

                            return {
                                progress: updatedProgress,
                                aiThinking: {
                                    ...prev.aiThinking,
                                    [candidateTime]: updatedThinking
                                },
                                allCandidates: {
                                    ...prev.allCandidates,
                                    [candidateTime]: updatedThinking
                                },
                                candidatesByStage: newCandidatesByStage,
                                stageHistory: newStageHistory,
                                displayedCandidate: candidateTime,
                            };
                        }

                        case 'ai_context': {
                            const context = payload as AIContextData;
                            let updatedPersistent = [...prev.persistentCandidates];

                            if (context?.candidatesInBatch && Array.isArray(context.candidatesInBatch)) {
                                const incoming = context.candidatesInBatch;
                                const now = Date.now();
                                const newMap = new Map<string, any>();
                                prev.persistentCandidates.forEach(c => newMap.set(c.time, c));
                                incoming.forEach(c => newMap.set(c.time, { ...c, lastUpdated: now }));
                                updatedPersistent = Array.from(newMap.values()).sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
                            }
                            return { aiContext: context, persistentCandidates: updatedPersistent };
                        }

                        case 'candidate_score':
                        case 'candidate_score_v2': {
                            const score = payload as CandidateScore;
                            if (!score || !score.time) return {};
                            const exists = prev.candidateScores.some(s => s.time === score.time && s.stage === score.stage);
                            if (exists) return {};
                            return { candidateScores: [...prev.candidateScores, score] };
                        }

                        case 'candidate_scores': {
                            const scores = payload as CandidateScore[];
                            return { candidateScores: scores };
                        }

                        case 'decision': {
                            const decision = payload as AnalysisDecision;
                            if (!decision || !decision.time) return {};
                            const filtered = prev.decisions.filter(d => !(d.time === decision.time && d.stage === decision.stage));
                            return { decisions: [...filtered, decision] };
                        }

                        case 'estimated_time': {
                            return { estimatedTimeRemaining: payload?.seconds || 0 };
                        }

                        case 'stage_stats': {
                            let newStats: StageStat[] = [];
                            if (Array.isArray(payload)) {
                                newStats = payload as StageStat[];
                            } else if (payload && typeof payload === 'object') {
                                const stat = payload as StageStat;
                                const exists = prev.stageStats.some(s => s.stage === stat.stage);
                                newStats = exists ? prev.stageStats.map(s => s.stage === stat.stage ? stat : s) : [...prev.stageStats, stat];
                            } else {
                                newStats = prev.stageStats;
                            }
                            return { stageStats: newStats };
                        }

                        case 'advanced_signals': {
                            return { advancedSignals: payload };
                        }

                        case 'metadata': {
                            const metadata = payload as StreamMetadata;
                            const isReset = metadata.status === 'pending' || metadata.status === 'queued';
                            if (isReset) {
                                return {
                                    metadata,
                                    aiThinking: {},
                                    stageHistory: {},
                                    candidateScores: [],
                                    allCandidates: {},
                                    candidatesByStage: {},
                                    decisions: []
                                };
                            }
                            return { metadata };
                        }

                        case 'complete':
                        case 'result': {
                            return {
                                isComplete: true,
                                result: payload as StreamResult,
                            };
                        }

                        case 'terminal_state': {
                            const isErr = payload.status === 'failed' || payload.status === 'error' || payload.status === 'cancelled';
                            return {
                                isComplete: !isErr,
                                error: isErr ? (payload.errorMessage || payload.message || `Session is ${payload.status}`) : null,
                                result: payload.result || prev.result,
                            };
                        }

                        default:
                            return {};
                    }
                });
            }
        }),
        {
            name: 'ai-pandit-stream-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // ⚠️ DONT PERSIST TRANSIENT UI STATE LIKE ERRORS 
                sessionId: state.sessionId,
                isComplete: state.isComplete,
                progress: state.progress,
                aiThinking: state.aiThinking,
                aiContext: state.aiContext,
                candidateScores: state.candidateScores,
                stageStats: state.stageStats,
                result: state.result,
                metadata: state.metadata,
                allCandidates: state.allCandidates,
                candidatesByStage: state.candidatesByStage,
                persistentCandidates: state.persistentCandidates,
                stageHistory: state.stageHistory,
                advancedSignals: state.advancedSignals,
                decisions: state.decisions
            })
        }
    )
);
