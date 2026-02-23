'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Zap, Brain, Filter, Target, CheckCircle, Cpu, Shield, Sparkles, Server } from 'lucide-react';

interface StageInfo {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  candidateRange: string;
}

const STAGE_CONFIG: Record<number, StageInfo> = {
  0: { id: 0, name: 'Initialization', description: 'Preparing analysis engine and loading birth data', icon: <Activity className="w-4 h-4" />, candidateRange: '---' },
  1: { id: 1, name: 'Rashi Grid Synthesis', description: 'Synthesis of primary astrological grids based on Rashi and Nakshatra placements', icon: <Target className="w-4 h-4" />, candidateRange: '1 → 61' },
  2: { id: 2, name: 'Amsha-Varga Elimination', description: 'Recursive elimination of low-probability candidates using Varga-displacement logic', icon: <Filter className="w-4 h-4" />, candidateRange: '61 → 15' },
  3: { id: 3, name: 'Temporal Refinement', description: 'Dynamic resolution adjustment for high-density temporal search windows', icon: <Activity className="w-4 h-4" />, candidateRange: '15 → 10' },
  4: { id: 4, name: 'Divisional Analysis', description: 'Advanced AI evaluation of Navamsha (D9) and Dashamsha (D10) lifecycle events', icon: <Brain className="w-4 h-4" />, candidateRange: '10 → 5' },
  5: { id: 5, name: 'Nadi-Amsha Convergence', description: 'Convergent validation across Shashtiamsha (D60) and 48-second Nadi-Amsha windows', icon: <Zap className="w-4 h-4" />, candidateRange: '5 → 3' },
  6: { id: 6, name: 'Prana-Dasha Verdict', description: 'Final synthesis of Pancha-Dasha subdivisions and forensic event alignment', icon: <Target className="w-4 h-4" />, candidateRange: '3 → 1' },
};

interface AnalysisStatusBannerProps {
  currentStage: number;
  candidateCount: number;
  totalCandidates: number;
  analyzedCount: number;
  elapsedSeconds: number;
  isConnected: boolean;
  isComplete: boolean;
  activeAIStage?: number | null;
  offsetMinutes?: number; // 🔱 NEW: God-Tier offset config
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
  isConnected,
  isComplete,
  activeAIStage,
  offsetMinutes = 60,
}: AnalysisStatusBannerProps) {
  // Use activeAIStage mapping like SimplifiedPipeline does if available
  const aiStageToIndex: Record<number, number> = { 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
  const effectiveStageIndex = activeAIStage && aiStageToIndex[activeAIStage] !== undefined
    ? Math.max(currentStage, aiStageToIndex[activeAIStage])
    : currentStage;

  const stage = STAGE_CONFIG[effectiveStageIndex] ?? STAGE_CONFIG[0];

  const gearNumber = useMemo(() => {
    if (offsetMinutes <= 30) return 1;
    if (offsetMinutes <= 60) return 2;
    if (offsetMinutes <= 120) return 3;
    if (offsetMinutes <= 240) return 4;
    return 5;
  }, [offsetMinutes]);

  const progressPercent = useMemo(() => {
    if (totalCandidates <= 0) return 0;
    return Math.min(100, Math.round((analyzedCount / totalCandidates) * 100));
  }, [analyzedCount, totalCandidates]);

  const stageProgress = useMemo(() => {
    if (isComplete) return { current: 7, total: 7 };
    return { current: effectiveStageIndex + 1, total: 7 };
  }, [effectiveStageIndex, isComplete]);

  const statusContent = useMemo(() => {
    if (isComplete) {
      return (
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-[#2D7A5C]/20 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-[#2D7A5C]" />
          </div>
          <div>
            <p className="font-bold text-[#1A1612]">Analysis Complete</p>
            <p className="text-xs text-[#2D7A5C] font-medium">Results verified & finalized</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-xl bg-[#B8860B]/20 flex items-center justify-center shrink-0">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            {stage.icon}
          </motion.div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-[#1A1612] text-sm sm:text-base">{stage.name}</p>
            {/* Phase Label Logic */}
            {(() => {
              const stageNum = effectiveStageIndex;
              let phaseLabel = '';
              if (stageNum <= 2) phaseLabel = offsetMinutes > 120 ? 'Phase A: Macro Sweep' : (offsetMinutes > 15 ? 'Phase B: Meso Sweep' : 'Phase C: Micro Sweep');
              else if (stageNum === 4) phaseLabel = 'Phase B: Meso Sweep';
              else if (stageNum >= 5) phaseLabel = 'Phase C: Micro Sweep';
              if (!phaseLabel) return null;
              return (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#2D7A5C]/10 text-[#2D7A5C] font-bold border border-[#2D7A5C]/20">
                  🪐 {phaseLabel}
                </span>
              );
            })()}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B8860B]/20 text-[#B8860B] font-bold">
              Step {stageProgress.current} of {stageProgress.total}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4A453F] mt-0.5 truncate">{stage.description}</p>
        </div>
      </div>
    );
  }, [isComplete, stage, effectiveStageIndex, offsetMinutes, stageProgress]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${isComplete ? 'from-[#2D7A5C]/10 to-transparent border-[#2D7A5C]/20' : 'from-[#B8860B]/10 via-[#B8860B]/5 to-transparent border-[#B8860B]/20'} border rounded-xl p-4 sm:p-5`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {statusContent}

        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">


          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-[#2D7A5C]' : (isConnected ? 'bg-[#2D7A5C] animate-pulse' : 'bg-[#C65D3B]')}`} />
            <span className="text-xs font-medium text-[#4A453F]">
              {isComplete ? 'Finalized' : (isConnected ? 'Inference Active' : 'Reconnecting')}
            </span>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-[#7A756F] uppercase tracking-wider">Candidates</p>
            <p className="text-sm font-bold text-[#B8860B] font-mono">{candidateCount.toLocaleString()}</p>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-[#7A756F] uppercase tracking-wider">Elapsed</p>
            <p className="text-sm font-bold text-[#1A1612] font-mono">{formatTime(elapsedSeconds)}</p>
          </div>
        </div>
      </div>

      {!isComplete && progressPercent > 0 && (
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
