'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Trophy, Activity, Sparkles } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════ */

const AI_REASONING_LINES = [
  'Cross-referencing Vimshottari Dasha periods against 5 life events...',
  'Jupiter Mahadasha (age 25-41) shows strong correlation with Career milestone event.',
  'Saturn transit through 10th house at age 28 aligns with professional achievement window.',
  'KP Sub-lord analysis: Moon in Scorpio (Jyeshtha nakshatra) narrows time to 14:28-14:36.',
  'Shadbala strength calculation: Sun 1.42 rupas, Moon 1.18 rupas — confirming day birth.',
  'D60 (Shashtiamsha) precision check: Lagna changing at 14:31:48 — critical boundary.',
  'Prana-Dasha convergence: 14:32:18 emerges as optimal with 94.2% confidence.',
];

const CANDIDATE_SCORES = [
  { time: '14:32:18', score: 94.2, stage: 6, best: true },
  { time: '14:31:45', score: 87.5, stage: 4, best: false },
  { time: '14:33:02', score: 82.1, stage: 4, best: false },
  { time: '14:30:28', score: 76.8, stage: 2, best: false },
  { time: '14:32:51', score: 71.3, stage: 2, best: false },
];

const EPHEMERIS_PLANETS = [
  { symbol: '☉', name: 'Sun', sign: 'Leo', degree: `125°42′18″`, house: '5th', color: 'text-orange-400' },
  { symbol: '☽', name: 'Moon', sign: 'Scorpio', degree: `218°54′36″`, house: '8th', color: 'text-blue-300' },
  { symbol: '♂', name: 'Mars', sign: 'Aries', degree: `15°40′12″`, house: '1st', color: 'text-red-400' },
  { symbol: '☿', name: 'Mercury', sign: 'Virgo', degree: `172°18′54″`, house: '6th', color: 'text-emerald-400' },
  { symbol: '♃', name: 'Jupiter', sign: 'Taurus', degree: `45°11′06″`, house: '11th', color: 'text-yellow-500' },
  { symbol: '♀', name: 'Venus', sign: 'Cancer', degree: `98°33′42″`, house: '4th', color: 'text-pink-400' },
  { symbol: '♄', name: 'Saturn', sign: 'Capricorn', degree: `298°19′30″`, house: '10th', color: 'text-indigo-400' },
];

/* ═══════════════════════════════════════════════════════════
   AI THINKING PANEL
   ═══════════════════════════════════════════════════════════ */

