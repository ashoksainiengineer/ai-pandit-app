'use client';

// components/rectify/UnifiedAIPanel.tsx
// Premium unified AI analysis panel with DeepSeek-style collapsible thinking
// Enhanced with Candidate Tabs for switching between analyzed candidates
// UPDATED: Sacred Ivory Theme for consistency

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIContextData } from '@/lib/use-stream-progress';
import { ChevronDown, ChevronUp, Brain, Zap, Clock, Activity, Users, Radio } from 'lucide-react';
import { Typewriter } from '@/components/ui/Typewriter';
import { LiveCalculationPanel, CalculationLog } from './LiveCalculationPanel';

// Sacred Ivory Theme Constants
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

interface AIThinking {
    stage: number;
    candidateTime?: string;
    chunks?: string[];
    fullText: string;
}

interface UnifiedAIPanelProps {
    thinking: AIThinking | null;
    stageHistory?: Map<number, string>;
    context: AIContextData | null;
    isActive: boolean;
    stage?: number;
    analyzedCount?: number;
    totalCandidates?: number;
    allCandidates?: Map<string, AIThinking>;
    displayedCandidate?: string | null;
    onSelectCandidate?: (time: string) => void;
    candidateScores?: Array<{
        time: string;
        score: number;
        stage: number;
        rank?: number;
        offsetMinutes?: number;
        minifiedEph?: {
            sun: string;
            moon: string;
            ascendant: string;
        };
    }>;
    calculationLogs?: CalculationLog[];
    unifiedMode?: boolean;
    isComplete?: boolean;
}

const cleanReasoningText = (text: string) => {
    if (!text) return '';

    let cleaned = text
        .replace(/<\/?thought>/g, '')
        .replace(/<\/?think>/g, '')
        .replace(/<\/?reasoning>/g, '')
        .replace(/<\/?analysis>/g, '');

    cleaned = cleaned
        .replace(/\[STAGE \w+\]/g, '')
        .replace(/═+[\r\n]*🎯 SWITCHING TO:[\s\S]*?═+[\r\n]*/g, '')
        .replace(/--- LEVEL \d: [\s\S]*? ---\n/g, '');

    cleaned = cleaned
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\u200B/g, '')
        .replace(/\uFEFF/g, '')
        .replace(/[\u2028\u2029]/g, '\n');

    cleaned = cleaned
        .replace(/(\r\n|\r)/g, '\n')
        .replace(/\n{4,}/g, '\n\n\n')
        .replace(/[ \t]+$/gm, '')
        .replace(/^[ \t]+/gm, (match) => match.length > 8 ? '  ' : match);

    cleaned = cleaned
        .replace(/^(\d+\.\s)/gm, '▸ $1')
        .replace(/^(•|\*|-) /gm, '◦ ');

    return cleaned.trim();
};

