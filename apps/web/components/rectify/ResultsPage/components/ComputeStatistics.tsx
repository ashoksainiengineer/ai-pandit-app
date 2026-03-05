import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Statistics } from '../types';
import { sanitizeHtml } from '../utils';

interface ComputeStatisticsProps {
    statistics: Statistics;
}

export function ComputeStatistics({ statistics }: ComputeStatisticsProps) {
    return (
        <>
            <div className="space-y-6">
                <h2 className="text-xl font-black text-[#1A1612] uppercase tracking-tight">
                    Full Compute Statistics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white border border-[#F0E8DE] p-4 rounded-xl">
                        <p className="text-[10px] text-[#7A756F] uppercase font-bold mb-1">Generated</p>
                        <p className="text-xl font-mono text-[#1A1612]">{statistics.totalCandidatesGenerated}</p>
                    </div>
                    <div className="bg-white border border-[#F0E8DE] p-4 rounded-xl">
                        <p className="text-[10px] text-[#7A756F] uppercase font-bold mb-1">Screened</p>
                        <p className="text-xl font-mono text-[#1A1612]">{statistics.topCandidatesAnalyzed}</p>
                    </div>
                    <div className="bg-white border border-[#F0E8DE] p-4 rounded-xl">
                        <p className="text-[10px] text-[#7A756F] uppercase font-bold mb-1">Neural Ops</p>
                        <p className="text-xl font-mono text-[#1A1612]">{statistics.deepAnalysisCount}</p>
                    </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {statistics.allCandidateScores.map((candidate, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between p-4 bg-white border border-[#F0E8DE] rounded-xl hover:border-[#78611D]/30 transition-colors"
                        >
                            <div>
                                <p className="font-mono text-lg text-[#1A1612]">{candidate.time}</p>
                                <p className="text-[10px] text-[#7A756F] uppercase">
                                    {sanitizeHtml(candidate.offsetDescription)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-[#78611D]">{candidate.quickScore}%</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-[#78611D]/5 border border-[#78611D]/20 rounded-xl p-8 flex items-center justify-between mt-8">
                <div>
                    <h3 className="font-black text-[#78611D] uppercase tracking-widest text-xs mb-1">
                        Compute Latency
                    </h3>
                    <p className="text-2xl font-black text-[#1A1612] font-mono">
                        {statistics.processingTime?.totalSeconds || 0}s
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-[#7A756F] uppercase font-bold tracking-widest mb-2">
                        Engine Integrity
                    </p>
                    <div className="flex items-center gap-1.5 justify-end text-emerald-600 font-black text-xs">
                        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                        VERIFIED OUTPUT
                    </div>
                </div>
            </div>
        </>
    );
}
