import React, { useMemo } from 'react';
import { Candidate } from '../types';
import { sanitizeHtml } from '../utils';

interface CandidateCardProps {
    candidate: Candidate;
    rank?: number;
}

export function CandidateCard({ candidate, rank }: CandidateCardProps) {
    const scoreColor = useMemo(() => {
        if (candidate.score >= 80) return 'text-emerald-600';
        if (candidate.score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    }, [candidate.score]);

    const confidenceColor = useMemo(() => {
        if (candidate.confidence === 'High') {
            return 'bg-emerald-100 text-emerald-700 border border-emerald-300';
        }
        if (candidate.confidence === 'Medium') {
            return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
        }
        return 'bg-red-100 text-red-700 border border-red-300';
    }, [candidate.confidence]);

    return (
        <div className="bg-white rounded-xl border border-[#F0E8DE] p-6 space-y-4 hover:border-[#78611D]/30 transition-all">
            {rank && (
                <p className="text-[10px] font-black text-[#7A756F] uppercase tracking-[0.2em]">
                    Priority Sequence Alpha #{rank}
                </p>
            )}

            <div className="flex items-center justify-between">
                <h3 className="text-3xl font-mono font-black text-[#78611D] tracking-tighter">
                    {candidate.time}
                </h3>
                <div className="text-right">
                    <p className={`text-2xl font-black ${scoreColor}`}>{candidate.score}%</p>
                    <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${confidenceColor} mt-1`}>
                        {candidate.confidence} Confidence
                    </span>
                </div>
            </div>

            <p className="text-[#7A756F] text-xs font-medium uppercase tracking-wider">
                {sanitizeHtml(candidate.offsetDescription)}
            </p>

            {candidate.recommendation && (
                <div className="bg-[#F5EFE7] rounded-xl border border-[#F0E8DE] p-6">
                    <p className="text-[10px] font-black text-[#78611D] uppercase tracking-widest mb-3">
                        Neural Decision
                    </p>
                    <p className="text-[#4A453F] text-sm leading-relaxed">
                        {sanitizeHtml(candidate.recommendation)}
                    </p>
                </div>
            )}

            {candidate.analysis && (
                <div className="bg-[#F5EFE7] rounded-xl border border-[#F0E8DE] p-6 max-h-64 overflow-y-auto custom-scrollbar">
                    <p className="text-[10px] font-black text-[#7A756F] uppercase tracking-widest mb-3">
                        Verification Trace
                    </p>
                    <p className="text-[#7A756F] text-xs leading-relaxed whitespace-pre-wrap">
                        {sanitizeHtml(candidate.analysis)}
                    </p>
                </div>
            )}
        </div>
    );
}
