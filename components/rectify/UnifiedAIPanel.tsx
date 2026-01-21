'use client';

// components/rectify/UnifiedAIPanel.tsx
// Premium unified AI analysis panel with DeepSeek-style collapsible thinking

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIContextData } from '@/lib/use-stream-progress';
import { ChevronDown, ChevronUp, Brain, Zap, Clock, Activity } from 'lucide-react';
import { Typewriter } from '@/components/ui/Typewriter';
import { LiveCalculationPanel, CalculationLog } from './LiveCalculationPanel';

interface UnifiedAIPanelProps {
    thinking: {
        stage: number;
        candidateTime?: string;
        fullText: string;
    } | null;
    stageHistory?: Map<number, string>;
    context: AIContextData | null;
    isActive: boolean;
    stage?: number;
    analyzedCount?: number;
    totalCandidates?: number;
    candidateScores?: Array<{ time: string; score: number; stage: number; rank?: number }>;
    calculationLogs?: CalculationLog[];
}


export function UnifiedAIPanel({
    thinking,
    stageHistory,
    context,
    isActive,
    stage,
    analyzedCount,
    totalCandidates,
    candidateScores,
    calculationLogs
}: UnifiedAIPanelProps) {
    // Current active stage
    const currentStage = thinking?.stage || stage || 2;

    // Auto-expand the current stage, others can be toggled
    const [expandedStages, setExpandedStages] = useState<number[]>([currentStage]);

    // Update expanded stages when current stage changes
    useEffect(() => {
        if (!expandedStages.includes(currentStage)) {
            setExpandedStages(prev => [...prev, currentStage]);
        }
    }, [currentStage]);

    const toggleStage = (stageId: number) => {
        setExpandedStages(prev =>
            prev.includes(stageId)
                ? prev.filter(id => id !== stageId)
                : [...prev, stageId]
        );
    };

    const thinkingSeconds = 0; // Simplified for loop view (or track per stage if needed, but global is complex)
    // Actually, we can just show "Processing" for the active one.

    const STAGES = [
        { id: 2, name: 'Gross Screening', level: 1, color: 'orange', accuracy: '88-92%' },
        { id: 5, name: 'Fine Tuning', level: 2, color: 'blue', accuracy: '92-96%' },
        { id: 7, name: 'Final Decision', level: 3, color: 'purple', accuracy: '96-99%' },
    ];

    return (
        <div className="space-y-4">
            {/* Stage-based Accordions */}
            {STAGES.map((stageConfig) => {
                // Determine content for this stage
                const historyText = stageHistory?.get(stageConfig.id);
                const isCurrent = currentStage === stageConfig.id;
                const content = isCurrent ? (thinking?.fullText || historyText) : historyText;

                // Only show if we have content or it's current
                if (!content && !isCurrent) return null;

                const isExpanded = expandedStages.includes(stageConfig.id);

                return (
                    <motion.div
                        key={stageConfig.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl border transition-colors overflow-hidden ${isCurrent
                            ? 'border-[#D4AF37]/50 bg-[#1A1F2E]/90 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                            : 'border-[#3A4452] bg-[#1A1F2E]/50 opacity-80'
                            }`}
                    >
                        {/* Header */}
                        <button
                            onClick={() => toggleStage(stageConfig.id)}
                            className="w-full p-4 flex items-center justify-between hover:bg-[#2A3442]/30 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stageConfig.color === 'orange' ? 'from-orange-500 to-amber-600' :
                                    stageConfig.color === 'blue' ? 'from-blue-500 to-cyan-600' :
                                        'from-purple-500 to-pink-600'
                                    } flex items-center justify-center shadow-lg`}>
                                    <Brain className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className={`font-bold text-base ${isCurrent ? 'text-[#D4AF37]' : 'text-[#F5F0EB]'}`}>
                                        Level {stageConfig.level}: {stageConfig.name}
                                    </h3>
                                    <p className="text-xs text-[#8C7F72]">
                                        Target Accuracy: {stageConfig.accuracy}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {isCurrent && isActive && (
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/30">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
                                        <span className="text-[10px] font-medium text-[#8B5CF6]">THINKING</span>
                                    </div>
                                )}
                                {isExpanded ? <ChevronUp className="w-5 h-5 text-[#8C7F72]" /> : <ChevronDown className="w-5 h-5 text-[#8C7F72]" />}
                            </div>
                        </button>

                        {/* Content */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden border-t border-[#3A4452]/50"
                                >
                                    <ScrollableContent content={content || ''} isThinking={isCurrent && isActive} />

                                    {/* Stats Footer for this stage */}
                                    {isCurrent && (analyzedCount !== undefined || thinking?.candidateTime) && (
                                        <div className="px-4 py-2 bg-[#0F1419] border-t border-[#3A4452]/50 flex items-center gap-4 text-xs">
                                            {thinking?.candidateTime && (
                                                <div className="flex items-center gap-1 text-[#D4AF37]">
                                                    <Zap className="w-3 h-3" />
                                                    Analyzing: <span className="font-mono">{thinking.candidateTime}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div >
                );
            })}

            {/* Context (Global) */}
            {
                context && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-[#2D7A5C]/30 bg-emerald-950/20 p-4">
                        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                            <span>📊</span>
                            Live Engine Context
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                            <div>
                                <div className="text-[#6B7280] mb-1">Planetary Info</div>
                                <div className="text-emerald-300">
                                    <div>☉ {context.planetaryInfo.sun}</div>
                                    <div>☽ {context.planetaryInfo.moon}</div>
                                    <div>⬆ {context.planetaryInfo.ascendant}</div>
                                </div>
                            </div>
                            <div>
                                <div className="text-[#6B7280] mb-1">Vedic Details</div>
                                <div className="text-emerald-300">
                                    <div className="truncate">{context.dasha}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )
            }

            {/* Live Calculation Stream */}
            {calculationLogs && (
                <LiveCalculationPanel
                    logs={calculationLogs}
                    isAnalyzing={isActive}
                />
            )}

            {/* Live Score Table */}
            {
                candidateScores && candidateScores.length > 0 && (
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
                                            <tr key={`${candidate.time}-${idx}`} className="border-t border-[#3A4452]/50 hover:bg-[#2A3442]/30">
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
                )
            }
        </div >
    );
}

// Sub-component for auto-scrolling
function ScrollableContent({ content, isThinking }: { content: string; isThinking: boolean }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const scrollAnchorRef = useRef<HTMLDivElement>(null);
    const lastContentLengthRef = useRef(0);

    const scrollToEnd = (forceWindowScroll = false) => {
        if (!shouldAutoScroll) return;

        // Internal container scroll
        if (scrollAnchorRef.current) {
            scrollAnchorRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
        }

        // Viewport synchronization: If the typing area is getting close to the bottom of the screen,
        // we should scroll the window to keep it visible.
        if (isThinking || forceWindowScroll) {
            const el = scrollRef.current;
            if (el) {
                const rect = el.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                // If the bottom of our container is below the viewport or very close to it (100px buffer)
                if (rect.bottom > viewportHeight - 100) {
                    window.scrollBy({ top: rect.bottom - (viewportHeight - 100), behavior: 'auto' });
                }
            }
        }
    };

    // Use ResizeObserver for content growth
    useEffect(() => {
        if (!scrollRef.current) return;

        const el = scrollRef.current;
        const observer = new ResizeObserver(() => {
            scrollToEnd();
        });

        const contentEl = el.firstElementChild;
        if (contentEl) observer.observe(contentEl);

        // Immediate scroll on significant changes
        if (Math.abs(content.length - lastContentLengthRef.current) > 20) {
            scrollToEnd(true);
        }
        lastContentLengthRef.current = content.length;

        return () => observer.disconnect();
    }, [shouldAutoScroll, content.length, isThinking]);

    const handleScroll = () => {
        if (!scrollRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        // Strict bottom detection - 15px buffer for various browser scaling
        const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 15;

        if (isAtBottom) {
            setShouldAutoScroll(true);
        } else {
            // Only disable if the user explicitly scrolls up
            setShouldAutoScroll(false);
        }
    };

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="p-4 bg-[#0F1419]/50 font-mono text-sm text-[#D1D5DB] leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar relative"
        >
            {content ? (
                <div className="break-words border-l-2 border-[#D4AF37]/30 pl-4 py-1 relative">
                    {isThinking ? (
                        <Typewriter content={content} speed={5} />
                    ) : (
                        <span className="whitespace-pre-wrap">{content}</span>
                    )}
                    {isThinking && (
                        <span className="inline-block w-2 h-4 bg-[#D4AF37] ml-1 animate-pulse align-text-bottom" />
                    )}
                    {/* Anchor for sticky scroll */}
                    <div ref={scrollAnchorRef} className="h-px w-full" />
                </div>
            ) : (
                <div className="text-[#6B7280] italic flex items-center gap-2">
                    <span className="animate-spin text-[#D4AF37]">⏳</span>
                    Initializing reasoning engine...
                </div>
            )}

            {/* Scroll Nudge Button (Optional: if user scrolled up, show a "Down" indicator) */}
            {!shouldAutoScroll && content && (
                <button
                    onClick={() => setShouldAutoScroll(true)}
                    className="absolute bottom-4 right-4 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/40 text-[#D4AF37] p-1 rounded-full border border-[#D4AF37]/30 transition-all animate-bounce"
                    title="Scroll to bottom"
                >
                    <ChevronDown className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
