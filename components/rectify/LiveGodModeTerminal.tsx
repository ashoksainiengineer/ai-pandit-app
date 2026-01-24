'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Filter, Target, ChevronDown, ChevronUp, Clock, Zap, Brain } from 'lucide-react';
import { AIContextData } from '@/lib/use-stream-progress';

interface Candidate {
    time: string;
    score: number;
    stage: number;
    rank?: number;
    reasoning?: string;
}

interface LiveGodModeTerminalProps {
    candidateScores: Candidate[];
    calculationLogs: Array<{ candidateTime: string; log: string }>;
    currentStage: number;
    isConnected: boolean;
    aiContext: AIContextData | null;
}

export function LiveGodModeTerminal({
    candidateScores,
    calculationLogs,
    currentStage,
    isConnected,
    aiContext
}: LiveGodModeTerminalProps) {
    const [expandedLevel, setExpandedLevel] = useState<number | null>(1);

    // Organize candidates by level
    const level1Candidates = useMemo(() =>
        candidateScores.filter(c => c.stage === 2).sort((a, b) => b.score - a.score),
        [candidateScores]
    );
    const level2Candidates = useMemo(() =>
        candidateScores.filter(c => c.stage === 4).sort((a, b) => b.score - a.score),
        [candidateScores]
    );
    const level3Candidates = useMemo(() =>
        candidateScores.filter(c => c.stage === 6).sort((a, b) => b.score - a.score),
        [candidateScores]
    );

    // Current analyzing candidate
    const currentCandidate = aiContext?.candidateTime;

    // Toggle level expansion
    const toggleLevel = (level: number) => {
        setExpandedLevel(expandedLevel === level ? null : level);
    };

    return (
        <div className="w-full bg-[#0F1419] border border-[#2A3442] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-[#1A2433] px-4 py-3 flex items-center justify-between border-b border-[#2A3442]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                        <Target className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#F5F0EB]">Candidate Funnel</h3>
                        <p className="text-xs text-[#8C7F72]">
                            {candidateScores.length} total • Stage {currentStage}
                        </p>
                    </div>
                </div>

                {/* Current Candidate Indicator */}
                {currentCandidate && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/30">
                        <Brain className="w-4 h-4 text-[#D4AF37] animate-pulse" />
                        <span className="text-xs font-bold text-[#D4AF37]">Analyzing: {currentCandidate}</span>
                    </div>
                )}

                {/* Connection Status */}
                <div className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                    {isConnected ? 'Live' : 'Offline'}
                </div>
            </div>

            {/* LEVEL 1: Coarse Candidates */}
            <LevelSection
                level={1}
                title="Stage 1-2: Initial Scan"
                subtitle={`${level1Candidates.length} candidates`}
                color="orange"
                isExpanded={expandedLevel === 1}
                onToggle={() => toggleLevel(1)}
                candidates={level1Candidates}
                currentCandidate={currentCandidate}
                showAsDots={level1Candidates.length > 20}
            />

            {/* LEVEL 2: Fine Candidates */}
            <LevelSection
                level={2}
                title="Stage 3-4: Tournament"
                subtitle={`${level2Candidates.length} candidates`}
                color="blue"
                isExpanded={expandedLevel === 2}
                onToggle={() => toggleLevel(2)}
                candidates={level2Candidates}
                currentCandidate={currentCandidate}
            />

            {/* LEVEL 3: Final Candidates */}
            <LevelSection
                level={3}
                title="Stage 5-6: Final"
                subtitle={`${level3Candidates.length} candidates`}
                color="gold"
                isExpanded={expandedLevel === 3}
                onToggle={() => toggleLevel(3)}
                candidates={level3Candidates}
                currentCandidate={currentCandidate}
                isFinal
            />

            {/* Recent Logs (Simplified) */}
            {calculationLogs.length > 0 && (
                <div className="border-t border-[#2A3442] bg-[#0A0F14] px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3 h-3 text-[#D4AF37]" />
                        <span className="text-xs font-bold text-[#8C7F72]">Recent Activity</span>
                    </div>
                    <div className="space-y-1 max-h-[80px] overflow-y-auto">
                        {calculationLogs.slice(-3).map((log, i) => (
                            <div key={i} className="text-xs text-[#8C7F72] flex gap-2">
                                <span className="text-[#D4AF37] font-mono w-16 shrink-0">{log.candidateTime}</span>
                                <span className="truncate">{log.log}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Separate Level Section Component
function LevelSection({
    level,
    title,
    subtitle,
    color,
    isExpanded,
    onToggle,
    candidates,
    currentCandidate,
    showAsDots = false,
    isFinal = false
}: {
    level: number;
    title: string;
    subtitle: string;
    color: 'orange' | 'blue' | 'gold';
    isExpanded: boolean;
    onToggle: () => void;
    candidates: Candidate[];
    currentCandidate?: string;
    showAsDots?: boolean;
    isFinal?: boolean;
}) {
    const colorClasses = {
        orange: {
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/30',
            text: 'text-orange-400',
            icon: 'text-orange-500'
        },
        blue: {
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30',
            text: 'text-blue-400',
            icon: 'text-blue-500'
        },
        gold: {
            bg: 'bg-[#D4AF37]/10',
            border: 'border-[#D4AF37]/30',
            text: 'text-[#D4AF37]',
            icon: 'text-[#D4AF37]'
        }
    };

    const colors = colorClasses[color];

    return (
        <div className={`border-b border-[#2A3442] ${isExpanded ? colors.bg : ''}`}>
            {/* Header */}
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#1A2433]/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-md ${colors.bg} flex items-center justify-center ${colors.border} border`}>
                        <span className={`text-xs font-bold ${colors.text}`}>{level}</span>
                    </div>
                    <div className="text-left">
                        <div className={`text-sm font-bold ${colors.text}`}>{title}</div>
                        <div className="text-xs text-[#8C7F72]">{subtitle}</div>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#8C7F72]" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-[#8C7F72]" />
                )}
            </button>

            {/* Content */}
            <AnimatePresence>
                {isExpanded && candidates.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-1">
                            {showAsDots ? (
                                /* Dot Grid for many candidates */
                                <div className="flex flex-wrap gap-1.5">
                                    {candidates.slice(0, 60).map((c) => (
                                        <div
                                            key={c.time}
                                            className={`w-3 h-3 rounded-full transition-all ${c.time === currentCandidate
                                                    ? 'bg-[#D4AF37] ring-2 ring-[#D4AF37] ring-offset-1 ring-offset-[#0F1419] animate-pulse'
                                                    : c.score > 70
                                                        ? 'bg-emerald-500'
                                                        : c.score > 40
                                                            ? 'bg-orange-500/50'
                                                            : 'bg-[#2A3442]'
                                                }`}
                                            title={`${c.time}: ${c.score}%`}
                                        />
                                    ))}
                                    {candidates.length > 60 && (
                                        <span className="text-xs text-[#8C7F72]">+{candidates.length - 60}</span>
                                    )}
                                </div>
                            ) : isFinal ? (
                                /* Final candidates with details */
                                <div className="space-y-2">
                                    {candidates.slice(0, 5).map((c, idx) => (
                                        <div
                                            key={c.time}
                                            className={`p-3 rounded-lg border ${idx === 0
                                                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50'
                                                    : 'bg-[#1A2433]/50 border-[#2A3442]'
                                                } ${c.time === currentCandidate ? 'ring-2 ring-[#D4AF37]' : ''}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-lg font-bold ${idx === 0 ? 'text-[#D4AF37]' : 'text-[#8C7F72]'}`}>
                                                        #{idx + 1}
                                                    </span>
                                                    <div>
                                                        <div className="text-lg font-bold text-[#F5F0EB] font-mono">{c.time}</div>
                                                        {c.time === currentCandidate && (
                                                            <span className="text-xs text-[#D4AF37] animate-pulse">Analyzing...</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-xl font-black ${idx === 0 ? 'text-[#D4AF37]' : 'text-[#F5F0EB]'}`}>
                                                        {c.score}%
                                                    </div>
                                                    <div className="text-xs text-[#8C7F72]">Score</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Grid view for medium count */
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {candidates.slice(0, 12).map((c) => (
                                        <div
                                            key={c.time}
                                            className={`p-2 rounded-lg border ${c.time === currentCandidate
                                                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 ring-1 ring-[#D4AF37]'
                                                    : 'bg-[#1A2433]/50 border-[#2A3442]'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-mono text-[#F5F0EB]">{c.time}</span>
                                                <span className={`text-sm font-bold ${c.score > 70 ? 'text-emerald-400' :
                                                        c.score > 50 ? 'text-orange-400' : 'text-[#8C7F72]'
                                                    }`}>
                                                    {c.score}%
                                                </span>
                                            </div>
                                            {c.time === currentCandidate && (
                                                <div className="mt-1 text-[10px] text-[#D4AF37] animate-pulse">
                                                    Analyzing...
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {candidates.length > 12 && (
                                        <div className="p-2 flex items-center justify-center text-xs text-[#8C7F72]">
                                            +{candidates.length - 12} more
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty state */}
            {isExpanded && candidates.length === 0 && (
                <div className="px-4 pb-4 pt-1">
                    <div className="text-center py-6 text-[#8C7F72] text-sm">
                        Waiting for candidates...
                    </div>
                </div>
            )}
        </div>
    );
}
