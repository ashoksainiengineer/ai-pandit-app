'use client';

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

// Types and Constants here

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

const formatStructuredSections = (text: string): React.ReactNode[] => {
    if (!text) return [];

    const sanitizedText = sanitizeAIContent(text);
    const lines = sanitizedText.split('\n');

    return lines.map((line, i) => {
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
        if (/^TIME: \d{2}:\d{2}:\d{2}/i.test(line)) {
            return (
                <div key={i} className="mt-6 mb-3 border-l-2 border-[#2D7A5C] pl-3">
                    <span className="text-[#2D7A5C] font-bold text-base sm:text-lg font-mono">{line}</span>
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
                <div key={i} className="mb-1 pl-2 text-[#4A453F] text-sm">
                    <span className="text-[#2D7A5C] mr-1">▹</span>
                    {line.replace(/^[▸◦•\-\*] /, '')}
                </div>
            );
        }
        return <div key={i} className="mb-1 text-[#4A453F] text-sm">{line}</div>;
    });
};

interface ScrollableContentProps {
    content: string;
    isThinking: boolean;
    candidateTime?: string;
}

const ScrollableContent = memo(function ScrollableContent({ content, isThinking, candidateTime }: ScrollableContentProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    // ... other scroll logic ...
    return (
        <div ref={scrollRef} className="p-3 sm:p-4 bg-[#FAF5EF]/50 font-mono text-xs sm:text-sm text-[#4A453F] leading-relaxed max-h-[300px] sm:max-h-[400px] overflow-y-auto custom-scrollbar relative scroll-smooth">
            {/* ... content ... */}
        </div>
    );
});

interface CandidateTabButtonProps {
    time: string;
    isSelected: boolean;
    isLive: boolean;
    onClick: () => void;
}

