'use client';

import React, { useState, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Cpu, Table, Globe, Clock } from 'lucide-react';
import { useStreamStore } from '@/lib/store/stream-store';
import { useShallow } from 'zustand/react/shallow';
import type { CandidateScore } from '@/lib/store/stream-types';

const PLANET_ORDER = ['Lagna', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

export const TechnicalMasterGrid = memo(function TechnicalMasterGrid() {
    const [isExpanded, setIsExpanded] = useState(false);

    const { candidateScores, activeAIStage } = useStreamStore(useShallow(state => ({
        candidateScores: state.candidateScores,
        activeAIStage: state.activeAIStage
    })));

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
                className="w-full flex items-center justify-between p-4 bg-[#1A1612] border border-[#3D352C] rounded-xl hover:bg-[#251F19] transition-all duration-300 group shadow-lg"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#B8860B]/20 rounded-lg group-hover:bg-[#B8860B]/30 transition-colors">
                        <Cpu className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-bold text-stone-100 uppercase tracking-widest flex items-center gap-2">
                            Swiss Ephemeris Master Log
                            <span className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-full border border-[#D4AF37]/20 uppercase">
                                4-Decimal Precision
                            </span>
                        </h3>
                        <p className="text-[11px] text-[#A8A39D] font-medium">Real-time planetary coordinates for {candidateScores.length} candidates</p>
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
                        className="overflow-hidden bg-[#1A1612]/95 border-x border-b border-[#3D352C] rounded-b-xl backdrop-blur-md"
                    >
                        <div className="p-1 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {groupedData.map(group => (
                                <div key={group.stage} className="border-t border-[#3D352C]/50 pt-2 first:border-0 first:pt-0">
                                    <div className="px-4 py-2 bg-[#251F19]/50 flex items-center justify-between sticky top-0 z-10">
                                        <div className="flex items-center gap-2">
                                            <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
                                            <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-tighter">
                                                {getStageName(group.stage)}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-mono font-bold text-[#A8A39D]">
                                            {group.candidates.length} Candidates Logged
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto overflow-y-visible">
                                        <table className="w-full text-left border-collapse min-w-[1000px]">
                                            <thead>
                                                <tr className="border-b border-[#3D352C]">
                                                    <th className="px-4 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest font-mono sticky left-0 bg-[#1A1612] z-20">Time (UTC)</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest font-mono text-center">Score</th>
                                                    {PLANET_ORDER.map(p => (
                                                        <th key={p} className="px-4 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest font-mono text-center">
                                                            {p}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#3D352C]/30">
                                                {group.candidates.map(c => (
                                                    <tr key={`${group.stage}_${c.time}`} className="hover:bg-white/5 transition-colors group/row">
                                                        <td className="px-4 py-2 bg-[#1A1612] sticky left-0 z-10 border-r border-[#3D352C]/50 group-hover/row:bg-[#251F19] transition-colors">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-3 h-3 text-[#D4AF37]/60" />
                                                                <span className="text-[11px] font-mono font-bold text-stone-200">
                                                                    {c.time}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <span className={`text-[10px] font-bold font-mono ${c.score > 85 ? 'text-green-400' :
                                                                    c.score > 60 ? 'text-amber-400' : 'text-red-400'
                                                                }`}>
                                                                {c.score.toFixed(1)}%
                                                            </span>
                                                        </td>
                                                        {PLANET_ORDER.map(p => {
                                                            const val = c.fullEph?.[p] || '---';
                                                            const [sign, degree] = val.split(' ');
                                                            return (
                                                                <td key={p} className="px-4 py-2 text-center whitespace-nowrap">
                                                                    {val !== '---' ? (
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-[9px] font-bold text-stone-300 uppercase leading-none mb-0.5">{sign}</span>
                                                                            <span className="text-[11px] font-mono font-medium text-amber-500/90 leading-none tabular-nums tracking-tighter">
                                                                                {degree || '0.0000°'}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-stone-600 font-mono text-[10px]">---</span>
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
                    background: #3D352C;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #D4AF37;
                }
            `}</style>
        </div>
    );
});
