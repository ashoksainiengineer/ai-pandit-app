import { env } from '../config/env';
import { logger } from '../secure-logger';
import { create } from 'zustand';
import { devtools, persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
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

// ⏱️ DEBOUNCED I/O: Prevents UI stutter by batching the I/O operations.
const debounceMap = new Map<string, ReturnType<typeof setTimeout>>();

const idbStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return (await get(name)) ?? null;
    },
    setItem: (name: string, value: string): void => {
        if (debounceMap.has(name)) {
            clearTimeout(debounceMap.get(name));
        }

        // 🌡️ 2s Debounce ensures we don't bombard I/O during rapid Stage 1 generation
        const timer = setTimeout(async () => {
            try {
                await set(name, value);
                debounceMap.delete(name);
            } catch (err) {
                logger.warn('[IDB] Failed to persist state', err);
            }
        }, 2000);

        debounceMap.set(name, timer);
    },
    removeItem: async (name: string): Promise<void> => {
        if (debounceMap.has(name)) {
            clearTimeout(debounceMap.get(name));
            debounceMap.delete(name);
        }
        await del(name);
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// INDUSTRY PATTERN: Archive Low-Scored Candidates (Linear/Notion)
// Keeps the active list lean for high-performance rendering.
// ═══════════════════════════════════════════════════════════════════════════════
export function archiveCandidates(scores: CandidateScore[]): CandidateScore[] {
    const MAX_ACTIVE_ALL = 500; // Hard cap on active leaderboard

    if (scores.length <= MAX_ACTIVE_ALL) return scores;

    // Keep top winners up to the cap
    return [...scores]
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_ACTIVE_ALL);
}

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
    aiContext: null,
    candidateScores: [],
    stageStats: [],
    result: null,
    metadata: undefined,
    candidatesByStage: {},
    displayedCandidate: null,
    persistentCandidates: [],
    stageHistory: {},
    analyzedCount: 0,
    totalCandidates: 0,
    startedAt: undefined,
    activeAIStage: null,
    allSteps: DEFAULT_STEPS,
    advancedSignals: null,
    decisions: [],
    lastEventId: 0,
    expandedCandidate: null,
});

interface StreamStore extends StreamState {
    setSessionId: (id: string | null) => void;
    setLastEventId: (seq: number) => void;
    clearStore: () => void;
    dispatchStreamEvent: (type: string, payload: any) => void;
    forceError: (msg: string) => void;
    markComplete: () => void;
    setDisplayedCandidate: (id: string | null) => void;
    /** 🔱 TIERED LOADING: Fetch ephemeris for expanded card */
    fetchCandidateEphemeris: (sessionId: string, time: string, stage: number) => Promise<void>;
    /** 🔱 TIERED LOADING: Fetch AI reasoning for expanded card */
    fetchCandidateReasoning: (sessionId: string, time: string, stage: number) => Promise<void>;
    /** 🔱 TIERED LOADING: Clear expanded data on collapse */
    clearExpandedCandidate: () => void;
}

// Thinking buffer for rAF flushes
interface ThinkingBuffer {
    chunks: Map<string, { stage: number; candidateTime: string; text: string }>;
    rafId: number | null;
}

const thinkingBuffer: ThinkingBuffer = {
    chunks: new Map(),
    rafId: null,
};

const scheduleBufferFlush = (cb: FrameRequestCallback): number => {
    if (typeof globalThis.requestAnimationFrame === 'function') {
        return globalThis.requestAnimationFrame(cb);
    }
    return setTimeout(() => cb(Date.now()), 16) as unknown as number;
};

const cancelBufferFlush = (id: number | null): void => {
    if (id === null) return;
    if (typeof globalThis.cancelAnimationFrame === 'function') {
        globalThis.cancelAnimationFrame(id);
        return;
    }
    clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
};

const getCharLimitForScore = (score: number | undefined): number => {
    if (score === undefined) return 15_000;
    if (score >= 85) return 25_000;
    if (score >= 70) return 15_000;
    if (score >= 50) return 10_000;
    return 5_000;
};

const MAX_FULLTEXT_CHARS = 25_000;

