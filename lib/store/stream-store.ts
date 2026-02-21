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

// ═══════════════════════════════════════════════════════════════════════════════
// INDUSTRY PATTERN: requestAnimationFrame paint-cycle batching (VS Code/Figma)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Instead of setTimeout(150ms) which fires at arbitrary times, we use rAF which
// synchronizes state flushes with the browser's native paint cycle (16.6ms @ 60fps).
// This is the exact pattern used by:
// - VS Code's terminal renderer (xterm.js)
// - Figma's real-time canvas updates
// - Chrome DevTools' network waterfall
//
// Combined with a coalescing Map that merges multiple chunks for the same candidate,
// this gives us the optimal balance: data freshness vs rendering cost.
// ═══════════════════════════════════════════════════════════════════════════════

interface ThinkingBuffer {
    chunks: Map<string, { stage: number; candidateTime: string; text: string }>;
    rafId: number | null;
}

const thinkingBuffer: ThinkingBuffer = {
    chunks: new Map(),
    rafId: null,
};

// INDUSTRY PATTERN: Memory cap per candidate (prevents OOM on long analyses)
// 500KB per candidate is generous — most AI reasoning text is ~50-100KB total
const MAX_FULLTEXT_CHARS = 500_000;

function flushThinkingBuffer(set: (fn: (prev: StreamState) => Partial<StreamState>) => void) {
    const buffered = new Map(thinkingBuffer.chunks);
    thinkingBuffer.chunks.clear();
    thinkingBuffer.rafId = null;

    if (buffered.size === 0) return;

    set((prev) => {
        // Single-pass atomic update — one set() call for ALL buffered chunks
        const newAiThinking = { ...prev.aiThinking };
        const newAllCandidates = { ...prev.allCandidates };
        const newCandidatesByStage = { ...prev.candidatesByStage };
        const newStageHistory = { ...prev.stageHistory };
        let latestCandidate = prev.displayedCandidate;
        let updatedProgress = prev.progress;

        buffered.forEach(({ stage, candidateTime, text }) => {
            const existing = newAllCandidates[candidateTime] || {
                stage,
                candidateTime,
                chunks: [],
                fullText: ''
            };

            // Memory cap: truncate if text exceeds limit
            let newFullText = existing.fullText + text;
            if (newFullText.length > MAX_FULLTEXT_CHARS) {
                // Keep the last MAX_FULLTEXT_CHARS characters (sliding window)
                newFullText = newFullText.slice(-MAX_FULLTEXT_CHARS);
            }

            const updated = {
                ...existing,
                fullText: newFullText,
            };

            newAiThinking[candidateTime] = updated;
            newAllCandidates[candidateTime] = updated;

            // Stage-level map
            if (!newCandidatesByStage[stage]) newCandidatesByStage[stage] = {};
            newCandidatesByStage[stage] = {
                ...newCandidatesByStage[stage],
                [candidateTime]: updated
            };

            // Stage history — capped to same limit
            const existingHistory = newStageHistory[stage] || '';
            const newHistory = existingHistory + text;
            newStageHistory[stage] = newHistory.length > MAX_FULLTEXT_CHARS
                ? newHistory.slice(-MAX_FULLTEXT_CHARS)
                : newHistory;

            latestCandidate = candidateTime;

            // Advance progress if stage jumped
            const currentStepIndex = updatedProgress?.stepIndex || 0;
            if (updatedProgress && stage > currentStepIndex && stage <= updatedProgress.totalSteps) {
                updatedProgress = {
                    ...updatedProgress,
                    stepIndex: stage,
                    step: 'advancing...',
                    message: `AI Processing: Stage ${stage}`
                };
            }
        });

        return {
            progress: updatedProgress,
            aiThinking: newAiThinking,
            allCandidates: newAllCandidates,
            candidatesByStage: newCandidatesByStage,
            stageHistory: newStageHistory,
            // BUG FIX: Only update displayedCandidate when it actually changed
            // Prevents unnecessary re-renders in UnifiedAIPanel on every rAF flush
            ...(latestCandidate !== prev.displayedCandidate ? { displayedCandidate: latestCandidate } : {}),
        };
    });
}

// ═══════════════════════════════════════════════════════════════════════════════

