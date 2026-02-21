'use client';

// components/rectify/LiveScoreTable-fixed.tsx
// Production-grade score table with accessibility, performance optimization,
// and responsive design

import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CandidateScore } from '@/lib/store/stream-types';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface LiveScoreTableProps {
    scores: CandidateScore[];
    className?: string;
    'aria-label'?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const THEME = {
    border: '#F0E8DE',
    bg: '#FFFCF8',
    bgWarm: '#FDF8F3',
    textPrimary: '#1A1612',
    textMuted: '#7A756F',
    success: '#2D7A5C',
    warning: '#E8A849',
    error: '#C65D3B',
    plum: '#6B1F7A',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SCORE BAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface ScoreBarProps {
    score: number;
    index: number;
}

const ScoreBar = memo(function ScoreBar({ score, index }: ScoreBarProps) {
    const colorClass = score >= 80 ? 'bg-green-600' : score >= 50 ? 'bg-yellow-600' : 'bg-red-600';
    const textColorClass = score >= 80 ? 'text-green-700' : score >= 50 ? 'text-yellow-700' : 'text-red-700';

    return (
        <div className="flex items-center gap-2">
            <div
                className="h-1.5 w-12 sm:w-16 overflow-hidden rounded-full bg-[#E8E0D5]"
                role="progressbar"
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Score: ${score} percent`}
            >
                <motion.div
                    className={`h-full rounded-full ${colorClass}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                />
            </div>
            <span className={`font-mono font-bold text-xs ${textColorClass}`} aria-label={`${score} points`}>
                {score}
            </span>
        </div>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// TABLE ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface ScoreRowProps {
    candidate: CandidateScore;
    index: number;
}

const ScoreRow = memo(function ScoreRow({ candidate, index }: ScoreRowProps) {
    return (
        <motion.tr
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="hover:bg-[#F5EFE7] transition-colors"
        >
            <td className="px-2 sm:px-4 py-2 sm:py-2.5 font-mono text-[#7A756F] text-xs sm:text-sm" scope="row">
                #{index + 1}
            </td>
            <td className="px-2 sm:px-4 py-2 sm:py-2.5 font-mono font-medium text-[#1A1612] text-xs sm:text-sm">
                <span className="tabular-nums">{candidate.time}</span>
            </td>
            <td className="px-2 sm:px-4 py-2 sm:py-2.5">
                <ScoreBar score={candidate.score} index={index} />
            </td>
            <td className="px-2 sm:px-4 py-2 sm:py-2.5 text-right">
                <span
                    className="inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium text-green-700"
                    role="status"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600" aria-hidden="true" />
                    Complete
                </span>
            </td>
        </motion.tr>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const LiveScoreTable = memo(function LiveScoreTable({
    scores,
    className = '',
    'aria-label': ariaLabel = 'Candidate Scores',
}: LiveScoreTableProps) {
    // Memoized sorting to prevent unnecessary re-renders
    const sortedScores = useMemo(() =>
        [...scores].sort((a, b) => b.score - a.score),
        [scores]
    );

    return (
        <div
            className={`mt-6 overflow-hidden rounded-xl border border-[#F0E8DE] bg-[#FFFCF8] backdrop-blur-sm ${className}`}
            role="region"
            aria-label={ariaLabel}
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F0E8DE] bg-[#FDF8F3] px-3 sm:px-4 py-2 sm:py-3">
                <h3 className="text-[9px] sm:text-[10px] font-black text-emerald-600 tracking-[0.15em] sm:tracking-[0.2em] uppercase">
                    VEDIC ASTROLOGICAL DATA TABLE
                </h3>
                <span
                    className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-purple-700"
                    role="status"
                    aria-label={`${scores.length} candidates analyzed`}
                >
                    {scores.length} Analyzed
                </span>
            </div>

            {/* Table */}
            <div className="max-h-[250px] sm:max-h-[300px] overflow-y-auto overflow-x-auto">
                <table className="w-full min-w-[300px] text-left text-sm" role="table" aria-label={ariaLabel}>
                    <caption className="sr-only">List of candidate birth times with their analysis scores</caption>
                    <thead className="sticky top-0 bg-[#FAF5EF] text-xs font-medium uppercase text-[#7A756F] backdrop-blur-md z-10">
                        <tr>
                            <th className="px-2 sm:px-4 py-2 text-left" scope="col">Rank</th>
                            <th className="px-2 sm:px-4 py-2 text-left" scope="col">Time</th>
                            <th className="px-2 sm:px-4 py-2 text-left" scope="col">Score</th>
                            <th className="px-2 sm:px-4 py-2 text-right" scope="col">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0E8DE]" role="rowgroup">
                        {sortedScores.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-4 py-6 sm:py-8 text-center text-[#7A756F] text-xs uppercase tracking-wider"
                                    role="status"
                                >
                                    Waiting for first batch to complete...
                                </td>
                            </tr>
                        ) : (
                            <AnimatePresence initial={false} mode="popLayout">
                                {sortedScores.map((candidate, index) => (
                                    <ScoreRow
                                        key={candidate.time}
                                        candidate={candidate}
                                        index={index}
                                    />
                                ))}
                            </AnimatePresence>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

export default LiveScoreTable;
