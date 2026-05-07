'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp } from 'lucide-react';

const CANDIDATES = [
  { time: '14:32:18', score: 94.2, best: true },
  { time: '14:31:45', score: 87.5 },
  { time: '14:33:02', score: 82.1 },
  { time: '14:30:28', score: 76.8 },
];

function ScoreBar({ score, best }: { score: number; best?: boolean }) {
  return (
    <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden ml-3">
      <motion.div
        className={`h-full rounded-full ${best ? 'bg-black' : 'bg-black/20'}`}
        initial={{ width: '0%' }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

export default function CandidateComparisonTable() {
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-3 h-3 bg-[#FA3D1D] rounded-full animate-pulse" />
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-black/40" />
          <span className="text-sm font-medium text-black/60">Candidate Birth Times</span>
        </div>
      </div>

      <div className="space-y-2">
        {CANDIDATES.map((c, i) => (
          <motion.div
            key={c.time}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className={`flex items-center p-3 rounded-xl border transition-colors ${
              c.best
                ? 'bg-black/[0.02] border-black/10'
                : 'border-transparent hover:bg-black/[0.01]'
            }`}
          >
            <div className="w-20 text-sm font-mono font-medium text-black">
              {c.time}
            </div>

            <ScoreBar score={c.score} best={c.best} />

            <div className="w-20 text-right flex items-center justify-end gap-1.5">
              {c.best && (
                <span className="text-[10px] px-1.5 py-0.5 bg-black text-white rounded-full font-medium leading-none">
                  Best
                </span>
              )}
              <span className={`text-xs font-medium ${c.best ? 'text-black' : 'text-black/40'}`}>
                {c.score}%
              </span>
            </div>

            {c.best && (
              <Trophy className="w-3.5 h-3.5 text-black ml-1 flex-shrink-0" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Summary footer */}
      <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-[10px] text-black/30">
        <span>Highest confidence match</span>
        <span className="font-mono">Dasha + KP + Shadbala consensus</span>
      </div>
    </div>
  );
}