const CandidateTabButton = memo(function CandidateTabButton({ time, isSelected, isLive, onClick }: CandidateTabButtonProps) {
    return (
        <button onClick={onClick} className={`px-2 sm:px-2.5 py-1 rounded text-[9px] sm:text-[10px] font-mono font-bold transition-all relative outline-none focus:ring-2 focus:ring-[#B8860B]/50 ${isSelected ? 'bg-[#B8860B]/20 text-[#B8860B] border border-[#B8860B]/50 shadow-[0_0_10px_rgba(184,134,11,0.2)]' : 'bg-[#FDF8F3] text-[#7A756F] border border-[#F0E8DE] hover:border-[#B8860B]/30 hover:text-[#4A453F]'}`} role="tab" aria-selected={isSelected} tabIndex={isSelected ? 0 : -1}>
            {/* ... content ... */}
        </button>
    );
});

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

    const toggleStage = useCallback((stageId: number) => {
        setExpandedStages(prev => prev.includes(stageId) ? prev.filter(id => id !== stageId) : [...prev, stageId]);
    }, []);

    const handleCandidateClick = useCallback((time: string) => {
        if (onSelectCandidate) {
            onSelectCandidate(time);
        } else {
            setLocalDisplayedCandidate(time);
        }
    }, [onSelectCandidate]);

    useEffect(() => {
        if (!expandedStages.includes(currentStage)) {
            setExpandedStages(prev => [...prev, currentStage]);
        }
    }, [currentStage, expandedStages]);

    const STAGES = useMemo(() => [
        { id: 2, name: 'Coarse Elimination', level: 1, color: 'orange', accuracy: '60 → 15' },
        { id: 4, name: 'Deep Analysis', level: 2, color: 'blue', accuracy: '100 → 7' },
        { id: 6, name: 'Final Precision', level: 3, color: 'purple', accuracy: '77 → 1' },
    ], []);

    const getDisplayedContent = useCallback(() => {
        if (allCandidates && effectiveDisplayedCandidate) {
            const candidateData = allCandidates.get(effectiveDisplayedCandidate);
            if (candidateData) return sanitizeAIContent(candidateData.fullText);
        }
        return thinking ? sanitizeAIContent(thinking.fullText) : '';
    }, [allCandidates, effectiveDisplayedCandidate, thinking]);

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

    const isStreaming = useCallback((time: string) =>
        thinking?.candidateTime === time && isActive,
        [thinking?.candidateTime, isActive]
    );

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

    if (unifiedMode) {
        const currentStageConfig = STAGES.find(s => s.id === currentStage) || STAGES[0];
        const activeContent = unifiedContent;

        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-[#D4A853]/50 bg-white shadow-[0_0_20px_rgba(184,134,11,0.1)] overflow-hidden" role="region" aria-labelledby={`${panelId}-title`}>
                {/* Header, Candidate Tabs, Content, etc. using the hooks from above */}
            </motion.div>
        );
    }

    // Accordion mode - collapsible stages
    return (
        <div className="space-y-3" role="region" aria-labelledby={`${panelId}-accordion-title`}>
            <h2 id={`${panelId}-accordion-title`} className="sr-only">
                AI Analysis Stages
            </h2>
            {STAGES.map((stageConfig) => {
                const isExpanded = expandedStages.includes(stageConfig.id);
                const stageContent = stageHistory?.get(stageConfig.id);
                const isCurrentStage = stageConfig.id === currentStage;
                const stageCandidates = groupedCandidates.get(stageConfig.id) || [];
                const hasContent = !!stageContent || (isCurrentStage && thinking);

                return (
                    <motion.div
                        key={stageConfig.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-xl border overflow-hidden transition-all ${isCurrentStage
                            ? 'border-[#B8860B]/50 bg-white shadow-lg'
                            : 'border-[#F0E8DE] bg-[#FEFDFB]'
                            }`}
                    >
                        {/* Accordion Header */}
                        <button
                            onClick={() => toggleStage(stageConfig.id)}
                            className={`w-full flex items-center justify-between p-3 sm:p-4 transition-colors ${isCurrentStage ? 'bg-[#B8860B]/5' : 'hover:bg-[#FDF8F3]'
                                }`}
                            aria-expanded={isExpanded}
                            aria-controls={`${panelId}-stage-${stageConfig.id}-content`}
                        >
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCurrentStage
                                    ? 'bg-[#B8860B]/20 text-[#B8860B]'
                                    : hasContent
                                        ? 'bg-[#2D7A5C]/10 text-[#2D7A5C]'
                                        : 'bg-[#F0E8DE] text-[#A8A39D]'
                                    }`}>
                                    {stageConfig.id === 2 && <Users className="w-4 h-4" />}
                                    {stageConfig.id === 4 && <Activity className="w-4 h-4" />}
                                    {stageConfig.id === 6 && <Zap className="w-4 h-4" />}
                                </div>
                                <div className="text-left">
                                    <p className={`font-medium text-sm ${isCurrentStage ? 'text-[#B8860B]' : 'text-[#1A1612]'
                                        }`}>
                                        Stage {stageConfig.id}: {stageConfig.name}
                                    </p>
                                    <p className="text-xs text-[#A8A39D]">
                                        {stageCandidates.length} candidates • {stageConfig.accuracy}
                                    </p>
                                </div>
                                {isCurrentStage && isActive && (
                                    <span className="ml-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#B8860B] text-white rounded-full animate-pulse">
                                        Live
                                    </span>
                                )}
                            </div>
                            {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-[#A8A39D]" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-[#A8A39D]" />
                            )}
                        </button>

                        {/* Accordion Content */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    id={`${panelId}-stage-${stageConfig.id}-content`}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-3 sm:p-4 border-t border-[#F0E8DE]">
                                        {/* Candidate tabs if multiple */}
                                        {stageCandidates.length > 1 && (
                                            <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-[#F0E8DE]">
                                                {stageCandidates.filter(c => c?.candidateTime).map((candidate, idx) => (
                                                    <CandidateTabButton
                                                        key={candidate.candidateTime || `candidate-${idx}`}
                                                        time={candidate.candidateTime || ''}
                                                        isSelected={effectiveDisplayedCandidate === candidate.candidateTime}
                                                        isLive={isStreaming(candidate.candidateTime || '')}
                                                        onClick={() => handleCandidateClick(candidate.candidateTime || '')}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Content display */}
                                        <div className="font-mono text-xs sm:text-sm text-[#4A453F] leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {stageContent ? (
                                                formatStructuredSections(stageContent)
                                            ) : isCurrentStage && thinking ? (
                                                <>
                                                    {formatStructuredSections(thinking.fullText)}
                                                    {isActive && (
                                                        <span className="inline-block w-1.5 h-4 bg-[#B8860B] animate-pulse ml-1" />
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-[#A8A39D] italic text-center py-4">
                                                    Waiting for analysis to reach this stage...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
});

export default UnifiedAIPanel;
