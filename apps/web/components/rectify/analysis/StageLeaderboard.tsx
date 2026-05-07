'use client';

import { memo, useMemo, useState, useCallback } from 'react';
import { Trophy, Zap, ChevronDown, ChevronUp, Info, Activity, Loader2, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CandidateScore } from '@/lib/store/stream-types';
import { useStreamStore } from '@/lib/store/stream-store';

import { formatSignDegree } from '@/lib/utils/astrology';

import { STAGES } from '@/lib/constants/stages';

// Available stages to show in the selector
// Available stages to show in the selector (S1 removed as per user request to reduce memory/bloat)
const navSTAGES = [2, 4, 6];

interface StageLeaderboardProps {
    stage: number;
    scores: CandidateScore[];
    isCompleted?: boolean;
    sessionId?: string;
}

export const StageLeaderboard = memo(function StageLeaderboard({
    stage: currentMaxStage,
    scores,
    isCompleted = false,
    sessionId,
}: StageLeaderboardProps) {
    const [expandedTime, setExpandedTime] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStage, setSelectedStage] = useState<number | null>(null);

    // 🔱 TIERED LOADING: Store state for on-demand data
    const expandedCandidate = useStreamStore(s => s.expandedCandidate);
    const fetchEphemeris = useStreamStore(s => s.fetchCandidateEphemeris);
    const clearExpanded = useStreamStore(s => s.clearExpandedCandidate);

    // Default to the highest precision stage that has data, or the current max stage
    const activeStage = useMemo(() => {
        if (selectedStage !== null) return selectedStage;

        // Find the highest stage in navSTAGES that actually has scores
        const stagesWithData = navSTAGES.filter(s => scores.some(sc => sc.stage === s));
        if (stagesWithData.length > 0) {
            return Math.max(...stagesWithData);
        }

        // Fallback to currentMaxStage (clamped to navSTAGES)
        return navSTAGES.includes(currentMaxStage) ? currentMaxStage : Math.max(...navSTAGES);
    }, [selectedStage, currentMaxStage, scores]);

    // Compute stats per stage (total candidates and batches)
    const stageStatsMap = useMemo(() => {
        const map: Record<number, { totalCandidates: number; batches: Set<number | undefined>; hasData: boolean }> = {};
        navSTAGES.forEach(s => {
            map[s] = { totalCandidates: 0, batches: new Set(), hasData: false };
        });
        scores.forEach(s => {
            if (!map[s.stage]) {
                map[s.stage] = { totalCandidates: 0, batches: new Set(), hasData: false };
            }
            map[s.stage].totalCandidates++;
            map[s.stage].hasData = true;
            if (s.batch !== undefined) {
                map[s.stage].batches.add(s.batch);
            }
        });
        return map;
    }, [scores]);

    const stageScores = useMemo(() => {
        // Take unique by time, highest score first, handle persistence by merging
        const unique = new Map<string, CandidateScore>();
        scores.forEach(s => {
            if (s.stage !== activeStage) return;
            const existing = unique.get(s.time);
            if (!existing || s.score > existing.score) unique.set(s.time, s);
        });

        let result = Array.from(unique.values()).sort((a, b) => b.score - a.score);

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.time.toLowerCase().includes(query) ||
                (s.minifiedEph?.ascendant && s.minifiedEph.ascendant.toLowerCase().includes(query))
            );
        }

        // 🔱 TIERED LOADING: No limit — all candidates render (Tier 1 data only = lightweight)
        return result;
    }, [scores, activeStage, searchQuery]);

    // 🔱 TIERED LOADING: On-demand expand handler
    const handleExpand = useCallback((time: string) => {
        if (expandedTime === time) {
            // Collapse → clear heavy data from memory
            setExpandedTime(null);
            clearExpanded();
        } else {
            // Expand → set time and fetch ephemeris on demand
            setExpandedTime(time);
            if (sessionId) {
                fetchEphemeris(sessionId, time, activeStage);
            }
        }
    }, [expandedTime, sessionId, activeStage, fetchEphemeris, clearExpanded]);

    const activeStageStat = stageStatsMap[activeStage];
    const batchCount = activeStageStat?.batches?.size || 0;

    // Don't render if NO data for the selected stage, but allow S1 to show during grid generation
    if (stageScores.length === 0 && activeStage !== 1) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 rounded-2xl border overflow-hidden transition-all duration-500 shadow-sm ${isCompleted
                ? 'border-[rgba(0,0,0,0.08)] bg-[#ffffff]/50'
                : 'border-amber-200 bg-white ring-1 ring-amber-100/50'
                }`}
        >
            {/* 🔱 HEADER - ALIGNED WITH AI PANDIT THEME */}
            <div className={`px-5 py-3.5 flex items-center justify-between border-b ${isCompleted ? 'bg-stone-50/80 border-[rgba(0,0,0,0.08)]' : 'bg-amber-50/50 border-amber-200/40'
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isCompleted ? 'bg-white border-stone-200' : 'bg-white border-amber-200 shadow-sm'
                        }`}>
                        <Trophy className={`w-4 h-4 ${isCompleted ? 'text-stone-400' : 'text-amber-600'}`} />
                    </div>
                    <div>
                        <h3 className={`text-[11px] font-medium uppercase tracking-wider ${isCompleted ? 'text-stone-500' : 'text-amber-800'}`}>
                            {STAGES[activeStage]?.name || `Stage ${activeStage} Candidates`}
                        </h3>
                        <p className="text-[9px] text-stone-400 font-medium">
                            {activeStageStat?.totalCandidates || 0} candidates scored
                            {batchCount > 0 && ` · ${batchCount} batches`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Stage Selector Tabs - Fixed to S2, S4, S6 (S1 removed) */}
                    <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-200">
                        {navSTAGES.map(s => {
                            const hasData = stageStatsMap[s]?.hasData;
                            const isActive = activeStage === s;
                            return (
                                <button
                                    key={s}
                                    onClick={() => setSelectedStage(s)}
                                    disabled={!hasData}
                                    className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all flex items-center gap-1.5 ${isActive
                                        ? 'bg-amber-600 text-white shadow-md scale-105 z-10'
                                        : hasData
                                            ? 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
                                            : 'text-stone-300 cursor-not-allowed opacity-50'
                                        }`}
                                >
                                    S{s}
                                    {hasData && stageStatsMap[s].totalCandidates > 0 && (
                                        <span className={`text-[8px] font-mono ${isActive ? 'text-amber-100' : 'text-stone-400'}`}>
                                            ({stageStatsMap[s].totalCandidates})
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <span className="text-[10px] font-mono font-medium text-stone-500 px-2 py-1 bg-white border border-stone-100 rounded-md">
                        {stageScores.length} UNITS
                    </span>
                </div>
            </div>

            {/* 🔱 SEARCH BAR */}
            <div className="px-5 py-2 border-b border-stone-50 bg-[#FAF8F5]/30">
                <input
                    type="text"
                    placeholder="Search candidate time or ascendant..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-200/50 outline-none transition-all"
                />
            </div>

            {/* 🔱 SCROLLABLE CONTAINER (SLIDER STYLE) */}
            <div className="max-h-[450px] overflow-y-auto bg-white [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#E5E0D8] hover:[&::-webkit-scrollbar-thumb]:bg-[#000000]">
                <div className="p-2 space-y-1.5">
                    <AnimatePresence initial={false}>
                        {stageScores.length > 0 ? (
                            stageScores.map((s, idx) => (
                                <div key={`s${activeStage}_${s.time}`} className="group">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`relative rounded-xl border transition-all duration-200 ${expandedTime === s.time
                                            ? 'border-amber-300 bg-amber-50/30 shadow-sm'
                                            : 'border-stone-100 bg-white hover:border-amber-200 hover:bg-stone-50/40'
                                            }`}
                                    >
                                        {/* Main Row Content */}
                                        <div
                                            className="px-4 py-2.5 flex items-center justify-between cursor-pointer"
                                            onClick={() => handleExpand(s.time)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleExpand(s.time);
                                                }
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            aria-expanded={expandedTime === s.time}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[13px] font-mono font-medium ${idx === 0 && s.score > 0 ? 'text-amber-700' : 'text-stone-700'
                                                            }`}>
                                                            {s.time}
                                                        </span>
                                                        {idx === 0 && s.score > 0 && (
                                                            <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                                <Zap className="w-2 h-2" /> LEADER: The current top-ranked candidate
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[9px] uppercase font-medium text-stone-400 tracking-wider">
                                                            ASC: <span className="text-stone-600 font-mono">{s.minifiedEph?.ascendant}</span>
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full bg-stone-200" />
                                                        <span className="text-[9px] uppercase font-medium text-stone-400 tracking-wider">
                                                            MOON: <span className="text-stone-600 font-mono">{s.minifiedEph?.moon?.split(' ')[0] ?? '-'}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-sm font-medium font-mono ${s.score > 85 ? 'text-[#184131]' : (s.score > 0 ? 'text-black' : 'text-stone-400')
                                                        }`}>
                                                        {s.score > 0 ? `${s.score.toFixed(1)}%` : 'PENDING'}
                                                    </span>
                                                    <div className="w-16 h-1 bg-stone-100 rounded-full mt-1 overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${s.score}%` }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                            className={`h-full rounded-full ${s.score > 85 ? 'bg-[#184131]' : 'bg-[#000000]'
                                                                }`}
                                                        />
                                                    </div>
                                                </div>
                                                {expandedTime === s.time ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                                            </div>
                                        </div>

                                        {/* 🔱 EXPANDABLE DMS GRID - LIGHT VERSION */}
                                        <AnimatePresence>
                                            {expandedTime === s.time && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden border-t border-stone-100 bg-stone-50/50"
                                                >
                                                    <div className="p-3.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                                                        {/* 🔱 TIERED LOADING: Use store's expanded data or candidate's own fullEph */}
                                                        {(() => {
                                                            const ephData = (expandedCandidate?.time === s.time && expandedCandidate.fullEph)
                                                                ? expandedCandidate.fullEph
                                                                : s.fullEph;
                                                            const isLoading = expandedCandidate?.time === s.time && expandedCandidate.loading;

                                                            if (isLoading) {
                                                                return (
                                                                    <div className="col-span-full py-6 text-center">
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                                                            <span className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                                                                                Loading Ephemeris...
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            if (ephData) {
                                                                return Object.entries(ephData).map(([planet, position]) => (
                                                                    <div key={planet} className="p-2.5 rounded-lg bg-white border border-stone-100 flex flex-col gap-0.5 shadow-sm hover:border-amber-200 transition-colors">
                                                                        <span className="text-[8px] font-medium uppercase text-stone-400 tracking-wider">{planet}</span>
                                                                        <span className="text-[10px] font-mono font-medium text-stone-700 whitespace-nowrap overflow-hidden text-ellipsis">
                                                                            {formatSignDegree(position)}
                                                                        </span>
                                                                    </div>
                                                                ));
                                                            }

                                                            return (
                                                                <div className="col-span-full py-4 text-center">
                                                                    <p className="text-[10px] text-stone-400 font-medium uppercase tracking-widest flex items-center justify-center gap-2">
                                                                        <Info className="w-3 h-3" /> Precision data available on-demand
                                                                    </p>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>

                                                    <div className="px-4 py-2 bg-stone-100/30 border-t border-stone-100 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[8px] font-medium text-stone-400 flex items-center gap-1">
                                                                <MapIcon className="w-2.5 h-2.5" /> High Precision Ephemeris
                                                            </span>
                                                        </div>
                                                        <span className="text-[8px] font-mono text-stone-300">ID: {s.time.replace(':', '')}</span>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-stone-300 gap-3">
                                <Activity className="w-8 h-8 animate-pulse" />
                                <p className="text-[10px] font-medium uppercase tracking-widest">Generating Grid Basis...</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            </motion.div>
    );
});