function flushThinkingBuffer(set: (fn: (prev: StreamState) => Partial<StreamState>) => void) {
    const buffered = new Map(thinkingBuffer.chunks);
    thinkingBuffer.chunks.clear();
    thinkingBuffer.rafId = null;

    if (buffered.size === 0) return;

    set((prev) => {
        const stageChanges: Record<number, Record<string, any>> = {};
        const historyAppends: Record<number, string> = {};
        let latestCandidate = prev.displayedCandidate;
        let latestStage = prev.activeAIStage;

        buffered.forEach(({ stage, candidateTime, text }) => {
            const existing = prev.candidatesByStage[stage]?.[candidateTime] || {
                stage,
                candidateTime,
                chunks: [],
                fullText: '',
                startedAt: Date.now()
            };

            let newFullText = existing.fullText;
            if (newFullText.length > 50 && text.length > 50 && newFullText.endsWith(text.slice(0, 50))) {
                // Duplicate replay check: append only the new portion
                newFullText += text.slice(50);
            } else {
                newFullText += text;
            }

            // Find score in candidateScores
            const score = prev.candidateScores.find(s => s.time === candidateTime)?.score;
            const charLimit = getCharLimitForScore(score);
            if (newFullText.length > charLimit) {
                newFullText = newFullText.slice(-charLimit);
            }

            const updated = { ...existing, fullText: newFullText, updatedAt: Date.now() };
            if (!stageChanges[stage]) stageChanges[stage] = {};
            stageChanges[stage][candidateTime] = updated;

            historyAppends[stage] = (historyAppends[stage] || '') + text;

            latestCandidate = candidateTime;
            latestStage = stage;
        });

        const newCandidatesByStage = { ...prev.candidatesByStage };
        Object.keys(stageChanges).forEach(stageStr => {
            const s = Number(stageStr);
            newCandidatesByStage[s] = { ...prev.candidatesByStage[s], ...stageChanges[s] };
        });

        const newStageHistory = { ...prev.stageHistory };
        Object.keys(historyAppends).forEach(stageStr => {
            const s = Number(stageStr);
            const appended = (prev.stageHistory[s] || '') + historyAppends[s];
            newStageHistory[s] = appended.slice(-MAX_FULLTEXT_CHARS);
        });

        return {
            candidatesByStage: newCandidatesByStage,
            stageHistory: newStageHistory,
            displayedCandidate: latestCandidate,
            activeAIStage: latestStage
        };
    });
}