export const useStreamStore = create<StreamStore>()(
    persist(
        (set, get) => ({
            ...createInitialState(),

            setSessionId: (id) => set({ sessionId: id }),

            clearStore: () => {
                // Cancel any pending rAF flush
                if (thinkingBuffer.rafId) {
                    cancelAnimationFrame(thinkingBuffer.rafId);
                    thinkingBuffer.rafId = null;
                }
                thinkingBuffer.chunks.clear();
                set({ ...createInitialState() });
            },

            forceError: (msg) => {
                set({ error: msg, isComplete: false });
            },

            markComplete: () => {
                set({ isComplete: true });
            },

            dispatchStreamEvent: (type: string, data: any) => {
                const payload = data.data || data;

                // ═══════════════════════════════════════════════════════════════
                // HOT PATH: ai_thinking events — throttled via buffer
                // ═══════════════════════════════════════════════════════════════
                if (type === 'ai_thinking') {
                    const thinkingEvent = payload as AIThinkingEventData;
                    const chunk = thinkingEvent?.chunk || '';
                    const stage = thinkingEvent?.stage || 1;
                    const candidateTime = thinkingEvent?.candidateTime || 'general';

                    // Append to buffer (coalesce multiple chunks for same candidate)
                    const existing = thinkingBuffer.chunks.get(candidateTime);
                    if (existing) {
                        existing.text += chunk;
                    } else {
                        thinkingBuffer.chunks.set(candidateTime, { stage, candidateTime, text: chunk });
                    }

                    // Schedule rAF flush if not already pending
                    if (!thinkingBuffer.rafId) {
                        thinkingBuffer.rafId = requestAnimationFrame(() => flushThinkingBuffer(set));
                    }
                    return; // Don't call set() synchronously
                }

                // ═══════════════════════════════════════════════════════════════
                // All other event types — direct set() (these are infrequent)
                // ═══════════════════════════════════════════════════════════════
                set((prev) => {
                    switch (type) {
                        case 'initial_state': {
                            // BUG FIX: Use `payload` (after data.data unwrap), not raw `data`
                            const progressData = (payload as any).progress as PollingProgressData;
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
                            // BUG FIX: Also extract candidateScores, startedAt, ETA from polling data
                            const updates: Partial<StreamState> = {
                                progress: {
                                    step: progressData.steps?.[progressData.currentStep || 0]?.id || 'unknown',
                                    stepIndex: progressData.currentStep || 0,
                                    totalSteps: progressData.totalSteps || 7,
                                    percentage: progressData.percentage || 0,
                                    message: progressData.message || progressData.liveMessage || '',
                                    details: progressData.steps?.[progressData.currentStep || 0]?.details || []
                                }
                            };
                            if (progressData.candidateScores && progressData.candidateScores.length > 0) {
                                updates.candidateScores = progressData.candidateScores;
                            }
                            if (progressData.startedAt) {
                                updates.startedAt = progressData.startedAt;
                            }
                            if (progressData.estimatedTimeRemaining !== undefined) {
                                updates.estimatedTimeRemaining = progressData.estimatedTimeRemaining;
                            }
                            return updates;
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
                            // Flush any remaining buffered chunks before marking complete
                            if (thinkingBuffer.rafId) {
                                cancelAnimationFrame(thinkingBuffer.rafId);
                                thinkingBuffer.rafId = null;
                            }

                            // BUG FIX: Robustly extract StreamResult from multiple possible shapes
                            // Backend may send: {rectifiedTime, accuracy, confidence}
                            // Or polling may send: {status:'complete', result:{...}, data:{...}}
                            const extractedResult: StreamResult | null =
                                (payload?.rectifiedTime ? payload : payload?.result || prev.result) as StreamResult | null;

                            if (thinkingBuffer.chunks.size > 0) {
                                const newAiThinking = { ...prev.aiThinking };
                                const newAllCandidates = { ...prev.allCandidates };
                                thinkingBuffer.chunks.forEach(({ stage, candidateTime, text }) => {
                                    const existing = newAllCandidates[candidateTime] || { stage, candidateTime, chunks: [], fullText: '' };
                                    const updated = { ...existing, fullText: existing.fullText + text };
                                    newAiThinking[candidateTime] = updated;
                                    newAllCandidates[candidateTime] = updated;
                                });
                                thinkingBuffer.chunks.clear();
                                return {
                                    isComplete: true,
                                    result: extractedResult,
                                    aiThinking: newAiThinking,
                                    allCandidates: newAllCandidates,
                                };
                            }
                            return {
                                isComplete: true,
                                result: extractedResult,
                            };
                        }

                        case 'terminal_state': {
                            // BUG FIX: Clean up thinking buffer on terminal state
                            if (thinkingBuffer.rafId) {
                                cancelAnimationFrame(thinkingBuffer.rafId);
                                thinkingBuffer.rafId = null;
                            }
                            thinkingBuffer.chunks.clear();

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
                // ⚠️ ONLY persist lightweight recovery data.
                // DO NOT persist aiThinking/allCandidates/stageHistory —
                // they update ~10x/sec and serializing megabytes of JSON per write freezes the browser.
                sessionId: state.sessionId,
                isComplete: state.isComplete,
                progress: state.progress,
                candidateScores: state.candidateScores,
                stageStats: state.stageStats,
                result: state.result,
                metadata: state.metadata,
                advancedSignals: state.advancedSignals,
                decisions: state.decisions
            })
        }
    )
);
