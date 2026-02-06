'use client';

// components/rectify/UnifiedAIPanel-fixed.tsx
// Production-grade AI panel with XSS protection, memory leak prevention,
// accessibility features, and responsive design

import React, {
    useEffect,
    useState,
    useRef,
    useMemo,
    useCallback,
    memo,
    useId,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, ChevronUp, Activity, Users, Radio, Zap, Clock } from 'lucide-react';
import { sanitizeAIContent } from '@/lib/xss-sanitizer';
import { logger } from '@/lib/secure-logger';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface PlanetaryInfo {
    sun: string;
    moon: string;
    ascendant: string;
}

interface AIContextData {
    stage: number;
    candidateTime: string;
    planetaryInfo: PlanetaryInfo;
    dasha: string;
    divCharts?: string;
    groundTruth?: unknown;
}

interface AIThinking {
    stage: number;
    candidateTime?: string;
    chunks?: string[];
    fullText: string;
}

interface CandidateScore {
    time: string;
    score: number;
    stage: number;
    rank?: number;
    offsetMinutes?: number;
    minifiedEph?: PlanetaryInfo;
}

interface CalculationLog {
    logId: string;
    candidateTime: string;
    sunPos: string;
    moonPos: string;
    ascendant: string;
    timestamp: number;
    message: string;
    level: 1 | 2 | 3;
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
    candidateScores?: CandidateScore[];
    calculationLogs?: CalculationLog[];
    unifiedMode?: boolean;
    isComplete?: boolean;
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
// FORMAT STRUCTURED SECTIONS (XSS-SAFE)
// ═══════════════════════════════════════════════════════════════════════════════

const formatStructuredSections = (text: string): React.ReactNode[] => {
    if (!text) return [];

    const sanitizedText = sanitizeAIContent(text);
    const lines = sanitizedText.split('\n');

    return lines.map((line, i) => {
        // Section headers (e.g., DASHA:, PLANETARY:)
        const sectionMatch = line.match(/^(DASHA|DIVISIONAL|TRANSIT|PLANETARY|EVENT|VERDICT|FINAL|PHYSICAL|BOUNDARY|LAGNA|NAKSHATRA|D9|D10|D60):/i);
        if (sectionMatch) {
            const colonIdx = line.indexOf(':');
            const label = line.slice(0, colonIdx).toUpperCase();
            const rest = line.slice(colonIdx + 1).trim();
            return (
                <div key={i} className="mt-4 mb-2 first:mt-0">
                    <span className="inline-block text-[#B8860B] font-bold uppercase text-[10px] tracking-widest bg-[#B8860B]/10 px-2 py-0.5 rounded border border-[#B8860B]/20">
                        {label}
                    </span>
                    <p className="mt-1 text-[#1A1612] text-sm">{rest}</p>
                </div>
            );
        }

        // Time headers
        if (/^TIME: \d{2}:\d{2}:\d{2}/i.test(line)) {
            return (
                <div key={i} className="mt-6 mb-3 border-l-2 border-[#2D7A5C] pl-3">
                    <span className="text-[#2D7A5C] font-bold text-base sm:text-lg font-mono">{line}</span>
                </div>
            );
        }

        // Score lines
        if (/^(SCORE|RATING|CONFIDENCE):/i.test(line)) {
            return (
                <div key={i} className="my-2 p-2 bg-[#B8860B]/5 rounded border-l-2 border-[#B8860B]">
                    <span className="text-[#B8860B] font-bold font-mono text-sm">{line}</span>
                </div>
            );
        }

        // Bullet points
        if (/^[▸◦•\-\*] /.test(line)) {
            return (
                <div key={i} className="mb-1 pl-2 text-[#4A453F] text-sm">
                    <span className="text-[#2D7A5C] mr-1">▹</span>
                    {line.replace(/^[▸◦•\-\*] /, '')}
                </div>
            );
        }

        return <div key={i} className="mb-1 text-[#4A453F] text-sm">{line}</div>;
    });
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCROLLABLE CONTENT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface ScrollableContentProps {
    content: string;
    isThinking: boolean;
    candidateTime?: string;
}

const ScrollableContent = memo(function ScrollableContent({
    content,
    isThinking,
    candidateTime,
}: ScrollableContentProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const scrollRafRef = useRef<number | null>(null);
    const lastScrollTimeRef = useRef(0);
    const isUserScrollingRef = useRef(false);
    const prevContentLengthRef = useRef(content.length);

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
                    scrollRafRef.current = requestAnimationFrame(smoothScrollToBottom);
                }
            }
        });
    }, [shouldAutoScroll]);

    // Auto-scroll on content change (only if content grew)
    useEffect(() => {
        if (content.length > prevContentLengthRef.current && shouldAutoScroll) {
            smoothScrollToBottom();
        }
        prevContentLengthRef.current = content.length;
    }, [content.length, shouldAutoScroll, smoothScrollToBottom]);

    // Cleanup RAF on unmount
    useEffect(() => {
        return () => {
            if (scrollRafRef.current) {
                cancelAnimationFrame(scrollRafRef.current);
            }
        };
    }, []);

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

            // Reset after 2 seconds
            setTimeout(() => {
                isUserScrollingRef.current = false;
            }, 2000);
        }
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
            className="p-3 sm:p-4 bg-[#FAF5EF]/50 font-mono text-xs sm:text-sm text-[#4A453F] leading-relaxed max-h-[300px] sm:max-h-[400px] overflow-y-auto custom-scrollbar relative scroll-smooth"
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-label="AI reasoning content"
            tabIndex={0}
        >
            {candidateTime && (
                <div className="mb-3 pb-2 border-b border-[#F0E8DE]">
                    <div className="flex items-center gap-2 text-[#B8860B]">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        <span className="font-bold">Candidate: {candidateTime}</span>
                    </div>
                </div>
            )}

            {content ? (
                <div className="break-words border-l-2 border-[#B8860B]/30 pl-3 sm:pl-4 py-1 relative">
                    <div className="whitespace-pre-wrap">{formatStructuredSections(content)}</div>
                    {isThinking && (
                        <span
                            className="inline-block w-2 h-4 bg-[#B8860B] ml-1 animate-pulse align-text-bottom"
                            style={{ boxShadow: '0 0 5px #B8860B' }}
                            aria-hidden="true"
                        />
                    )}
                </div>
            ) : (
                <div className="text-[#A8A39D] italic flex items-center gap-2">
                    <span className="animate-spin text-[#B8860B]" aria-hidden="true">⏳</span>
                    Initializing reasoning engine...
                </div>
            )}

            {!shouldAutoScroll && content && (
                <button
                    onClick={handleResumeAutoScroll}
                    className="absolute bottom-4 right-4 bg-[#B8860B]/20 hover:bg-[#B8860B]/40 text-[#B8860B] px-3 py-1.5 rounded-lg border border-[#B8860B]/30 transition-all flex items-center gap-2 text-xs font-medium shadow-lg backdrop-blur focus:outline-none focus:ring-2 focus:ring-[#B8860B]/50"
                    aria-label="Resume auto-scroll"
                >
                    <ChevronDown className="w-4 h-4" aria-hidden="true" />
                    Follow
                </button>
            )}
        </div>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// CANDIDATE TAB BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

