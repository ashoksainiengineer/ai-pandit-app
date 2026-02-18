'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Zap, Brain, Filter, Target } from 'lucide-react';

interface StageInfo {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  candidateRange: string;
}

const STAGE_CONFIG: Record<number, StageInfo> = {
  0: { id: 0, name: 'Initialization', description: 'Preparing analysis engine and loading birth data', icon: <Activity className="w-4 h-4" />, candidateRange: '---' },
  1: { id: 1, name: 'Grid Generation', description: 'Creating time candidates based on your precision settings', icon: <Target className="w-4 h-4" />, candidateRange: '1 → 60' },
  2: { id: 2, name: 'Coarse Elimination', description: 'Eliminating low-probability times using quick astrological checks', icon: <Filter className="w-4 h-4" />, candidateRange: '60 → 15' },
  3: { id: 3, name: 'Refinement Grid', description: 'Fine-tuning remaining candidates with precise calculations', icon: <Activity className="w-4 h-4" />, candidateRange: '15 → 10' },
  4: { id: 4, name: 'Deep Analysis', description: 'AI analyzing top candidates against your life events', icon: <Brain className="w-4 h-4" />, candidateRange: '10 → 5' },
  5: { id: 5, name: 'Micro Precision', description: 'Second-level accuracy refinement for final candidates', icon: <Zap className="w-4 h-4" />, candidateRange: '5 → 3' },
  6: { id: 6, name: 'Final Verdict', description: 'Computing confidence scores and preparing results', icon: <Target className="w-4 h-4" />, candidateRange: '3 → 1' },
};

interface AnalysisStatusBannerProps {
  currentStage: number;
  candidateCount: number;
  totalCandidates: number;
  analyzedCount: number;
  elapsedSeconds: number;
  estimatedSecondsRemaining: number;
  isConnected: boolean;
  isComplete: boolean;
}

function formatTime(seconds: number): string {
  if (seconds < 0 || !isFinite(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const AnalysisStatusBanner = memo(function AnalysisStatusBanner({
  currentStage,
  candidateCount,
  totalCandidates,
  analyzedCount,
  elapsedSeconds,
  estimatedSecondsRemaining,
  isConnected,
  isComplete,
}: AnalysisStatusBannerProps) {
  const stage = STAGE_CONFIG[currentStage] ?? STAGE_CONFIG[0];

  const progressPercent = useMemo(() => {
    if (totalCandidates <= 0) return 0;
    return Math.min(100, Math.round((analyzedCount / totalCandidates) * 100));
  }, [analyzedCount, totalCandidates]);

  const stageProgress = useMemo(() => {
    if (isComplete) return { current: 7, total: 7 };
    return { current: currentStage + 1, total: 7 };
  }, [currentStage, isComplete]);

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#2D7A5C]/10 to-[#2D7A5C]/5 border border-[#2D7A5C]/30 rounded-xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2D7A5C]/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-[#2D7A5C]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#1A1612]">Analysis Complete</p>
            <p className="text-sm text-[#4A453F]">Total time: {formatTime(elapsedSeconds)}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-[#B8860B]/10 via-[#B8860B]/5 to-transparent border border-[#B8860B]/20 rounded-xl p-4 sm:p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-[#B8860B]/20 flex items-center justify-center shrink-0">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {stage.icon}
            </motion.div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-[#1A1612] text-sm sm:text-base">
                {stage.name}
              </p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B8860B]/20 text-[#B8860B] font-bold">
                Step {stageProgress.current} of {stageProgress.total}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#4A453F] mt-0.5 truncate">
              {stage.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#2D7A5C] animate-pulse' : 'bg-[#C65D3B]'}`} />
            <span className="text-xs font-medium text-[#4A453F]">
              {isConnected ? 'Live' : 'Reconnecting'}
            </span>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-[#7A756F] uppercase tracking-wider">Candidates</p>
            <p className="text-sm font-bold text-[#B8860B] font-mono">
              {candidateCount.toLocaleString()}
            </p>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-[#7A756F] uppercase tracking-wider">Elapsed</p>
            <p className="text-sm font-bold text-[#1A1612] font-mono">
              {formatTime(elapsedSeconds)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-[#7A756F] uppercase tracking-wider flex items-center gap-1 justify-center">
              <Clock className="w-3 h-3" />
              ETA
            </p>
            <p className="text-sm font-bold text-[#B8860B] font-mono">
              {estimatedSecondsRemaining > 0 ? `~${formatTime(estimatedSecondsRemaining)}` : 'Calculating...'}
            </p>
          </div>
        </div>
      </div>

      {progressPercent > 0 && (
        <div className="mt-3 pt-3 border-t border-[#B8860B]/10">
          <div className="flex items-center justify-between text-xs text-[#7A756F] mb-1">
            <span>Stage Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-[#F0E8DE] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#B8860B] to-[#D4A853] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
});

export default AnalysisStatusBanner;
