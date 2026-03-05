import React from 'react';
import { Clock } from 'lucide-react';
import { Candidate } from '../types';
import { sanitizeHtml, truncateText } from '../utils';

interface TopRecommendationProps {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
    topRecommendation: Candidate;
    extractSection: (text: string | undefined, section: string) => string;
}

export function TopRecommendation({
    rectifiedTime,
    accuracy,
    confidence,
    topRecommendation,
    extractSection
}: TopRecommendationProps) {
    return (
        <div className="bg-white border-2 border-[#78611D]/30 rounded-xl p-8 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
            <div className="text-center">
                <p className="text-[10px] font-black text-[#7A756F] uppercase tracking-[0.3em] mb-4">
                    Rectified Birth Time
                </p>
                <h1 className="text-6xl font-black text-[#78611D] font-mono mb-6 tracking-tighter">
                    {rectifiedTime}
                </h1>

                <div className="flex justify-center gap-12 mb-8">
                    <div className="text-center">
                        <p className="text-[10px] text-[#7A756F] uppercase font-bold mb-1">Accuracy Score</p>
                        <p className="text-4xl font-black text-[#1A1612]">{accuracy}%</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-[#7A756F] uppercase font-bold mb-1">Confidence</p>
                        <p
                            className={`text-4xl font-black ${confidence === 'High'
                                ? 'text-emerald-600'
                                : confidence === 'Medium'
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                }`}
                        >
                            {confidence}
                        </p>
                    </div>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#78611D]/10 border border-[#78611D]/50 rounded-full text-[#78611D] text-xs font-bold uppercase tracking-widest mb-8">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    {sanitizeHtml(topRecommendation.offsetDescription)}
                </div>

                <div className="bg-[#F5EFE7] border border-[#F0E8DE] rounded-xl p-8 text-left space-y-6">
                    <div>
                        <h3 className="text-[#78611D] font-black uppercase tracking-wider text-sm mb-3">
                            Logical Verdict
                        </h3>
                        <p className="text-[#4A453F] leading-relaxed">
                            {sanitizeHtml(truncateText(topRecommendation.recommendation, 500))}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-[#78611D] font-black uppercase tracking-wider text-sm mb-3">
                            Precision Strengths
                        </h3>
                        <p className="text-[#7A756F] text-sm leading-relaxed">
                            {extractSection(topRecommendation.analysis, 'STRENGTHS')}
                        </p>
                    </div>

                    {topRecommendation.dashaAnalysis && (
                        <div>
                            <h3 className="text-[#78611D] font-black uppercase tracking-wider text-sm mb-3">
                                Vimshottari/Yogini Alignment
                            </h3>
                            <p className="text-[#7A756F] text-sm leading-relaxed">
                                {sanitizeHtml(topRecommendation.dashaAnalysis)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
