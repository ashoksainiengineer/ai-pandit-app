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
}

interface CandidateLevelTablesProps {
    candidateScores: CandidateScore[];
    currentStage: number;
}

const STAGES = [
    { id: 2, name: 'Coarse Scan', level: 1, icon: Target, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    { id: 5, name: '30s Refinement', level: 2, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { id: 7, name: '6s Grand Finals', level: 3, icon: Trophy, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
];

export function CandidateLevelTables({ candidateScores, currentStage }: CandidateLevelTablesProps) {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {STAGES.map((stage) => {
                const results = candidateScores
                    .filter(c => c.stage === stage.id)
                    .sort((a, b) => b.score - a.score);

                // If no results yet for this stage, show a placeholder if it's the current or next stage
                const isStarted = results.length > 0;

                return (
                    <motion.div
                        key={stage.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`glass-card p-5 border ${stage.border} relative overflow-hidden`}
                    >
                        {/* Background Glow */}
                        {isStarted && (
                            <div className={`absolute -top-10 -right-10 w-32 h-32 ${stage.bg} blur-3xl rounded-full`} />
                        )}

                        {/* Title Header */}
                        <div className="flex items-center justify-between mb-4">
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
                                <span className={`text-[10px] font-mono ${stage.color} font-bold`}>
                                    {results.length} Candidates
                                </span>
                            )}
                        </div>

                        {/* Results Table */}
                        <div className="min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar bg-[#0F1419]/30 rounded-xl border border-[#3A4452]/20">
                            {isStarted ? (
                                <table className="w-full text-xs">
                                    <thead className="bg-[#1A1F2E] sticky top-0 z-10">
                                        <tr className="text-[#6B7280]">
                                            <th className="px-3 py-2 text-left">Time</th>
                                            <th className="px-3 py-2 text-center">Score</th>
                                            <th className="px-3 py-2 text-right">Pass</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#3A4452]/20">
                                        {results.map((c, idx) => (
                                            <tr key={`${c.time}-${idx}`} className="hover:bg-white/5 transition-colors">
                                                <td className="px-3 py-2 font-mono text-[#E5E7EB]">{c.time}</td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-12 bg-gray-700 rounded-full h-1">
                                                            <div
                                                                className={`h-full rounded-full ${c.score >= 80 ? 'bg-emerald-500' : c.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                                style={{ width: `${c.score}%` }}
                                                            />
                                                        </div>
                                                        <span className="font-mono text-[10px]">{Math.round(c.score)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <div className={`w-1.5 h-1.5 rounded-full inline-block ${c.score >= 70 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-[200px] flex flex-col items-center justify-center text-[#4B5563] text-[10px] uppercase font-bold tracking-[0.2em]">
                                    <div className="w-10 h-10 border-2 border-dashed border-[#3A4452] rounded-full flex items-center justify-center mb-3 opacity-30">
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    Awaiting Level {stage.level} Results
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
