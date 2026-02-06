'use client';

// app/rectify/[id]/page-fixed.tsx
// Production-grade analysis page with error boundaries,
// accessibility, responsive design, and optimized performance

import React, { useEffect, useState, useRef, useCallback, useMemo, memo, useId } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown, ChevronUp, Brain, Clock, Activity, Users, Radio,
    Home, LayoutDashboard, AlertCircle, Settings,
    CheckCircle, XCircle, RefreshCw, Download, Share2
} from 'lucide-react';
import { useStreamProgress } from '@/lib/use-stream-progress-fixed';
import { logger } from '@/lib/secure-logger';
import { AnalysisErrorBoundary, SectionErrorBoundary } from '@/components/rectify/AnalysisErrorBoundary';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface AnalysisTimerProps {
    startedAt: string | null;
    isComplete: boolean;
}

interface ProgressBarProps {
    percentage: number;
    stepIndex: number;
    totalSteps: number;
    message?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const THEME = {
    bg: '#FFFCF8',
    surface: '#FFFFFF',
    surfaceWarm: '#FDF8F3',
    surfaceCream: '#FAF5EF',
    border: '#F0E8DE',
    borderHover: '#E8E0D5',
    textPrimary: '#1A1612',
    textSecondary: '#4A453F',
    textMuted: '#7A756F',
    textSubtle: '#A8A39D',
    gold: '#B8860B',
    goldLight: '#D4A853',
    goldPale: '#F2E4C6',
    success: '#2D7A5C',
    successLight: '#D4E5DE',
    warning: '#E8A849',
    error: '#C65D3B',
    plum: '#6B1F7A',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYSIS TIMER COMPONENT (Memoized)
// ═══════════════════════════════════════════════════════════════════════════════

const AnalysisTimer = memo(function AnalysisTimer({ startedAt, isComplete }: AnalysisTimerProps) {
    const [elapsed, setElapsed] = useState(0);
    const [isValid, setIsValid] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Parse start time safely
    const startTime = useMemo(() => {
        if (!startedAt) return null;
        const parsed = new Date(startedAt);
        return isNaN(parsed.getTime()) ? null : parsed;
    }, [startedAt]);

    useEffect(() => {
        setIsValid(!!startTime && !isComplete);

        // Clear existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (startTime && !isComplete) {
            // Initial calculation
            setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));

            // Start interval
            intervalRef.current = setInterval(() => {
                setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [startTime, isComplete]);

    const formatTime = useCallback((seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    if (!isValid) {
        return (
            <div
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-400"
                aria-label="Timer not started"
            >
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span className="font-mono tabular-nums">--:--</span>
            </div>
        );
    }

    return (
        <motion.div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm"
            style={{
                backgroundColor: THEME.surfaceWarm,
                borderColor: THEME.border,
                color: THEME.textSecondary
            }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            role="timer"
            aria-label={`Analysis time: ${formatTime(elapsed)}`}
        >
            <Clock className="w-4 h-4" style={{ color: THEME.gold }} aria-hidden="true" />
            <span className="font-mono tabular-nums">{formatTime(elapsed)}</span>
        </motion.div>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS BAR COMPONENT (Memoized with ARIA)
// ═══════════════════════════════════════════════════════════════════════════════

const ProgressBar = memo(function ProgressBar({
    percentage,
    stepIndex,
    totalSteps,
    message
}: ProgressBarProps) {
    const clampedPercentage = Math.min(100, Math.max(0, percentage));
    const progressId = useId();

    return (
        <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm font-medium" style={{ color: THEME.textSecondary }}>
                        Analysis Progress
                    </span>
                    <span
                        className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${THEME.success}15`, color: THEME.success }}
                    >
                        Step {stepIndex + 1} of {totalSteps}
                    </span>
                </div>
                <motion.span
                    className="text-base sm:text-lg font-bold tabular-nums"
                    style={{ color: THEME.gold }}
                    key={clampedPercentage}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {Math.round(clampedPercentage)}%
                </motion.span>
            </div>

            <div
                className="h-3 sm:h-4 rounded-full overflow-hidden border"
                style={{ backgroundColor: THEME.surfaceCream, borderColor: THEME.border }}
                role="progressbar"
                aria-valuenow={clampedPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-labelledby={progressId}
                aria-valuetext={`${Math.round(clampedPercentage)} percent complete`}
            >
                <motion.div
                    className="h-full rounded-full"
                    style={{
                        background: `linear-gradient(90deg, ${THEME.gold}, ${THEME.goldLight})`,
                        boxShadow: `0 0 20px ${THEME.gold}40`
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${clampedPercentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>

            {message && (
                <motion.p
                    id={progressId}
                    className="mt-2 sm:mt-3 text-xs sm:text-sm"
                    style={{ color: THEME.textMuted }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={message}
                >
                    {message}
                </motion.p>
            )}
        </div>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// PIPELINE TRACKER COMPONENT (Memoized)
// ═══════════════════════════════════════════════════════════════════════════════

const PipelineTracker = memo(function PipelineTracker({
    steps,
    currentStep,
    isConnected,
    stats,
}: {
    steps: Array<{ id: string; name: string; icon?: string }>;
    currentStep: number;
    isConnected: boolean;
    stats: Array<{ stage: number; candidateCount: number; description?: string }>;
}) {
    const [load, setLoad] = useState(45);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Clear previous interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        intervalRef.current = setInterval(() => {
            setLoad(prev => {
                const isAIStage = currentStep >= 1 && currentStep <= 3;
                const baseLoad = isAIStage ? 85 : currentStep > 3 ? 45 : 25;
                const jitter = (Math.random() - 0.5) * 15;
                return Math.max(10, Math.min(99, baseLoad + jitter));
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [currentStep]);

    const activeStat = stats[stats.length - 1];
    const candidateCount = activeStat?.candidateCount || 0;

    return (
        <motion.div
            className="rounded-2xl border p-4 sm:p-6 mb-4 sm:mb-6"
            style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            role="region"
            aria-label="Analysis Pipeline"
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border"
                        style={{
                            backgroundColor: `${THEME.gold}15`,
                            borderColor: `${THEME.gold}30`
                        }}
                        aria-hidden="true"
                    >
                        <Settings className="w-5 h-5" style={{ color: THEME.gold }} />
                    </div>
                    <div>
                        <h3 className="font-bold text-base sm:text-lg" style={{ color: THEME.textPrimary }}>
                            Analysis Pipeline
                        </h3>
                        <p className="text-[10px] sm:text-xs" style={{ color: THEME.textMuted }}>
                            Real-time processing stages
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                    <div
                        className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg border"
                        style={{ backgroundColor: THEME.surfaceWarm, borderColor: THEME.border }}
                        role="status"
                        aria-live="polite"
                    >
                        <motion.span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: isConnected ? THEME.success : THEME.error }}
                            animate={{ scale: isConnected ? [1, 1.2, 1] : 1 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            aria-hidden="true"
                        />
                        <span
                            className="text-xs font-semibold"
                            style={{ color: isConnected ? THEME.success : THEME.error }}
                        >
                            {isConnected ? 'Online' : 'Reconnecting'}
                        </span>
                    </div>

                    <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: THEME.textMuted }}>
                            Active Engine
                        </div>
                        <div className="text-xs font-semibold" style={{ color: THEME.gold }}>
                            {currentStep >= 1 && currentStep <= 3 ? 'DeepSeek R1' : 'Swiss Ephemeris'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stage Steps */}
            <div
                className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-none"
                role="list"
                aria-label="Pipeline steps"
            >
                {steps.map((step, idx) => {
                    const isActive = idx === currentStep;
                    const isComplete = idx < currentStep;

                    return (
                        <motion.div
                            key={step.id}
                            className="flex-shrink-0 px-3 sm:px-4 py-2 rounded-xl border text-[10px] sm:text-xs font-medium min-w-[80px] sm:min-w-[100px] text-center"
                            style={{
                                backgroundColor: isActive ? `${THEME.gold}15` : isComplete ? `${THEME.success}10` : THEME.surfaceWarm,
                                borderColor: isActive ? `${THEME.gold}50` : isComplete ? `${THEME.success}30` : THEME.border,
                                color: isActive ? THEME.gold : isComplete ? THEME.success : THEME.textMuted
                            }}
                            animate={isActive ? { scale: [1, 1.02, 1] } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                            role="listitem"
                            aria-current={isActive ? 'step' : undefined}
                            aria-label={`Step ${idx + 1}: ${step.name}${isComplete ? ' (Complete)' : isActive ? ' (Active)' : ''}`}
                        >
                            <div className="font-bold mb-0.5">Step {idx + 1}</div>
                            <div className="truncate">{step.name}</div>
                            {isComplete && <CheckCircle className="w-3 h-3 mx-auto mt-1" aria-hidden="true" />}
                        </motion.div>
                    );
                })}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-wider mb-1" style={{ color: THEME.textMuted }}>Current Task</div>
                    <div className="text-xs sm:text-sm font-semibold truncate" style={{ color: THEME.textPrimary }}>
                        {steps[currentStep]?.name || 'Waiting...'}
                    </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-wider mb-1" style={{ color: THEME.textMuted }}>Precision</div>
                    <div className="text-xs sm:text-sm font-semibold" style={{ color: THEME.gold }}>±60 seconds</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-wider mb-1" style={{ color: THEME.textMuted }}>Candidates</div>
                    <motion.div
                        className="text-xs sm:text-sm font-semibold tabular-nums"
                        style={{ color: THEME.textPrimary }}
                        key={candidateCount}
                        initial={{ scale: 1.5, color: THEME.gold }}
                        animate={{ scale: 1, color: THEME.textPrimary }}
                    >
                        {candidateCount}
                    </motion.div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-wider mb-1" style={{ color: THEME.textMuted }}>Load</div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: THEME.gold }}
                                animate={{ width: `${load}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        <span className="text-xs font-semibold tabular-nums" style={{ color: THEME.gold }}>
                            {load.toFixed(0)}%
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// AI THINKING PANEL COMPONENT (Memoized)
// ═══════════════════════════════════════════════════════════════════════════════

const AIThinkingPanel = memo(function AIThinkingPanel({
    thinking,
    isActive,
}: {
    thinking: { fullText: string; candidateTime?: string } | null;
    isActive: boolean;
}) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textRef = useRef(thinking?.fullText || '');
    const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Smooth typing effect
    useEffect(() => {
        const fullText = thinking?.fullText || '';

        if (fullText !== textRef.current) {
            textRef.current = fullText;
            setIsTyping(true);

            // Clear existing interval
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }

            let index = displayedText.length;
            typingIntervalRef.current = setInterval(() => {
                if (index < fullText.length) {
                    setDisplayedText(fullText.slice(0, index + 1));
                    index++;
                } else {
                    if (typingIntervalRef.current) {
                        clearInterval(typingIntervalRef.current);
                        typingIntervalRef.current = null;
                    }
                    setIsTyping(false);
                }
            }, 5);
        }

        return () => {
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }
        };
    }, [thinking?.fullText]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current && isExpanded) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [displayedText, isExpanded]);

    if (!thinking) return null;

    return (
        <motion.div
            className="rounded-2xl border overflow-hidden mb-4 sm:mb-6"
            style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            role="region"
            aria-label="AI Reasoning Panel"
        >
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b outline-none focus:ring-2 focus:ring-inset focus:ring-[#B8860B]/30"
                style={{ backgroundColor: THEME.surfaceWarm, borderColor: THEME.border }}
                aria-expanded={isExpanded}
                aria-controls="ai-thinking-content"
            >
                <div className="flex items-center gap-2 sm:gap-3">
                    <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${THEME.plum}15` }}
                        aria-hidden="true"
                    >
                        <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: THEME.plum }} />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-sm sm:text-base" style={{ color: THEME.textPrimary }}>
                            Stage 2: Coarse Elimination
                        </h3>
                        <p className="text-[10px] sm:text-xs" style={{ color: THEME.textMuted }}>
                            Candidates: 60 → 15
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    {isActive && (
                        <span
                            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium"
                            style={{
                                backgroundColor: `${THEME.plum}15`,
                                color: THEME.plum
                            }}
                        >
                            <motion.span
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                aria-hidden="true"
                            >
                                ●
                            </motion.span>
                            THINKING
                        </span>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" aria-hidden="true" />
                    ) : (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" aria-hidden="true" />
                    )}
                </div>
            </button>

            {/* Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        id="ai-thinking-content"
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div
                            ref={scrollRef}
                            className="p-4 sm:p-6 max-h-[300px] sm:max-h-[400px] overflow-y-auto font-mono text-xs sm:text-sm leading-relaxed"
                            style={{
                                backgroundColor: THEME.surface,
                                color: THEME.textSecondary
                            }}
                            tabIndex={0}
                            role="log"
                            aria-live="polite"
                            aria-atomic="false"
                        >
                            <div className="whitespace-pre-wrap">
                                {displayedText}
                                {isTyping && (
                                    <motion.span
                                        animate={{ opacity: [1, 0, 1] }}
                                        transition={{ duration: 0.5, repeat: Infinity }}
                                        style={{ color: THEME.gold }}
                                        aria-hidden="true"
                                    >
                                        |
                                    </motion.span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// CANDIDATE SCORE TABLE COMPONENT (Memoized)
// ═══════════════════════════════════════════════════════════════════════════════

interface CandidateScore {
    time: string;
    score: number;
    stage: number;
}

const CandidateScoreTable = memo(function CandidateScoreTable({
    scores,
}: {
    scores: CandidateScore[];
}) {
    const sortedScores = useMemo(() =>
        [...scores].sort((a, b) => b.score - a.score),
        [scores]
    );

    if (scores.length === 0) {
        return (
            <motion.div
                className="rounded-2xl border p-6 sm:p-8 text-center"
                style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                role="status"
                aria-live="polite"
            >
                <div className="text-3xl sm:text-4xl mb-3" aria-hidden="true">🔍</div>
                <p style={{ color: THEME.textMuted }}>Waiting for candidates...</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            role="region"
            aria-label="Candidate Scores"
        >
            <div
                className="flex items-center justify-between border-b px-4 sm:px-6 py-3 sm:py-4"
                style={{ backgroundColor: THEME.surfaceWarm, borderColor: THEME.border }}
            >
                <h3
                    className="text-[10px] sm:text-xs font-black tracking-widest uppercase"
                    style={{ color: THEME.success }}
                >
                    Vedic Astrological Data Table
                </h3>
                <span
                    className="rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium"
                    style={{ backgroundColor: `${THEME.plum}15`, color: THEME.plum }}
                >
                    {scores.length} Analyzed
                </span>
            </div>

            <div className="max-h-[250px] sm:max-h-[300px] overflow-y-auto overflow-x-auto">
                <table className="w-full min-w-[300px] text-xs sm:text-sm">
                    <caption className="sr-only">Candidate scores ranked by match percentage</caption>
                    <thead
                        className="sticky top-0 text-[10px] sm:text-xs font-medium uppercase z-10"
                        style={{ backgroundColor: THEME.surfaceCream, color: THEME.textMuted }}
                    >
                        <tr>
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left" scope="col">Rank</th>
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left" scope="col">Time</th>
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left" scope="col">Score</th>
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-right" scope="col">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: THEME.border }}>
                        <AnimatePresence>
                            {sortedScores.map((candidate, index) => (
                                <motion.tr
                                    key={candidate.time}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-3 sm:px-6 py-2 sm:py-3 font-mono" style={{ color: THEME.textMuted }}>
                                        #{index + 1}
                                    </td>
                                    <td className="px-3 sm:px-6 py-2 sm:py-3 font-mono font-medium tabular-nums" style={{ color: THEME.textPrimary }}>
                                        {candidate.time}
                                    </td>
                                    <td className="px-3 sm:px-6 py-2 sm:py-3">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-1.5 w-12 sm:w-16 rounded-full overflow-hidden"
                                                style={{ backgroundColor: THEME.border }}
                                                role="progressbar"
                                                aria-valuenow={candidate.score}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                            >
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        backgroundColor: candidate.score >= 80 ? THEME.success :
                                                            candidate.score >= 50 ? THEME.warning : THEME.error
                                                    }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${candidate.score}%` }}
                                                    transition={{ duration: 0.5, delay: index * 0.05 }}
                                                />
                                            </div>
                                            <span
                                                className="font-mono font-bold text-[10px] sm:text-xs"
                                                style={{
                                                    color: candidate.score >= 80 ? THEME.success :
                                                        candidate.score >= 50 ? THEME.warning : THEME.error
                                                }}
                                            >
                                                {candidate.score}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-2 sm:py-3 text-right">
                                        <span
                                            className="inline-flex items-center gap-1 rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] font-medium"
                                            style={{
                                                backgroundColor: `${THEME.success}15`,
                                                color: THEME.success
                                            }}
                                        >
                                            <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
                                            Complete
                                        </span>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR DISPLAY COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const ErrorDisplay = memo(function ErrorDisplay({
    error,
    onRetry,
}: {
    error: string;
    onRetry: () => void;
}) {
    return (
        <div
            className="min-h-screen pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6"
            style={{ backgroundColor: THEME.bg }}
            role="alert"
            aria-live="assertive"
        >
            <motion.div
                className="max-w-2xl mx-auto rounded-2xl border p-6 sm:p-8 text-center"
                style={{ backgroundColor: THEME.surface, borderColor: `${THEME.error}30` }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div
                    className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${THEME.error}10` }}
                    aria-hidden="true"
                >
                    <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: THEME.error }} />
                </div>
                <h2
                    className="text-xl sm:text-2xl font-bold mb-2"
                    style={{ color: THEME.textPrimary }}
                >
                    Analysis Error
                </h2>
                <p className="mb-6 text-sm sm:text-base" style={{ color: THEME.textMuted }}>{error}</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={onRetry}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                            background: `linear-gradient(90deg, ${THEME.gold}, ${THEME.goldLight})`,
                        }}
                    >
                        <RefreshCw className="w-4 h-4" aria-hidden="true" />
                        Try Again
                    </button>
                    <Link
                        href="/dashboard"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold border transition-colors outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                            borderColor: THEME.border,
                            color: THEME.textSecondary,
                        }}
                    >
                        <Home className="w-4 h-4" aria-hidden="true" />
                        Dashboard
                    </Link>
                </div>
            </motion.div>
        </div>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING STATE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const LoadingState = memo(function LoadingState() {
    return (
        <div
            className="min-h-screen pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6"
            style={{ backgroundColor: THEME.bg }}
            role="status"
            aria-live="polite"
            aria-label="Loading analysis"
        >
            <motion.div
                className="max-w-2xl mx-auto rounded-2xl border p-6 sm:p-8 text-center"
                style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" aria-hidden="true">
                    <motion.div
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4"
                        style={{ borderColor: `${THEME.gold}20`, borderTopColor: THEME.gold }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                </div>
                <h2
                    className="text-lg sm:text-xl font-bold mb-2"
                    style={{ color: THEME.textPrimary }}
                >
                    Connecting to Analysis Engine...
                </h2>
                <p className="text-sm" style={{ color: THEME.textMuted }}>
                    Establishing secure connection to backend
                </p>
            </motion.div>
        </div>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// BREADCRUMBS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: React.ReactNode;
}

const Breadcrumbs = memo(function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
    return (
        <nav
            className="flex items-center gap-2 text-xs sm:text-sm mb-3 sm:mb-4"
            style={{ color: THEME.textMuted }}
            aria-label="Breadcrumb"
        >
            <ol className="flex flex-wrap items-center gap-2">
                {items.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                        {index > 0 && <span style={{ color: THEME.border }} aria-hidden="true">/</span>}
                        {item.href ? (
                            <Link
                                href={item.href}
                                className="flex items-center gap-1.5 hover:text-[#B8860B] transition-colors outline-none focus:ring-2 focus:ring-[#B8860B]/30 rounded"
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        ) : (
                            <span
                                className="flex items-center gap-1.5 font-medium"
                                style={{ color: THEME.textPrimary }}
                                aria-current="page"
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function RobustAnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const { getToken } = useAuth();
    const sessionId = params.id as string;
    const pageTitleId = useId();

    // SSE Hook
    const streamData = useStreamProgress(
        sessionId,
        process.env.NEXT_PUBLIC_BACKEND_URL || '',
        getToken
    );

    const {
        isConnected,
        isComplete,
        error: streamError,
        progress,
        aiThinking,
        stageHistory,
        candidateScores,
        stageStats,
        result,
        startedAt,
        allSteps,
        metadata,
    } = streamData;

    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelled, setCancelled] = useState(false);

    // Sync cancellation status
    useEffect(() => {
        if (metadata?.status === 'cancelled') {
            setCancelled(true);
        }
    }, [metadata?.status]);

    // Cancel handler
    const handleCancel = useCallback(async () => {
        if (isCancelling || cancelled) return;

        try {
            setIsCancelling(true);
            const token = await getToken();

            const res = await fetch('/api/queue/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sessionId })
            });

            if (res.ok) {
                setCancelled(true);
                logger.info('Analysis cancelled', { sessionId });
            }
        } catch (err) {
            logger.error('Cancel failed', err);
        } finally {
            setIsCancelling(false);
        }
    }, [sessionId, getToken, isCancelling, cancelled]);

    // Memoized progress percentage
    const progressPercentage = useMemo(() =>
        progress?.percentage ||
        (allSteps?.length ? ((progress?.stepIndex || 0) / allSteps.length) * 100 : 0),
        [progress?.percentage, progress?.stepIndex, allSteps?.length]
    );

    // Loading state
    if (!isConnected && !streamError && !result) {
        return <LoadingState />;
    }

    // Error state
    if (streamError) {
        return (
            <ErrorDisplay
                error={streamError}
                onRetry={() => window.location.reload()}
            />
        );
    }

    return (
        <AnalysisErrorBoundary sectionName="Analysis Page">
            <main
                className="min-h-screen"
                style={{ backgroundColor: THEME.bg }}
                aria-labelledby={pageTitleId}
            >
                {/* Header */}
                <header
                    className="sticky top-0 z-40 border-b"
                    style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}
                    role="banner"
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                        <Breadcrumbs
                            items={[
                                { label: 'Home', href: '/', icon: <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
                                { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
                                { label: 'Analysis', icon: <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> }
                            ]}
                        />

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h1
                                    id={pageTitleId}
                                    className="text-lg sm:text-2xl font-bold"
                                    style={{ color: THEME.textPrimary }}
                                >
                                    Analysis for {metadata?.fullName || 'Birth Time Analysis'}
                                </h1>
                                <p className="text-xs sm:text-sm" style={{ color: THEME.textMuted }}>
                                    Session ID: <span className="font-mono tabular-nums" style={{ color: THEME.gold }}>{sessionId.slice(0, 8)}...</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <AnalysisTimer
                                    startedAt={startedAt || null}
                                    isComplete={isComplete}
                                />

                                {!isComplete && !cancelled && (
                                    <button
                                        onClick={handleCancel}
                                        disabled={isCancelling}
                                        className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border transition-colors disabled:opacity-50 outline-none focus:ring-2 focus:ring-[#C65D3B]/30"
                                        style={{
                                            color: THEME.error,
                                            borderColor: `${THEME.error}30`,
                                            backgroundColor: `${THEME.error}05`
                                        }}
                                        aria-label="Cancel analysis"
                                    >
                                        {isCancelling ? 'Cancelling...' : 'Cancel'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    {/* Connection Status */}
                    <motion.div
                        className="flex items-center gap-2 mb-4 sm:mb-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        role="status"
                        aria-live="polite"
                    >
                        <motion.span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: isConnected ? THEME.success : THEME.error }}
                            animate={{ scale: isConnected ? [1, 1.3, 1] : 1 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            aria-hidden="true"
                        />
                        <span className="text-xs sm:text-sm" style={{ color: THEME.textMuted }}>
                            {isConnected ? 'Connected to analysis engine' : 'Reconnecting...'}
                        </span>
                    </motion.div>

                    {/* Progress */}
                    {!isComplete && !cancelled && (
                        <ProgressBar
                            percentage={progressPercentage}
                            stepIndex={progress?.stepIndex || 0}
                            totalSteps={allSteps?.length || 5}
                            message={progress?.message}
                        />
                    )}

                    {/* Cancelled */}
                    {cancelled && (
                        <motion.div
                            className="rounded-2xl border p-6 sm:p-8 text-center mb-6 sm:mb-8"
                            style={{ backgroundColor: THEME.surface, borderColor: `${THEME.warning}30` }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            role="alert"
                        >
                            <h2 className="text-lg sm:text-xl font-bold mb-2" style={{ color: THEME.textPrimary }}>
                                Analysis Cancelled
                            </h2>
                            <p className="mb-4 text-sm" style={{ color: THEME.textMuted }}>
                                The analysis was cancelled by user request.
                            </p>
                            <Link
                                href="/rectify?new=true"
                                className="inline-block px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 outline-none focus:ring-2 focus:ring-offset-2"
                                style={{ background: `linear-gradient(90deg, ${THEME.gold}, ${THEME.goldLight})` }}
                            >
                                Start New Analysis
                            </Link>
                        </motion.div>
                    )}

                    {/* Pipeline Tracker */}
                    {allSteps && allSteps.length > 0 && (
                        <SectionErrorBoundary
                            sectionName="Pipeline Tracker"
                            icon={<Settings className="w-5 h-5" />}
                        >
                            <PipelineTracker
                                steps={allSteps}
                                currentStep={progress?.stepIndex || 0}
                                isConnected={isConnected}
                                stats={stageStats || []}
                            />
                        </SectionErrorBoundary>
                    )}

                    {/* AI Thinking Panel */}
                    {aiThinking && (
                        <SectionErrorBoundary
                            sectionName="AI Thinking"
                            icon={<Brain className="w-5 h-5" />}
                        >
                            <AIThinkingPanel
                                thinking={aiThinking}
                                isActive={!isComplete && !cancelled}
                            />
                        </SectionErrorBoundary>
                    )}

                    {/* Candidate Scores */}
                    {candidateScores && candidateScores.length > 0 && !isComplete && (
                        <SectionErrorBoundary
                            sectionName="Candidate Scores"
                            icon={<Activity className="w-5 h-5" />}
                        >
                            <CandidateScoreTable scores={candidateScores} />
                        </SectionErrorBoundary>
                    )}
                </div>
            </main>
        </AnalysisErrorBoundary>
    );
}
