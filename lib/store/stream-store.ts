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
    StreamMetadata,
    AIThinking
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
    activeAIStage: null, // Tracks the actual AI stage (2, 4, or 6)
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
        // ═══════════════════════════════════════════════════════════════════
        // PHASE 1: Collect all changes into lightweight lookup maps.
        //          No object spreading yet — just pure computation.
        // ═══════════════════════════════════════════════════════════════════
        const changedEntries: Record<string, any> = {};
        const stageChanges: Record<number, Record<string, any>> = {};
        const historyAppends: Record<number, string> = {};
        let latestCandidate = prev.displayedCandidate;
        let updatedProgress = prev.progress;
        let progressChanged = false;

        buffered.forEach(({ stage, candidateTime, text }) => {
            // INDUSTRY PATTERN: Composite key prevents cross-stage data collision
            const stageKey = `s${stage}_${candidateTime}`;

            // Use already-changed entry if same candidate appeared multiple times in buffer
            const existing = changedEntries[stageKey] || prev.allCandidates[stageKey] || {
                stage,
                candidateTime,
                chunks: [],
                fullText: ''
            };

            // Append text with memory cap (sliding window)
            let newFullText = existing.fullText + text;
            if (newFullText.length > MAX_FULLTEXT_CHARS) {
                newFullText = newFullText.slice(-MAX_FULLTEXT_CHARS);
            }

            const updated = { ...existing, fullText: newFullText, updatedAt: Date.now() };
            changedEntries[stageKey] = updated;

            // Group changes by stage for candidatesByStage
            // Note: we still use candidateTime as the key inside the stage map for easy lookup
            if (!stageChanges[stage]) stageChanges[stage] = {};
            stageChanges[stage][candidateTime] = updated;

            // Accumulate history appends per stage (avoid multiple string concats on prev)
            historyAppends[stage] = (historyAppends[stage] || '') + text;

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
                progressChanged = true;
            }
        });

        // ═══════════════════════════════════════════════════════════════════
        // PHASE 2: One merge per map — structural sharing.
        //          Unchanged entries keep SAME object references.
        //          React sees same ref → skips re-render for those entries.
        // ═══════════════════════════════════════════════════════════════════

        // aiThinking & allCandidates: single Object.assign merges only changed keys
        const newAiThinking = Object.assign({}, prev.aiThinking, changedEntries);
        const newAllCandidates = Object.assign({}, prev.allCandidates, changedEntries);

        // candidatesByStage: only create new sub-objects for stages that had changes
        const changedStageNumbers = Object.keys(stageChanges);
        let newCandidatesByStage = prev.candidatesByStage;
        if (changedStageNumbers.length > 0) {
            newCandidatesByStage = { ...prev.candidatesByStage };
            for (const stageStr of changedStageNumbers) {
                const stageNum = Number(stageStr);
                newCandidatesByStage[stageNum] = Object.assign(
                    {},
                    prev.candidatesByStage[stageNum] || {},
                    stageChanges[stageNum]
                );
            }
        }

        // stageHistory: only touch changed stages
        const changedHistoryStages = Object.keys(historyAppends);
        let newStageHistory = prev.stageHistory;
        if (changedHistoryStages.length > 0) {
            newStageHistory = { ...prev.stageHistory };
            for (const stageStr of changedHistoryStages) {
                const stageNum = Number(stageStr);
                const existingHistory = prev.stageHistory[stageNum] || '';
                const appended = existingHistory + historyAppends[stageNum];
                newStageHistory[stageNum] = appended.length > MAX_FULLTEXT_CHARS
                    ? appended.slice(-MAX_FULLTEXT_CHARS)
                    : appended;
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // PHASE 3: Return minimal diff — only include fields that changed.
        // ═══════════════════════════════════════════════════════════════════
        const result: Partial<StreamState> = {
            aiThinking: newAiThinking,
            allCandidates: newAllCandidates,
            candidatesByStage: newCandidatesByStage,
            stageHistory: newStageHistory,
        };

        if (progressChanged) result.progress = updatedProgress;
        if (latestCandidate !== prev.displayedCandidate) result.displayedCandidate = latestCandidate;

        return result;
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
                if (type === 'ai_thinking' && payload.chunk !== undefined) { // Only buffer chunked ai_thinking events
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
                            // initial_state sends {type:'initial_state', progress: ProgressData}
                            const progressData = (payload as any).progress as PollingProgressData;
                            const updates: Partial<StreamState> = {
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
                                estimatedTimeRemaining: progressData?.estimatedTimeRemaining || prev.estimatedTimeRemaining,
                            };
                            // INDUSTRY FIX: Populate allSteps from ProgressData.steps[]
                            if (progressData?.steps && progressData.steps.length > 0) {
                                updates.allSteps = progressData.steps.map((s: any) => ({
                                    id: s.id || 'unknown',
                                    name: s.name || s.id || 'Unknown Stage',
                                    icon: s.icon,
                                }));
                            }
                            return updates;
                        }

                        case 'progress': {
                            // ═══════════════════════════════════════════════════════════════
                            // INDUSTRY FIX: Handle BOTH SSE flat shape AND polling PollingProgressData
                            // SSE sends:    {type:'progress', stepIndex:2, message:'...'}
                            // Polling sends: {currentStep:2, steps:[], liveMessage:'...'}
                            // ═══════════════════════════════════════════════════════════════
                            const p = payload as any;
                            const stepIndex = p.stepIndex ?? p.currentStep ?? 0;
                            const message = p.message || p.liveMessage || '';
                            const steps = p.steps as Array<{ id: string; name: string; details?: string[]; icon?: string }> | undefined;

                            const updates: Partial<StreamState> = {
                                progress: {
                                    step: steps?.[stepIndex]?.id || p.step || 'unknown',
                                    stepIndex,
                                    totalSteps: p.totalSteps || 7,
                                    percentage: p.percentage || 0,
                                    message,
                                    details: steps?.[stepIndex]?.details || p.details || []
                                }
                            };
                            // Populate allSteps if available (from polling ProgressData)
                            if (steps && steps.length > 0 && prev.allSteps.length === 0) {
                                updates.allSteps = steps.map((s: any) => ({
                                    id: s.id || 'unknown',
                                    name: s.name || s.id || 'Unknown Stage',
                                    icon: s.icon,
                                }));
                            }
                            if (p.candidateScores && p.candidateScores.length > 0) {
                                updates.candidateScores = p.candidateScores;
                            }
                            if (p.startedAt) {
                                updates.startedAt = p.startedAt;
                            }
                            if (p.estimatedTimeRemaining !== undefined) {
                                updates.estimatedTimeRemaining = p.estimatedTimeRemaining;
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

                            return {
                                aiContext: context,
                                persistentCandidates: updatedPersistent,
                                activeAIStage: context.stage || prev.activeAIStage // Sync active stage
                            };
                        }

                        case 'candidate_score':
                        case 'candidate_score_v2': {
                            const score = payload as CandidateScore;
                            if (!score || !score.time) return {};

                            // INDUSTRY PATTERN: Upsert — replace existing score for the same (time, stage) tuple
                            const filtered = prev.candidateScores.filter(s => !(s.time === score.time && s.stage === score.stage));
                            const newScores = [...filtered, score];

                            // 🔱 God-Tier: Progress tracking MUST be stage-aware
                            // Use the maximum stage found in the scores to determine current stage progress
                            const maxStage = Math.max(...newScores.map(s => s.stage));
                            const analyzedCount = new Set(newScores.filter(s => s.stage === maxStage).map(s => s.time)).size;

                            return {
                                candidateScores: newScores,
                                analyzedCount,
                            };
                        }

                        case 'candidate_scores': {
                            const scores = payload as CandidateScore[];
                            if (!scores || scores.length === 0) return { candidateScores: [] };

                            const maxStage = Math.max(...scores.map(s => s.stage));
                            const analyzedCount = new Set(scores.filter(s => s.stage === maxStage).map(s => s.time)).size;

                            return {
                                candidateScores: scores,
                                analyzedCount
                            };
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
                            // Derive totalCandidates from the first stage's candidateCount (the initial grid size)
                            const firstStageStat = newStats.find(s => s.stage === 1) || newStats[0];
                            const totalCandidates = firstStageStat?.candidateCount || prev.totalCandidates;
                            return { stageStats: newStats, totalCandidates };
                        }

                        case 'advanced_signals': {
                            return { advancedSignals: payload };
                        }

                        case 'ai_thinking': { // This case handles full AIThinking objects, not chunks
                            const data = payload as AIThinking;
                            const stageStr = data.stage?.toString() || '0';

                            // Map AI stage number (2, 4, 6) back to progress step index (2, 4, 5) for UI syncing if needed
                            // Stage 2 = index 2 (Coarse Elimination)
                            // Stage 4 = index 4 (Deep Analysis)
                            // Stage 6 = index 5 (Micro Precision)  -- wait, stage 6 is Final Verdict (index 6). The mapping is complex.

                            const newThinkingData = {
                                ...prev.aiThinking,
                                [stageStr]: data
                            };

                            const updates: Partial<StreamState> = { aiThinking: newThinkingData, activeAIStage: data.stage || prev.activeAIStage };

                            // Only push to details if it's the current step
                            if (prev.progress?.stepIndex === data.stage && data.fullText) {
                                const paragraphs = data.fullText.split('\n\n').filter(Boolean);
                                const lastFive = paragraphs.slice(-5);
                                updates.progress = {
                                    ...prev.progress,
                                    details: lastFive
                                };
                            }
                            return updates;
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
                            // Clean up thinking buffer on terminal state
                            if (thinkingBuffer.rafId) {
                                cancelAnimationFrame(thinkingBuffer.rafId);
                                thinkingBuffer.rafId = null;
                            }
                            thinkingBuffer.chunks.clear();

                            const termStatus = payload.status;
                            const isCompleted = termStatus === 'complete';
                            const isErr = termStatus === 'failed' || termStatus === 'error' || termStatus === 'cancelled';
                            return {
                                isComplete: isCompleted,
                                error: isErr ? (payload.errorMessage || payload.message || `Session is ${termStatus}`) : null,
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
