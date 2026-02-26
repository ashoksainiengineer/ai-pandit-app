'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, Trophy, TrendingUp, ChevronDown, ChevronUp, ArrowUpDown, Filter } from 'lucide-react';

// Interfaces and Types
interface CandidateScore {
    time: string;
    score: number;
    stage: number;
    rank?: number;
    offsetMinutes?: number;
    reason?: string;
    minifiedEph?: { sun: string; moon: string; ascendant: string; };
}

interface CandidateLevelTablesProps {
    candidateScores: CandidateScore[];
    currentStage: number;
    onSelectCandidate?: (time: string) => void;
}

type SortField = 'score' | 'time';
type SortOrder = 'asc' | 'desc';

// Constants
const STAGES = [
    { id: 2, name: 'Coarse (AI)', level: 1, icon: Target, color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    { id: 4, name: 'Deep Analysis (AI)', level: 2, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { id: 6, name: 'Final Precision (AI)', level: 3, icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
];
const SHOW_OPTIONS = [5, 10, 20, 'All'] as const;

// Sub-component for a single stage's table
function StageTable({ stage, candidateScores, onSelectCandidate }: {
    stage: typeof STAGES[0];
    candidateScores: CandidateScore[];
    onSelectCandidate?: (time: string) => void;
}) {
    const [settings, setSettings] = useState({
        sortField: 'score' as SortField,
        sortOrder: 'desc' as SortOrder,
        showCount: 5 as (typeof SHOW_OPTIONS)[number] | 'All',
        expandedRow: null as string | null,
    });

    const toggleSort = (field: SortField) => {
        setSettings(prev => ({
            ...prev,
            sortField: field,
            sortOrder: prev.sortField === field && prev.sortOrder === 'desc' ? 'asc' : 'desc',
        }));
    };

    const sortedResults = useMemo(() => {
        return [...candidateScores].sort((a, b) => {
            if (settings.sortField === 'score') {
                return settings.sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
            }
            return settings.sortOrder === 'asc' ? a.time.localeCompare(b.time) : b.time.localeCompare(a.time);
        });
    }, [candidateScores, settings.sortField, settings.sortOrder]);

    const results = settings.showCount === 'All' ? sortedResults : sortedResults.slice(0, settings.showCount as number);
    const isStarted = candidateScores.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`glass-card p-5 border ${stage.border} relative overflow-hidden flex flex-col bg-white rounded-xl`}
        >
            {isStarted && <div className={`absolute -top-10 -right-10 w-48 h-48 ${stage.bg} blur-[100px] rounded-full opacity-30`} />}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stage.bg}`}><stage.icon className={`w-5 h-5 ${stage.color}`} /></div>
                    <div>
                        <h4 className="text-sm font-bold text-[#1A1612]">Stage {stage.id}</h4>
                        <p className="text-[10px] text-[#7A756F] uppercase tracking-wider">{stage.name}</p>
                    </div>
                </div>
                {isStarted && (
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select
                                value={settings.showCount}
                                onChange={(e) => setSettings(prev => ({ ...prev, showCount: e.target.value === 'All' ? 'All' as const : parseInt(e.target.value) as 5 | 10 | 20 }))}
                                className="appearance-none bg-[#FDF8F3] border border-[#F0E8DE] rounded-lg px-2 py-1 text-[10px] text-[#7A756F] cursor-pointer hover:border-[#78611D]/50 transition-colors pr-6"
                            >
                                {SHOW_OPTIONS.map(opt => <option key={opt} value={opt}>Top {opt}</option>)}
                            </select>
                            <Filter className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-[#7A756F] pointer-events-none" />
                        </div>
                        <span className={`text-[10px] font-mono ${stage.color} font-bold bg-[#F5EFE7] px-2 py-1 rounded border border-[#F0E8DE]`}>
                            {candidateScores.length} Total
                        </span>
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FFFCF8] rounded-xl border border-[#F0E8DE] shadow-inner max-h-[350px]">
                {isStarted ? (
                    <table className="w-full text-xs border-separate border-spacing-0">
                        <thead className="bg-[#FDF8F3] sticky top-0 z-10">
                            <tr className="text-[#7A756F]">
                                <th className="px-3 py-2.5 text-left font-bold uppercase tracking-widest text-[9px] border-b border-[#F0E8DE] w-12">#</th>
                                <th onClick={() => toggleSort('time')} className="px-3 py-2.5 text-left font-bold uppercase tracking-widest text-[9px] border-b border-[#F0E8DE] cursor-pointer hover:text-[#78611D] transition-colors group">
                                    <div className="flex items-center gap-1">Time <ArrowUpDown className={`w-3 h-3 opacity-50 group-hover:opacity-100 ${settings.sortField === 'time' ? 'text-[#78611D]' : ''}`} /></div>
                                </th>
                                <th onClick={() => toggleSort('score')} className="px-3 py-2.5 text-center font-bold uppercase tracking-widest text-[9px] border-b border-[#F0E8DE] cursor-pointer hover:text-[#78611D] transition-colors group">
                                    <div className="flex items-center justify-center gap-1">Score <ArrowUpDown className={`w-3 h-3 opacity-50 group-hover:opacity-100 ${settings.sortField === 'score' ? 'text-[#78611D]' : ''}`} /></div>
                                </th>
                                <th className="px-3 py-2.5 text-left font-bold uppercase tracking-widest text-[9px] border-b border-[#F0E8DE]">Key Reason</th>
                                <th className="px-3 py-2.5 text-center font-bold uppercase tracking-widest text-[9px] border-b border-[#F0E8DE] w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0E8DE]">
                            <AnimatePresence>
                                {results.map((c, idx) => (
                                    <motion.tr layout key={`${c.time}-${idx}`} className={`group hover:bg-[#F5EFE7] transition-all duration-300 ${settings.expandedRow === c.time ? 'bg-[#78611D]/5' : ''}`}>
                                        <td className="px-3 py-2.5 text-[#7A756F] font-mono text-[10px]">{idx + 1}</td>
                                        <td onClick={() => onSelectCandidate?.(c.time)} className="px-3 py-2.5 font-mono text-[#1A1612] font-bold text-sm tracking-tighter cursor-pointer hover:text-[#78611D]">
                                            <div className="flex flex-col"><span>{c.time}</span>{c.offsetMinutes !== undefined && <span className="text-[9px] text-[#7A756F]">{c.offsetMinutes >= 0 ? '+' : ''}{c.offsetMinutes.toFixed(1)}m</span>}</div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-16 bg-[#F0E8DE] rounded-full h-1.5 overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${c.score}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className={`h-full rounded-full ${c.score >= 80 ? 'bg-emerald-600 shadow-[0_0_10px_rgba(22,163,74,0.3)]' : c.score >= 60 ? 'bg-amber-600' : 'bg-rose-600'}`} />
                                                </div>
                                                <span className="font-mono text-[11px] font-bold text-[#1A1612] w-8">{Math.round(c.score)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-[10px] text-[#4A453F] max-w-[200px]"><span className="line-clamp-2" title={c.reason || 'No detailed reason'}>{c.reason || 'Vedic correlation identified'}</span></td>
                                        <td className="px-3 py-2.5 text-center">
                                            <button onClick={() => setSettings(p => ({ ...p, expandedRow: p.expandedRow === c.time ? null : c.time }))} className="p-1 rounded hover:bg-[#F5EFE7] transition-colors">
                                                {settings.expandedRow === c.time ? <ChevronUp className="w-4 h-4 text-[#78611D]" /> : <ChevronDown className="w-4 h-4 text-[#7A756F]" />}
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                ) : (
                    <div className="h-[200px] flex flex-col items-center justify-center text-[#7A756F] text-[10px] uppercase font-bold tracking-[0.2em] bg-gradient-to-b from-transparent to-[#FDF8F3]/40">
                        <div className="w-12 h-12 border border-[#F0E8DE] rounded-full flex items-center justify-center mb-4 relative">
                            <Zap className="w-5 h-5 text-[#E8E0D5] animate-pulse" />
                            <div className="absolute inset-0 border-t-2 border-[#78611D]/30 rounded-full animate-spin" />
                        </div>
                        <span className="animate-pulse">Awaiting Stage {stage.id} Analysis</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// Main Component
export function CandidateLevelTables({ candidateScores, currentStage, onSelectCandidate }: CandidateLevelTablesProps) {
    const scoresByStage = useMemo(() => {
        const byStage: Record<number, CandidateScore[]> = { 2: [], 4: [], 6: [] };
        candidateScores.forEach(c => {
            if (c.stage >= 2) byStage[2].push(c);
            if (c.stage >= 4) byStage[4].push(c);
            if (c.stage >= 6) byStage[6].push(c);
        });
        return byStage;
    }, [candidateScores]);

    return (
        <div className="flex flex-col gap-6">
            {STAGES.map(stage => (
                <StageTable
                    key={stage.id}
                    stage={stage}
                    candidateScores={scoresByStage[stage.id] || []}
                    onSelectCandidate={onSelectCandidate}
                />
            ))}
        </div>
    );
}
