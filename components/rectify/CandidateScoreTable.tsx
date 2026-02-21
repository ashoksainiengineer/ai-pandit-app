'use client';

import React, { memo, useState, useEffect, useMemo } from 'react';
import { Activity } from 'lucide-react';
import type { CandidateScore } from '@/lib/store/stream-types';

export const CandidateScoreTable = memo(({ scores }: { scores: CandidateScore[] | Map<string, any> }) => {
    // Handle Map or Array input for robustness
    const scoreArray = useMemo(() => {
        if (Array.isArray(scores)) return scores;
        if (scores instanceof Map) {
            const arr: CandidateScore[] = [];
            scores.forEach((val) => {
                if (val.score !== undefined) arr.push(val);
            });
            return arr;
        }
        return [];
    }, [scores]);

    const [activeTab, setActiveTab] = useState<number | 'all'>('all');

    // Auto-switch to latest stage
    useEffect(() => {
        if (scoreArray.length > 0) {
            const latestStage = Math.max(...scoreArray.map(s => s.stage));
            if (activeTab === 'all' || latestStage > Number(activeTab)) {
                setActiveTab(latestStage);
            }
        }
    }, [scoreArray, activeTab]);

    const filteredScores = useMemo(() => {
        const filtered = activeTab === 'all' ? scoreArray : scoreArray.filter(s => s.stage === activeTab);
        // Take unique by time, highest score first
        const unique = new Map<string, CandidateScore>();
        filtered.forEach(s => {
            const existing = unique.get(s.time);
            if (!existing || s.score > existing.score) unique.set(s.time, s);
        });
        return Array.from(unique.values()).sort((a, b) => b.score - a.score).slice(0, 15);
    }, [scoreArray, activeTab]);

    const stages = useMemo(() => {
        const uniqueStages = Array.from(new Set(scoreArray.map(s => s.stage))).sort((a: number, b: number) => a - b);
        return uniqueStages;
    }, [scoreArray]);

    return (
        <div className="h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-sm font-bold text-[#1A1612] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#B8860B]" />
                    Stage-wise Leaderboard
                </h2>
                <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeTab === 'all' ? 'bg-white text-[#B8860B] shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                        ALL
                    </button>
                    {stages.map(stage => (
                        <button
                            key={stage}
                            onClick={() => setActiveTab(stage)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeTab === stage ? 'bg-white text-[#B8860B] shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                        >
                            S{stage}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#F0E8DE] bg-white shadow-sm overflow-x-auto max-h-[350px] style-scroll">
                {filteredScores.length > 0 ? (
                    <table className="min-w-full divide-y divide-[#F0E8DE]">
                        <thead className="bg-[#FAF8F5]">
                            <tr>
                                <th className="px-4 py-2 text-left text-[10px] font-bold text-[#7A756F] uppercase">Candidate</th>
                                <th className="px-4 py-2 text-center text-[10px] font-bold text-[#7A756F] uppercase">Sun</th>
                                <th className="px-4 py-2 text-center text-[10px] font-bold text-[#7A756F] uppercase">Moon</th>
                                <th className="px-4 py-2 text-center text-[10px] font-bold text-[#7A756F] uppercase">Ascendant</th>
                                <th className="px-4 py-2 text-right text-[10px] font-bold text-[#7A756F] uppercase">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0E8DE]">
                            {filteredScores.map((s, index) => (
                                <tr key={`${s.time}-${s.stage}-${index}`} className="hover:bg-stone-50 transition-colors">
                                    <td className="px-4 py-2.5 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono font-bold text-[#1A1612]">{s.time}</span>
                                            {index === 0 && <span className="bg-yellow-100 text-yellow-800 text-[8px] font-heavy px-1 rounded">WINNER</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-center text-[11px] font-medium text-stone-600 font-mono">{s.minifiedEph?.sun || '---'}</td>
                                    <td className="px-4 py-2.5 text-center text-[11px] font-medium text-stone-600 font-mono">{s.minifiedEph?.moon || '---'}</td>
                                    <td className="px-4 py-2.5 text-center text-[11px] font-medium text-stone-600 font-mono">{s.minifiedEph?.ascendant || '---'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className="text-sm font-bold font-mono text-[#2D7A5C]">{s.score.toFixed(1)}%</span>
                                            <div className="w-20 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#2D7A5C]" style={{ width: `${s.score}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-8 text-center text-xs text-stone-400 italic">No data for this stage yet...</div>
                )}
            </div>
        </div>
    );
});
CandidateScoreTable.displayName = 'CandidateScoreTable';
