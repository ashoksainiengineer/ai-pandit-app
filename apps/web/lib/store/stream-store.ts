import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
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

// ═══════════════════════════════════════════════════════════════════════════════
// INDUSTRY PATTERN: IndexedDB Storage Adapter for Zustand (Notion/Linear pattern)
// Provides 50MB+ storage vs localStorage's 5MB limit.
// Wraps idb-keyval's async API into Zustand's StateStorage interface.
// ═══════════════════════════════════════════════════════════════════════════════
const idbStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return (await get(name)) ?? null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await set(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await del(name);
    },
};

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
    activeAIStage: null, // Tracks the actual AI stage (2, 4, or 6)
    allSteps: DEFAULT_STEPS,
    advancedSignals: null,
    decisions: [],
    lastEventId: 0,
});

interface StreamStore extends StreamState {
    setSessionId: (id: string | null) => void;
    clearStore: () => void;
    dispatchStreamEvent: (type: string, payload: any) => void;
    forceError: (msg: string) => void;
    markComplete: () => void;
    setDisplayedCandidate: (id: string | null) => void;
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

// Per-stage set of candidate keys that have already contributed to stageHistory
// This prevents the old bug where includes() dropped chunks with common AI preambles
const stageHistoryContributors: Record<number, Set<string>> = {};

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
                fullText: '',
                startedAt: Date.now()
            };

            let newFullText: string;

            // ═══════════════════════════════════════════════════════════════
            // INDUSTRY FIX: Suffix-overlap de-duplication
            // On reconnect, backend replays full accumulated buffer.
            // Old `.includes()` approach was O(n) and broke when
            // persisted text (10KB capped) didn't contain the full replay (50KB).
            //
            // New approach: Find the longest suffix of `existing.fullText`
            // that matches a prefix of `text`, then skip that overlap.
            // ═══════════════════════════════════════════════════════════════
            if (existing.fullText && text) {
                // Case 1: Incoming text is entirely within existing (exact duplicate)
                if (existing.fullText.endsWith(text)) {
                    return; // Nothing new
                }
                // Case 2: Existing text is a prefix of incoming (reconnect replay with full buffer)
                if (text.startsWith(existing.fullText)) {
                    newFullText = text; // Incoming is a superset — just replace
                } else {
                    // Case 3: Partial overlap — find the longest suffix-prefix match
                    // Check if the END of existing text overlaps with START of new text
                    const maxCheck = Math.min(existing.fullText.length, text.length, 2000); // Cap check at 2KB
                    let overlapLen = 0;
                    for (let len = maxCheck; len > 0; len--) {
                        const suffix = existing.fullText.slice(-len);
                        if (text.startsWith(suffix)) {
                            overlapLen = len;
                            break;
                        }
                    }
                    newFullText = existing.fullText + text.slice(overlapLen);
                }
            } else {
                newFullText = existing.fullText + text;
            }

            if (newFullText.length > MAX_FULLTEXT_CHARS) {
                newFullText = newFullText.slice(-MAX_FULLTEXT_CHARS);
            }

            const updated = { ...existing, fullText: newFullText, updatedAt: Date.now() };
            changedEntries[stageKey] = updated;

            // Group changes by stage for candidatesByStage
            if (!stageChanges[stage]) stageChanges[stage] = {};
            stageChanges[stage][candidateTime] = updated;

            // Accumulate history appends per stage
            // INDUSTRY FIX: Use per-candidate contributor tracking instead of
            // substring includes() which dropped valid chunks with identical AI preambles
            if (!stageHistoryContributors[stage]) {
                stageHistoryContributors[stage] = new Set();
            }
            const contributorKey = `${stage}_${candidateTime}`;
            if (!stageHistoryContributors[stage].has(contributorKey)) {
                // First time this candidate contributes to this stage's history
                stageHistoryContributors[stage].add(contributorKey);
                historyAppends[stage] = (historyAppends[stage] || '') + text;
            } else {
                // Candidate already contributed — only append genuinely new text
                const existingHistory = prev.stageHistory[stage] || '';
                if (text.length > 50 && !existingHistory.endsWith(text.slice(-50))) {
                    // New content detected (last 50 chars don't match) — append
                    historyAppends[stage] = (historyAppends[stage] || '') + text;
                }
            }

            // Selection Logic: Set focus to CURRENT stage candidate
            latestCandidate = stageKey;

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

            setDisplayedCandidate: (id) => set({ displayedCandidate: id }),

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

                    // Precision Fix: Buffer key must include stage to prevent cross-stage contamination
                    // (e.g., Stage 2 'general' vs Stage 3 'general')
                    const bufferKey = `${stage}_${candidateTime}`;
                    const existing = thinkingBuffer.chunks.get(bufferKey);

                    if (existing) {
                        existing.text += chunk;
                    } else {
                        thinkingBuffer.chunks.set(bufferKey, { stage, candidateTime, text: chunk });
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
                                // Sync analyzedCount
                                const maxStage = Math.max(...p.candidateScores.map((s: any) => s.stage));
                                updates.analyzedCount = new Set(p.candidateScores.filter((s: any) => s.stage === maxStage).map((s: any) => s.time)).size;
                            }
                            if (p.startedAt) {
                                updates.startedAt = p.startedAt;
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

                            // Standard: Progress tracking must be stage-aware
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
                            return {}; // Logic removed as per de-cluttering policy
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
                            // Backend Robustness: Only wipe on status RESET if we don't have active progress
                            // OR if status explicitly transition from complete/failed back to pending
                            const isReset = (metadata.status === 'pending' || metadata.status === 'queued') &&
                                (prev.isComplete || !!prev.error || !prev.sessionId);

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
                                    const stageKey = `s${stage}_${candidateTime}`;
                                    const existing = newAllCandidates[stageKey] || { stage, candidateTime, chunks: [], fullText: '' };
                                    const updated = { ...existing, fullText: existing.fullText + text };
                                    newAiThinking[stageKey] = updated;
                                    newAllCandidates[stageKey] = updated;
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
            // ═══════════════════════════════════════════════════════════════
            // INDUSTRY UPGRADE: IndexedDB storage (50MB+ vs localStorage 5MB)
            // Uses idb-keyval for async key-value access to IndexedDB.
            // Zustand's createJSONStorage adapter handles serialization.
            // This enables FULL reasoning text persistence for multi-hour
            // analyses without the old 10KB/candidate text cap.
            // ═══════════════════════════════════════════════════════════════
            storage: createJSONStorage(() => idbStorage),
            partialize: (state) => ({
                // ═══════════════════════════════════════════════════════════════
                // PERSISTENCE POLICY: What survives page refresh
                // ═══════════════════════════════════════════════════════════════
                // Core session state
                sessionId: state.sessionId,
                isComplete: state.isComplete,
                progress: state.progress,
                result: state.result,
                metadata: state.metadata,
                startedAt: state.startedAt,

                // Scoring & stats (tables, emerging candidates, leaderboard)
                candidateScores: state.candidateScores,
                stageStats: state.stageStats,
                analyzedCount: state.analyzedCount,
                totalCandidates: state.totalCandidates,
                decisions: state.decisions,

                // Advanced data
                advancedSignals: state.advancedSignals,
                stageHistory: state.stageHistory,

                // UI state
                activeAIStage: state.activeAIStage,
                displayedCandidate: state.displayedCandidate,
                persistentCandidates: state.persistentCandidates,

                // Reasoning cards — IndexedDB has 50MB+ capacity,
                // so we persist FULL text without any truncation.
                // No more 10KB cap — multi-hour analyses fully preserved.
                allCandidates: state.allCandidates,
                candidatesByStage: state.candidatesByStage,

                // SSE Last-Event-ID: persisted so native EventSource can send it on reconnect
                lastEventId: state.lastEventId,
            })
        }
    )
);
