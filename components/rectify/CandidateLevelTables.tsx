'use client';

// components/rectify/CandidateLevelTables.tsx
// Decoupled cards for Level 1, 2, and 3 candidate results

import { motion } from 'framer-motion';
import { Target, Zap, Trophy, TrendingUp } from 'lucide-react';

interface CandidateScore {
    time: string;
    score: number;
    stage: number;
    rank?: number;
    offsetMinutes?: number;
    minifiedEph?: {
        sun: string;
        moon: string;
        ascendant: string;
    };
}

interface CandidateLevelTablesProps {
    candidateScores: CandidateScore[];
    currentStage: number;
}

const STAGES = [
    { id: 1, name: 'Discovery (1m)', level: 1, icon: Target, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    { id: 2, name: 'Convergence (30s)', level: 2, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { id: 3, name: 'Micro-Audit (6s)', level: 3, icon: Trophy, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
];

export function CandidateLevelTables({ candidateScores, currentStage }: CandidateLevelTablesProps) {
    return (
        <div className="flex flex-col gap-6">
            {STAGES.map((stage) => {
                const results = candidateScores
                    .filter(c => c.stage === stage.id)
                    .sort((a, b) => b.score - a.score);

                // If no results yet for this stage, show a placeholder if it's the current or next stage
                const isStarted = results.length > 0;

                return (
                    <motion.div
                        key={stage.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`glass-card p-5 border ${stage.border} relative overflow-hidden h-[400px] flex flex-col`}
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
                                    <h4 className="text-sm font-bold text-[#F5F0EB]">Level {stage.level}</h4>
                                    <p className="text-[10px] text-[#8C7F72] uppercase tracking-wider">{stage.name}</p>
                                </div>
                            </div>
                            {isStarted && (
                                <span className={`text-[10px] font-mono ${stage.color} font-bold bg-white/5 px-2 py-1 rounded border border-white/5`}>
                                    {results.length} Candidates Tracked
                                </span>
                            )}
                        </div>

                        {/* Results Table */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#05080A]/60 rounded-xl border border-[#1A2433] shadow-inner">
                            {isStarted ? (
                                <table className="w-full text-xs border-separate border-spacing-0">
                                    <thead className="bg-[#0A0F14] sticky top-0 z-10">
                                        <tr className="text-[#6B7280]">
                                            <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-[9px] border-b border-[#1A2433]">Time</th>
                                            <th className="px-4 py-3 text-center font-bold uppercase tracking-widest text-[9px] border-b border-[#1A2433]">Match Score</th>
                                            <th className="px-4 py-3 text-right font-bold uppercase tracking-widest text-[9px] border-b border-[#1A2433]">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1A2433]">
                                        {results.map((c, idx) => (
                                            <tr key={`${c.time}-${idx}`} className="group hover:bg-[#D4AF37]/5 transition-all duration-300">
                                                <td className="px-4 py-3 font-mono text-[#F5F0EB] font-bold text-sm tracking-tighter">
                                                    <div className="flex flex-col">
                                                        <span>{c.time}</span>
                                                        {c.offsetMinutes !== undefined && (
                                                            <span className="text-[9px] text-[#8C7F72]">
                                                                {c.offsetMinutes >= 0 ? '+' : ''}{c.offsetMinutes.toFixed(1)}m
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-1 text-[9px] font-mono text-[#8C7F72]">
                                                        {c.minifiedEph ? (
                                                            <>
                                                                <div className="flex justify-between gap-2">
                                                                    <span className="text-[#D4AF37]/70 uppercase">Sun</span>
                                                                    <span className="text-emerald-400/80">{c.minifiedEph.sun}</span>
                                                                </div>
                                                                <div className="flex justify-between gap-2">
                                                                    <span className="text-[#D4AF37]/70 uppercase">Moon</span>
                                                                    <span className="text-emerald-400/80">{c.minifiedEph.moon}</span>
                                                                </div>
                                                                <div className="flex justify-between gap-2">
                                                                    <span className="text-[#D4AF37]/70 uppercase">Asc</span>
                                                                    <span className="text-emerald-400/80">{c.minifiedEph.ascendant}</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <span className="italic opacity-50">Calculating...</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className="w-20 bg-[#1A2433] rounded-full h-1.5 overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${c.score}%` }}
                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                                className={`h-full rounded-full ${c.score >= 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : c.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                            />
                                                        </div>
                                                        <span className="font-mono text-[11px] font-bold text-[#F5F0EB] w-8">
                                                            {Math.round(c.score)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className={`text-[9px] font-bold uppercase ${c.score >= 70 ? 'text-emerald-500' : 'text-rose-500/50'}`}>
                                                            {c.score >= 70 ? 'Optimal' : 'Scrutiny'}
                                                        </span>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${c.score >= 70 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500/20'} animate-pulse`} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-[#4B5563] text-[10px] uppercase font-bold tracking-[0.2em] bg-gradient-to-b from-transparent to-[#0A0F14]/40">
                                    <div className="w-12 h-12 border border-[#1A2433] rounded-full flex items-center justify-center mb-4 relative">
                                        <Zap className="w-5 h-5 text-[#3A4452] animate-pulse" />
                                        <div className="absolute inset-0 border-t-2 border-[#D4AF37]/30 rounded-full animate-spin" />
                                    </div>
                                    <span className="animate-pulse">Awaiting Level {stage.level} Convergence Engine</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
