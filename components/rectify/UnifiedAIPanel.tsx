'use client';

// components/rectify/UnifiedAIPanel.tsx
// Premium unified AI analysis panel with DeepSeek-style collapsible thinking
// Enhanced with Candidate Tabs for switching between analyzed candidates

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIContextData } from '@/lib/use-stream-progress';
import { ChevronDown, ChevronUp, Brain, Zap, Clock, Activity, Users, Radio } from 'lucide-react';
import { Typewriter } from '@/components/ui/Typewriter';
import { LiveCalculationPanel, CalculationLog } from './LiveCalculationPanel';

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
    // 🆕 All candidates map for tab switching
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
    unifiedMode?: boolean; // 🌊 Unified stream mode
}


const cleanReasoningText = (text: string) => {
    if (!text) return '';

    // 1. Remove XML-style tags but keep content
    let cleaned = text
        .replace(/<\/?thought>/g, '')
        .replace(/<\/?think>/g, '')
        .replace(/<\/?reasoning>/g, '')
        .replace(/<\/?analysis>/g, '');

    // 2. Remove internal markers and separators
    cleaned = cleaned
        .replace(/\[STAGE \w+\]/g, '')
        .replace(/═+[\r\n]*🎯 SWITCHING TO:[\s\S]*?═+[\r\n]*/g, '')
        .replace(/--- LEVEL \d: [\s\S]*? ---\n/g, '');

    // 3. Clean up garbage characters and Unicode issues
    cleaned = cleaned
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Control chars
        .replace(/\u200B/g, '') // Zero-width space
        .replace(/\uFEFF/g, '') // BOM
        .replace(/[\u2028\u2029]/g, '\n'); // Line/paragraph separators

    // 4. Normalize whitespace
    cleaned = cleaned
        .replace(/(\r\n|\r)/g, '\n') // Normalize line endings
        .replace(/\n{4,}/g, '\n\n\n') // Max 3 consecutive newlines
        .replace(/[ \t]+$/gm, '') // Trailing whitespace per line
        .replace(/^[ \t]+/gm, (match) => match.length > 8 ? '  ' : match); // Limit indent

    // 5. Add visual structure indicators for common patterns
    cleaned = cleaned
        .replace(/^(\d+\.\s)/gm, '▸ $1') // Numbered lists
        .replace(/^(•|\*|-) /gm, '◦ '); // Bullet points

    return cleaned.trim();
};