const formatStructuredSections = (text: string) => {
    return text.split('\n').map((line, i) => {
        if (/^(DASHA|DIVISIONAL|TRANSIT|PLANETARY|EVENT|VERDICT|FINAL|PHYSICAL|BOUNDARY|LAGNA|NAKSHATRA|D9|D10|D60)/i.test(line)) {
            const colonIdx = line.indexOf(':');
            if (colonIdx > 0) {
                const label = line.slice(0, colonIdx).toUpperCase();
                const rest = line.slice(colonIdx + 1).trim();
                return (
                    <div key={i} className="mt-4 mb-2 first:mt-0">
                        <span className="text-[#B8860B] font-bold uppercase text-[10px] tracking-widest bg-[#B8860B]/10 px-2 py-0.5 rounded border border-[#B8860B]/20">
                            {label}
                        </span>
                        <p className="mt-1 text-[#1A1612]">{rest}</p>
                    </div>
                );
            }
        }

        if (/^TIME: \d{2}:\d{2}:\d{2}/i.test(line)) {
            return (
                <div key={i} className="mt-6 mb-3 border-l-2 border-[#2D7A5C] pl-3">
                    <span className="text-[#2D7A5C] font-bold text-lg font-mono">{line}</span>
                </div>
            );
        }

        if (/^(SCORE|RATING|CONFIDENCE):/i.test(line)) {
            return (
                <div key={i} className="my-2 p-2 bg-[#B8860B]/5 rounded border-l-2 border-[#B8860B]">
                    <span className="text-[#B8860B] font-bold font-mono text-sm">{line}</span>
                </div>
            );
        }

        if (/^[▸◦•\-\*] /.test(line)) {
            return (
                <div key={i} className="mb-1 pl-2 text-[#4A453F]">
                    <span className="text-[#2D7A5C] mr-1">▹</span>
                    {line.replace(/^[▸◦•\-\*] /, '')}
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
    allCandidates,
    displayedCandidate,
    onSelectCandidate,
    candidateScores,
    calculationLogs,
    unifiedMode,
    isComplete = false
}: UnifiedAIPanelProps) {
    const currentStage = thinking?.stage || stage || 2;
    const [expandedStages, setExpandedStages] = useState<number[]>([currentStage]);
    const [localDisplayedCandidate, setLocalDisplayedCandidate] = useState<string | null>(null);
    const effectiveDisplayedCandidate = displayedCandidate || localDisplayedCandidate;

    const candidateTabs = useMemo(() => {
        if (!allCandidates || allCandidates.size === 0) {
            return thinking?.candidateTime ? [thinking.candidateTime] : [];
        }
        return Array.from(allCandidates.keys());
    }, [allCandidates, thinking?.candidateTime]);

    const handleCandidateClick = (time: string) => {
        if (onSelectCandidate) {
            onSelectCandidate(time);
        } else {
            setLocalDisplayedCandidate(time);
        }
    };

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

    const STAGES = [
        { id: 2, name: 'Coarse Elimination', level: 1, color: 'orange', accuracy: '60 → 15' },
        { id: 4, name: 'Deep Analysis', level: 2, color: 'blue', accuracy: '100 → 7' },
        { id: 6, name: 'Final Precision', level: 3, color: 'purple', accuracy: '77 → 1' },
    ];

    const batchCount = useMemo(() => {
        if (currentStage === 2 && totalCandidates) {
            return Math.ceil(totalCandidates / 15);
        }
        return undefined;
    }, [currentStage, totalCandidates]);

    if (unifiedMode) {
        const currentStageConfig = STAGES.find(s => s.id === currentStage) || STAGES[0];

        const getDisplayedContent = () => {
            if (allCandidates && effectiveDisplayedCandidate) {
                const candidateData = allCandidates.get(effectiveDisplayedCandidate);
                if (candidateData) return candidateData.fullText;
            }
            return thinking?.fullText || '';
        };

        let unifiedContent = '';
        STAGES.forEach(s => {
            const hist = stageHistory?.get(s.id);
            if (hist) {
                unifiedContent += `\n--- STAGE ${s.id}: ${s.name} ---\n${hist}\n`;
            } else if (s.id === currentStage) {
                const currentContent = getDisplayedContent();
                if (currentContent) {
                    unifiedContent += `\n--- STAGE ${s.id}: ${s.name} [ACTIVE] ---\n${currentContent}`;
                }
            }
        });

        const activeContent = cleanReasoningText(unifiedContent || getDisplayedContent());
        const isStreaming = (time: string) => thinking?.candidateTime === time && isActive;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[#D4A853]/50 bg-white shadow-[0_0_20px_rgba(184,134,11,0.1)] overflow-hidden"
            >
                {/* Dynamic Header */}
                <div className="p-4 bg-[#FDF8F3] flex items-center justify-between border-b border-[#F0E8DE]">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentStageConfig.color === 'orange' ? 'from-[#E8A849] to-[#D4A853]' :
                            currentStageConfig.color === 'blue' ? 'from-[#6B9AC4] to-[#4A7C6F]' :
                                'from-[#6B1F7A] to-[#8B4A9C]'
                            } flex items-center justify-center shadow-lg relative`}>
                            <Brain className="w-5 h-5 text-white" />
                            {isActive && !isComplete && <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#C65D3B] rounded-full animate-ping" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-[#B8860B] font-[family-name:var(--font-cormorant)]">
                                AI Reasoning: Stage {currentStage}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-[#7A756F]">
                                <Activity className="w-3 h-3 text-[#2D7A5C]" />
                                {isActive ? 'LIVE STREAM' : 'ARCHIVE'} • {currentStageConfig.accuracy} candidates
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {thinking?.candidateTime && isActive && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-[#B8860B]/10 rounded-lg border border-[#B8860B]/30 shadow-sm animate-pulse">
                                <span className="text-xs text-[#7A756F] uppercase font-bold tracking-wider">Analyzing:</span>
                                <span className="text-sm font-mono font-bold text-[#B8860B]">{thinking.candidateTime}</span>
                            </div>
                        )}

                        {isActive && !isComplete && (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#6B1F7A]/10 border border-[#6B1F7A]/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#6B1F7A] animate-pulse" />
                                <span className="text-[10px] font-medium text-[#6B1F7A] uppercase tracking-wider">THINKING</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Candidate Tabs Bar */}
                <div className="px-4 py-2 bg-white border-b border-[#F0E8DE]">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-3.5 h-3.5 text-[#7A756F]" />
                        <span className="text-[10px] text-[#7A756F] uppercase tracking-wider font-bold">
                            Active Candidates Matrix ({candidateTabs.length})
                        </span>
                    </div>
                    {candidateTabs.length > 0 ? (
                        <div className="space-y-3 pb-1 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {[2, 4, 6].map(sId => {
                                const stageCandidates = Array.from(allCandidates?.values() || []).filter(c => sId === 2 ? c.stage <= 2 : c.stage === sId);
                                if (stageCandidates.length === 0) return null;

                                return (
                                    <div key={sId} className="space-y-1.5">
                                        <div className="flex items-center gap-2 opacity-60">
                                            <div className="h-[1px] flex-1 bg-[#F0E8DE]" />
                                            <span className="text-[9px] font-bold uppercase tracking-tighter text-[#7A756F]">
                                                {sId === 2 ? 'Discovery' : sId === 4 ? 'Deep Verification' : 'Final Selection'}
                                            </span>
                                            <div className="h-[1px] flex-1 bg-[#F0E8DE]" />
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {stageCandidates.map((cData) => {
                                                const time = cData.candidateTime || 'unknown';
                                                const isSelected = effectiveDisplayedCandidate === time;
                                                const isLive = thinking?.candidateTime === time && isActive;

                                                return (
                                                    <button
                                                        key={time}
                                                        onClick={() => handleCandidateClick(time)}
                                                        className={`
                                                            px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all relative
                                                            ${isSelected
                                                                ? 'bg-[#B8860B]/20 text-[#B8860B] border border-[#B8860B]/50 shadow-[0_0_10px_rgba(184,134,11,0.2)]'
                                                                : 'bg-[#FDF8F3] text-[#7A756F] border border-[#F0E8DE] hover:border-[#B8860B]/30 hover:text-[#4A453F]'
                                                            }
                                                        `}
                                                    >
                                                        {isLive && (
                                                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C65D3B] opacity-75" />
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C65D3B]" />
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            {isLive && <Radio className="w-2.5 h-2.5 text-[#C65D3B]" />}
                                                            {time}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-10 flex items-center justify-center text-[#A8A39D] text-xs italic border border-dashed border-[#F0E8DE] rounded-lg bg-[#FAF5EF]">
                            Waiting for candidates...
                        </div>
                    )}
                </div>

                {/* Content for Selected Candidate */}
                <ScrollableContent
                    content={activeContent}
                    isThinking={isActive && !isComplete}
                    candidateTime={effectiveDisplayedCandidate || thinking?.candidateTime}
                />

                {/* Calculation Stats Strip */}
                {calculationLogs && calculationLogs.length > 0 && (
                    <div className="px-4 py-2 bg-[#FDF8F3] border-t border-[#F0E8DE] flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-4 text-[#7A756F]">
                            <div className="flex items-center gap-1">
                                <Zap className="w-3 h-3 text-[#B8860B]" />
                                Swiss Eph Calculations: {calculationLogs.length}
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Latency: ~42ms
                            </div>
                        </div>
                        {effectiveDisplayedCandidate && (
                            <div className="text-[#B8860B] font-bold font-mono">
                                VIEWING: {effectiveDisplayedCandidate}
                            </div>
                        )}
                    </div>
                )}

                {/* Live Calculation Stream */}
                {calculationLogs && (
                    <div className="border-t border-[#F0E8DE]">
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
            {STAGES.map((stageConfig) => {
                const historyText = stageHistory?.get(stageConfig.id);
                const isCurrent = currentStage === stageConfig.id;
                const rawContent = isCurrent ? (thinking?.fullText || historyText) : historyText;
                const content = cleanReasoningText(rawContent || '');

                if (!content && !isCurrent) return null;

                const isExpanded = expandedStages.includes(stageConfig.id);

                return (
                    <motion.div
                        key={stageConfig.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl border transition-colors overflow-hidden ${isCurrent
                            ? 'border-[#D4A853]/50 bg-white shadow-[0_0_20px_rgba(184,134,11,0.1)]'
                            : 'border-[#F0E8DE] bg-[#FAF5EF]/50'
                            }`}
                    >
                        {/* Header */}
                        <button
                            onClick={() => toggleStage(stageConfig.id)}
                            className="w-full p-4 flex items-center justify-between hover:bg-[#FDF8F3] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stageConfig.color === 'orange' ? 'from-[#E8A849] to-[#D4A853]' :
                                    stageConfig.color === 'blue' ? 'from-[#6B9AC4] to-[#4A7C6F]' :
                                        'from-[#6B1F7A] to-[#8B4A9C]'
                                    } flex items-center justify-center shadow-lg`}>
                                    <Brain className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className={`font-bold text-base font-[family-name:var(--font-cormorant)] ${isCurrent ? 'text-[#B8860B]' : 'text-[#1A1612]'}`}>
                                        Stage {stageConfig.id}: {stageConfig.name}
                                    </h3>
                                    <p className="text-xs text-[#7A756F]">
                                        Candidates: {stageConfig.accuracy}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {isCurrent && isActive && (
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#6B1F7A]/10 border border-[#6B1F7A]/30">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#6B1F7A] animate-pulse" />
                                        <span className="text-[10px] font-medium text-[#6B1F7A] uppercase tracking-wider">THINKING</span>
                                    </div>
                                )}
                                {isExpanded ? <ChevronUp className="w-5 h-5 text-[#7A756F]" /> : <ChevronDown className="w-5 h-5 text-[#7A756F]" />}
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
                                    className="overflow-hidden border-t border-[#F0E8DE]"
                                >
                                    <ScrollableContent content={content || ''} isThinking={isCurrent && isActive} />

                                    {/* Stats Footer for this stage */}
                                    {isCurrent && (analyzedCount !== undefined || thinking?.candidateTime) && (
                                        <div className="px-4 py-2 bg-[#FDF8F3] border-t border-[#F0E8DE] flex items-center gap-4 text-xs">
                                            {thinking?.candidateTime && (
                                                <div className="flex items-center gap-1 text-[#B8860B]">
                                                    <Zap className="w-3 h-3" />
                                                    Analyzing: <span className="font-mono">{thinking.candidateTime}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}

            {/* Context (Global) */}
            {context && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-[#2D7A5C]/30 bg-[#D4E5DE]/30 p-4">
                    <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-[#2D7A5C] uppercase tracking-wider">
                        <span>📊</span>
                        Live Engine Context
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                        <div>
                            <div className="text-[#7A756F] mb-1">Planetary Info</div>
                            <div className="text-[#2D7A5C]">
                                <div>☉ {context.planetaryInfo.sun}</div>
                                <div>☽ {context.planetaryInfo.moon}</div>
                                <div>⬆ {context.planetaryInfo.ascendant}</div>
                            </div>
                        </div>
                        <div>
                            <div className="text-[#7A756F] mb-1">Vedic Details</div>
                            <div className="text-[#2D7A5C]">
                                <div className="truncate">{context.dasha}</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Live Calculation Stream */}
            {calculationLogs && (
                <LiveCalculationPanel
                    logs={calculationLogs}
                    isAnalyzing={isActive}
                />
            )}
        </div>
    );
}

// Sub-component for auto-scrolling - ROBUST SMOOTH SCROLL
function ScrollableContent({ content, isThinking, candidateTime }: { content: string; isThinking: boolean; candidateTime?: string }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const scrollRafRef = useRef<number | null>(null);
    const lastScrollTimeRef = useRef(0);
    const isUserScrollingRef = useRef(false);

    const smoothScrollToBottom = useCallback(() => {
        if (!shouldAutoScroll || isUserScrollingRef.current) return;

        const now = Date.now();
        if (now - lastScrollTimeRef.current < 50) return;

        if (scrollRafRef.current) {
            cancelAnimationFrame(scrollRafRef.current);
        }

        scrollRafRef.current = requestAnimationFrame(() => {
            const container = scrollRef.current;
            if (!container) return;

            const targetScroll = container.scrollHeight - container.clientHeight;
            const currentScroll = container.scrollTop;
            const distance = targetScroll - currentScroll;

            if (distance > 2) {
                const step = Math.max(distance * 0.4, 5);
                container.scrollTop = currentScroll + step;
                lastScrollTimeRef.current = now;

                if (container.scrollTop < targetScroll - 2) {
                    scrollRafRef.current = requestAnimationFrame(() => smoothScrollToBottom());
                }
            }
        });
    }, [shouldAutoScroll]);

    useEffect(() => {
        if (isThinking && shouldAutoScroll) {
            smoothScrollToBottom();
        }
    }, [content.length, isThinking, shouldAutoScroll, smoothScrollToBottom]);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const observer = new MutationObserver(() => {
            if (shouldAutoScroll && isThinking) {
                smoothScrollToBottom();
            }
        });

        observer.observe(container, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        return () => observer.disconnect();
    }, [shouldAutoScroll, isThinking, smoothScrollToBottom]);

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        if (distanceFromBottom < 30) {
            setShouldAutoScroll(true);
            isUserScrollingRef.current = false;
        } else {
            setShouldAutoScroll(false);
            isUserScrollingRef.current = true;

            setTimeout(() => {
                isUserScrollingRef.current = false;
            }, 2000);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (scrollRafRef.current) {
                cancelAnimationFrame(scrollRafRef.current);
            }
        };
    }, []);

    const handleResumeAutoScroll = useCallback(() => {
        setShouldAutoScroll(true);
        isUserScrollingRef.current = false;
        smoothScrollToBottom();
    }, [smoothScrollToBottom]);

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="p-4 bg-[#FAF5EF]/50 font-mono text-sm text-[#4A453F] leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar relative scroll-smooth"
        >
            {candidateTime && (
                <div className="mb-3 pb-2 border-b border-[#F0E8DE]">
                    <div className="flex items-center gap-2 text-[#B8860B]">
                        <Clock className="w-4 h-4" />
                        <span className="font-bold">Candidate: {candidateTime}</span>
                    </div>
                </div>
            )}

            {content ? (
                <div className="break-words border-l-2 border-[#B8860B]/30 pl-4 py-1 relative">
                    {isThinking ? (
                        <Typewriter
                            content={content}
                            speed={1}
                        />
                    ) : (
                        <div className="whitespace-pre-wrap">{formatStructuredSections(content)}</div>
                    )}
                    {isThinking && (
                        <span className="inline-block w-2 h-4 bg-[#B8860B] ml-1 animate-pulse align-text-bottom" style={{ boxShadow: '0 0 5px #B8860B' }} />
                    )}
                </div>
            ) : (
                <div className="text-[#A8A39D] italic flex items-center gap-2">
                    <span className="animate-spin text-[#B8860B]">⏳</span>
                    Initializing reasoning engine...
                </div>
            )}

            {!shouldAutoScroll && content && (
                <button
                    onClick={handleResumeAutoScroll}
                    className="absolute bottom-4 right-4 bg-[#B8860B]/20 hover:bg-[#B8860B]/40 text-[#B8860B] px-3 py-1.5 rounded-lg border border-[#B8860B]/30 transition-all flex items-center gap-2 text-xs font-medium shadow-lg backdrop-blur"
                    title="Resume auto-scroll"
                >
                    <ChevronDown className="w-4 h-4" />
                    Follow
                </button>
            )}
        </div>
    );
}
