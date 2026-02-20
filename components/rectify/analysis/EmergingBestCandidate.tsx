'use client';

import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Clock, Target, ChevronUp, ChevronDown } from 'lucide-react';

interface TopCandidate {
  time: string;
  score: number;
  stage: number;
  rank?: number;
  minifiedEph?: { sun: string; moon: string; ascendant: string };
}

interface EmergingBestCandidateProps {
  candidates: TopCandidate[];
  isVisible: boolean;
  isComplete: boolean;
}

function getScoreColor(score: number): { bg: string; text: string; border: string } {
  if (score >= 85) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  if (score >= 70) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
  if (score >= 50) return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
  return { bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-200' };
}

function getScoreLabel(score: number): string {
  if (score >= 85) return 'Excellent Match';
  if (score >= 70) return 'Strong Match';
  if (score >= 50) return 'Promising';
  return 'Evaluating';
}

function getConfidenceGap(top: number, second: number): { text: string; color: string } {
  const gap = top - second;
  if (gap >= 15) return { text: 'Decisive lead', color: 'text-emerald-600' };
  if (gap >= 8) return { text: 'Strong lead', color: 'text-emerald-500' };
  if (gap >= 3) return { text: 'Slight edge', color: 'text-amber-600' };
  return { text: 'Tight race', color: 'text-orange-500' };
}

export const EmergingBestCandidate = memo(function EmergingBestCandidate({
  candidates,
  isVisible,
  isComplete,
}: EmergingBestCandidateProps) {
  const sortedCandidates = useMemo(() => {
    if (!candidates || candidates.length === 0) return [];
    return [...candidates].sort((a, b) => b.score - a.score).slice(0, 3);
  }, [candidates]);

  const topCandidate = sortedCandidates[0];
  const secondCandidate = sortedCandidates[1];

  const gapInfo = useMemo(() => {
    if (!topCandidate || !secondCandidate) return null;
    return getConfidenceGap(topCandidate.score, secondCandidate.score);
  }, [topCandidate, secondCandidate]);

  if (!isVisible || sortedCandidates.length === 0) {
    return (
      <div className="bg-[#FAF9F6] border border-[#F0E8DE] rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F0E8DE]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#F0E8DE] rounded w-1/3" />
            <div className="h-3 bg-[#F0E8DE] rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const colors = getScoreColor(topCandidate.score);
  const label = getScoreLabel(topCandidate.score);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${colors.bg} border ${colors.border} rounded-xl p-4 sm:p-5 shadow-sm`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className={`w-5 h-5 ${colors.text}`} />
          <span className="text-sm font-bold text-[#1A1612]">
            {isComplete ? 'Winner' : 'Emerging Best Candidate'}
          </span>
        </div>
        {gapInfo && !isComplete && (
          <span className={`text-[10px] font-bold uppercase tracking-wider ${gapInfo.color} bg-white px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1`}>
            <TrendingUp className="w-3 h-3" />
            {gapInfo.text}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={topCandidate.time}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl p-5 border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7A756F]" />
                <span className="text-xl sm:text-2xl font-mono font-bold text-[#1A1612]">
                  {topCandidate.time}
                </span>
              </div>
              {topCandidate.minifiedEph && (
                <div className="hidden sm:flex items-center gap-3 text-xs text-[#7A756F]">
                  <span>Sun: <strong className="text-[#4A453F]">{topCandidate.minifiedEph.sun}</strong></span>
                  <span>Moon: <strong className="text-[#4A453F]">{topCandidate.minifiedEph.moon}</strong></span>
                  <span>Lg: <strong className="text-[#4A453F]">{topCandidate.minifiedEph.ascendant}</strong></span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className={`text-2xl sm:text-3xl font-bold font-mono ${colors.text}`}>
                {topCandidate.score.toFixed(1)}%
              </div>
              <div className={`text-xs font-medium ${colors.text} opacity-80`}>
                {label}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {sortedCandidates.length > 1 && (
        <div className="mt-3 pt-3 border-t border-black/5">
          <p className="text-[10px] text-[#7A756F] uppercase tracking-wider mb-2 font-medium">
            Runners Up
          </p>
          <div className="grid grid-cols-2 gap-2">
            {sortedCandidates.slice(1, 3).map((candidate, idx) => {
              const cColors = getScoreColor(candidate.score);
              return (
                <motion.div
                  key={`${candidate.time}-${candidate.stage}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-lg p-3 flex items-center justify-between border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 font-bold bg-stone-100 px-1.5 py-0.5 rounded">#{idx + 2}</span>
                    <span className="text-sm font-mono font-bold text-[#1A1612]">
                      {candidate.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold font-mono ${cColors.text}`}>
                      {candidate.score.toFixed(1)}%
                    </span>
                    {topCandidate && (
                      <ChevronDown className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {gapInfo && topCandidate && secondCandidate && !isComplete && (
        <div className="mt-3 text-center">
          <span className="text-[10px] text-[#7A756F]">
            Gap to #{2}: <strong className={gapInfo.color}>{(topCandidate.score - secondCandidate.score).toFixed(1)} points</strong>
          </span>
        </div>
      )}
    </motion.div>
  );
});

export default EmergingBestCandidate;
