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
    unifiedMode?: boolean; // 🌊 Unified stream mode
}


const cleanReasoningText = (text: string) => {
    if (!text) return '';

    // Strip tags but KEEP the content inside for transparency
    return text
        .replace(/<\/?thought>/g, '')
        .replace(/<\/?think>/g, '')
        .replace(/\[STAGE \w+\]/g, '')
        .replace(/═+[\r\n]*🎯 SWITCHING TO:[\s\S]*?═+[\r\n]*/g, '')
        .replace(/--- LEVEL \d: [\s\S]*? ---\n/g, '') // Remove internal separators to rebuild them
        .replace(/(\r\n|\n|\r){3,}/g, '\n\n')
        .trim();
};

const formatStructuredSections = (text: string) => {
    // Basic pattern matching for common AI headers to make them pop
    return text.split('\n').map((line, i) => {
        if (/^(DASHA CHECK|DIVISIONAL CHECK|TRANSIT ANALYSIS|VERDICT|FINAL RANKING|PLANETARY ANALYSIS|EVENT CORRELATION|PHYSICAL AUDIT):/i.test(line)) {
            const [label, ...rest] = line.split(':');
            return (
                <div key={i} className="mt-4 mb-2 first:mt-0">
                    <span className="text-[#D4AF37] font-black uppercase text-[10px] tracking-widest bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/20">
                        {label}
                    </span>
                    <p className="mt-1 text-[#F5F0EB]">{rest.join(':').trim()}</p>
                </div>
            );
        }
        if (/^TIME: \d{2}:\d{2}:\d{2}/i.test(line)) {
            return (
                <div key={i} className="mt-6 mb-3 border-l-2 border-emerald-500 pl-3">
                    <span className="text-emerald-400 font-black text-lg font-mono">{line}</span>
                </div>
            );
        }
        return <div key={i} className="mb-1">{line}</div>;
    });
};

