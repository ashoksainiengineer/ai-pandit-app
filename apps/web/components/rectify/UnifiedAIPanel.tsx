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
import { useVirtualizer } from '@tanstack/react-virtual';
import { sanitizeAIContent } from '@/lib/xss-sanitizer';
import { highlightKeywords } from '@/lib/keyword-highlighter';

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
  updatedAt?: number;
  startedAt?: number;
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
  stageHistory?: Record<number, string>;
  isActive: boolean;
  stage?: number;
  allCandidates?: Record<string, AIThinking>;
  displayedCandidate?: string | null;
  onSelectCandidate?: (time: string) => void;
  candidateScores?: CandidateScore[];
  unifiedMode?: boolean;
  isComplete?: boolean;
  title?: string;
  isCompleted?: boolean;
  offsetMinutes?: number;
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
  candidates: Record<string, AIThinking> | undefined,
  scores: CandidateScore[] | undefined
): GroupedCandidates {
  const result: GroupedCandidates = { top: [], promising: [], exploring: [] };

  if (!candidates || Object.keys(candidates).length === 0) return result;

  const scoreMap = new Map<string, number>();
  if (scores) {
    scores.forEach(s => {
      const existing = scoreMap.get(s.time);
      if (existing === undefined || s.score > existing) {
        scoreMap.set(s.time, s.score);
      }
    });
  }

  Object.entries(candidates).forEach(([key, data]) => {
    const time = data.candidateTime || key.split('_').pop() || key;
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

// Compact Reasoning Card — 4 per row, live typing effect
// PERF: Custom comparator — only re-render when THIS card's content actually changes
const ReasoningCard = memo(function ReasoningCard({
  title,
  content,
  isLive,
  onClick,
  batchIndex,
  startedAt,
  updatedAt,
  score,
  isWinner,
}: {
  title: string;
  content: string;
  isLive: boolean;
  onClick: () => void;
  batchIndex: number;
  startedAt?: number;
  updatedAt?: number;
  score?: number;
  isWinner?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const sanitized = sanitizeAIContent(content);

  // Auto-scroll when live
  useEffect(() => {
    if (scrollRef.current && isLive) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content, isLive]);

  // Timer logic
  useEffect(() => {
    if (!startedAt) return;
    if (isLive) {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
      const interval = setInterval(() => {
        setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      const end = updatedAt || Date.now();
      setElapsed(Math.max(0, Math.floor((end - startedAt) / 1000)));
    }
  }, [isLive, startedAt, updatedAt]);

  return (
    <div
      onClick={onClick}
      style={{ contain: 'strict' }}
      className={`
        relative p-3 rounded-lg border cursor-pointer transition-all duration-200 flex flex-col h-[180px]
        ${isWinner
          ? 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
          : isLive
            ? 'bg-amber-50/60 border-amber-300 shadow-sm ring-1 ring-amber-300/40'
            : 'bg-white border-[#F0E8DE] hover:border-amber-400 hover:shadow-sm'
        }
      `}
    >
      {/* Score Bar */}
      {score !== undefined && score > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden rounded-t-lg">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            className={`h-full ${score >= 85 ? 'bg-emerald-500' :
              score >= 70 ? 'bg-amber-500' :
                'bg-stone-400'
              }`}
          />
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-amber-500 animate-pulse' : 'bg-stone-300'}`} />
          <span className="text-[10px] font-mono text-[#7A756F] truncate max-w-[100px]">
            {title}
          </span>
        </div>
        {isLive && (
          <span className="text-[8px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
            <Radio className="w-2 h-2 animate-pulse" /> Live
          </span>
        )}
      </div>

      {/* Content — TRUNCATED preview only */}
      <div
        ref={scrollRef}
        className="text-[10px] text-[#4A453F] leading-relaxed font-mono overflow-y-auto flex-grow relative"
      >
        {!sanitized ? (
          <span className="text-stone-400 italic text-[9px]">Evaluating...</span>
        ) : (
          <pre className="whitespace-pre-wrap break-words font-mono text-[10px] text-[#4A453F] leading-relaxed">
            {highlightKeywords(sanitized)}
            {isLive && (
              <span className="inline-block w-1 h-3 bg-[#B8860B] animate-pulse ml-0.5 align-middle" />
            )}
          </pre>
        )}
        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </div>

      {/* Footer */}
      <div className="mt-1.5 pt-1.5 border-t border-stone-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {elapsed > 0 && (
            <span className="text-[9px] text-stone-500 font-mono flex items-center gap-1">
              ⏱ {elapsed}s
            </span>
          )}
          <span className="text-[8px] text-stone-400 font-mono">
            {content.length > 0 ? `${(content.length / 1000).toFixed(1)}k` : '0'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isWinner && (
            <span className="text-[9px] font-black text-emerald-700 flex items-center gap-0.5">
              🏆 MATCH
            </span>
          )}
          <span className="text-[8px] font-bold text-[#B8860B]">
            View →
          </span>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  // INDUSTRY PATTERN: Custom memo comparator (Figma/VS Code pattern)
  // Only re-render when THIS card's props actually changed
  return (
    prev.content === next.content &&
    prev.isLive === next.isLive &&
    prev.title === next.title
  );
});

// PERF CONSTANT: Only show last N chars in card preview to keep DOM lightweight
const CARD_PREVIEW_CHARS = 300;

// ROW HEIGHT: card height (180px) + gap (12px)
const VIRTUAL_ROW_HEIGHT = 192;

// ═══════════════════════════════════════════════════════════════════════════════
// INDUSTRY PATTERN: Virtualized Grid (Discord/Slack/Linear pattern)
// Only renders rows visible in viewport. 50 cards → ~4 visible rows = 16 DOM nodes.
// Uses @tanstack/react-virtual for row virtualization with responsive columns.
// ═══════════════════════════════════════════════════════════════════════════════
const ReasoningGrid = memo(function ReasoningGrid({
  candidates,
  liveCandidate,
  onFocus,
  isStageCompleted,
  isStageActive,
  candidateScores,
  stage,
}: {
  candidates: Record<string, AIThinking>;
  liveCandidate: string | null;
  onFocus: (time: string) => void;
  isStageCompleted?: boolean;
  isStageActive?: boolean;
  candidateScores?: CandidateScore[];
  stage?: number;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = useMemo(() => {
    let result = Object.entries(candidates);
    if (!searchQuery) return result;

    const query = searchQuery.toLowerCase();
    return result.filter(([time, data]) =>
      time.toLowerCase().includes(query) ||
      data.candidateTime?.toLowerCase().includes(query) ||
      data.fullText.toLowerCase().includes(query)
    );
  }, [candidates, searchQuery]);

  const scoreMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!candidateScores) return map;
    candidateScores.forEach(s => {
      const existing = map.get(s.time);
      if (existing === undefined || s.score > existing) {
        map.set(s.time, s.score);
      }
    });
    return map;
  }, [candidateScores]);

  const maxScore = useMemo(() => {
    if (scoreMap.size === 0) return 0;
    return Math.max(...Array.from(scoreMap.values()));
  }, [scoreMap]);

  // Responsive column count via container width
  const [columns, setColumns] = useState(4);
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const observer = new ResizeObserver((resizeEntries) => {
      const width = resizeEntries[0]?.contentRect.width || 0;
      if (width >= 1024) setColumns(4);
      else if (width >= 768) setColumns(3);
      else setColumns(2);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const rowCount = Math.ceil(filteredEntries.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => VIRTUAL_ROW_HEIGHT,
    overscan: 2, // Render 2 extra rows above/below for smooth scrolling
  });

  if (filteredEntries.length === 0 && !searchQuery) return null;

  return (
    <div
      ref={parentRef}
      className="p-3 max-h-[600px] overflow-y-auto style-scroll bg-[#FAF8F5]/30"
    >
      {/* 🔱 Search Interface */}
      <div className="sticky top-0 z-10 mb-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search candidates, times, or reasoning..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white/90 backdrop-blur-sm border border-[#F0E8DE] rounded-xl focus:ring-2 focus:ring-[#B8860B]/20 outline-none transition-all pr-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
            >
              ×
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-1 text-[9px] text-stone-500 font-bold uppercase tracking-wider px-1">
            Found {filteredEntries.length} results
          </div>
        )}
      </div>

      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIdx = virtualRow.index * columns;
          const rowEntries = filteredEntries.slice(startIdx, startIdx + columns);
          const now = Date.now();
          const ACTIVE_THRESHOLD_MS = 3000; // 🔱 Consider "Live" if updated in last 3s

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={`grid gap-3 ${columns === 4 ? 'grid-cols-4' :
                columns === 3 ? 'grid-cols-3' : 'grid-cols-2'
                }`}
            >
              {rowEntries.map(([time, data], idx) => {
                // 🔱 Multi-Stream logic: a card is live if it was recently updated
                // OR if it's explicitly identified as the liveCandidate from the store dispatch
                const isRecentlyUpdated = data.updatedAt && (now - data.updatedAt < ACTIVE_THRESHOLD_MS);
                const isPulseActive = !isStageCompleted && !!isStageActive && (liveCandidate === time || isRecentlyUpdated);

                const score = scoreMap.get(time);
                const isWinner = isStageCompleted && score !== undefined && score === maxScore && score >= 85;

                return (
                  <ReasoningCard
                    key={`s${stage ?? 0}_${time}`}
                    title={data.candidateTime || time}
                    content={data.fullText.length > CARD_PREVIEW_CHARS
                      ? data.fullText.slice(-CARD_PREVIEW_CHARS)
                      : data.fullText}
                    isLive={isPulseActive}
                    batchIndex={startIdx + idx}
                    onClick={() => onFocus(time)}
                    startedAt={data.startedAt}
                    updatedAt={data.updatedAt}
                    score={score}
                    isWinner={isWinner}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
});

const CandidateTabsSection = memo(function CandidateTabsSection({
  groupedCandidates,
  selectedCandidate,
  liveCandidate,
  onSelect,
  stage,
}: {
  groupedCandidates: GroupedCandidates;
  selectedCandidate: string | null;
  liveCandidate: string | null;
  onSelect: (time: string) => void;
  stage?: number;
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
                    key={`s${stage}_${time}`}
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
      <pre className="whitespace-pre-wrap break-words font-mono text-sm text-[#4A453F] leading-7">
        {highlightKeywords(sanitizedContent.length > 50000 ? sanitizedContent.slice(-50000) : sanitizedContent)}
        {isActive && (
          <span className="inline-block w-1.5 h-4 bg-[#B8860B] animate-pulse ml-0.5 align-middle" />
        )}
      </pre>
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
  title = 'Intelligence Grid',
  isCompleted = false,
  offsetMinutes = 60,
}: UnifiedAIPanelProps) {
  const panelId = useId();
  const [localSelectedCandidate, setLocalSelectedCandidate] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(isCompleted);

  // Auto-collapse when completed
  useEffect(() => {
    if (isCompleted && !isActive) {
      setIsCollapsed(true);
    } else if (isActive) {
      setIsCollapsed(false);
    }
  }, [isCompleted, isActive]);

  // Sync focus if displayedCandidate changes externally AND belongs to this stage
  // ⚡ PERF: Use a ref to track the last auto-focused candidate so we don't
  // trigger redundant setState calls every time displayedCandidate updates
  // (which happens every 150ms from the throttled buffer).
  const lastAutoFocusedRef = useRef<string | null>(null);
  useEffect(() => {
    // Don't auto-focus if stage is completed
    if (isCompleted) return;
    if (!displayedCandidate) return;
    // DON'T override user's selection when they're in focus view
    if (isFocused) return;
    // Skip if we already auto-focused this same candidate
    if (lastAutoFocusedRef.current === displayedCandidate) return;

    if (allCandidates && displayedCandidate in allCandidates) {
      lastAutoFocusedRef.current = displayedCandidate;
      setLocalSelectedCandidate(displayedCandidate);
    } else if (thinking?.candidateTime === displayedCandidate) {
      lastAutoFocusedRef.current = displayedCandidate;
      setLocalSelectedCandidate(displayedCandidate);
    }
  }, [displayedCandidate, allCandidates, thinking, isCompleted, isFocused]);

  const currentStage = thinking?.stage || stage || 2;
  const effectiveSelectedCandidate = localSelectedCandidate;

  const groupedCandidates = useMemo(
    () => groupCandidatesByScore(allCandidates, candidateScores),
    [allCandidates, candidateScores]
  );

  const candidatesList = useMemo(
    () => Object.keys(allCandidates || {}),
    [allCandidates]
  );

  const handleCandidateSelect = useCallback((time: string) => {
    setLocalSelectedCandidate(time);
    setIsFocused(true);
    if (onSelectCandidate) onSelectCandidate(time);
  }, [onSelectCandidate]);

  const displayedContent = useMemo(() => {
    // Helper to safely slice massive strings before expensive DOM/Regex operations
    const getSafeText = (text: string | undefined | null) => {
      if (!text) return '';
      return text.length > 100000 ? text.slice(-100000) : text;
    };

    // 1. If user has manually selected a candidate, show THAT reasoning
    if (allCandidates && effectiveSelectedCandidate) {
      const candidateData = allCandidates[effectiveSelectedCandidate];
      return candidateData?.fullText ? sanitizeAIContent(getSafeText(candidateData.fullText)) : '';
    }

    // 2. Otherwise, show the CUMULATIVE stage history (concatenated chunks)
    // This provides a stable "Stage Narrative" even with multiple parallel batch streams
    const stageNum = stage || currentStage;
    if (stageHistory && stageHistory[stageNum]) {
      return sanitizeAIContent(getSafeText(stageHistory[stageNum]));
    }

    // 3. Fallback to the latest live 'thinking' object
    return thinking ? sanitizeAIContent(getSafeText(thinking.fullText)) : '';
  }, [allCandidates, effectiveSelectedCandidate, thinking, stageHistory, stage, currentStage]);

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
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: isActive
          ? '0 0 30px rgba(184, 134, 11, 0.15)'
          : '0 0 20px rgba(184, 134, 11, 0.08)'
      }}
      className={`bg-white rounded-2xl border transition-all duration-500 overflow-hidden ${isActive ? 'border-[#78611D]' : 'border-[#78611D]/40 shadow-sm'
        }`}
      role="region"
      aria-labelledby={`${panelId}-title`}
    >
      {/* Header */}
      <div className={`px-5 py-4 border-b flex items-center justify-between transition-colors
        ${isCompleted
          ? 'bg-[#FAF8F5] border-[#E8E2D9]'
          : 'bg-gradient-to-r from-[#FAF8F5] to-white border-[#F0E8DE]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isCompleted ? 'bg-stone-100' : 'bg-[#B8860B]/10'}`}>
            <Brain className={`w-5 h-5 ${isCompleted ? 'text-stone-400' : 'text-[#B8860B]'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 id={`${panelId}-title`} className={`text-base font-bold truncate ${isCompleted ? 'text-[#4A453F]' : 'text-[#1A1612]'}`}>
                {title || `Stage ${stage} Analysis`}
              </h3>
              {(() => {
                // 🔱 God-Tier Telescopic Varga Funnel UI Badge
                const stageNum = currentStage;
                let phaseLabel = '';
                if (stageNum <= 2) {
                  phaseLabel = offsetMinutes > 120 ? 'Phase A: Macro Sweep' : (offsetMinutes > 15 ? 'Phase B: Meso Sweep' : 'Phase C: Micro Sweep');
                } else if (stageNum === 4) {
                  phaseLabel = 'Phase B: Meso Sweep';
                } else if (stageNum >= 5) {
                  phaseLabel = 'Phase C: Micro Sweep';
                }

                if (!phaseLabel) return null;
                return (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${isCompleted ? 'bg-stone-200 text-stone-500' : 'bg-[#B8860B]/20 text-[#B8860B]'
                    }`}>
                    🪐 {phaseLabel}
                  </span>
                );
              })()}
            </div>

            {/* Batch Progress Bar - 🔱 Lean UX Feature 4 */}
            {!isCompleted && isActive && candidatesList.length > 0 && (
              <div className="mt-1.5 max-w-[200px]">
                <div className="flex items-center justify-between text-[8px] font-bold text-[#7A756F] mb-0.5 uppercase tracking-tighter">
                  <span>Batch Progress</span>
                  <span>{candidatesList.length} Processed</span>
                </div>
                <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (candidatesList.length / 100) * 100)}%` }}
                    className="h-full bg-gradient-to-r from-[#78611D] to-[#B8860B]"
                  />
                </div>
              </div>
            )}

            <p className="text-[10px] text-[#7A756F] mt-0.5 truncate">
              {isCompleted ? 'Stage processing completed' : (isActive ? `Processing ${candidatesList.length} candidates` : 'Multi-stream history')}
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
              className="flex items-center gap-1.5 px-2 py-1 bg-[#184131]/10 rounded-full"
            >
              <Activity className="w-3 h-3 text-[#184131]" />
              <span className="text-[10px] font-bold text-[#184131]">LIVE</span>
            </motion.div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-stone-200/50 text-stone-400 transition-colors"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
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
                  {!isCompleted && thinking?.candidateTime === 'general' && (
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
                    candidates={allCandidates || {}}
                    liveCandidate={thinking?.candidateTime || null}
                    onFocus={handleCandidateSelect}
                    isStageCompleted={isCompleted}
                    isStageActive={isActive}
                    candidateScores={candidateScores}
                    stage={stage}
                  />

                  {candidatesList.length === 0 && (
                    <ReasoningContent content="" isActive={isActive && !isCompleted} />
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

                  <ReasoningContent
                    content={displayedContent}
                    isActive={(() => {
                      if (!isActive || isCompleted) return false;
                      if (thinking?.candidateTime === effectiveSelectedCandidate) return true;

                      // 🔱 Multi-Stream logic: also active if recently updated in store
                      const data = effectiveSelectedCandidate ? allCandidates?.[effectiveSelectedCandidate] : null;
                      if (data?.updatedAt && (Date.now() - data.updatedAt < 3000)) return true;

                      return false;
                    })()}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default UnifiedAIPanel;
