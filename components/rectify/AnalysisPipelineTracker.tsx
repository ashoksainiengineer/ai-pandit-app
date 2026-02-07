'use client';

// components/rectify/AnalysisPipelineTracker-fixed.tsx
// Production-grade pipeline tracker with memory leak prevention,
// proper accessibility, and responsive design

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StageStat } from '@/lib/use-stream-progress';
import { Settings, CheckCircle, AlertCircle } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface AnalysisPipelineTrackerProps {
    stats: StageStat[];
    allSteps: Array<{ id: string; name: string; icon?: string }>;
    currentStage: number;
    isConnected: boolean;
    isComplete?: boolean;
    'aria-label'?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const THEME = {
    bg: '#FFFFFF',
    bgWarm: '#FDF8F3',
    bgCream: '#FAF5EF',
    border: '#F0E8DE',
    textPrimary: '#1A1612',
    textSecondary: '#4A453F',
    textMuted: '#7A756F',
    gold: '#B8860B',
    goldLight: '#D4A853',
    success: '#2D7A5C',
    warning: '#E8A849',
    error: '#C65D3B',
    plum: '#6B1F7A',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SCAN LINE ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

const ScanLine = memo(function ScanLine() {
    return (
        <motion.div
            className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#B8860B] to-transparent z-10 opacity-50"
            style={{ boxShadow: '0 0 10px rgba(184,134,11,0.3)' }}
            initial={{ top: '0%' }}
            animate={{ top: '100%' }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            aria-hidden="true"
        />
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK ICON
// ═══════════════════════════════════════════════════════════════════════════════

const CheckCircleIcon = memo(function CheckCircleIcon() {
    return (
        <svg
            className="w-4 h-4 text-[#2D7A5C]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE STEP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface StageStepProps {
    step: { id: string; name: string; icon?: string };
    index: number;
    isActive: boolean;
    isPast: boolean;
    isAI: boolean;
    stat?: StageStat;
    isLast: boolean;
}

const StageStep = memo(function StageStep({
    step,
    index,
    isActive,
    isPast,
    isAI,
    stat,
    isLast,
}: StageStepProps) {
    return (
        <div className="flex-1 min-w-[80px] sm:min-w-[100px] relative">
            <motion.div
                initial={false}
                animate={{
                    borderColor: isActive ? THEME.gold : isPast ? 'rgba(184,134,11,0.4)' : THEME.border,
                    backgroundColor: isActive ? 'rgba(184,134,11,0.05)' : isPast ? THEME.bgWarm : THEME.bg,
                }}
                className={`relative z-10 border-2 p-2 sm:p-3 rounded-xl transition-all duration-500
                    ${isActive ? 'shadow-lg shadow-[#B8860B]/10 ring-1 ring-[#B8860B]/20 scale-[1.02]' : ''}`}
                role="group"
                aria-label={`Step ${index + 1}: ${step.name}`}
                aria-current={isActive ? 'step' : undefined}
            >
                {isActive && <ScanLine />}

                <div className="flex justify-between items-center mb-1 sm:mb-2">
                    <span className={`text-[9px] sm:text-[10px] font-bold ${isActive ? 'text-[#B8860B]' : 'text-[#7A756F]'}`}>
                        Step {index + 1}
                    </span>
                    {isAI && (
                        <span
                            className={`text-[8px] sm:text-[9px] px-1 py-0.5 rounded-full ${isActive ? 'bg-[#6B1F7A] text-white' : 'bg-[#6B1F7A]/10 text-[#6B1F7A]'
                                }`}
                        >
                            AI
                        </span>
                    )}
                </div>

                <div
                    className={`text-[10px] sm:text-xs font-semibold truncate mb-1 sm:mb-2 ${isActive ? 'text-[#1A1612]' : 'text-[#7A756F]'
                        }`}
                    title={step.name}
                >
                    {step.name}
                </div>

                <div className="flex items-center justify-between">
                    {stat ? (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[#B8860B] font-bold text-xs sm:text-sm"
                            aria-label={`${stat.candidateCount} candidates`}
                        >
                            {stat.candidateCount}
                        </motion.span>
                    ) : isActive ? (
                        <span className="text-[#2D7A5C] animate-pulse text-[9px] sm:text-xs font-medium">
                            Processing
                        </span>
                    ) : (
                        <span className="text-[#D0CBC5]">—</span>
                    )}
                    {isPast && <CheckCircleIcon />}
                </div>
            </motion.div>

            {/* Connector Line */}
            {!isLast && (
                <div
                    className="absolute top-1/2 -right-1 w-2 h-0.5 bg-[#F0E8DE] hidden sm:block"
                    aria-hidden="true"
                />
            )}
        </div>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const AnalysisPipelineTracker = memo(function AnalysisPipelineTracker({
    stats,
    allSteps,
    currentStage,
    isConnected,
    isComplete = false,
    'aria-label': ariaLabel = 'Analysis Pipeline',
}: AnalysisPipelineTrackerProps) {
    const [load, setLoad] = useState(72.4);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Memory-safe load animation
    useEffect(() => {
        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (isComplete) {
            setLoad(0);
            return;
        }

        intervalRef.current = setInterval(() => {
            setLoad(prev => {
                const step = allSteps[currentStage];
                const isAIStage = step?.id === 'discovery' || step?.id === 'seal';
                const baseLoad = isAIStage ? 85 : currentStage > 0 ? 45 : 12;
                const jitter = (Math.random() - 0.5) * 10;
                const next = Math.max(10, Math.min(99, baseLoad + jitter));
                return Number(next.toFixed(1));
            });
        }, 1200);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [currentStage, allSteps, isComplete]);

    const activeStat = stats[stats.length - 1];
    const candidateCount = activeStat?.candidateCount || 0;
    const currentStep = allSteps[currentStage];
    const isAIStage = currentStep?.id === 'discovery' || currentStep?.id === 'seal';

    // Calculate precision based on stage
    const precision = useCallback(() => {
        if (currentStage >= 8) return '±3 seconds';
        if (currentStage >= 6) return '±6 seconds';
        if (currentStage >= 4) return '±30 seconds';
        return '±60 seconds';
    }, [currentStage])();

    return (
        <div
            className="w-full bg-white border border-[#F0E8DE] rounded-2xl p-4 sm:p-6 font-sans text-sm overflow-hidden relative shadow-sm"
            role="region"
            aria-label={ariaLabel}
        >
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B8860B]/20 to-[#D4A853]/10 flex items-center justify-center border border-[#D4A853]/20"
                        aria-hidden="true"
                    >
                        <Settings className="w-5 h-5 text-[#B8860B]" />
                    </div>
                    <div>
                        <h3 className="font-bold text-[#1A1612] text-base sm:text-lg">Analysis Pipeline</h3>
                        <p className="text-xs text-[#7A756F]">Real-time processing stages</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                    {/* System Status */}
                    <div
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#FDF8F3] rounded-lg border border-[#F0E8DE]"
                        role="status"
                        aria-live="polite"
                        aria-label={`Connection status: ${isConnected ? 'Online' : 'Reconnecting'}`}
                    >
                        <span
                            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#2D7A5C]' : 'bg-[#C65D3B]'} animate-pulse`}
                            aria-hidden="true"
                        />
                        <span className={`text-xs font-semibold ${isConnected ? 'text-[#2D7A5C]' : 'text-[#C65D3B]'}`}>
                            {isConnected ? 'Online' : 'Reconnecting'}
                        </span>
                    </div>

                    {/* Active Engine */}
                    <div className="text-right">
                        <div className="text-[10px] text-[#7A756F] uppercase tracking-wider mb-0.5">Active Engine</div>
                        <div className="text-xs font-semibold text-[#B8860B]">
                            {currentStage >= 0 ? (isAIStage ? 'DeepSeek R1' : 'Swiss Ephemeris') : 'Idle'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pipeline Blocks */}
            <div
                className="relative flex items-center justify-between gap-2 overflow-x-auto pb-4 pt-2 scrollbar-none"
                role="list"
                aria-label="Pipeline steps"
            >
                {allSteps.map((step, idx) => (
                    <StageStep
                        key={step.id}
                        step={step}
                        index={idx}
                        isActive={currentStage === idx}
                        isPast={currentStage > idx}
                        isAI={step.id === 'discovery' || step.id === 'seal'}
                        stat={stats.find(s => s.stage === idx)}
                        isLast={idx === allSteps.length - 1}
                    />
                ))}
            </div>

            {/* Sub-Metrics Bar */}
            <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-center border-t border-[#F0E8DE] pt-4">
                <div className="group">
                    <div className="text-[10px] text-[#7A756F] uppercase tracking-wider mb-1">Current Task</div>
                    <div className="text-[#1A1612] text-xs font-medium truncate">
                        {activeStat?.description || 'Waiting for task...'}
                    </div>
                </div>

                <div>
                    <div className="text-[10px] text-[#7A756F] uppercase tracking-wider mb-1">Precision</div>
                    <div className="text-[#B8860B] text-xs font-semibold">{precision}</div>
                </div>

                <div>
                    <div className="text-[10px] text-[#7A756F] uppercase tracking-wider mb-1">Candidates</div>
                    <div
                        className="text-[#1A1612] text-xs font-mono font-semibold"
                        aria-label={`${candidateCount} candidates`}
                    >
                        {candidateCount > 0 ? candidateCount.toLocaleString() : '0'}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-[#7A756F] uppercase tracking-wider">Load</span>
                        <span className={`text-[10px] font-bold ${load > 90 ? 'text-[#C65D3B]' : 'text-[#B8860B]'}`}>
                            {load}%
                        </span>
                    </div>
                    <div
                        className="w-full bg-[#F5EFE7] h-1.5 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={load}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="System load"
                    >
                        <motion.div
                            className={`h-full rounded-full ${load > 90 ? 'bg-[#C65D3B]' : 'bg-gradient-to-r from-[#2D7A5C] to-[#B8860B]'}`}
                            initial={{ width: '0%' }}
                            animate={{ width: `${load}%` }}
                            transition={{ duration: 1 }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});

export default AnalysisPipelineTracker;
