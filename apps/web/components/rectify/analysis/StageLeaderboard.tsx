'use client';

import React, { memo, useMemo } from 'react';
import { Activity, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CandidateScore } from '@/lib/store/stream-types';

interface StageLeaderboardProps {
    stage: number;
    scores: CandidateScore[];
    isCompleted?: boolean;
}

export const StageLeaderboard = memo(function StageLeaderboard({
    stage,
    scores,
    isCompleted = false
}: StageLeaderboardProps) {
    const stageScores = useMemo(() => {
        // Take unique by time, highest score first
        const unique = new Map<string, CandidateScore>();
        scores.forEach(s => {
            const existing = unique.get(s.time);
            if (!existing || s.score > existing.score) unique.set(s.time, s);
        });
        return Array.from(unique.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 8); // Keep it compact
    }, [scores]);

    if (stageScores.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 rounded-xl border bg-white shadow-sm overflow-hidden transition-all duration-300 ${isCompleted ? 'border-[#F0E8DE] opacity-90' : 'border-amber-200/60 ring-1 ring-amber-100/50'
                }`}
        >
            {/* Header */}
            <div className={`px-4 py-2.5 flex items-center justify-between border-b ${isCompleted ? 'bg-stone-50/80 border-[#F0E8DE]' : 'bg-amber-50/50 border-amber-200/40'
                }`}>
                <div className="flex items-center gap-2">
                    <Trophy className={`w-3.5 h-3.5 ${isCompleted ? 'text-stone-400' : 'text-amber-500'}`} />
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${isCompleted ? 'text-stone-500' : 'text-amber-800'
                        }`}>
                        Stage {stage} Top Candidates
                    </span>
                </div>
                <span className="text-[9px] font-mono font-bold text-stone-400 px-1.5 py-0.5 bg-white border border-stone-100 rounded">
                    {stageScores.length} Scored
                </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-100">
                    <thead className="bg-stone-50/30">
                        <tr>
                            <th className="px-4 py-2 text-left text-[9px] font-bold text-stone-400 uppercase font-mono">Time</th>
                            <th className="px-4 py-2 text-center text-[9px] font-bold text-stone-400 uppercase font-mono hidden sm:table-cell">Positions</th>
                            <th className="px-4 py-2 text-right text-[9px] font-bold text-stone-400 uppercase font-mono">Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                        {stageScores.map((s, idx) => (
                            <tr key={`s${stage}_${s.time}`} className="hover:bg-amber-50/30 transition-colors">
                                <td className="px-4 py-1.5 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] sm:text-xs font-mono font-bold ${idx === 0 ? 'text-amber-600' : 'text-stone-700'
                                            }`}>
                                            {s.time}
                                        </span>
                                        {idx === 0 && (
                                            <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1 rounded flex items-center gap-0.5">
                                                <Zap className="w-2 h-2" /> LEADER
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-1.5 text-center hidden sm:table-cell">
                                    <div className="flex items-center justify-center gap-2 text-[9px] text-stone-500 font-mono">
                                        {s.minifiedEph ? (
                                            <>
                                                <span>A: {s.minifiedEph.ascendant.split(' ')[0]}</span>
                                                <span className="text-stone-300">|</span>
                                                <span>M: {s.minifiedEph.moon.split(' ')[0]}</span>
                                            </>
                                        ) : '---'}
                                    </div>
                                </td>
                                <td className="px-4 py-1.5 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className={`text-[11px] font-bold font-mono ${s.score > 80 ? 'text-[#2D7A5C]' : 'text-[#B8860B]'
                                            }`}>
                                            {s.score.toFixed(1)}%
                                        </span>
                                        <div className="w-12 h-1 bg-stone-100 rounded-full mt-0.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${s.score > 80 ? 'bg-[#2D7A5C]' : 'bg-[#B8860B]'
                                                    }`}
                                                style={{ width: `${s.score}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
});