interface CandidateTabButtonProps {
    time: string;
    isSelected: boolean;
    isLive: boolean;
    onClick: () => void;
}

const CandidateTabButton = memo(function CandidateTabButton({
    time,
    isSelected,
    isLive,
    onClick,
}: CandidateTabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`
                px-2 sm:px-2.5 py-1 rounded text-[9px] sm:text-[10px] font-mono font-bold transition-all relative outline-none focus:ring-2 focus:ring-[#B8860B]/50
                ${isSelected
                    ? 'bg-[#B8860B]/20 text-[#B8860B] border border-[#B8860B]/50 shadow-[0_0_10px_rgba(184,134,11,0.2)]'
                    : 'bg-[#FDF8F3] text-[#7A756F] border border-[#F0E8DE] hover:border-[#B8860B]/30 hover:text-[#4A453F]'
                }
            `}
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
        >
            {isLive && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2" aria-hidden="true">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C65D3B] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C65D3B]" />
                </span>
            )}
            <span className="flex items-center gap-1">
                {isLive && <Radio className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#C65D3B]" aria-hidden="true" />}
                <span className="tabular-nums">{time}</span>
            </span>
        </button>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const UnifiedAIPanel = memo(function UnifiedAIPanel({
    thinking,
    stageHistory,
    context,
    isActive,
    stage,
    allCandidates,
    displayedCandidate,
    onSelectCandidate,
    calculationLogs,
    unifiedMode = true,
    isComplete = false,
}: UnifiedAIPanelProps) {
    const currentStage = thinking?.stage || stage || 2;
    const [expandedStages, setExpandedStages] = useState<number[]>([currentStage]);
    const [localDisplayedCandidate, setLocalDisplayedCandidate] = useState<string | null>(null);
    const panelId = useId();

    const effectiveDisplayedCandidate = displayedCandidate || localDisplayedCandidate;

    // Toggle stage expansion
    const toggleStage = useCallback((stageId: number) => {
        setExpandedStages(prev =>
            prev.includes(stageId)
                ? prev.filter(id => id !== stageId)
                : [...prev, stageId]
        );
    }, []);

    // Handle candidate selection
    const handleCandidateClick = useCallback((time: string) => {
        if (onSelectCandidate) {
            onSelectCandidate(time);
        } else {
            setLocalDisplayedCandidate(time);
        }
    }, [onSelectCandidate]);

    // Expand current stage if not already expanded
    useEffect(() => {
        if (!expandedStages.includes(currentStage)) {
            setExpandedStages(prev => [...prev, currentStage]);
        }
    }, [currentStage, expandedStages]);

    // Stage configurations
    const STAGES = useMemo(() => [
        { id: 2, name: 'Coarse Elimination', level: 1, color: 'orange', accuracy: '60 → 15' },
        { id: 4, name: 'Deep Analysis', level: 2, color: 'blue', accuracy: '100 → 7' },
        { id: 6, name: 'Final Precision', level: 3, color: 'purple', accuracy: '77 → 1' },
    ], []);

    // Unified mode rendering
    if (unifiedMode) {
        const currentStageConfig = STAGES.find(s => s.id === currentStage) || STAGES[0];

        // Get displayed content
        const getDisplayedContent = useCallback(() => {
            if (allCandidates && effectiveDisplayedCandidate) {
                const candidateData = allCandidates.get(effectiveDisplayedCandidate);
                if (candidateData) return sanitizeAIContent(candidateData.fullText);
            }
            return thinking ? sanitizeAIContent(thinking.fullText) : '';
        }, [allCandidates, effectiveDisplayedCandidate, thinking]);

        // Build unified content
        const unifiedContent = useMemo(() => {
            let content = '';
            STAGES.forEach(s => {
                const hist = stageHistory?.get(s.id);
                if (hist) {
                    content += `\n--- STAGE ${s.id}: ${s.name} ---\n${sanitizeAIContent(hist)}\n`;
                } else if (s.id === currentStage) {
                    const currentContent = getDisplayedContent();
                    if (currentContent) {
                        content += `\n--- STAGE ${s.id}: ${s.name} [ACTIVE] ---\n${currentContent}`;
                    }
                }
            });
            return content || getDisplayedContent();
        }, [STAGES, stageHistory, currentStage, getDisplayedContent]);

        const activeContent = unifiedContent;
        const isStreaming = useCallback((time: string) =>
            thinking?.candidateTime === time && isActive,
            [thinking?.candidateTime, isActive]
        );

        // Group candidates by stage
        const groupedCandidates = useMemo(() => {
            if (!allCandidates || allCandidates.size === 0) {
                return thinking?.candidateTime ? new Map([[2, [thinking]]]) : new Map();
            }

            const groups = new Map<number, AIThinking[]>();
            allCandidates.forEach((candidate) => {
                const stageId = candidate.stage <= 2 ? 2 : candidate.stage === 4 ? 4 : 6;
                const existing = groups.get(stageId) || [];
                existing.push(candidate);
                groups.set(stageId, existing);
            });
            return groups;
        }, [allCandidates, thinking]);

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[#D4A853]/50 bg-white shadow-[0_0_20px_rgba(184,134,11,0.1)] overflow-hidden"
                role="region"
                aria-labelledby={`${panelId}-title`}
            >
                {/* Header */}
                <div className="p-3 sm:p-4 bg-[#FDF8F3] flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#F0E8DE] gap-3">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg relative
                                ${currentStageConfig.color === 'orange' ? 'from-[#E8A849] to-[#D4A853]' :
                                  currentStageConfig.color === 'blue' ? 'from-[#6B9AC4] to-[#4A7C6F]' :
                                  'from-[#6B1F7A] to-[#8B4A9C]'}`}
                            aria-hidden="true"
                        >
                            <Brain className="w-5 h-5 text-white" />
                            {isActive && !isComplete && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#C65D3B] rounded-full animate-ping" aria-hidden="true" />
                            )}
                        </div>
                        <div>
                            <h3
                                id={`${panelId}-title`}
                                className="font-bold text-sm sm:text-base text-[#B8860B]"
                            >
                                AI Reasoning: Stage {currentStage}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-[#7A756F]">
                                <Activity className="w-3 h-3 text-[#2D7A5C]" aria-hidden="true" />
                                {isActive ? 'LIVE STREAM' : 'ARCHIVE'} • {currentStageConfig.accuracy} candidates
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {thinking?.candidateTime && isActive && (
                            <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-[#B8860B]/10 rounded-lg border border-[#B8860B]/30 shadow-sm animate-pulse">
                                <span className="text-[10px] text-[#7A756F] uppercase font-bold tracking-wider">Analyzing:</span>
                                <span className="text-xs sm:text-sm font-mono font-bold text-[#B8860B] tabular-nums">{thinking.candidateTime}</span>
                            </div>
                        )}

                        {isActive && !isComplete && (
                            <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full bg-[#6B1F7A]/10 border border-[#6B1F7A]/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#6B1F7A] animate-pulse" aria-hidden="true" />
                                <span className="text-[9px] sm:text-[10px] font-medium text-[#6B1F7A] uppercase tracking-wider">THINKING</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Candidate Tabs */}
                {groupedCandidates.size > 0 && (
                    <div className="px-3 sm:px-4 py-2 bg-white border-b border-[#F0E8DE]">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-3.5 h-3.5 text-[#7A756F]" aria-hidden="true" />
                            <span className="text-[10px] text-[#7A756F] uppercase tracking-wider font-bold">
                                Active Candidates
                            </span>
                        </div>
                        <div
                            className="space-y-2 pb-1 max-h-[200px] overflow-y-auto custom-scrollbar"
                            role="tablist"
                            aria-label="Candidate selection"
                        >
                            {[2, 4, 6].map(stageId => {
                                const stageCandidates = groupedCandidates.get(stageId) || [];
                                if (stageCandidates.length === 0) return null;

                                const stageName = stageId === 2 ? 'Discovery' : stageId === 4 ? 'Deep Verification' : 'Final Selection';

                                return (
                                    <div key={stageId} className="space-y-1.5">
                                        <div className="flex items-center gap-2 opacity-60">
                                            <div className="h-[1px] flex-1 bg-[#F0E8DE]" />
                                            <span className="text-[9px] font-bold uppercase tracking-tighter text-[#7A756F]">
                                                {stageName}
                                            </span>
                                            <div className="h-[1px] flex-1 bg-[#F0E8DE]" />
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {stageCandidates.map((cData) => {
                                                const time = cData.candidateTime || 'unknown';
                                                const isSelected = effectiveDisplayedCandidate === time;
                                                const isLive = isStreaming(time);

                                                return (
                                                    <CandidateTabButton
                                                        key={time}
                                                        time={time}
                                                        isSelected={isSelected}
                                                        isLive={isLive}
                                                        onClick={() => handleCandidateClick(time)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Content */}
                <ScrollableContent
                    content={activeContent}
                    isThinking={isActive && !isComplete}
                    candidateTime={effectiveDisplayedCandidate || thinking?.candidateTime}
                />

                {/* Calculation Stats */}
                {calculationLogs && calculationLogs.length > 0 && (
                    <div className="px-3 sm:px-4 py-2 bg-[#FDF8F3] border-t border-[#F0E8DE] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[10px]">
                        <div className="flex items-center gap-3 sm:gap-4 text-[#7A756F]">
                            <div className="flex items-center gap-1">
                                <Zap className="w-3 h-3 text-[#B8860B]" aria-hidden="true" />
                                Calculations: {calculationLogs.length}
                            </div>
                        </div>
                        {effectiveDisplayedCandidate && (
                            <div className="text-[#B8860B] font-bold font-mono tabular-nums">
                                VIEWING: {effectiveDisplayedCandidate}
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        );
    }

    // Accordion mode (legacy fallback)
    return (
        <div className="space-y-4">
            {STAGES.map((stageConfig) => {
                const historyText = stageHistory?.get(stageConfig.id);
                const isCurrent = currentStage === stageConfig.id;
                const rawContent = isCurrent ? (thinking?.fullText || historyText) : historyText;
                const content = rawContent ? sanitizeAIContent(rawContent) : '';

                if (!content && !isCurrent) return null;

                const isExpanded = expandedStages.includes(stageConfig.id);
                const stageId = `${panelId}-stage-${stageConfig.id}`;

                return (
                    <motion.div
                        key={stageConfig.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl border transition-colors overflow-hidden ${
                            isCurrent
                                ? 'border-[#D4A853]/50 bg-white shadow-[0_0_20px_rgba(184,134,11,0.1)]'
                                : 'border-[#F0E8DE] bg-[#FAF5EF]/50'
                        }`}
                    >
                        {/* Header */}
                        <button
                            onClick={() => toggleStage(stageConfig.id)}
                            className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-[#FDF8F3] transition-colors outline-none focus:ring-2 focus:ring-inset focus:ring-[#B8860B]/30"
                            aria-expanded={isExpanded}
                            aria-controls={stageId}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg
                                        ${stageConfig.color === 'orange' ? 'from-[#E8A849] to-[#D4A853]' :
                                          stageConfig.color === 'blue' ? 'from-[#6B9AC4] to-[#4A7C6F]' :
                                          'from-[#6B1F7A] to-[#8B4A9C]'}`}
                                    aria-hidden="true"
                                >
                                    <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className={`font-bold text-sm sm:text-base ${isCurrent ? 'text-[#B8860B]' : 'text-[#1A1612]'}`}>
                                        Stage {stageConfig.id}: {stageConfig.name}
                                    </h3>
                                    <p className="text-[10px] sm:text-xs text-[#7A756F]">
                                        Candidates: {stageConfig.accuracy}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-4">
                                {isCurrent && isActive && (
                                    <div className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full bg-[#6B1F7A]/10 border border-[#6B1F7A]/30">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#6B1F7A] animate-pulse" aria-hidden="true" />
                                        <span className="text-[9px] sm:text-[10px] font-medium text-[#6B1F7A] uppercase tracking-wider">THINKING</span>
                                    </div>
                                )}
                                {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#7A756F]" aria-hidden="true" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#7A756F]" aria-hidden="true" />
                                )}
                            </div>
                        </button>

                        {/* Content */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    id={stageId}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden border-t border-[#F0E8DE]"
                                >
                                    <ScrollableContent
                                        content={content}
                                        isThinking={isCurrent && isActive}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}

            {/* Context Panel */}
            {context && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl border border-[#2D7A5C]/30 bg-[#D4E5DE]/30 p-3 sm:p-4"
                    role="complementary"
                    aria-label="Engine context"
                >
                    <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-[#2D7A5C] uppercase tracking-wider">
                        <span aria-hidden="true">📊</span>
                        Live Engine Context
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
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
                            <div className="text-[#2D7A5C] truncate">
                                {context.dasha}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
});

export default UnifiedAIPanel;
