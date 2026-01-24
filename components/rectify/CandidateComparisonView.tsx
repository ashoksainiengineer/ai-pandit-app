'use client';

// components/rectify/CandidateComparisonView.tsx
// Side-by-side comparison of top candidates with difference highlighting

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, ChevronDown, Check, AlertTriangle, X, Trophy, Medal } from 'lucide-react';

interface CandidateData {
    time: string;
    score: number;
    stage: number;
    rank?: number;
    reason?: string;
    offsetMinutes?: number;
    minifiedEph?: {
        sun: string;
        moon: string;
        ascendant: string;
    };
    // Extended data for detailed comparison
    d60?: string;
    boundaryDistance?: number;
    eventMatches?: Array<{
        event: string;
        matches: boolean;
        dasha?: string;
    }>;
}

interface CandidateComparisonViewProps {
    candidates: CandidateData[];
    onSelect?: (time: string) => void;
}

export function CandidateComparisonView({ candidates, onSelect }: CandidateComparisonViewProps) {
    // Sort candidates by score descending
    const sortedCandidates = useMemo(() =>
        [...candidates].sort((a, b) => b.score - a.score),
        [candidates]
    );

    // Default to top 2 candidates
    const [leftIndex, setLeftIndex] = useState(0);
    const [rightIndex, setRightIndex] = useState(1);

    const leftCandidate = sortedCandidates[leftIndex];
    const rightCandidate = sortedCandidates[rightIndex];

    // Can't compare if less than 2 candidates
    if (sortedCandidates.length < 2) {
        return (
            <div className="glass-card p-6 border border-[#3A4452] text-center">
                <Scale className="w-8 h-8 text-[#8C7F72] mx-auto mb-3" />
                <p className="text-sm text-[#8C7F72]">At least 2 candidates required for comparison</p>
            </div>
        );
    }

    // Compare two values and determine match status
    const compareValues = (left: string | undefined, right: string | undefined): 'match' | 'differ' | 'unknown' => {
        if (!left || !right) return 'unknown';
        return left === right ? 'match' : 'differ';
    };

    // Get status icon
    const StatusIcon = ({ status }: { status: 'match' | 'differ' | 'unknown' }) => {
        switch (status) {
            case 'match':
                return <Check className="w-3.5 h-3.5 text-emerald-400" />;
            case 'differ':
                return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
            default:
                return <X className="w-3.5 h-3.5 text-[#8C7F72]" />;
        }
    };

    // Determine winner
    const winner = leftCandidate.score >= rightCandidate.score ? 'left' : 'right';
    const scoreDiff = Math.abs(leftCandidate.score - rightCandidate.score);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 border border-[#D4AF37]/30 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Scale className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-[#F5F0EB]">Candidate Comparison</h3>
                        <p className="text-[10px] text-[#8C7F72] uppercase tracking-wider">Side-by-side analysis</p>
                    </div>
                </div>

                {/* Winner Badge */}
                <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
                    ${scoreDiff > 5 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}
                >
                    {scoreDiff > 5 ? 'Clear Winner' : 'Close Match'}
                </div>
            </div>

            {/* Candidate Selectors */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Left Selector */}
                <div className="relative">
                    <select
                        value={leftIndex}
                        onChange={(e) => setLeftIndex(parseInt(e.target.value))}
                        className="w-full appearance-none bg-[#1A2433] border border-[#3A4452] rounded-lg px-3 py-2 text-sm text-[#F5F0EB] cursor-pointer hover:border-[#D4AF37]/50 transition-colors pr-8"
                    >
                        {sortedCandidates.map((c, idx) => (
                            <option key={c.time} value={idx} disabled={idx === rightIndex}>
                                {idx + 1}. {c.time} ({c.score.toFixed(1)}%)
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-[#8C7F72] pointer-events-none" />
                </div>

                {/* Right Selector */}
                <div className="relative">
                    <select
                        value={rightIndex}
                        onChange={(e) => setRightIndex(parseInt(e.target.value))}
                        className="w-full appearance-none bg-[#1A2433] border border-[#3A4452] rounded-lg px-3 py-2 text-sm text-[#F5F0EB] cursor-pointer hover:border-[#D4AF37]/50 transition-colors pr-8"
                    >
                        {sortedCandidates.map((c, idx) => (
                            <option key={c.time} value={idx} disabled={idx === leftIndex}>
                                {idx + 1}. {c.time} ({c.score.toFixed(1)}%)
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-[#8C7F72] pointer-events-none" />
                </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Left Candidate Card */}
                <CandidateCard
                    candidate={leftCandidate}
                    rank={leftIndex + 1}
                    isWinner={winner === 'left'}
                    onSelect={() => onSelect?.(leftCandidate.time)}
                />

                {/* Right Candidate Card */}
                <CandidateCard
                    candidate={rightCandidate}
                    rank={rightIndex + 1}
                    isWinner={winner === 'right'}
                    onSelect={() => onSelect?.(rightCandidate.time)}
                />
            </div>

            {/* Detailed Differences */}
            <div className="mt-6 bg-[#0F1419]/50 rounded-xl p-4 border border-[#3A4452]">
                <h4 className="text-[10px] text-[#8C7F72] uppercase tracking-wider font-bold mb-3">Key Differences</h4>
                <div className="space-y-2">
                    {/* Ephemeris Comparison */}
                    <ComparisonRow
                        label="Sun Position"
                        leftValue={leftCandidate.minifiedEph?.sun}
                        rightValue={rightCandidate.minifiedEph?.sun}
                    />
                    <ComparisonRow
                        label="Moon Position"
                        leftValue={leftCandidate.minifiedEph?.moon}
                        rightValue={rightCandidate.minifiedEph?.moon}
                    />
                    <ComparisonRow
                        label="Ascendant"
                        leftValue={leftCandidate.minifiedEph?.ascendant}
                        rightValue={rightCandidate.minifiedEph?.ascendant}
                    />
                    {leftCandidate.d60 && rightCandidate.d60 && (
                        <ComparisonRow
                            label="D60 Chart"
                            leftValue={leftCandidate.d60}
                            rightValue={rightCandidate.d60}
                        />
                    )}
                </div>
            </div>

            {/* AI Verdict */}
            <div className="mt-4 p-4 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/30">
                <div className="flex items-start gap-3">
                    <Trophy className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-[#D4AF37] mb-1">AI Comparison Verdict</h4>
                        <p className="text-xs text-[#C4B8AD] leading-relaxed">
                            {winner === 'left' ? leftCandidate.time : rightCandidate.time} is preferred
                            {scoreDiff > 5
                                ? ` with a significant ${scoreDiff.toFixed(1)}% lead. `
                                : ` by a narrow ${scoreDiff.toFixed(1)}% margin. `}
                            {leftCandidate.reason || rightCandidate.reason || 'Dasha correlation and event timing were primary factors in this determination.'}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Individual Candidate Card
function CandidateCard({
    candidate,
    rank,
    isWinner,
    onSelect
}: {
    candidate: CandidateData;
    rank: number;
    isWinner: boolean;
    onSelect?: () => void;
}) {
    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={onSelect}
            className={`
                bg-[#0F1419]/70 rounded-xl p-4 border cursor-pointer transition-all
                ${isWinner
                    ? 'border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                    : 'border-[#3A4452] hover:border-[#D4AF37]/30'
                }
            `}
        >
            {/* Header with rank */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {isWinner ? (
                        <Trophy className="w-5 h-5 text-[#D4AF37]" />
                    ) : (
                        <Medal className="w-5 h-5 text-[#8C7F72]" />
                    )}
                    <span className="text-[10px] text-[#8C7F72] font-bold uppercase">Rank #{rank}</span>
                </div>
                {isWinner && (
                    <span className="text-[8px] bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full font-bold uppercase">
                        Winner
                    </span>
                )}
            </div>

            {/* Time */}
            <div className="text-2xl font-black text-[#F5F0EB] font-mono mb-2">
                {candidate.time}
            </div>

            {/* Score */}
            <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#8C7F72]">Score</span>
                    <span className={`font-bold ${candidate.score >= 80 ? 'text-emerald-400' : candidate.score >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {candidate.score.toFixed(1)}%
                    </span>
                </div>
                <div className="w-full bg-[#2A3442] rounded-full h-2 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${candidate.score}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${candidate.score >= 80 ? 'bg-emerald-500' : candidate.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    />
                </div>
            </div>

            {/* Ephemeris Summary */}
            {candidate.minifiedEph && (
                <div className="space-y-1 text-[10px] font-mono border-t border-[#3A4452] pt-2 mt-2">
                    <div className="flex justify-between">
                        <span className="text-[#8C7F72]">☉ Sun</span>
                        <span className="text-[#C4B8AD]">{candidate.minifiedEph.sun}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[#8C7F72]">☽ Moon</span>
                        <span className="text-[#C4B8AD]">{candidate.minifiedEph.moon}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[#8C7F72]">↑ Asc</span>
                        <span className="text-[#C4B8AD]">{candidate.minifiedEph.ascendant}</span>
                    </div>
                </div>
            )}

            {/* Reason */}
            {candidate.reason && (
                <p className="text-[10px] text-[#8C7F72] mt-2 line-clamp-2 italic">
                    "{candidate.reason}"
                </p>
            )}
        </motion.div>
    );
}

// Comparison Row Component
function ComparisonRow({
    label,
    leftValue,
    rightValue
}: {
    label: string;
    leftValue?: string;
    rightValue?: string;
}) {
    const matches = leftValue === rightValue;

    return (
        <div className="flex items-center gap-3 text-[10px]">
            <span className="w-24 text-[#8C7F72] font-medium flex-shrink-0">{label}</span>
            <div className="flex-1 flex items-center justify-between gap-2 bg-[#1A2433] rounded-lg px-2 py-1">
                <span className="font-mono text-[#C4B8AD] truncate">{leftValue || '-'}</span>
                {matches ? (
                    <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                )}
                <span className="font-mono text-[#C4B8AD] truncate">{rightValue || '-'}</span>
            </div>
        </div>
    );
}
