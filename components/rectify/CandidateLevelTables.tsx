'use client';

// components/rectify/CandidateLevelTables.tsx
// Enhanced Candidate Tables with sorting, expandable rows, and filtering

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, Trophy, TrendingUp, ChevronDown, ChevronUp, ArrowUpDown, Filter } from 'lucide-react';

interface CandidateScore {
    time: string;
    score: number;
    stage: number;
    rank?: number;
    offsetMinutes?: number;
    reason?: string; // AI's key verdict
    minifiedEph?: {
        sun: string;
        moon: string;
        ascendant: string;
    };
}

interface CandidateLevelTablesProps {
    candidateScores: CandidateScore[];
    currentStage: number;
    onSelectCandidate?: (time: string) => void;
}

type SortField = 'score' | 'time';
type SortOrder = 'asc' | 'desc';

const STAGES = [
    { id: 2, name: 'Coarse (AI)', level: 1, icon: Target, color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    { id: 4, name: 'Deep Analysis (AI)', level: 2, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { id: 6, name: 'Final Precision (AI)', level: 3, icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
];

const SHOW_OPTIONS = [5, 10, 20, 'All'] as const;

export function CandidateLevelTables({ candidateScores, currentStage, onSelectCandidate }: CandidateLevelTablesProps) {
    // State for each stage's sort and filter settings
    const [stageSettings, setStageSettings] = useState<Record<number, {
        sortField: SortField;
        sortOrder: SortOrder;
        showCount: number | 'All';
        expandedRow: string | null;
    }>>({
        2: { sortField: 'score', sortOrder: 'desc', showCount: 5, expandedRow: null },
        4: { sortField: 'score', sortOrder: 'desc', showCount: 5, expandedRow: null },
        6: { sortField: 'score', sortOrder: 'desc', showCount: 5, expandedRow: null },
    });

    const toggleSort = (stageId: number, field: SortField) => {
        setStageSettings(prev => {
            const current = prev[stageId];
            const newOrder = current.sortField === field && current.sortOrder === 'desc' ? 'asc' : 'desc';
            return {
                ...prev,
                [stageId]: { ...current, sortField: field, sortOrder: newOrder }
            };
        });
    };

    const setShowCount = (stageId: number, count: number | 'All') => {
        setStageSettings(prev => ({
            ...prev,
            [stageId]: { ...prev[stageId], showCount: count }
        }));
    };

    const toggleExpand = (stageId: number, time: string) => {
        setStageSettings(prev => ({
            ...prev,
            [stageId]: {
                ...prev[stageId],
                expandedRow: prev[stageId].expandedRow === time ? null : time
            }
        }));
    };

    return (
        <div className="flex flex-col gap-6">
            {STAGES.map((stage) => {
                const settings = stageSettings[stage.id];
                const rawResults = candidateScores.filter(c => c.stage >= stage.id);

                // Sort results
                const sortedResults = useMemo(() => {
                    return [...rawResults].sort((a, b) => {
                        if (settings.sortField === 'score') {
                            return settings.sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
                        } else {
                            return settings.sortOrder === 'asc'
                                ? a.time.localeCompare(b.time)
                                : b.time.localeCompare(a.time);
                        }
                    });
                }, [rawResults, settings.sortField, settings.sortOrder]);

                // Apply show count filter
                const results = settings.showCount === 'All'
                    ? sortedResults
                    : sortedResults.slice(0, settings.showCount);

                const isStarted = rawResults.length > 0;

                return (
                    <motion.div
                        key={stage.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`glass-card p-5 border ${stage.border} relative overflow-hidden flex flex-col bg-white rounded-xl`}
                    >
                        {/* Background Glow */}
                        {isStarted && (
                            <div className={`absolute -top-10 -right-10 w-48 h-48 ${stage.bg} blur-[100px] rounded-full opacity-30`} />
                        )}

                        {/* Title Header */}
                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${stage.bg}`}>
                                    <stage.icon className={`w-5 h-5 ${stage.color}`} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#1A1612]">Stage {stage.id}</h4>
                                    <p className="text-[10px] text-[#7A756F] uppercase tracking-wider">{stage.name}</p>
                                </div>
                            </div>

                            {isStarted && (
                                <div className="flex items-center gap-2">
                                    {/* Show Count Dropdown */}
                                    <div className="relative">
                                        <select
                                            value={settings.showCount}
                                            onChange={(e) => setShowCount(stage.id, e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
                                            className="appearance-none bg-[#FDF8F3] border border-[#F0E8DE] rounded-lg px-2 py-1 text-[10px] text-[#7A756F] cursor-pointer hover:border-[#D4AF37]/50 transition-colors pr-6"
                                        >
                                            {SHOW_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>Top {opt}</option>
                                            ))}
                                        </select>
                                        <Filter className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-[#7A756F] pointer-events-none" />
                                    </div>

                                    <span className={`text-[10px] font-mono ${stage.color} font-bold bg-[#F5EFE7] px-2 py-1 rounded border border-[#F0E8DE]`}>
                                        {rawResults.length} Total
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Results Table */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FFFCF8] rounded-xl border border-[#F0E8DE] shadow-inner max-h-[350px]">
                            {isStarted ? (
                                <table className="w-full text-xs border-separate border-spacing-0">
                                    <thead className="bg-[#FDF8F3] sticky top-0 z-10">
                                        <tr className="text-[#7A756F]">
                                            <th className="px-3 py-2.5 text-left font-bold uppercase tracking-widest text-[9px] border-b border-[#F0E8DE] w-12">#</th>
                                            <th
                                                onClick={() => toggleSort(stage.id, 'time')}
                                                className="px-3 py-2.5 text-left font-bold uppercase tracking-widest text-[9px] border-b border-[#F0E8DE] cursor-pointer hover:text-[#D4AF37] transition-colors group"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Time
                                                    <ArrowUpDown className={`w-3 h-3 opacity-50 group-hover:opacity-100 ${settings.sortField === 'time' ? 'text-[#D4AF37]' : ''}`} />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => toggleSort(stage.id, 'score')}
                                                className="px-3 py-2.5 text-center font-bold uppercase tracking-widest text-[9px] border-b border-[#F0E8DE] cursor-pointer hover:text-[#D4AF37] transition-colors group"
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    Score
                                                    <ArrowUpDown className={`w-3 h-3 opacity-50 group-hover:opacity-100 ${settings.sortField === 'score' ? 'text-[#D4AF37]' : ''}`} />
                                                </div>
                                            </th>
                                            <th className="px-3 py-2.5 text-left font-bold uppercase tracking-widest text-[9px] border-b border-[#F0E8DE]">Key Reason</th>
                                            <th className="px-3 py-2.5 text-center font-bold uppercase tracking-widest text-[9px] border-b border-[#F0E8DE] w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F0E8DE]">
                                        {results.map((c, idx) => {
                                            const isExpanded = settings.expandedRow === c.time;
                                            return (
                                                <motion.tr
                                                    key={`${c.time}-${idx}`}
                                                    layout
                                                    className={`group hover:bg-[#F5EFE7] transition-all duration-300 ${isExpanded ? 'bg-[#D4AF37]/5' : ''}`}
                                                >
                                                    {/* Rank */}
                                                    <td className="px-3 py-2.5 text-[#7A756F] font-mono text-[10px]">
                                                        {idx + 1}
                                                    </td>

                                                    {/* Time */}
                                                    <td
                                                        className="px-3 py-2.5 font-mono text-[#1A1612] font-bold text-sm tracking-tighter cursor-pointer hover:text-[#D4AF37]"
                                                        onClick={() => onSelectCandidate?.(c.time)}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span>{c.time}</span>
                                                            {c.offsetMinutes !== undefined && (
                                                                <span className="text-[9px] text-[#7A756F]">
                                                                    {c.offsetMinutes >= 0 ? '+' : ''}{c.offsetMinutes.toFixed(1)}m
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Score Bar */}
                                                    <td className="px-3 py-2.5">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="w-16 bg-[#F0E8DE] rounded-full h-1.5 overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${c.score}%` }}
                                                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                                                    className={`h-full rounded-full ${c.score >= 80 ? 'bg-emerald-600 shadow-[0_0_10px_rgba(22,163,74,0.3)]' : c.score >= 60 ? 'bg-amber-600' : 'bg-rose-600'}`}
                                                                />
                                                            </div>
                                                            <span className="font-mono text-[11px] font-bold text-[#1A1612] w-8">
                                                                {Math.round(c.score)}%
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Key Reason */}
                                                    <td className="px-3 py-2.5 text-[10px] text-[#4A453F] max-w-[200px]">
                                                        <span className="line-clamp-2" title={c.reason || 'No detailed reason provided'}>
                                                            {c.reason || (c.score >= 80 ? 'Strong dasha correlation' : c.score >= 60 ? 'Partial event match' : 'Vedic correlation identified')}
                                                        </span>
                                                    </td>

                                                    {/* Expand Button */}
                                                    <td className="px-3 py-2.5 text-center">
                                                        <button
                                                            onClick={() => toggleExpand(stage.id, c.time)}
                                                            className="p-1 rounded hover:bg-[#F5EFE7] transition-colors"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronUp className="w-4 h-4 text-[#D4AF37]" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4 text-[#7A756F]" />
                                                            )}
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}

                                        {/* Expanded Row Details */}
                                        <AnimatePresence>
                                            {results.map((c) => {
                                                if (settings.expandedRow !== c.time) return null;
                                                return (
                                                    <motion.tr
                                                        key={`${c.time}-expanded`}
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="bg-[#FDF8F3]"
                                                    >
                                                        <td colSpan={5} className="px-4 py-4">
                                                            <div className="grid grid-cols-3 gap-4 text-[10px]">
                                                                {/* Ephemeris Summary */}
                                                                <div className="bg-white rounded-lg p-3 border border-[#F0E8DE]">
                                                                    <div className="text-[9px] text-[#7A756F] uppercase tracking-wider mb-2 font-bold">Planetary Snapshot</div>
                                                                    {c.minifiedEph ? (
                                                                        <div className="space-y-1.5 font-mono">
                                                                            <div className="flex justify-between">
                                                                                <span className="text-[#D4AF37]">☉ Sun</span>
                                                                                <span className="text-emerald-700">{c.minifiedEph.sun}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-[#D4AF37]">☽ Moon</span>
                                                                                <span className="text-emerald-700">{c.minifiedEph.moon}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-[#D4AF37]">↑ Asc</span>
                                                                                <span className="text-emerald-700">{c.minifiedEph.ascendant}</span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[#7A756F] italic">Data not available</span>
                                                                    )}
                                                                </div>

                                                                {/* Score Details */}
                                                                <div className="bg-white rounded-lg p-3 border border-[#F0E8DE]">
                                                                    <div className="text-[9px] text-[#7A756F] uppercase tracking-wider mb-2 font-bold">Analysis Summary</div>
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-[#7A756F]">AI Score</span>
                                                                            <span className={`font-bold ${c.score >= 80 ? 'text-emerald-700' : c.score >= 60 ? 'text-amber-700' : 'text-rose-700'}`}>
                                                                                {c.score.toFixed(1)}%
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-[#7A756F]">Stage</span>
                                                                            <span className="text-[#1A1612]">{stage.id}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-[#7A756F]">Status</span>
                                                                            <span className={c.score >= 70 ? 'text-emerald-700' : 'text-amber-700'}>
                                                                                {c.score >= 70 ? 'Optimal' : 'Review'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* AI Verdict */}
                                                                <div className="bg-white rounded-lg p-3 border border-[#F0E8DE]">
                                                                    <div className="text-[9px] text-[#7A756F] uppercase tracking-wider mb-2 font-bold">AI Verdict</div>
                                                                    <p className="text-[#4A453F] leading-relaxed">
                                                                        {c.reason || 'Candidate passed through AI analysis. Dasha periods and event timing correlations were evaluated against life events provided.'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-[200px] flex flex-col items-center justify-center text-[#7A756F] text-[10px] uppercase font-bold tracking-[0.2em] bg-gradient-to-b from-transparent to-[#FDF8F3]/40">
                                    <div className="w-12 h-12 border border-[#F0E8DE] rounded-full flex items-center justify-center mb-4 relative">
                                        <Zap className="w-5 h-5 text-[#E8E0D5] animate-pulse" />
                                        <div className="absolute inset-0 border-t-2 border-[#D4AF37]/30 rounded-full animate-spin" />
                                    </div>
                                    <span className="animate-pulse">Awaiting Stage {stage.id} Analysis</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
