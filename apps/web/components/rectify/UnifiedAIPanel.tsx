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
import { Brain, Radio, Activity, Users, ChevronDown, ChevronUp, ChevronRight, Loader2, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useVirtualizer } from '@tanstack/react-virtual';
import { sanitizeAIContent } from '@/lib/xss-sanitizer';
import { highlightKeywords } from '@/lib/keyword-highlighter';

// ═══════════════════════════════════════════════════════════════════════════════
// INDUSTRY PATTERN: Stable component references (React best practice)
// Defining these outside the render function prevents React from creating
// new component objects on every re-render, reducing GC pressure.
// ═══════════════════════════════════════════════════════════════════════════════
const MARKDOWN_COMPONENTS_CARD = {
  p: ({ children }: any) => <span className="mb-2 block">{children}</span>,
  li: ({ children }: any) => <li className="ml-3 list-disc marker:text-[#B8860B]">{children}</li>,
  strong: ({ children }: any) => <strong className="font-bold text-[#1A1612]">{children}</strong>,
  code: ({ children }: any) => <code className="bg-[#F5EFE7] px-1 py-0.5 rounded text-[10px]">{children}</code>,
};

const MARKDOWN_COMPONENTS_FOCUS = {
  p: ({ children }: any) => <p className="mb-4 last:mb-0 text-sm leading-7">{children}</p>,
  li: ({ children }: any) => <li className="ml-5 list-disc marker:text-[#B8860B] mb-2 text-sm leading-7">{children}</li>,
  strong: ({ children }: any) => <strong className="font-bold text-[#1A1612]">{children}</strong>,
  code: ({ children }: any) => <code className="bg-[#F5EFE7] px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
  h1: ({ children }: any) => <h1 className="text-lg font-bold text-[#1A1612] mb-4 mt-6 first:mt-0">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-base font-bold text-[#1A1612] mb-3 mt-5">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-sm font-bold text-[#1A1612] mb-2 mt-4">{children}</h3>,
};

const REMARK_PLUGINS = [remarkGfm];

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
  updatedAt?: number; // 🔱 NEW: Stable sorting & live tracking
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
  title?: string;      // 🔱 NEW: Stage title for header
  isCompleted?: boolean; // 🔱 NEW: If this specific stage is done
  offsetMinutes?: number; // 🔱 NEW: God-Tier architecture time offset
  hideLiveReasoning?: boolean; // 🔱 NEW: Hide streaming for Stage 4 & 6
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

/**
 * Normalize time string for robust matching.
 * Handles: "10:30" vs "10:30:00", leading zeros, trailing spaces
 */
function normalizeTime(time: string): string {
  const trimmed = time.trim();
  // Split into parts and normalize to HH:MM:SS
  const parts = trimmed.split(':');
  if (parts.length === 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
  if (parts.length === 3) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
  return trimmed;
}

function groupCandidatesByScore(
  candidates: Record<string, AIThinking> | undefined,
  scores: CandidateScore[] | undefined
): GroupedCandidates {
  const result: GroupedCandidates = { top: [], promising: [], exploring: [] };

  if (!candidates || Object.keys(candidates).length === 0) return result;

  // Build score map with NORMALIZED time keys for robust matching
  const scoreMap = new Map<string, number>();
  if (scores) {
    scores.forEach(s => {
      const normalizedTime = normalizeTime(s.time);
      const existing = scoreMap.get(normalizedTime);
      if (existing === undefined || s.score > existing) {
        scoreMap.set(normalizedTime, s.score);
      }
      // Also store with original key for exact-match fallback
      const existingRaw = scoreMap.get(s.time);
      if (existingRaw === undefined || s.score > existingRaw) {
        scoreMap.set(s.time, s.score);
      }
    });
  }

  Object.entries(candidates).forEach(([time, _]) => {
    // Try normalized match first, then exact match
    const score = scoreMap.get(normalizeTime(time)) ?? scoreMap.get(time) ?? 0;
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
  score = 0,
  startedAt,
  updatedAt,
  isWinner = false,
  ephemeris,
}: {
  title: string;
  content: string;
  isLive: boolean;
  onClick: () => void;
  batchIndex: number;
  score?: number;
  startedAt?: number;
  updatedAt?: number;
  isWinner?: boolean;
  ephemeris?: PlanetaryInfo;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);

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

  // 🔱 Strip raw think tags for cleaner card preview
  const displayContent = useMemo(() => {
    return content.replace(/<\/?think>/gi, '').trim();
  }, [content]);

  let scoreColor = 'bg-stone-200';
  let scoreFillColor = 'bg-stone-400';
  if (score >= 85) { scoreColor = 'bg-emerald-100'; scoreFillColor = 'bg-emerald-500'; }
  else if (score >= 70) { scoreColor = 'bg-amber-100'; scoreFillColor = 'bg-amber-500'; }

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-lg border cursor-pointer transition-all duration-300 flex flex-col h-[240px]
        ${isWinner
          ? 'bg-[#FFFAF0] border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] ring-1 ring-amber-400'
          : isLive
            ? 'bg-amber-50/40 border-amber-300 shadow-sm ring-1 ring-amber-300/30'
            : 'bg-white border-[#F0E8DE] hover:border-amber-400 hover:shadow-md'
        }
      `}
    >
      {/* 🔱 Score Bar (Phase 1 Lean Feature) */}
      {score > 0 && (
        <div className={`h-1 w-full ${scoreColor} rounded-t-lg overflow-hidden shrink-0`}>
          <div className={`h-full ${scoreFillColor} transition-all duration-1000 ease-out`} style={{ width: `${Math.min(score, 100)}%` }} />
        </div>
      )}

      <div className="p-3 flex flex-col flex-grow overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-amber-500 animate-pulse' : isWinner ? 'bg-amber-600' : 'bg-stone-300'}`} />
            <span className="text-[12px] font-bold text-[#1A1612] truncate max-w-[120px]">
              {title}
            </span>
          </div>
          {isLive ? (
            <span className="text-[8px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
              <Radio className="w-2 h-2 animate-pulse" /> LIVE
            </span>
          ) : score > 0 ? (
            <span className={`text-[10px] font-bold ${score >= 85 ? 'text-emerald-700' : score >= 70 ? 'text-amber-700' : 'text-stone-500'}`}>
              {score.toFixed(0)}
            </span>
          ) : null}
        </div>

        {/* Content — TRUNCATED preview only */}
        <div
          ref={scrollRef}
          className="text-[11px] text-[#4A453F] leading-relaxed font-sans overflow-y-auto flex-grow relative style-scroll-mini"
        >
          {!content ? (
            <span className="text-stone-400 italic text-[10px]">Analyzing...</span>
          ) : (
            <div className="whitespace-pre-wrap break-words">
              {/* 🔱 Keyword Highlighting */}
              {highlightKeywords(displayContent)}
              {isLive && (
                <span className="inline-block w-1.5 h-3 bg-[#B8860B] animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          )}
        </div>

        {/* Gradient fade at bottom */}
        <div className="absolute bottom-[32px] left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />

        {/* Footer */}
        <div className="mt-1.5 pt-1.5 border-t border-stone-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {elapsed > 0 && (
              <span className="text-[9px] text-stone-500 font-mono flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> {elapsed}s
              </span>
            )}
            {ephemeris && (
              <span className="text-[9px] text-[#A8A39D] font-mono">
                ☀{ephemeris.sun?.substring(0, 3)} 🌙{ephemeris.moon?.substring(0, 3)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isWinner && <span className="text-[10px] font-bold text-amber-600">🏆 MATCH</span>}
            <span className="text-[9px] font-bold text-[#B8860B]">
              View →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.content === next.content &&
    prev.isLive === next.isLive &&
    prev.title === next.title &&
    prev.score === next.score &&
    prev.isWinner === next.isWinner
  );
});

// PERF CONSTANT: Only show last N chars in card preview to keep DOM lightweight
const CARD_PREVIEW_CHARS = 300;

// ROW HEIGHT: card height (240px) + gap (12px)
const VIRTUAL_ROW_HEIGHT = 252;

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
}: {
  candidates: Record<string, AIThinking>;
  liveCandidate: string | null;
  onFocus: (time: string) => void;
  isStageCompleted?: boolean;
  isStageActive?: boolean;
  candidateScores?: CandidateScore[];
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  // 🔱 SCORE-SORTED ENTRIES
  // Sort by score descending so winners float to the top
  const entries = useMemo(() => {
    return Object.entries(candidates).sort((a, b) => {
      const scoreA = candidateScores?.find(s => s.time === a[0])?.score || 0;
      const scoreB = candidateScores?.find(s => s.time === b[0])?.score || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      // Stable fallback sorting
      return a[0].localeCompare(b[0]);
    });
  }, [candidates, candidateScores]);

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

  const rowCount = Math.ceil(entries.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => VIRTUAL_ROW_HEIGHT,
    overscan: 2, // Render 2 extra rows above/below for smooth scrolling
  });

  if (entries.length === 0) return null;

  return (
    <div
      ref={parentRef}
      className="p-3 max-h-[600px] overflow-y-auto style-scroll bg-[#FAF8F5]/30"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIdx = virtualRow.index * columns;
          const rowEntries = entries.slice(startIdx, startIdx + columns);
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

                const scoreObj = candidateScores?.find(s => s.time === time);
                const score = scoreObj?.score || 0;

                // 🔱 Winner Glow: True if completed, score > 0, and this is the highest score
                const isWinner = isStageCompleted && score > 0 && Math.max(...(candidateScores?.map(s => s.score) || [0])) === score;

                return (
                  <ReasoningCard
                    key={time}
                    title={data.candidateTime || time}
                    content={data.fullText.length > CARD_PREVIEW_CHARS
                      ? data.fullText.slice(-CARD_PREVIEW_CHARS)
                      : data.fullText}
                    isLive={isPulseActive}
                    batchIndex={startIdx + idx}
                    onClick={() => onFocus(time)}
                    score={score}
                    startedAt={data.startedAt}
                    updatedAt={data.updatedAt}
                    isWinner={isWinner}
                    ephemeris={scoreObj?.minifiedEph}
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

  // 🔱 Strip raw think tags for consistent rendering
  const displayContent = content.replace(/<\/?think>/gi, '').trim();
  const sanitizedContent = sanitizeAIContent(displayContent);

  return (
    <div
      ref={scrollRef}
      className="p-6 overflow-y-auto max-h-[500px] font-sans text-sm text-[#4A453F] leading-relaxed style-scroll bg-white"
    >
      {isActive ? (
        <pre className="whitespace-pre-wrap break-words font-sans text-[14px] text-[#1A1612] leading-7">
          {sanitizedContent}
          <span className="inline-block w-1.5 h-4 bg-[#B8860B] animate-pulse ml-0.5 align-middle" />
        </pre>
      ) : (
        <div className="prose prose-stone max-w-none">
          <ReactMarkdown
            remarkPlugins={REMARK_PLUGINS}
            components={MARKDOWN_COMPONENTS_FOCUS}
          >
            {sanitizedContent}
          </ReactMarkdown>
        </div>
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
  title = 'Intelligence Grid',
  isCompleted = false,
  offsetMinutes = 60,
  hideLiveReasoning = false,
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
  // ⚡ PERF: Use a ref to track the last auto-focused candidate
  const lastAutoFocusedRef = useRef<string | null>(null);
  useEffect(() => {
    // Don't auto-focus if stage is completed
    if (isCompleted) return;
    if (!displayedCandidate) return;
    // DON'T override user's selection when they're in focus view
    if (isFocused) return;
    // Skip if we already auto-focused this same candidate
    if (lastAutoFocusedRef.current === displayedCandidate) return;

    // 🔱 Stage-Aware Focus Check
    // displayedCandidate is now stage-qualified (e.g., 's2_10:30:00')
    const currentStagePrefix = `s${stage}_`;
    if (displayedCandidate.startsWith(currentStagePrefix)) {
      const candidateTime = displayedCandidate.replace(currentStagePrefix, '');
      if (allCandidates && candidateTime in allCandidates) {
        lastAutoFocusedRef.current = displayedCandidate;
        setLocalSelectedCandidate(candidateTime);
      } else if (thinking?.candidateTime === candidateTime) {
        lastAutoFocusedRef.current = displayedCandidate;
        setLocalSelectedCandidate(candidateTime);
      }
    }
  }, [displayedCandidate, allCandidates, thinking, isCompleted, isFocused, stage]);

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
    // 1. If user has manually selected a candidate, show THAT reasoning
    if (allCandidates && effectiveSelectedCandidate) {
      const candidateData = allCandidates[effectiveSelectedCandidate];
      return candidateData?.fullText ? sanitizeAIContent(candidateData.fullText) : '';
    }

    // 2. Otherwise, show the CUMULATIVE stage history (concatenated chunks)
    // This provides a stable "Stage Narrative" even with multiple parallel batch streams
    const stageNum = stage || currentStage;
    if (stageHistory && stageHistory[stageNum]) {
      return sanitizeAIContent(stageHistory[stageNum]);
    }

    // 3. Fallback to the latest live 'thinking' object
    return thinking ? sanitizeAIContent(thinking.fullText) : '';
  }, [allCandidates, effectiveSelectedCandidate, thinking, stageHistory, stage, currentStage]);

  // 🔱 Batch Progress Bar logic
  const completedCount = candidateScores?.length || 0;
  const analysisCount = candidatesList.length || 0;
  // Let minimum expected candidates be analysisCount to prevent 0 division. Max is expected or analysisCount
  const expectedTotal = analysisCount > 0 ? analysisCount : 1;
  const progressPercent = Math.min(100, Math.round((completedCount / expectedTotal) * 100));

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
      className={`bg-white rounded-2xl border transition-all duration-500 overflow-hidden ${isActive ? 'border-[#D4A853]' : 'border-[#D4A853]/40 shadow-sm'
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
          <div>
            <div className="flex items-center gap-2">
              <h3 id={`${panelId}-title`} className={`text-base font-bold ${isCompleted ? 'text-[#4A453F]' : 'text-[#1A1612]'}`}>
                {title}
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
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${isCompleted ? 'bg-stone-200 text-stone-500' : 'bg-[#B8860B]/20 text-[#B8860B]'
                    }`}>
                    🪐 {phaseLabel}
                  </span>
                );
              })()}
            </div>
            <p className="text-[10px] text-[#7A756F]">
              {isCompleted ? 'Stage processing completed' : (isActive ? 'Simultaneous processing' : 'Multi-stream history')}
            </p>
          </div>
        </div>

        {/* 🔱 Batch Progress Bar (Header) */}
        {!isCompleted && isActive && analysisCount > 0 && (
          <div className="flex-grow max-w-[240px] px-6 hidden md:block">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[9px] font-bold text-[#7A756F] uppercase tracking-wider">Analysis Progress</span>
              <span className="text-[9px] font-bold text-[#B8860B]">{completedCount}/{analysisCount} ({progressPercent}%)</span>
            </div>
            <div className="h-1.5 bg-[#E8E2D9] rounded-full overflow-hidden w-full">
              <div
                className="h-full bg-gradient-to-r from-[#D4A853] to-[#B8860B] transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

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
                  {hideLiveReasoning && isActive && !isCompleted ? (
                    <div className="flex flex-col">
                      <div className="flex flex-col items-center justify-center h-[180px] text-center p-6 bg-[#FAF8F5]/30 border-b border-[#F0E8DE]/50">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="w-10 h-10 rounded-full border-2 border-amber-500/20 border-t-amber-500 flex items-center justify-center mb-3"
                        />
                        <p className="text-xs font-bold text-amber-700 uppercase tracking-widest animate-pulse">
                          Analyzing Temporal Patterns...
                        </p>
                        <p className="text-[10px] text-stone-500 mt-2 max-w-[250px]">
                          Processing high-fidelity synthesis chunks...
                        </p>
                      </div>
                      <ReasoningContent content={displayedContent} isActive={isActive && !isCompleted} />
                    </div>
                  ) : (
                    <>
                      <ReasoningGrid
                        candidates={allCandidates || {}}
                        liveCandidate={thinking?.candidateTime || null}
                        onFocus={handleCandidateSelect}
                        isStageCompleted={isCompleted}
                        isStageActive={isActive}
                        candidateScores={candidateScores}
                      />

                      {/* Always show the narrative/overview at the bottom of the grid or as the primary content if no candidates */}
                      {displayedContent && (
                        <div className={candidatesList.length > 0 ? "mt-4 pt-4 border-t border-[#F0E8DE]" : ""}>
                          {candidatesList.length > 0 && (
                            <div className="px-5 mb-2">
                              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Stage Narrative</span>
                            </div>
                          )}
                          <ReasoningContent content={displayedContent} isActive={isActive && !isCompleted} />
                        </div>
                      )}
                    </>
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