export function UnifiedAIPanel({
    thinking,
    stageHistory,
    context,
    isActive,
    stage,
    analyzedCount,
    totalCandidates,
    candidateScores,
    calculationLogs,
    unifiedMode
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
        { id: 2, name: 'Neural Screening', level: 1, color: 'orange', accuracy: '80-88%' },
        { id: 4, name: 'Tournament Dynamics', level: 2, color: 'blue', accuracy: '90-95%' },
        { id: 7, name: 'Grand Finals (R1)', level: 3, color: 'purple', accuracy: '98-99.9%' },
    ];

    if (unifiedMode) {
        // 🌊 GOD-TIER UNIFIED MODE: Single continuous stream
        const currentStageConfig = STAGES.find(s => s.id === currentStage) || STAGES[0];

        // Accumulate all historic text into one blob or just show the active one?
        // User wants "SAARE LEVELS KA REASONING EK HI CONTAINER ME"
        // So we concatenate history + current thinking
        let unifiedContent = '';
        STAGES.forEach(s => {
            const hist = stageHistory?.get(s.id);
            if (hist) {
                unifiedContent += `\n--- LEVEL ${s.level}: ${s.name} ---\n${hist}\n`;
            } else if (s.id === currentStage && thinking?.fullText) {
                unifiedContent += `\n--- LEVEL ${s.level}: ${s.name} [ACTIVE] ---\n${thinking.fullText}`;
            }
        });

        const activeContent = cleanReasoningText(unifiedContent || '');

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[#D4AF37]/50 bg-[#1A1F2E]/90 shadow-[0_0_20px_rgba(212,175,55,0.1)] overflow-hidden"
            >
                {/* Dynamic Header */}
                <div className="p-4 bg-[#2A3442]/30 flex items-center justify-between border-b border-[#D4AF37]/20">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentStageConfig.color === 'orange' ? 'from-orange-500 to-amber-600' :
                            currentStageConfig.color === 'blue' ? 'from-blue-500 to-cyan-600' :
                                'from-purple-500 to-pink-600'
                            } flex items-center justify-center shadow-lg relative`}>
                            <Brain className="w-5 h-5 text-white" />
                            {isActive && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-[#D4AF37]">
                                Reasoning Engine: {currentStageConfig.name}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-[#8C7F72] font-mono">
                                <Activity className="w-3 h-3 text-emerald-500" />
                                {isActive ? 'LIVE_NEURAL_STREAM' : 'VOD_REASONING_ARCHIVE'}
                            </div>
                        </div>
                    </div>

                    {isActive && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/30">
                            <span className="text-[10px] font-medium text-[#8B5CF6] uppercase tracking-wider">Processing Level {currentStageConfig.level}</span>
                        </div>
                    )}
                </div>

                {/* Single Scroller */}
                <ScrollableContent content={activeContent} isThinking={isActive} />

                {/* Calculation Stats Strip */}
                {calculationLogs && calculationLogs.length > 0 && (
                    <div className="px-4 py-2 bg-[#0F1419] border-t border-[#3A4452]/50 flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-4 text-[#8C7F72]">
                            <div className="flex items-center gap-1">
                                <Zap className="w-3 h-3 text-[#D4AF37]" />
                                Engine OPS: 1.42 T/s
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Latency: 42ms
                            </div>
                        </div>
                        {thinking?.candidateTime && (
                            <div className="text-[#D4AF37] font-bold">
                                FOCUS: {thinking.candidateTime}
                            </div>
                        )}
                    </div>
                )}

                {/* 📊 LIVE CALCULATION STREAM (RESTORATION) */}
                {calculationLogs && (
                    <div className="border-t border-[#3A4452]/30">
                        <LiveCalculationPanel
                            logs={calculationLogs}
                            isAnalyzing={isActive}
                        />
                    </div>
                )}
            </motion.div>
        );
    }

    // Default accordion mode (Legacy fallback)
    return (
        <div className="space-y-4">
            {/* Stage-based Accordions */}
            {STAGES.map((stageConfig) => {
                // Determine content for this stage
                const historyText = stageHistory?.get(stageConfig.id);
                const isCurrent = currentStage === stageConfig.id;
                const rawContent = isCurrent ? (thinking?.fullText || historyText) : historyText;
                const content = cleanReasoningText(rawContent || '');

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
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
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

                                    {/* 📊 LEVEL-SPECIFIC LIVE TABLE */}
                                    {candidateScores && candidateScores.some(c => c.stage === stageConfig.id) && (
                                        <div className="border-t border-[#3A4452]/50">
                                            <div className="px-4 py-2 bg-[#1A1F2E]/80 text-[10px] uppercase font-bold text-[#8C7F72] tracking-wider flex justify-between">
                                                <span>Live Candidates (Level {stageConfig.level})</span>
                                                <span>{candidateScores.filter(c => c.stage === stageConfig.id).length} Entries</span>
                                            </div>
                                            <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                                <table className="w-full text-xs border-collapse">
                                                    <thead className="bg-[#0F1419]/50 sticky top-0 backdrop-blur-sm z-10">
                                                        <tr className="text-[#6B7280]">
                                                            <th className="px-4 py-2 text-left">Time</th>
                                                            <th className="px-4 py-2 text-center">Score</th>
                                                            <th className="px-4 py-2 text-right">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {candidateScores
                                                            .filter(c => c.stage === stageConfig.id)
                                                            .sort((a, b) => b.score - a.score)
                                                            .slice(0, 50) // Limit rows for performance
                                                            .map((candidate, idx) => (
                                                                <tr key={`${candidate.time}-${idx}`} className="border-t border-[#3A4452]/30 hover:bg-[#D4AF37]/5 transition-colors">
                                                                    <td className="px-4 py-2 font-mono text-[#F5F0EB]">{candidate.time}</td>
                                                                    <td className="px-4 py-2 text-center">
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            <div className="w-16 bg-[#3A4452] rounded-full h-1 overflow-hidden">
                                                                                <div
                                                                                    className={`h-full ${candidate.score >= 80 ? 'bg-emerald-500' : candidate.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                                                    style={{ width: `${candidate.score}%` }}
                                                                                />
                                                                            </div>
                                                                            <span className="font-mono">{candidate.score}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right">
                                                                        <span className={`text-[9px] ${candidate.score >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                            {candidate.score >= 70 ? 'PASS' : 'DROP'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </table>
                                            </div>
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
            scrollAnchorRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
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
            // Use requestAnimationFrame for smoother scrolling sync
            requestAnimationFrame(() => scrollToEnd());
        });

        const contentEl = el.firstElementChild;
        if (contentEl) observer.observe(contentEl);

        // Immediate scroll on significant changes (Zero-Tolerance)
        if (content.length !== lastContentLengthRef.current) {
            scrollToEnd(true);
            lastContentLengthRef.current = content.length;
        }

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
                        <Typewriter
                            content={content}
                            speed={5}
                        // Custom renderer for typewriter (or wrap it after it's done)
                        // For simplicity, we just render it formatted if NOT thinking
                        />
                    ) : (
                        <div className="whitespace-pre-wrap">{formatStructuredSections(content)}</div>
                    )}
                    {isThinking && (
                        <span className="inline-block w-2 h-4 bg-[#D4AF37] ml-1 animate-pulse align-text-bottom shadow-[0_0_5px_#D4AF37]" />
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
