import React, { memo, useRef, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useResponsiveColumns } from '../hooks/useResponsiveColumns';
import { VIRTUAL_ROW_HEIGHT, CARD_PREVIEW_CHARS } from '../constants';
import { AIThinking, CandidateScore } from '../types';
import { ReasoningCard } from './ReasoningCard';

export const ReasoningGrid = memo(function ReasoningGrid({
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
        console.log(`[ReasoningGrid] Stage ${stage} Filter triggered. Total candidates: ${result.length}`, { keys: Object.keys(candidates) });
        if (!searchQuery) return result;

        const query = searchQuery.toLowerCase();
        return result.filter(([time, data]) =>
            time.toLowerCase().includes(query) ||
            data.candidateTime?.toLowerCase().includes(query) ||
            data.fullText.toLowerCase().includes(query)
        );
    }, [candidates, searchQuery, stage]);

    const scoreMap = useMemo(() => {
        const map = new Map<string, number>();
        if (!candidateScores) return map;
        candidateScores.forEach(s => {
            if (s.stage !== stage) return;
            const existing = map.get(s.time);
            if (existing === undefined || s.score > existing) {
                map.set(s.time, s.score);
            }
        });
        return map;
    }, [candidateScores, stage]);

    const maxScore = useMemo(() => {
        if (scoreMap.size === 0) return 0;
        return Math.max(...Array.from(scoreMap.values()));
    }, [scoreMap]);

    const columns = useResponsiveColumns(parentRef, 4);
    const rowCount = Math.ceil(filteredEntries.length / columns);

    const virtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => VIRTUAL_ROW_HEIGHT,
        overscan: 2,
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
                    const ACTIVE_THRESHOLD_MS = 3000;

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
