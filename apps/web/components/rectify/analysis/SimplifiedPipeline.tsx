'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Loader2, Cpu, Shield, Zap, Info } from 'lucide-react';

interface StageConfig {
  id: number;
  name: string;
  shortName: string;
}

const STAGES: StageConfig[] = [
  { id: 0, name: 'Initialization', shortName: 'Init' },
  { id: 1, name: 'Rashi Grid Synthesis', shortName: 'Rashi' },
  { id: 2, name: 'Amsha-Varga Elimination', shortName: 'Amsha' },
  { id: 3, name: 'Temporal Refinement', shortName: 'Zoom' },
  { id: 4, name: 'Divisional Analysis', shortName: 'Varga' },
  { id: 5, name: 'Nadi-Amsha Convergence', shortName: 'Nadi' },
  { id: 6, name: 'Prana-Dasha Verdict', shortName: 'Prana' },
];

interface SimplifiedPipelineProps {
  currentStage: number;
  isComplete: boolean;
  isConnected: boolean;
  aiModel?: string;
  activeAIStage?: number | null;
  offsetMinutes?: number; // 🔱 NEW: God-Tier offset config
}

export const SimplifiedPipeline = memo(function SimplifiedPipeline({
  currentStage,
  isComplete,
  isConnected,
  aiModel,
  activeAIStage,
  offsetMinutes = 60,
}: SimplifiedPipelineProps) {
  const aiStageToIndex: Record<number, number> = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
  };

  const effectiveStageIndex = activeAIStage && aiStageToIndex[activeAIStage] !== undefined
    ? Math.max(currentStage, aiStageToIndex[activeAIStage])
    : currentStage;

  const stageStates = useMemo(() => {
    return STAGES.map((stage, index) => {
      if (isComplete) return 'completed';
      if (index < effectiveStageIndex) return 'completed';
      if (index === effectiveStageIndex) return 'active';
      return 'pending';
    });
  }, [isComplete, effectiveStageIndex]);

  const completedCount = stageStates.filter(s => s === 'completed').length;
  const progressPercent = Math.round((completedCount / STAGES.length) * 100);

  return (
    <div className="bg-white border border-[#F0E8DE] rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#184131] animate-pulse' : 'bg-[#C65D3B]'}`} />
          <span className="text-xs font-medium text-[#7A756F]">
            {isConnected ? 'Processing' : 'Reconnecting'}
          </span>
        </div>

      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {STAGES.map((stage, index) => {
          const state = stageStates[index];
          const isLast = index === STAGES.length - 1;

          return (
            <React.Fragment key={stage.id}>
              <motion.div
                initial={false}
                animate={{
                  scale: state === 'active' ? 1.05 : 1,
                }}
                className={`
                  flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg shrink-0
                  transition-colors duration-300
                  ${state === 'completed' ? 'bg-[#184131] text-white' : ''}
                  ${state === 'active' ? 'bg-[#B8860B] text-white ring-2 ring-[#B8860B]/30 ring-offset-1' : ''}
                  ${state === 'pending' ? 'bg-[#F5EFE7] text-[#A8A39D]' : ''}
                `}
                title={stage.name}
              >
                {state === 'completed' && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
                {state === 'active' && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />}
                {state === 'pending' && <Circle className="w-3 h-3 sm:w-4 sm:h-4" />}
              </motion.div>

              {!isLast && (
                <div className="flex-1 h-0.5 bg-[#F0E8DE] rounded-full overflow-hidden min-w-[4px] sm:min-w-[8px]">
                  <motion.div
                    className="h-full bg-[#184131]"
                    initial={{ width: 0 }}
                    animate={{ width: stageStates[index] === 'completed' ? '100%' : '0%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F0E8DE]">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-start">
            <span className="text-xs text-[#7A756F]">Stage</span>
            <span className="text-sm font-bold text-[#1A1612]">
              {isComplete ? 'Complete' : STAGES[currentStage]?.name || 'Unknown'}
            </span>
          </div>
          {(() => {
            // 🔱 God-Tier Phase logic
            const stageNum = effectiveStageIndex;
            let phaseLabel = '';
            if (stageNum <= 2) {
              phaseLabel = offsetMinutes > 120 ? 'Macro' : (offsetMinutes > 15 ? 'Meso' : 'Micro');
            } else if (stageNum === 4) {
              phaseLabel = 'Meso';
            } else if (stageNum >= 5) {
              phaseLabel = 'Micro';
            }

            if (!phaseLabel) return null;
            return (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F5EFE7] text-[#B8860B] border border-[#B8860B]/10 font-bold uppercase mt-1">
                {phaseLabel}
              </span>
            );
          })()}
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 sm:w-32 bg-[#F5EFE7] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#B8860B] to-[#184131] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-[#B8860B]">
            {progressPercent}%
          </span>
        </div>
      </div>
    </div>
  );
});

export default SimplifiedPipeline;