export const useStreamStore = create<StreamStore>()(
    devtools(
        persist(
            (set, get) => ({
                ...createInitialState(),

                setSessionId: (id) => {
                    const currentId = get().sessionId;
                    if (id && id !== currentId) {
                        get().clearStore();
                    }
                    set({ sessionId: id });
                },

                clearStore: () => {
                    if (thinkingBuffer.rafId) {
                        cancelBufferFlush(thinkingBuffer.rafId);
                        thinkingBuffer.rafId = null;
                    }
                    thinkingBuffer.chunks.clear();
                    set({ ...createInitialState() });
                },

                setLastEventId: (seq) => set({ lastEventId: seq }),

                forceError: (msg) => set({ error: msg, isComplete: false }),

                markComplete: () => set({ isComplete: true }),

                setDisplayedCandidate: (id) => set({ displayedCandidate: id }),

                // ═══════════════════════════════════════════════════════════════
                // 🔱 TIERED LOADING ACTIONS
                // ═══════════════════════════════════════════════════════════════

                clearExpandedCandidate: () => set({ expandedCandidate: null }),

                fetchCandidateEphemeris: async (sessionId: string, time: string, stage: number) => {
                    // Set loading state immediately
                    set({
                        expandedCandidate: {
                            time,
                            stage,
                            loading: true,
                        },
                    });

                    try {
                        const token = await (window as any).__clerk?.session?.getToken();
                        const backendUrl = (await import('@/lib/config')).env.api.backendUrl.replace(/\/$/, '');

                        const res = await fetch(
                            `${backendUrl}/api/candidate/${sessionId}/${encodeURIComponent(time)}/ephemeris`,
                            {
                                headers: {
                                    Authorization: token ? `Bearer ${token}` : '',
                                },
                            }
                        );

                        if (!res.ok) {
                            set(prev => ({
                                expandedCandidate: prev.expandedCandidate?.time === time
                                    ? { ...prev.expandedCandidate, loading: false, error: `HTTP ${res.status}` }
                                    : prev.expandedCandidate,
                            }));
                            return;
                        }

                        const data = await res.json();
                        set(prev => ({
                            expandedCandidate: prev.expandedCandidate?.time === time
                                ? { ...prev.expandedCandidate, fullEph: data.fullEph, loading: false }
                                : prev.expandedCandidate,
                        }));
                    } catch (err) {
                        set(prev => ({
                            expandedCandidate: prev.expandedCandidate?.time === time
                                ? { ...prev.expandedCandidate, loading: false, error: 'Network error' }
                                : prev.expandedCandidate,
                        }));
                    }
                },

                fetchCandidateReasoning: async (sessionId: string, time: string, stage: number) => {
                    // Merge into existing expanded data
                    set(prev => ({
                        expandedCandidate: {
                            time,
                            stage,
                            fullEph: prev.expandedCandidate?.time === time ? prev.expandedCandidate.fullEph : undefined,
                            loading: true,
                        },
                    }));

                    try {
                        const token = await (window as any).__clerk?.session?.getToken();
                        const backendUrl = (await import('@/lib/config')).env.api.backendUrl.replace(/\/$/, '');

                        const res = await fetch(
                            `${backendUrl}/api/candidate/${sessionId}/${encodeURIComponent(time)}/reasoning?stage=${stage}`,
                            {
                                headers: {
                                    Authorization: token ? `Bearer ${token}` : '',
                                },
                            }
                        );

                        if (!res.ok) {
                            set(prev => ({
                                expandedCandidate: prev.expandedCandidate?.time === time
                                    ? { ...prev.expandedCandidate, loading: false, error: `HTTP ${res.status}` }
                                    : prev.expandedCandidate,
                            }));
                            return;
                        }

                        const data = await res.json();
                        set(prev => ({
                            expandedCandidate: prev.expandedCandidate?.time === time
                                ? { ...prev.expandedCandidate, reasoning: data.reasoning, loading: false }
                                : prev.expandedCandidate,
                        }));
                    } catch (err) {
                        set(prev => ({
                            expandedCandidate: prev.expandedCandidate?.time === time
                                ? { ...prev.expandedCandidate, loading: false, error: 'Network error' }
                                : prev.expandedCandidate,
                        }));
                    }
                },

                dispatchStreamEvent: (type: string, data: any) => {
                    const payload = data.data || data;

                    if (type === 'ai_thinking' && payload.chunk !== undefined) {
                        const { chunk, stage, candidateTime = 'general' } = payload as AIThinkingEventData;
                        const bufferKey = `${stage}_${candidateTime}`;
                        const existing = thinkingBuffer.chunks.get(bufferKey);

                        if (existing) {
                            existing.text += chunk;
                        } else {
                            thinkingBuffer.chunks.set(bufferKey, { stage, candidateTime, text: chunk });
                        }

                        if (!thinkingBuffer.rafId) {
                            thinkingBuffer.rafId = scheduleBufferFlush(() => flushThinkingBuffer(set));
                        }

                        set((prev) => (prev.activeAIStage !== stage ? { activeAIStage: stage } : {}));
                        return;
                    }

                    set((prev) => {
                        switch (type) {
                            case 'initial_state': {
                                const p = (payload as any).progress as PollingProgressData;
                                if (!p) return {};

                                const scoreMap = new Map<string, CandidateScore>();
                                prev.candidateScores.forEach(s => scoreMap.set(`${s.stage}_${s.time}`, s));
                                (p.candidateScores || []).forEach(s => scoreMap.set(`${s.stage}_${s.time}`, s));

                                const newScores = archiveCandidates(Array.from(scoreMap.values()));
                                const maxStage = newScores.length > 0 ? Math.max(...newScores.map(s => s.stage)) : 1;

                                return {
                                    progress: {
                                        step: p.steps?.find((s: any) => s.status === 'running')?.id || DEFAULT_STEPS[p.currentStep || 0].id,
                                        stepIndex: p.currentStep || 0,
                                        totalSteps: p.totalSteps || 7,
                                        percentage: p.percentage || 0,
                                        message: p.message || p.liveMessage || '',
                                        details: p.steps?.[p.currentStep || 0]?.details || []
                                    },
                                    candidateScores: newScores,
                                    startedAt: p.startedAt || prev.startedAt,
                                    activeAIStage: maxStage
                                };
                            }

                            case 'progress': {
                                const p = payload as any;
                                const stepIndex = p.stepIndex ?? p.currentStep ?? 0;
                                const message = p.message || p.liveMessage || '';
                                const steps = p.steps as any[];

                                const updates: Partial<StreamState> = {
                                    progress: {
                                        step: steps?.[stepIndex]?.id || p.step || DEFAULT_STEPS[stepIndex].id,
                                        stepIndex,
                                        totalSteps: p.totalSteps || 7,
                                        percentage: p.percentage || 0,
                                        message,
                                        details: steps?.[stepIndex]?.details || p.details || []
                                    }
                                };

                                if (p.candidateScores && Array.isArray(p.candidateScores) && p.candidateScores.length > 0) {
                                    const scoreMap = new Map<string, CandidateScore>();
                                    prev.candidateScores.forEach(s => scoreMap.set(`${s.stage}_${s.time}`, s));
                                    p.candidateScores.forEach(s => scoreMap.set(`${s.stage}_${s.time}`, s));

                                    const newScores = archiveCandidates(Array.from(scoreMap.values()));
                                    updates.candidateScores = newScores;

                                    const maxStage = newScores.length > 0 ? Math.max(...newScores.map(s => s.stage)) : stepIndex;
                                    updates.activeAIStage = maxStage;
                                    updates.analyzedCount = new Set(newScores.filter(s => s.stage === maxStage).map(s => s.time)).size;
                                } else {
                                    // Clamp to navSTAGES logic if needed, but for now just sync
                                    updates.activeAIStage = (stepIndex === 1 || stepIndex === 2 || stepIndex === 4 || stepIndex === 6) ? stepIndex : prev.activeAIStage;
                                }

                                return updates;
                            }

                            case 'candidate_score':
                            case 'candidate_score_v2':
                            case 'candidate_scores': {
                                const batch = Array.isArray(payload) ? payload : [payload as CandidateScore];
                                if (batch.length === 0) return {};

                                const scoreMap = new Map<string, CandidateScore>();
                                prev.candidateScores.forEach(s => scoreMap.set(`${s.stage}_${s.time}`, s));
                                batch.forEach(s => {
                                    if (s && s.time) scoreMap.set(`${s.stage}_${s.time}`, s);
                                });

                                const newScores = archiveCandidates(Array.from(scoreMap.values()));
                                const maxStage = newScores.length > 0 ? Math.max(...newScores.map(s => s.stage)) : 1;
                                const analyzedCount = new Set(newScores.filter(s => s.stage === maxStage).map(s => s.time)).size;

                                return {
                                    candidateScores: newScores,
                                    analyzedCount,
                                    activeAIStage: maxStage
                                };
                            }

                            case 'ai_context': {
                                const context = payload as AIContextData;
                                return {
                                    aiContext: context,
                                    activeAIStage: context.stage || prev.activeAIStage
                                };
                            }

                            case 'decision': {
                                const d = payload as AnalysisDecision;
                                if (!d || !d.time) return {};
                                const filtered = prev.decisions.filter(x => !(x.time === d.time && x.stage === d.stage));
                                // Cap decisions to last 100 to prevent memory blowup
                                const newDecisions = [...filtered, d].slice(-100);
                                return { decisions: newDecisions };
                            }

                            case 'complete':
                            case 'result': {
                                const directResult = payload?.rectifiedTime ? payload : null;
                                const nestedResult = payload?.result?.rectifiedTime ? payload.result : null;
                                const res = (directResult || nestedResult || prev.result) as StreamResult | null;
                                return { isComplete: true, result: res, error: null };
                            }

                            case 'terminal_state': {
                                const status = payload?.status;
                                const terminalResult = (
                                    payload?.result?.rectifiedTime
                                        ? payload.result
                                        : payload?.data?.result?.rectifiedTime
                                            ? payload.data.result
                                            : payload?.rectifiedTime
                                                ? payload
                                                : prev.result
                                ) as StreamResult | null;
                                const terminalError = payload?.errorMessage || payload?.error || payload?.message;
                                const mergedMetadata = payload?.data
                                    ? { ...(prev.metadata || {}), ...(payload.data as StreamMetadata) }
                                    : prev.metadata;

                                if (status === 'complete' || status === 'success' || status === 'finished') {
                                    return {
                                        isComplete: true,
                                        result: terminalResult,
                                        error: null,
                                        metadata: mergedMetadata
                                    };
                                }

                                return {
                                    isComplete: false,
                                    error: terminalError || `Session ${status || 'failed'}`,
                                    metadata: mergedMetadata
                                };
                            }

                            case 'error': {
                                return { error: payload.message || payload.error || String(payload), isComplete: false };
                            }

                            case 'stage_stats': {
                                const stat = payload as StageStat;
                                const exists = prev.stageStats.findIndex(s => s.stage === stat.stage);
                                const newStats = exists >= 0
                                    ? prev.stageStats.map((s, i) => i === exists ? stat : s)
                                    : [...prev.stageStats, stat];
                                return { stageStats: newStats };
                            }

                            case 'metadata': {
                                const m = payload as StreamMetadata;
                                return { metadata: { ...(prev.metadata || {}), ...m } };
                            }

                            default:
                                return {};
                        }
                    });
                }
            }),
            {
                name: 'btr-stream-storage',
                storage: createJSONStorage(() => idbStorage),
                // ONLY persist essential fields to prevent IndexedDB blowup
                partialize: (state) => ({
                    sessionId: state.sessionId,
                    isComplete: state.isComplete,
                    candidateScores: state.candidateScores,
                    progress: state.progress,
                    activeAIStage: state.activeAIStage,
                    result: state.result,
                    startedAt: state.startedAt
                }),
            }
        ),
        { name: 'BTR-StreamStore', enabled: env.app?.isDevelopment ?? false } as any
    )
);
