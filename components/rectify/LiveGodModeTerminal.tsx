'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Filter, Target, ChevronDown, ChevronUp, Clock, Zap, Brain } from 'lucide-react';
import { AIContextData } from '@/lib/store/stream-types';

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
        <div className="w-full bg-white border border-[#F0E8DE] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-[#FDF8F3] px-4 py-3 flex items-center justify-between border-b border-[#F0E8DE]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                        <Target className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#1A1612]">Candidate Funnel</h3>
                        <p className="text-xs text-[#4A453F]">
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
                <div className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-emerald-600' : 'text-red-600'}`}>
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-600' : 'bg-red-600'} animate-pulse`} />
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
                <div className="border-t border-[#F0E8DE] bg-[#FFFCF8] px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3 h-3 text-[#D4AF37]" />
                        <span className="text-xs font-bold text-[#4A453F]">Recent Activity</span>
                    </div>
                    <div className="space-y-1 max-h-[80px] overflow-y-auto">
                        {calculationLogs.slice(-3).filter(log => log?.candidateTime).map((log, i) => (
                            <div key={`log-${i}`} className="text-xs text-[#4A453F] flex gap-2">
                                <span className="text-[#D4AF37] font-mono w-16 shrink-0">{log.candidateTime || '-'}</span>
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
            text: 'text-orange-600',
            icon: 'text-orange-600'
        },
        blue: {
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30',
            text: 'text-blue-600',
            icon: 'text-blue-600'
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
        <div className={`border-b border-[#F0E8DE] ${isExpanded ? colors.bg : ''}`}>
            {/* Header */}
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#F5EFE7] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-md ${colors.bg} flex items-center justify-center ${colors.border} border`}>
                        <span className={`text-xs font-bold ${colors.text}`}>{level}</span>
                    </div>
                    <div className="text-left">
                        <div className={`text-sm font-bold ${colors.text}`}>{title}</div>
                        <div className="text-xs text-[#4A453F]">{subtitle}</div>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#4A453F]" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-[#4A453F]" />
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
                        {/* Table Header */}
                        <div className={`grid grid-cols-[15%_35%_25%_25%] px-4 py-2 border-b border-[#F0E8DE] bg-[#FDF8F3] text-[10px] font-bold uppercase tracking-wider ${colors.text} opacity-70`}>
                            <span>Rank</span>
                            <span>Time</span>
                            <span>Score</span>
                            <span className="text-right">Status</span>
                        </div>

                        {/* Scrollable Table Body */}
                        <div className="max-h-60 overflow-y-auto custom-scrollbar bg-white/50">
                            {candidates.map((c, idx) => (
                                <div
                                    key={c.time}
                                    className={`
                                        grid grid-cols-[15%_35%_25%_25%] px-4 py-2 border-b border-[#F0E8DE]/50 items-center text-xs transition-colors
                                        ${c.time === currentCandidate ? 'bg-[#D4AF37]/10' : 'hover:bg-[#F5EFE7]'}
                                    `}
                                >
                                    <span className={`font-mono ${idx < 3 ? 'text-[#D4AF37] font-bold' : 'text-[#4A453F]'}`}>
                                        #{idx + 1}
                                    </span>
                                    <span className={`font-mono font-bold ${c.time === currentCandidate ? 'text-[#D4AF37]' : 'text-[#1A1612]'}`}>
                                        {c.time}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-12 h-1.5 bg-[#F0E8DE] rounded-full overflow-hidden">
                                            <div
                                                style={{ width: `${c.score}%` }}
                                                className={`h-full rounded-full ${c.score > 80 ? 'bg-emerald-600' :
                                                    c.score > 50 ? 'bg-orange-600' : 'bg-red-600'
                                                    }`}
                                            />
                                        </div>
                                        <span className="text-[10px] text-[#4A453F]">{c.score}%</span>
                                    </div>
                                    <div className="text-right">
                                        {c.time === currentCandidate ? (
                                            <span className="text-[10px] text-[#D4AF37] font-bold animate-pulse">ANALYZING</span>
                                        ) : c.reasoning ? (
                                            <span className="text-[10px] text-emerald-600/80">VERIFIED</span>
                                        ) : (
                                            <span className="text-[10px] text-[#4A453F]">WAITING</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Summary */}
                        <div className="px-4 py-2 bg-[#FDF8F3] border-t border-[#F0E8DE] text-[10px] text-[#4A453F] flex justify-between">
                            <span>Showing {candidates.length} candidates</span>
                            <span>Top Score: {Math.max(...candidates.map(c => c.score))}%</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty state */}
            {isExpanded && candidates.length === 0 && (
                <div className="px-4 pb-4 pt-1">
                    <div className="text-center py-6 text-[#4A453F] text-sm italic">
                        Waiting for candidate data stream...
                    </div>
                </div>
            )}
        </div>
    );
}
