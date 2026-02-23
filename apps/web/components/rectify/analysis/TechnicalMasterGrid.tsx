'use client';

import React, { useState, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Cpu, Table, Globe, Clock } from 'lucide-react';
import { useStreamStore } from '@/lib/store/stream-store';
import type { CandidateScore } from '@/lib/store/stream-types';

const PLANET_ORDER = ['Lagna', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

export const TechnicalMasterGrid = memo(function TechnicalMasterGrid() {
    const [isExpanded, setIsExpanded] = useState(false);

    const candidateScores = useStreamStore(state => state.candidateScores);
    const activeAIStage = useStreamStore(state => state.activeAIStage);

    // Group candidates by stage and time
    const groupedData = useMemo(() => {
        const stages: Record<number, CandidateScore[]> = {};
        candidateScores.forEach(s => {
            if (!stages[s.stage]) stages[s.stage] = [];

            // Avoid duplicates for same time/stage (upsert logic should handle this but extra safety)
            const exists = stages[s.stage].find(existing => existing.time === s.time);
            if (!exists) {
                stages[s.stage].push(s);
            } else if (s.score > exists.score) {
                // Keep highest score version if multiple arrived
                Object.assign(exists, s);
            }
        });

        // Sort stages descending (latest first) and candidates by score
        return Object.keys(stages)
            .map(Number)
            .sort((a, b) => b - a)
            .map(stNum => ({
                stage: stNum,
                candidates: stages[stNum].sort((a, b) => b.score - a.score)
            }));
    }, [candidateScores]);

    if (candidateScores.length === 0) return null;

    const getStageName = (stage: number) => {
        switch (stage) {
            case 1: return 'Rashi Grid Synthesis';
            case 2: return 'Amsha-Varga Elimination';
            case 3: return 'Temporal Refinement';
            case 4: return 'Divisional Analysis';
            case 5: return 'Nadi-Amsha Convergence';
            case 6: return 'Prana-Dasha Verdict';
            default: return `Stage ${stage}`;
        }
    };

    return (
        <div className="w-full mb-6">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 bg-white border border-[#F0E8DE] rounded-xl hover:bg-[#FAF8F5] transition-all duration-300 group shadow-sm"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#B8860B]/10 rounded-lg group-hover:bg-[#B8860B]/20 transition-colors">
                        <Cpu className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-bold text-[#1A1612] uppercase tracking-widest flex items-center gap-2">
                            Swiss Ephemeris Master Log
                            <span className="text-[10px] bg-[#B8860B]/10 text-[#B8860B] px-2 py-0.5 rounded-full border border-[#B8860B]/20 uppercase">
                                4-Decimal Precision
                            </span>
                        </h3>
                        <p className="text-[11px] text-[#7A756F] font-medium">Real-time planetary coordinates for {candidateScores.length} candidates</p>
                    </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-[#A8A39D]" /> : <ChevronDown className="w-5 h-5 text-[#A8A39D]" />}
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-[#FFFCF8] border-x border-b border-[#F0E8DE] rounded-b-xl"
                    >
                        <div className="p-1 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {groupedData.map(group => (
                                <div key={group.stage} className="border-t border-[#F0E8DE] pt-2 first:border-0 first:pt-0">
                                    <div className="px-4 py-2 bg-[#FAF8F5] flex items-center justify-between sticky top-0 z-10 border-b border-[#F0E8DE]">
                                        <div className="flex items-center gap-2">
                                            <Globe className="w-3.5 h-3.5 text-[#B8860B]" />
                                            <span className="text-[10px] font-black text-[#B8860B] uppercase tracking-tighter">
                                                {getStageName(group.stage)}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-mono font-bold text-[#7A756F]">
                                            {group.candidates.length} Candidates Logged
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto overflow-y-visible">
                                        <table className="w-full text-left border-collapse min-w-[1000px]">
                                            <thead>
                                                <tr className="border-b border-[#F0E8DE]">
                                                    <th className="px-4 py-3 text-[10px] font-bold text-[#7A756F] uppercase tracking-widest font-mono sticky left-0 bg-[#FAF8F5] z-20">Time (UTC)</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold text-[#7A756F] uppercase tracking-widest font-mono text-center bg-[#FAF8F5]">Score</th>
                                                    {PLANET_ORDER.map(p => (
                                                        <th key={p} className="px-4 py-3 text-[10px] font-bold text-[#7A756F] uppercase tracking-widest font-mono text-center bg-[#FAF8F5]">
                                                            {p}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#F0E8DE]">
                                                {group.candidates.map(c => (
                                                    <tr key={`${group.stage}_${c.time}`} className="hover:bg-stone-50 transition-colors group/row">
                                                        <td className="px-4 py-2 bg-white sticky left-0 z-10 border-r border-[#F0E8DE] group-hover/row:bg-stone-50 transition-colors">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-3 h-3 text-[#B8860B]/60" />
                                                                <span className="text-[11px] font-mono font-bold text-[#1A1612]">
                                                                    {c.time}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 text-center bg-white group-hover/row:bg-stone-50 transition-colors">
                                                            <span className={`text-[10px] font-bold font-mono ${c.score > 85 ? 'text-[#2D7A5C]' :
                                                                c.score > 60 ? 'text-[#B8860B]' : 'text-stone-500'
                                                                }`}>
                                                                {c.score.toFixed(1)}%
                                                            </span>
                                                        </td>
                                                        {PLANET_ORDER.map(p => {
                                                            const val = c.fullEph?.[p] || '---';
                                                            const [sign, degree] = val.split(' ');
                                                            return (
                                                                <td key={p} className="px-4 py-2 text-center whitespace-nowrap bg-white group-hover/row:bg-stone-50 transition-colors">
                                                                    {val !== '---' ? (
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-[9px] font-bold text-[#7A756F] uppercase leading-none mb-0.5">{sign}</span>
                                                                            <span className="text-[11px] font-mono font-medium text-[#B8860B] leading-none tabular-nums tracking-tighter">
                                                                                {degree || '0.0000°'}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-stone-400 font-mono text-[10px]">---</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #F0E8DE;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #B8860B;
                }
            `}</style>
        </div>
    );
});
