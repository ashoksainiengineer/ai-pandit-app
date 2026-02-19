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

// 🔱 NEW: Reasoning Card for Grid View
const ReasoningCard = memo(function ReasoningCard({
  title,
  content,
  isLive,
  onClick,
  batchIndex,
}: {
  title: string;
  content: string;
  isLive: boolean;
  onClick: () => void;
  batchIndex: number;
}) {
  const sanitized = sanitizeAIContent(content);
  // Get first 150 chars for preview
  const preview = sanitized.length > 150 ? sanitized.substring(0, 150) + '...' : sanitized;

  return (
    <motion.div
      layoutId={`reasoning-card-${title}`}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onClick}
      className={`
        cursor-pointer relative p-4 rounded-xl border transition-all duration-300
        ${isLive
          ? 'bg-amber-50/50 border-amber-200 shadow-[0_4px_12px_rgba(184,134,11,0.1)]'
          : 'bg-white border-[#F0E8DE] hover:border-amber-400 hover:shadow-md'}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-amber-500 animate-pulse' : 'bg-stone-300'}`} />
          <span className="text-[11px] font-bold text-[#1A1612] font-mono">{title}</span>
        </div>
        {isLive && (
          <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">
            Live
          </span>
        )}
      </div>

      <div className="text-[10px] text-[#4A453F] leading-relaxed line-clamp-4 font-mono overflow-hidden">
        {preview || 'Initializing batch calculations...'}
      </div>

      <div className="mt-4 pt-3 border-t border-dashed border-stone-100 flex items-center justify-between">
        <span className="text-[9px] text-stone-400 font-mono">
          {content.length.toLocaleString()} chars
        </span>
        <span className="text-[9px] text-amber-700 font-bold hover:underline">
          View Full Reasoning →
        </span>
      </div>
    </motion.div>
  );
});

// 🔱 NEW: Reasoning Grid
const ReasoningGrid = memo(function ReasoningGrid({
  candidates,
  liveCandidate,
  onFocus,
}: {
  candidates: Map<string, AIThinking>;
  liveCandidate: string | null;
  onFocus: (time: string) => void;
}) {
  const entries = Array.from(candidates.entries());

  if (entries.length === 0) return null;

  return (
    <div className="p-5 flex flex-col gap-4 max-h-[800px] overflow-y-auto style-scroll bg-[#FAF8F5]/30">
      {entries.map(([time, data], idx) => (
        <ReasoningCard
          key={time}
          title={data.candidateTime || time}
          content={data.fullText}
          isLive={liveCandidate === time}
          batchIndex={idx}
          onClick={() => onFocus(time)}
        />
      ))}
    </div>
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
  const [isFocused, setIsFocused] = useState(false);

  // Sync focus if displayedCandidate changes externally
  useEffect(() => {
    if (displayedCandidate) {
      setLocalSelectedCandidate(displayedCandidate);
      setIsFocused(true);
    }
  }, [displayedCandidate]);

  const currentStage = thinking?.stage || stage || 2;
  const effectiveSelectedCandidate = localSelectedCandidate;

  const groupedCandidates = useMemo(
    () => groupCandidatesByScore(allCandidates, candidateScores),
    [allCandidates, candidateScores]
  );

  const candidatesList = useMemo(
    () => Array.from(allCandidates?.keys() || []),
    [allCandidates]
  );

  const handleCandidateSelect = useCallback((time: string) => {
    setLocalSelectedCandidate(time);
    setIsFocused(true);
    if (onSelectCandidate) onSelectCandidate(time);
  }, [onSelectCandidate]);

  const displayedContent = useMemo(() => {
    if (allCandidates && effectiveSelectedCandidate) {
      const candidateData = allCandidates.get(effectiveSelectedCandidate);
      return candidateData?.fullText ? sanitizeAIContent(candidateData.fullText) : '';
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
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FAF8F5] to-white px-5 py-4 border-b border-[#F0E8DE] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#B8860B]/10 rounded-lg">
            <Brain className="w-5 h-5 text-[#B8860B]" />
          </div>
          <div>
            <h3 id={`${panelId}-title`} className="text-base font-bold text-[#1A1612]">
              Intelligence Grid
            </h3>
            <p className="text-[10px] text-[#7A756F]">
              {isActive ? 'Simultaneous processing' : 'Multi-stream history'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFocused && (
            <button
              onClick={() => setIsFocused(false)}
              className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1"
            >
              ← Back to Grid
            </button>
          )}
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
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isFocused ? (
          <motion.div
            key="grid-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {/* Top General Overview if available */}
            {thinking?.candidateTime === 'general' && (
              <div className="px-5 py-3 bg-[#FCFBF9] border-b border-[#F0E8DE]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Global Reasoning</span>
                </div>
                <div className="text-[11px] text-[#4A453F] line-clamp-2 italic font-mono">
                  {thinking.fullText}
                </div>
              </div>
            )}

            {/* Grid of Batches */}
            <ReasoningGrid
              candidates={allCandidates || new Map()}
              liveCandidate={thinking?.candidateTime || null}
              onFocus={handleCandidateSelect}
            />

            {candidatesList.length === 0 && (
              <ReasoningContent content="" isActive={isActive} />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="focus-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Context Info for Focused View */}
            <div className="px-5 py-3 bg-amber-50/30 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#1A1612] font-mono flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${thinking?.candidateTime === effectiveSelectedCandidate ? 'bg-green-500 animate-pulse' : 'bg-[#B8860B]'}`} />
                  {effectiveSelectedCandidate}
                </span>
                <span className="text-[9px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold uppercase">
                  Technical Reasoning
                </span>
              </div>
              <button
                onClick={() => setIsFocused(false)}
                className="text-[10px] text-[#7A756F] hover:text-[#1A1612] transition-colors"
              >
                Close Full View ×
              </button>
            </div>

            <ReasoningContent content={displayedContent} isActive={isActive && thinking?.candidateTime === effectiveSelectedCandidate} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default UnifiedAIPanel;
