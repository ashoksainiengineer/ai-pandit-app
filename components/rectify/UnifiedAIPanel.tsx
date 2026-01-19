'use client';

// components/rectify/UnifiedAIPanel.tsx
// Premium unified AI analysis panel with DeepSeek-style collapsible thinking

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIContextData } from '@/lib/use-stream-progress';
import { ChevronDown, ChevronUp, Brain, Zap, Clock, Activity } from 'lucide-react';

interface UnifiedAIPanelProps {
    thinking: {
        stage: number;
        candidateTime?: string;
        fullText: string;
    } | null;
    context: AIContextData | null;
    isActive: boolean;
    stage?: number;
    analyzedCount?: number;
    totalCandidates?: number;
    candidateScores?: Array<{ time: string; score: number; stage: number; rank?: number }>;
}


export function UnifiedAIPanel({
    thinking,
    context,
    isActive,
    stage,
    analyzedCount,
    totalCandidates,
    candidateScores
}: UnifiedAIPanelProps) {
    const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
    const [thinkingSeconds, setThinkingSeconds] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const lastLengthRef = useRef(0);
    const prevCandidateRef = useRef('');
    const startTimeRef = useRef<number | null>(null);

    // Track thinking duration
    useEffect(() => {
        if (isActive && !startTimeRef.current) {
            startTimeRef.current = Date.now();
        }
        if (!isActive) {
            startTimeRef.current = null;
        }

        const interval = setInterval(() => {
            if (isActive && startTimeRef.current) {
                setThinkingSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive]);

    // Handle text streaming
    useEffect(() => {
        const candidateTime = thinking?.candidateTime;
        const fullText = thinking?.fullText;

        if (!fullText) {
            setDisplayedText('');
            lastLengthRef.current = 0;
            return;
        }

        if (candidateTime !== prevCandidateRef.current) {
            setDisplayedText(fullText);
            lastLengthRef.current = fullText.length;
            prevCandidateRef.current = candidateTime || '';
            if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
            return;
        }

        if (fullText.length > lastLengthRef.current) {
            setDisplayedText(fullText);
            lastLengthRef.current = fullText.length;
            if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
        }
    }, [thinking?.fullText, thinking?.candidateTime]);

    // Show panel if we're in an AI stage, or if we have thinking/context data
    const shouldShow = isActive || thinking?.fullText || context || [2, 5, 7].includes(stage || 0);
    if (!shouldShow) {
        return null;
    }


    const currentStage = thinking?.stage || stage || 2;
    const stageConfig = {
        2: { name: 'Gross Screening', level: 1, color: 'orange', accuracy: '88-92%' },
        5: { name: 'Fine Tuning', level: 2, color: 'blue', accuracy: '92-96%' },
        7: { name: 'Final Decision', level: 3, color: 'purple', accuracy: '96-99%' },
    }[currentStage] || { name: 'Analysis', level: 1, color: 'orange', accuracy: '88%+' };

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="space-y-4">
            {/* Main AI Analysis Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[#3A4452] bg-[#1A1F2E]/90 backdrop-blur-xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-4 border-b border-[#3A4452] bg-[#0F1419]/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stageConfig.color === 'orange' ? 'from-orange-500 to-amber-600' :
                                stageConfig.color === 'blue' ? 'from-blue-500 to-cyan-600' :
                                    'from-purple-500 to-pink-600'
                                } flex items-center justify-center shadow-lg`}>
                                <Brain className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-[#F5F0EB]">
                                    Level {stageConfig.level}: {stageConfig.name}
                                </h3>
                                <p className="text-xs text-[#8C7F72]">
                                    DeepSeek {currentStage === 7 ? 'Reasoner (R1)' : 'V3'} • Target Accuracy: {stageConfig.accuracy}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {isActive && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/30">
                                    <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
                                    <span className="text-xs font-medium text-[#8B5CF6]">THINKING</span>
                                </div>
                            )}
                            {thinkingSeconds > 0 && (
                                <div className="flex items-center gap-1 text-xs text-[#8C7F72]">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(thinkingSeconds)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Progress Stats */}
                    {(analyzedCount !== undefined || thinking?.candidateTime) && (
                        <div className="mt-3 flex items-center gap-4 text-xs">
                            {thinking?.candidateTime && thinking.candidateTime !== 'final_decision' && (
                                <div className="flex items-center gap-1 text-[#D4AF37]">
                                    <Zap className="w-3 h-3" />
                                    Analyzing: <span className="font-mono font-bold">{thinking.candidateTime}</span>
                                </div>
                            )}
                            {analyzedCount !== undefined && (
                                <div className="flex items-center gap-1 text-[#2D7A5C]">
                                    <Activity className="w-3 h-3" />
                                    Candidates: {analyzedCount}{totalCandidates && ` / ${totalCandidates}`}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Collapsible Thinking Section - DeepSeek Style */}
                <div className="border-b border-[#3A4452]">
                    <button
                        onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#2A3442]/30 transition-colors"
                    >
                        <div className="flex items-center gap-2 text-sm text-[#C4B8AD]">
                            <span className="text-lg">💭</span>
                            <span>
                                {isActive ? 'Thinking...' : `Thought for ${formatTime(thinkingSeconds)}`}
                            </span>
                            <span className="text-[10px] text-[#8C7F72] font-mono">
                                ({displayedText.length.toLocaleString()} chars)
                            </span>
                        </div>
                        {isThinkingExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[#8C7F72]" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-[#8C7F72]" />
                        )}
                    </button>

                    <AnimatePresence>
                        {isThinkingExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div
                                    ref={containerRef}
                                    className="mx-4 mb-4 p-4 rounded-lg bg-[#0F1419] border border-[#3A4452] max-h-[300px] overflow-y-auto font-mono text-sm text-[#9CA3AF] leading-relaxed"
                                    style={{
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: '#3A4452 #0F1419',
                                    }}
                                >
                                    {displayedText ? (
                                        <pre className="whitespace-pre-wrap break-words">
                                            {displayedText}
                                            {isActive && (
                                                <span className="inline-block w-2 h-4 bg-[#8B5CF6] ml-0.5 animate-pulse"
                                                    style={{ verticalAlign: 'text-bottom' }} />
                                            )}
                                        </pre>
                                    ) : (
                                        <div className="text-[#6B7280] flex items-center gap-2">
                                            <span className="animate-spin">⚙️</span>
                                            Initializing DeepSeek {currentStage === 7 ? 'R1' : 'V3'} reasoning engine...
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Ground Truth Context - Integrated */}
                {context && (
                    <div className="p-4 bg-emerald-950/20">
                        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                            <span>📊</span>
                            Engine Ground Truth (Swiss Ephemeris)
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                            <div className="bg-[#0F1419]/50 p-2 rounded border border-emerald-500/10">
                                <div className="text-[#6B7280] mb-1">Planetary Positions</div>
                                <div className="space-y-0.5 text-emerald-300">
                                    <div>☉ {context.planetaryInfo.sun}</div>
                                    <div>☽ {context.planetaryInfo.moon}</div>
                                    <div>⬆ {context.planetaryInfo.ascendant}</div>
                                </div>
                            </div>
                            <div className="bg-[#0F1419]/50 p-2 rounded border border-emerald-500/10">
                                <div className="text-[#6B7280] mb-1">Vedic Context</div>
                                <div className="text-emerald-300">
                                    <div className="truncate">{context.dasha}</div>
                                    {context.divCharts && <div className="truncate text-[#8C7F72]">{context.divCharts}</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Live Score Table */}
            {candidateScores && candidateScores.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-[#3A4452] bg-[#1A1F2E]/90 overflow-hidden"
                >
                    <div className="p-3 border-b border-[#3A4452] flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-[#F5F0EB]">Live Analysis Results</h4>
                        <span className="text-[10px] px-2 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37]">
                            {candidateScores.length} Analyzed
                        </span>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-[#0F1419]/50 sticky top-0">
                                <tr className="text-[#8C7F72] uppercase tracking-wider">
                                    <th className="px-4 py-2 text-left">Rank</th>
                                    <th className="px-4 py-2 text-left">Time</th>
                                    <th className="px-4 py-2 text-center">Score</th>
                                    <th className="px-4 py-2 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidateScores
                                    .sort((a, b) => b.score - a.score)
                                    .map((candidate, idx) => (
                                        <tr key={candidate.time} className="border-t border-[#3A4452]/50 hover:bg-[#2A3442]/30">
                                            <td className="px-4 py-2 font-bold text-[#D4AF37]">#{idx + 1}</td>
                                            <td className="px-4 py-2 font-mono text-[#F5F0EB]">{candidate.time}</td>
                                            <td className="px-4 py-2 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-16 bg-[#3A4452] rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${candidate.score >= 80 ? 'bg-green-500' :
                                                                candidate.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${candidate.score}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-mono">{candidate.score}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <span className={`px-2 py-0.5 rounded text-[10px] ${candidate.score >= 70
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {candidate.score >= 70 ? 'KEEP' : 'ELIMINATE'}
                                                </span>
                                            </td>

                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
