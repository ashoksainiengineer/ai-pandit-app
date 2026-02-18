'use client';

import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  memo,
  useEffect,
  useId,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Radio, Activity, Users, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sanitizeAIContent } from '@/lib/xss-sanitizer';

interface PlanetaryInfo {
  sun: string;
  moon: string;
  ascendant: string;
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

interface UnifiedAIPanelProps {
  thinking: AIThinking | null;
  stageHistory?: Map<number, string>;
  isActive: boolean;
  stage?: number;
  allCandidates?: Map<string, AIThinking>;
  displayedCandidate?: string | null;
  onSelectCandidate?: (time: string) => void;
  candidateScores?: CandidateScore[];
  unifiedMode?: boolean;
  isComplete?: boolean;
}

type ScoreTier = 'top' | 'promising' | 'exploring';

interface GroupedCandidates {
  top: Array<{ time: string; score: number }>;
  promising: Array<{ time: string; score: number }>;
  exploring: Array<{ time: string; score: number }>;
}

const TIER_CONFIG: Record<ScoreTier, { label: string; color: string; bgColor: string; borderColor: string; pulseColor: string }> = {
  top: {
    label: 'Top',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    pulseColor: 'bg-emerald-500',
  },
  promising: {
    label: 'Promising',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    pulseColor: 'bg-amber-500',
  },
  exploring: {
    label: 'Exploring',
    color: 'text-stone-600',
    bgColor: 'bg-stone-50',
    borderColor: 'border-stone-200',
    pulseColor: 'bg-stone-400',
  },
};

function groupCandidatesByScore(
  candidates: Map<string, AIThinking> | undefined,
  scores: CandidateScore[] | undefined
): GroupedCandidates {
  const result: GroupedCandidates = { top: [], promising: [], exploring: [] };

  if (!candidates || candidates.size === 0) return result;

  const scoreMap = new Map<string, number>();
  if (scores) {
    scores.forEach(s => {
      const existing = scoreMap.get(s.time);
      if (existing === undefined || s.score > existing) {
        scoreMap.set(s.time, s.score);
      }
    });
  }

  candidates.forEach((_, time) => {
    const score = scoreMap.get(time) ?? 0;
    const entry = { time, score };

    if (score >= 80) result.top.push(entry);
    else if (score >= 60) result.promising.push(entry);
    else result.exploring.push(entry);
  });

  result.top.sort((a, b) => b.score - a.score);
  result.promising.sort((a, b) => b.score - a.score);
  result.exploring.sort((a, b) => b.score - a.score);

  return result;
}

const CandidatePill = memo(function CandidatePill({
  time,
  score,
  tier,
  isSelected,
  isLive,
  onClick,
}: {
  time: string;
  score: number;
  tier: ScoreTier;
  isSelected: boolean;
  isLive: boolean;
  onClick: () => void;
}) {
  const config = TIER_CONFIG[tier];

  return (
    <button
      onClick={onClick}
      className={`
        relative px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold
        transition-all duration-200 border
        ${isSelected
          ? `${config.bgColor} ${config.color} ${config.borderColor} ring-2 ring-offset-1 ring-current/20 shadow-sm`
          : 'bg-white text-[#7A756F] border-[#F0E8DE] hover:border-[#B8860B]/30 hover:text-[#4A453F]'
        }
      `}
    >
      {isLive && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pulseColor} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.pulseColor}`} />
        </span>
      )}
      <span className="flex items-center gap-1">
        {isLive && <Radio className="w-2.5 h-2.5 animate-pulse" />}
        {time}
        {score > 0 && (
          <span className={`text-[8px] opacity-70 ${isSelected ? config.color : 'text-[#A8A39D]'}`}>
            {score.toFixed(0)}
          </span>
        )}
      </span>
    </button>
  );
});

const CandidateTabsSection = memo(function CandidateTabsSection({
  groupedCandidates,
  selectedCandidate,
  liveCandidate,
  onSelect,
}: {
  groupedCandidates: GroupedCandidates;
  selectedCandidate: string | null;
  liveCandidate: string | null;
  onSelect: (time: string) => void;
}) {
  const [expandedTiers, setExpandedTiers] = useState<Set<ScoreTier>>(new Set(['top', 'promising']));

  const toggleTier = useCallback((tier: ScoreTier) => {
    setExpandedTiers(prev => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  }, []);

  const totalCandidates =
    groupedCandidates.top.length +
    groupedCandidates.promising.length +
    groupedCandidates.exploring.length;

  if (totalCandidates === 0) return null;

  return (
    <div className="px-5 py-3 bg-[#FAF8F5] border-b border-[#F0E8DE]">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-3.5 h-3.5 text-[#7A756F]" />
        <span className="text-[10px] text-[#7A756F] uppercase tracking-wider font-bold">
          Candidates ({totalCandidates})
        </span>
      </div>

      <div className="space-y-2">
        {(['top', 'promising', 'exploring'] as ScoreTier[]).map(tier => {
          const candidates = groupedCandidates[tier];
          if (candidates.length === 0) return null;

          const config = TIER_CONFIG[tier];
          const isExpanded = expandedTiers.has(tier);
          const displayedCount = isExpanded ? candidates.length : Math.min(5, candidates.length);
          const hasMore = candidates.length > 5;

          return (
            <div key={tier}>
              <button
                onClick={() => toggleTier(tier)}
                className="flex items-center gap-2 mb-1.5 group"
              >
                <span className={`text-[9px] font-bold uppercase tracking-wider ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-[9px] text-[#A8A39D]">
                  ({candidates.length})
                </span>
                {hasMore && (
                  <>
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3 text-[#A8A39D] group-hover:text-[#7A756F]" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-[#A8A39D] group-hover:text-[#7A756F]" />
                    )}
                  </>
                )}
              </button>

              <div className="flex flex-wrap gap-1.5">
                {candidates.slice(0, displayedCount).map(({ time, score }) => (
                  <CandidatePill
                    key={time}
                    time={time}
                    score={score}
                    tier={tier}
                    isSelected={selectedCandidate === time}
                    isLive={liveCandidate === time}
                    onClick={() => onSelect(time)}
                  />
                ))}
                {hasMore && !isExpanded && (
                  <button
                    onClick={() => toggleTier(tier)}
                    className="px-2 py-1 text-[10px] text-[#7A756F] hover:text-[#4A453F]"
                  >
                    +{candidates.length - 5} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const ReasoningContent = memo(function ReasoningContent({
  content,
  isActive,
}: {
  content: string;
  isActive: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && isActive) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content, isActive]);

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center p-8">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-16 h-16 rounded-full bg-[#B8860B]/5 flex items-center justify-center mb-4"
        >
          <Brain className="w-8 h-8 text-[#B8860B]/40" />
        </motion.div>
        <p className="text-sm text-[#7A756F]">
          Waiting for AI reasoning stream...
        </p>
      </div>
    );
  }

  const sanitizedContent = sanitizeAIContent(content);

  return (
    <div
      ref={scrollRef}
      className="p-5 overflow-y-auto max-h-[400px] font-mono text-sm text-[#4A453F] leading-7 style-scroll"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          li: ({ children }) => (
            <li className="ml-4 list-disc marker:text-[#B8860B]">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-[#1A1612]">{children}</strong>
          ),
          code: ({ children }) => (
            <code className="bg-[#F5EFE7] px-1 py-0.5 rounded text-xs">{children}</code>
          ),
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
      {isActive && (
        <span className="inline-block w-1.5 h-4 bg-[#B8860B] animate-pulse ml-1" />
      )}
    </div>
  );
});

export const UnifiedAIPanel = memo(function UnifiedAIPanel({
  thinking,
  stageHistory,
  isActive,
  stage,
  allCandidates,
  displayedCandidate,
  onSelectCandidate,
  candidateScores,
  unifiedMode = true,
  isComplete = false,
}: UnifiedAIPanelProps) {
  const panelId = useId();
  const [localSelectedCandidate, setLocalSelectedCandidate] = useState<string | null>(null);

  const currentStage = thinking?.stage || stage || 2;

  const effectiveSelectedCandidate = displayedCandidate || localSelectedCandidate;

  const groupedCandidates = useMemo(
    () => groupCandidatesByScore(allCandidates, candidateScores),
    [allCandidates, candidateScores]
  );

  const candidatesList = useMemo(
    () => Array.from(allCandidates?.keys() || []),
    [allCandidates]
  );

  const handleCandidateSelect = useCallback((time: string) => {
    if (onSelectCandidate) {
      onSelectCandidate(time);
    } else {
      setLocalSelectedCandidate(time);
    }
  }, [onSelectCandidate]);

  const displayedContent = useMemo(() => {
    if (allCandidates && effectiveSelectedCandidate) {
      const candidateData = allCandidates.get(effectiveSelectedCandidate);
      if (candidateData?.fullText) {
        return sanitizeAIContent(candidateData.fullText);
      }
    }
    return thinking ? sanitizeAIContent(thinking.fullText) : '';
  }, [allCandidates, effectiveSelectedCandidate, thinking]);

  if (!unifiedMode) {
    return (
      <div className="space-y-3" role="region" aria-labelledby={`${panelId}-title`}>
        <p className="text-sm text-[#7A756F]">Accordion mode not implemented</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#D4A853]/40 shadow-[0_0_20px_rgba(184,134,11,0.08)] overflow-hidden"
      role="region"
      aria-labelledby={`${panelId}-title`}
    >
      <div className="bg-gradient-to-r from-[#FAF8F5] to-white px-5 py-4 border-b border-[#F0E8DE] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#B8860B]/10 rounded-lg">
            <Brain className="w-5 h-5 text-[#B8860B]" />
          </div>
          <div>
            <h3 id={`${panelId}-title`} className="text-base font-bold text-[#1A1612]">
              AI Reasoning Stream
            </h3>
            <p className="text-[10px] text-[#7A756F]">
              {isActive ? 'Live analysis in progress' : 'Analysis results'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isActive && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-1.5 px-2 py-1 bg-[#2D7A5C]/10 rounded-full"
            >
              <Activity className="w-3 h-3 text-[#2D7A5C]" />
              <span className="text-[10px] font-bold text-[#2D7A5C]">LIVE</span>
            </motion.div>
          )}
          <div className="text-[10px] text-[#7A756F] font-mono">
            {candidatesList.length} candidates
          </div>
        </div>
      </div>

      {candidatesList.length > 0 && (
        <CandidateTabsSection
          groupedCandidates={groupedCandidates}
          selectedCandidate={effectiveSelectedCandidate || null}
          liveCandidate={thinking?.candidateTime || null}
          onSelect={handleCandidateSelect}
        />
      )}

      {effectiveSelectedCandidate && (
        <div className="px-5 py-2 bg-[#FCFBF9] border-b border-[#F0E8DE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              {isActive && thinking?.candidateTime === effectiveSelectedCandidate && (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </>
              )}
              {!isActive && (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B8860B]" />
              )}
            </span>
            <span className="text-xs font-bold text-[#1A1612] font-mono">
              {effectiveSelectedCandidate}
            </span>
          </div>
          <span className="text-[10px] text-[#7A756F] font-mono">
            {displayedContent.length.toLocaleString()} chars
          </span>
        </div>
      )}

      <ReasoningContent content={displayedContent} isActive={isActive} />
    </motion.div>
  );
});

export default UnifiedAIPanel;
