import React from 'react';
import { motion } from 'framer-motion';

interface BTRProcessFlowProps {
    currentStage: number; // 1 to 6
    totalCandidates?: number;
    batchCount?: number;
}

const STAGES = [
    { id: 1, label: 'Grid Gen', sub: 'Calculations' },
    { id: 2, label: 'Tournament', sub: 'Coarse Filter' },
    { id: 3, label: 'Refinement', sub: '±5 min Grid' },
    { id: 4, label: 'Deep Analysis', sub: 'Multi-Dasha' },
    { id: 5, label: 'Micro Grid', sub: '±30s Precision' },
    { id: 6, label: 'Final Verdict', sub: 'D60 Karma' },
];

export const BTRProcessFlow: React.FC<BTRProcessFlowProps> = ({ currentStage, totalCandidates, batchCount }) => {
    return (
        <div className="w-full py-4 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[800px] px-2">
                {STAGES.map((stage, index) => {
                    const isActive = stage.id === currentStage;
                    const isCompleted = stage.id < currentStage;
                    const isPending = stage.id > currentStage;

                    return (
                        <React.Fragment key={stage.id}>
                            {/* Node */}
                            <div className={`relative flex flex-col items-center justify-center w-32 h-20 border-2 rounded-lg transition-all duration-300 ${isActive
                                    ? 'border-amber-400 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-105'
                                    : isCompleted
                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                        : 'border-slate-700 bg-slate-800/50 opacity-50'
                                }`}>
                                {/* Status Icon */}
                                <div className="absolute -top-3 -right-2 bg-slate-900 rounded-full p-0.5">
                                    {isCompleted ? (
                                        <span className="text-emerald-500 text-lg">✓</span>
                                    ) : isActive ? (
                                        <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                                    ) : (
                                        <span className="text-xs text-slate-600 font-mono">{stage.id}</span>
                                    )}
                                </div>

                                <span className={`text-sm font-bold ${isActive ? 'text-amber-100' : isCompleted ? 'text-emerald-100' : 'text-slate-400'}`}>
                                    {stage.label}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-1">
                                    {/* Dynamic Subtext for Stage 2 */}
                                    {stage.id === 2 && isActive && batchCount
                                        ? `${batchCount} Batches`
                                        : stage.sub}
                                </span>

                                {/* Active Highlight Line */}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-glow"
                                        className="absolute inset-0 rounded-lg bg-amber-400/5"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    />
                                )}
                            </div>

                            {/* Connector Arrow */}
                            {index < STAGES.length - 1 && (
                                <div className="flex-1 h-0.5 mx-2 bg-slate-800 relative">
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-500 transition-all duration-700`}
                                        style={{ width: isCompleted ? '100%' : '0%' }}
                                    />
                                    {isActive && (
                                        <motion.div
                                            className="absolute inset-0 bg-amber-500/50"
                                            initial={{ width: '0%' }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                    )}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};