function AIThinkingPanel({ isActive, onComplete, cycleCount }: { isActive: boolean; onComplete: () => void; cycleCount: number }) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);

  useEffect(() => {
    if (!isActive) return;
    setVisibleLines([]);

    const timers: ReturnType<typeof setTimeout>[] = [];
    AI_REASONING_LINES.forEach((_, i) => {
      const t = setTimeout(() => {
        setVisibleLines(prev => [...prev, i]);
        if (i === AI_REASONING_LINES.length - 1) {
          setTimeout(onComplete, 1500);
        }
      }, (i + 1) * 1200); // 1.2s per line = 8.4s total — fast & plausible
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, [isActive, cycleCount]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-black/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-black/40" />
          <span className="text-xs font-medium text-black/60 uppercase tracking-wider">AI Reasoning Engine</span>
        </div>
        {isActive && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-medium text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      {/* Reasoning Lines */}
      <div className="p-5 space-y-3">
        <AnimatePresence>
          {visibleLines.map((lineIndex) => (
            <motion.div
              key={`${cycleCount}-${lineIndex}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={`flex items-start gap-2.5 p-3 rounded-lg text-sm ${
                lineIndex === AI_REASONING_LINES.length - 1
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-[var(--prism-canvas)]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                lineIndex === AI_REASONING_LINES.length - 1
                  ? 'bg-emerald-500'
                  : 'bg-amber-500 animate-pulse'
              }`} />
              <span className={lineIndex === AI_REASONING_LINES.length - 1 ? 'text-emerald-800 font-medium' : 'text-[#636363]'}>
                {AI_REASONING_LINES[lineIndex]}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading placeholder for upcoming lines */}
        {isActive && visibleLines.length < AI_REASONING_LINES.length && (
          <div className="flex items-center gap-3 p-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-xs text-black/30">Processing next reasoning step...</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CANDIDATE LEADERBOARD
   ═══════════════════════════════════════════════════════════ */

function CandidateLeaderboard() {
  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-black/5 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-black/40" />
        <span className="text-xs font-medium text-black/60 uppercase tracking-wider">Candidate Birth Times</span>
        <span className="text-[10px] text-black/30 ml-auto">94.2% confidence threshold</span>
      </div>

      <div className="divide-y divide-black/[0.04]">
        {CANDIDATE_SCORES.map((c, i) => (
          <motion.div
            key={c.time}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className={`flex items-center px-5 py-3.5 gap-4 ${
              c.best ? 'bg-emerald-50/60' : 'hover:bg-[var(--prism-canvas)]'
            } transition-colors`}
          >
            {/* Rank */}
            <span className="w-5 text-xs font-mono text-black/30 text-right">{i + 1}</span>

            {/* Time */}
            <span className={`font-mono text-sm font-medium ${c.best ? 'text-emerald-800' : 'text-black'}`}>
              {c.time}
            </span>

            {/* Score bar */}
            <div className="flex-1 h-2 bg-black/[0.06] rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${c.best ? 'bg-emerald-500' : 'bg-black/20'}`}
                initial={{ width: '0%' }}
                animate={{ width: `${c.score}%` }}
                transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            {/* Score */}
            <span className={`text-xs font-medium w-14 text-right ${c.best ? 'text-emerald-700' : 'text-black/40'}`}>
              {c.score}%
            </span>

            {/* Stage badge */}
            <span className="text-[10px] text-black/25 font-medium w-12 text-right">
              S{c.stage}
            </span>

            {/* Best badge */}
            {c.best && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-200 text-emerald-800">
                Best
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-black/5 flex items-center justify-between text-[10px] text-black/25">
        <span>Dasha + KP Sub-lord + Shadbala consensus</span>
        <span className="font-mono">±0.0001° accuracy</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EPHEMERIS TABLE
   ═══════════════════════════════════════════════════════════ */

function EphemerisTable() {
  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-black/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-black/40" />
          <span className="text-xs font-medium text-black/60 uppercase tracking-wider">Ephemeris Data — 14:32:18</span>
        </div>
        <span className="text-[10px] text-black/30 font-mono">NASA JPL DE440</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-5 gap-2 px-5 py-2 border-b border-black/5 bg-[var(--prism-canvas)]">
        <span className="text-[10px] font-medium text-black/30 uppercase tracking-wider">Planet</span>
        <span className="text-[10px] font-medium text-black/30 uppercase tracking-wider">Sign</span>
        <span className="text-[10px] font-medium text-black/30 uppercase tracking-wider col-span-2">Longitude</span>
        <span className="text-[10px] font-medium text-black/30 uppercase tracking-wider">House</span>
      </div>

      {/* Planet rows */}
      <div className="divide-y divide-black/[0.03]">
        {EPHEMERIS_PLANETS.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04 }}
            className="grid grid-cols-5 gap-2 px-5 py-2.5 hover:bg-[var(--prism-canvas)] transition-colors"
          >
            <span className={`text-xs font-medium ${p.color}`}>{p.symbol} {p.name}</span>
            <span className="text-xs text-[#636363]">{p.sign}</span>
            <span className="text-xs text-[#636363] font-mono col-span-2">{p.degree}</span>
            <span className="text-xs text-[#636363]">{p.house}</span>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-black/5 flex items-center justify-between text-[10px] text-black/25 bg-[var(--prism-canvas)]">
        <span>Ascendant: Scorpio 15°42′ — Jyeshtha Nakshatra</span>
        <span className="font-mono">Dasha: Jupiter Mahadasha</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN DEMO COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function LivePipelineDemo() {
  const [aiActive, setAiActive] = useState(true);
  const [showCandidates, setShowCandidates] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);

  const handleAIComplete = useCallback(() => {
    setAiActive(false);
    setTimeout(() => {
      setShowCandidates(true);
      // Restart AI cycle after 30s pause
      setTimeout(() => {
        setShowCandidates(false);
        setAiActive(true);
        setCycleCount(c => c + 1);
      }, 30000);
    }, 1500);
  }, []);

  return (
    <div className="space-y-4">
      {/* AI Thinking Panel */}
      <AIThinkingPanel
        key={`ai-${cycleCount}`}
        isActive={aiActive}
        onComplete={handleAIComplete}
        cycleCount={cycleCount}
      />

      {/* Candidate Leaderboard (appears after AI completes) */}
      <AnimatePresence>
        {showCandidates && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <CandidateLeaderboard />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ephemeris Table (always visible) */}
      <EphemerisTable />

      {/* Cycle indicator */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-black/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Analysis simulation — refreshes every cycle
      </div>
    </div>
  );
}