const formatStructuredSections = (text: string) => {
    // Enhanced pattern matching for AI headers
    return text.split('\n').map((line, i) => {
        // Major section headers
        if (/^(DASHA|DIVISIONAL|TRANSIT|PLANETARY|EVENT|VERDICT|FINAL|PHYSICAL|BOUNDARY|LAGNA|NAKSHATRA|D9|D10|D60)/i.test(line)) {
            const colonIdx = line.indexOf(':');
            if (colonIdx > 0) {
                const label = line.slice(0, colonIdx).toUpperCase();
                const rest = line.slice(colonIdx + 1).trim();
                return (
                    <div key={i} className="mt-4 mb-2 first:mt-0">
                        <span className="text-[#D4AF37] font-black uppercase text-[10px] tracking-widest bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/20">
                            {label}
                        </span>
                        <p className="mt-1 text-[#F5F0EB]">{rest}</p>
                    </div>
                );
            }
        }

        // Time candidate headers
        if (/^TIME: \d{2}:\d{2}:\d{2}/i.test(line)) {
            return (
                <div key={i} className="mt-6 mb-3 border-l-2 border-emerald-500 pl-3">
                    <span className="text-emerald-400 font-black text-lg font-mono">{line}</span>
                </div>
            );
        }

        // Score lines
        if (/^(SCORE|RATING|CONFIDENCE):/i.test(line)) {
            return (
                <div key={i} className="my-2 p-2 bg-[#D4AF37]/5 rounded border-l-2 border-[#D4AF37]">
                    <span className="text-[#D4AF37] font-bold font-mono text-sm">{line}</span>
                </div>
            );
        }

        // Bullet points with checkmarks
        if (/^[▸◦•\-\*] /.test(line)) {
            return (
                <div key={i} className="mb-1 pl-2 text-[#C4B8AD]">
                    <span className="text-emerald-400 mr-1">▹</span>
                    {line.replace(/^[▸◦•\-\*] /, '')}
                </div>
            );
        }

        // Regular lines
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
    unifiedMode
}: UnifiedAIPanelProps) {
    // Current active stage
    const currentStage = thinking?.stage || stage || 2;

    // Auto-expand the current stage, others can be toggled
    const [expandedStages, setExpandedStages] = useState<number[]>([currentStage]);

    // Local state for displayed candidate if not controlled externally
    const [localDisplayedCandidate, setLocalDisplayedCandidate] = useState<string | null>(null);

    // Effective displayed candidate
    const effectiveDisplayedCandidate = displayedCandidate || localDisplayedCandidate;

    // Get all active candidate times from allCandidates map
    const candidateTabs = useMemo(() => {
        if (!allCandidates || allCandidates.size === 0) {
            return thinking?.candidateTime ? [thinking.candidateTime] : [];
        }
        return Array.from(allCandidates.keys());
    }, [allCandidates, thinking?.candidateTime]);

    // Handle candidate tab click
    const handleCandidateClick = (time: string) => {
        if (onSelectCandidate) {
            onSelectCandidate(time);
        } else {
            setLocalDisplayedCandidate(time);
        }
    };

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

    const STAGES = [
        { id: 2, name: 'Coarse Elimination', level: 1, color: 'orange', accuracy: '60 → 15' },
        { id: 4, name: 'Deep Analysis', level: 2, color: 'blue', accuracy: '100 → 7' },
        { id: 6, name: 'Final Precision', level: 3, color: 'purple', accuracy: '77 → 1' },
    ];

    if (unifiedMode) {
        // 🌊 GOD-TIER UNIFIED MODE: Single continuous stream with candidate tabs
        const currentStageConfig = STAGES.find(s => s.id === currentStage) || STAGES[0];

        // Get content for displayed candidate
        const getDisplayedContent = () => {
            if (allCandidates && effectiveDisplayedCandidate) {
                const candidateData = allCandidates.get(effectiveDisplayedCandidate);
                if (candidateData) return candidateData.fullText;
            }
            return thinking?.fullText || '';
        };

        // Accumulate all historic text with candidate-specific content
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

        // Check if current candidate is streaming
        const isStreaming = (time: string) => thinking?.candidateTime === time && isActive;

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
                                🧠 AI Reasoning: Stage {currentStage}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-[#8C7F72] font-mono">
                                <Activity className="w-3 h-3 text-emerald-500" />
                                {isActive ? 'LIVE_STREAM' : 'ARCHIVE'} • {currentStageConfig.accuracy} candidates
                            </div>
                        </div>
                    </div>

                    {isActive && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-medium text-[#8B5CF6] uppercase tracking-wider">THINKING</span>
                        </div>
                    )}
                </div>

                {/* 🆕 CANDIDATE TABS BAR */}
                {candidateTabs.length > 0 && (
                    <div className="px-4 py-2 bg-[#0F1419] border-b border-[#3A4452]/50">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-3.5 h-3.5 text-[#8C7F72]" />
                            <span className="text-[10px] text-[#8C7F72] uppercase tracking-wider font-bold">
                                Active Candidates ({candidateTabs.length})
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                            {candidateTabs.slice(0, 10).map((time) => {
                                const isSelected = effectiveDisplayedCandidate === time;
                                const isLive = isStreaming(time);

                                return (
                                    <button
                                        key={time}
                                        onClick={() => handleCandidateClick(time)}
                                        className={`
                                            px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all relative
                                            ${isSelected
                                                ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                                                : 'bg-[#1A2433] text-[#8C7F72] border border-[#3A4452] hover:border-[#D4AF37]/30 hover:text-[#C4B8AD]'
                                            }
                                        `}
                                    >
                                        {isLive && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1.5">
                                            {isLive && <Radio className="w-3 h-3 text-red-400" />}
                                            {time}
                                        </span>
                                    </button>
                                );
                            })}
                            {candidateTabs.length > 10 && (
                                <span className="px-2 py-1.5 text-[10px] text-[#8C7F72]">
                                    +{candidateTabs.length - 10} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Content for Selected Candidate */}
                <ScrollableContent
                    content={activeContent}
                    isThinking={isActive}
                    candidateTime={effectiveDisplayedCandidate || thinking?.candidateTime}
                />

                {/* Calculation Stats Strip */}
                {calculationLogs && calculationLogs.length > 0 && (
                    <div className="px-4 py-2 bg-[#0F1419] border-t border-[#3A4452]/50 flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-4 text-[#8C7F72]">
                            <div className="flex items-center gap-1">
                                <Zap className="w-3 h-3 text-[#D4AF37]" />
                                Swiss Eph Calculations: {calculationLogs.length}
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Latency: ~42ms
                            </div>
                        </div>
                        {effectiveDisplayedCandidate && (
                            <div className="text-[#D4AF37] font-bold font-mono">
                                VIEWING: {effectiveDisplayedCandidate}
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
                                        Stage {stageConfig.id}: {stageConfig.name}
                                    </h3>
                                    <p className="text-xs text-[#8C7F72]">
                                        Candidates: {stageConfig.accuracy}
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

// Sub-component for auto-scrolling - ROBUST SMOOTH SCROLL
function ScrollableContent({ content, isThinking, candidateTime }: { content: string; isThinking: boolean; candidateTime?: string }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const scrollRafRef = useRef<number | null>(null);
    const lastScrollTimeRef = useRef(0);
    const isUserScrollingRef = useRef(false);

    // 🔱 ROBUST SMOOTH SCROLL - Debounced RAF-based
    const smoothScrollToBottom = useCallback(() => {
        if (!shouldAutoScroll || isUserScrollingRef.current) return;

        const now = Date.now();
        // Debounce: min 50ms between scrolls
        if (now - lastScrollTimeRef.current < 50) return;

        // Cancel any pending scroll
        if (scrollRafRef.current) {
            cancelAnimationFrame(scrollRafRef.current);
        }

        scrollRafRef.current = requestAnimationFrame(() => {
            const container = scrollRef.current;
            if (!container) return;

            // Calculate target scroll position
            const targetScroll = container.scrollHeight - container.clientHeight;
            const currentScroll = container.scrollTop;
            const distance = targetScroll - currentScroll;

            // Only scroll if there's meaningful distance
            if (distance > 2) {
                // Smooth scroll with easing (move 40% of distance per frame)
                const step = Math.max(distance * 0.4, 5);
                container.scrollTop = currentScroll + step;
                lastScrollTimeRef.current = now;

                // Continue if not at bottom
                if (container.scrollTop < targetScroll - 2) {
                    scrollRafRef.current = requestAnimationFrame(() => smoothScrollToBottom());
                }
            }
        });
    }, [shouldAutoScroll]);

    // Trigger scroll when content changes
    useEffect(() => {
        if (isThinking && shouldAutoScroll) {
            smoothScrollToBottom();
        }
    }, [content.length, isThinking, shouldAutoScroll, smoothScrollToBottom]);

    // MutationObserver for DOM changes
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

    // Detect user scroll intent
    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        // If within 30px of bottom, enable auto-scroll
        if (distanceFromBottom < 30) {
            setShouldAutoScroll(true);
            isUserScrollingRef.current = false;
        } else {
            // User scrolled up - disable auto-scroll temporarily
            setShouldAutoScroll(false);
            isUserScrollingRef.current = true;

            // Re-enable after 2 seconds of no interaction
            setTimeout(() => {
                isUserScrollingRef.current = false;
            }, 2000);
        }
    }, []);

    // Cleanup RAF on unmount
    useEffect(() => {
        return () => {
            if (scrollRafRef.current) {
                cancelAnimationFrame(scrollRafRef.current);
            }
        };
    }, []);

    // Resume auto-scroll handler
    const handleResumeAutoScroll = useCallback(() => {
        setShouldAutoScroll(true);
        isUserScrollingRef.current = false;
        smoothScrollToBottom();
    }, [smoothScrollToBottom]);

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="p-4 bg-[#0F1419]/50 font-mono text-sm text-[#D1D5DB] leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar relative scroll-smooth"
        >
            {/* Candidate header if viewing specific candidate */}
            {candidateTime && (
                <div className="mb-3 pb-2 border-b border-[#3A4452]">
                    <div className="flex items-center gap-2 text-[#D4AF37]">
                        <Clock className="w-4 h-4" />
                        <span className="font-bold">Candidate: {candidateTime}</span>
                    </div>
                </div>
            )}

            {content ? (
                <div className="break-words border-l-2 border-[#D4AF37]/30 pl-4 py-1 relative">
                    {isThinking ? (
                        <Typewriter
                            content={content}
                            speed={5}
                        />
                    ) : (
                        <div className="whitespace-pre-wrap">{formatStructuredSections(content)}</div>
                    )}
                    {isThinking && (
                        <span className="inline-block w-2 h-4 bg-[#D4AF37] ml-1 animate-pulse align-text-bottom shadow-[0_0_5px_#D4AF37]" />
                    )}
                </div>
            ) : (
                <div className="text-[#6B7280] italic flex items-center gap-2">
                    <span className="animate-spin text-[#D4AF37]">⏳</span>
                    Initializing reasoning engine...
                </div>
            )}

            {/* Scroll Nudge Button - shows when user scrolled up */}
            {!shouldAutoScroll && content && (
                <button
                    onClick={handleResumeAutoScroll}
                    className="absolute bottom-4 right-4 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/40 text-[#D4AF37] px-3 py-1.5 rounded-lg border border-[#D4AF37]/30 transition-all flex items-center gap-2 text-xs font-medium shadow-lg backdrop-blur"
                    title="Resume auto-scroll"
                >
                    <ChevronDown className="w-4 h-4" />
                    Follow
                </button>
            )}
        </div>
    );
}
