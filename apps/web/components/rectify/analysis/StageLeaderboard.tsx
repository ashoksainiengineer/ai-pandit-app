'use client';

import React, { memo, useMemo, useState } from 'react';
import { Trophy, Zap, ChevronDown, ChevronUp, Info, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CandidateScore } from '@/lib/store/stream-types';

import { formatSignDegree } from '@/lib/utils/astrology';

interface StageLeaderboardProps {
    stage: number;
    scores: CandidateScore[];
    isCompleted?: boolean;
}

export const StageLeaderboard = memo(function StageLeaderboard({
    stage: currentMaxStage,
    scores,
    isCompleted = false
}: StageLeaderboardProps) {
    const [expandedTime, setExpandedTime] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStage, setSelectedStage] = useState<number | null>(null);

    // Default to the current max stage if no manual selection
    const activeStage = selectedStage ?? currentMaxStage;

    const availableStages = useMemo(() => {
        return Array.from(new Set(scores.map(s => s.stage))).sort((a, b) => b - a);
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

        return result;
    }, [scores, activeStage, searchQuery]);

    if (stageScores.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 rounded-2xl border overflow-hidden transition-all duration-500 shadow-sm ${isCompleted
                ? 'border-[#F0E8DE] bg-[#FDF8F3]/50'
                : 'border-amber-200 bg-white ring-1 ring-amber-100/50'
                }`}
        >
            {/* 🔱 HEADER - ALIGNED WITH AI PANDIT THEME */}
            <div className={`px-5 py-3.5 flex items-center justify-between border-b ${isCompleted ? 'bg-stone-50/80 border-[#F0E8DE]' : 'bg-amber-50/50 border-amber-200/40'
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isCompleted ? 'bg-white border-stone-200' : 'bg-white border-amber-200 shadow-sm'
                        }`}>
                        <Trophy className={`w-4 h-4 ${isCompleted ? 'text-stone-400' : 'text-amber-600'}`} />
                    </div>
                    <div>
                        <h3 className={`text-[11px] font-bold uppercase tracking-wider ${isCompleted ? 'text-stone-500' : 'text-amber-800'}`}>
                            Stage {activeStage} Top Candidates
                        </h3>
                        <p className="text-[9px] text-stone-400 font-medium">BTR Variations: {stageScores.length} Processed</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Stage Selector Tabs */}
                    <div className="flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200">
                        {availableStages.map(s => (
                            <button
                                key={s}
                                onClick={() => setSelectedStage(s)}
                                className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${activeStage === s
                                    ? 'bg-white text-amber-700 shadow-sm'
                                    : 'text-stone-400 hover:text-stone-600'
                                    }`}
                            >
                                S{s}
                            </button>
                        ))}
                    </div>

                    <span className="text-[10px] font-mono font-bold text-stone-500 px-2 py-1 bg-white border border-stone-100 rounded-md">
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
            <div className="max-h-[450px] overflow-y-auto custom-scrollbar bg-white">
                <div className="p-2 space-y-1.5">
                    <AnimatePresence initial={false}>
                        {stageScores.map((s, idx) => (
                            <div key={`s${activeStage}_${s.time}`} className="group">
                                <motion.div
                                    layout
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
                                        onClick={() => setExpandedTime(expandedTime === s.time ? null : s.time)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[13px] font-mono font-bold ${idx === 0 ? 'text-amber-700' : 'text-stone-700'
                                                        }`}>
                                                        {s.time}
                                                    </span>
                                                    {idx === 0 && (
                                                        <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                            <Zap className="w-2 h-2" /> LEADER
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">
                                                        ASC: <span className="text-stone-600 font-mono">{s.minifiedEph?.ascendant.split(' ')[0]}</span>
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-stone-200" />
                                                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">
                                                        MOON: <span className="text-stone-600 font-mono">{s.minifiedEph?.moon.split(' ')[0]}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-sm font-bold font-mono ${s.score > 85 ? 'text-[#184131]' : 'text-[#B8860B]'
                                                    }`}>
                                                    {s.score.toFixed(1)}%
                                                </span>
                                                <div className="w-16 h-1 bg-stone-100 rounded-full mt-1 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${s.score}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className={`h-full rounded-full ${s.score > 85 ? 'bg-[#184131]' : 'bg-[#B8860B]'
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
                                                    {s.fullEph ? (
                                                        Object.entries(s.fullEph).map(([planet, position]) => (
                                                            <div key={planet} className="p-2.5 rounded-lg bg-white border border-stone-100 flex flex-col gap-0.5 shadow-sm hover:border-amber-200 transition-colors">
                                                                <span className="text-[8px] font-bold uppercase text-stone-400 tracking-wider">{planet}</span>
                                                                <span className="text-[10px] font-mono font-bold text-stone-700 whitespace-nowrap overflow-hidden text-ellipsis">
                                                                    {formatSignDegree(position)}
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="col-span-full py-4 text-center">
                                                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                                                <Info className="w-3 h-3" /> Analyzing planetary precision...
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="px-4 py-2 bg-stone-100/30 border-t border-stone-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[8px] font-bold text-stone-400 flex items-center gap-1">
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
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E5E0D8;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #B8860B;
                }
            `}</style>
        </motion.div>
    );
});
