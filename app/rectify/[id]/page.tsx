'use client';

// app/rectify/[id]/page.tsx
// Live analysis page — shows real-time progress, AI thinking, and candidate scores.
// On completion, redirects to the results page.

import React, { useEffect, useState, useRef, useCallback, useMemo, memo, useId } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import {
    Brain, Clock, Activity, Home, LayoutDashboard, AlertCircle, Gem,
    CheckCircle, RefreshCw,
} from 'lucide-react';
import { useStreamProgress, type CandidateScore, type StreamStep, type StageStat, type AIThinking } from '@/lib/use-stream-progress';
import { logger } from '@/lib/secure-logger';
import { AnalysisPipelineTracker } from '@/components/rectify/AnalysisPipelineTracker';
import { AnalysisErrorBoundary, SectionErrorBoundary } from '@/components/rectify/AnalysisErrorBoundary';
import AdvancedSignalsDashboard from '@/components/rectify/advanced-signals/AdvancedSignalsDashboard';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function RobustAnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const { getToken } = useAuth();
    const sessionId = params.id as string;
    const pageTitleId = useId();

    // Direct SSE to backend — no backendUrl override, uses NEXT_PUBLIC_BACKEND_URL default
    const streamData = useStreamProgress(sessionId, undefined, getToken);

    const {
        isConnected, isComplete, error: streamError, progress, aiThinking,
        candidateScores, stageStats, advancedSignals, result, startedAt, allSteps, metadata,
        connectionState,
    } = streamData;

    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelled, setCancelled] = useState(false);

    useEffect(() => {
        if (metadata?.status === 'cancelled') {
            setCancelled(true);
        } else if (metadata?.status && ['pending', 'queued', 'processing'].includes(metadata.status)) {
            setCancelled(false);
        }
    }, [metadata?.status]);

    // Redirect to results page when analysis completes
    useEffect(() => {
        if (isComplete && result) {
            // Store result in localStorage for the results page to hydrate instantly
            try {
                localStorage.setItem(`rectification_result_${sessionId}`, JSON.stringify({
                    rectifiedTime: result.rectifiedTime,
                    accuracy: result.accuracy,
                    confidence: result.confidence,
                }));
            } catch { /* localStorage may be unavailable */ }

            // Brief delay so user sees the completion state before navigating
            const timer = setTimeout(() => {
                router.push(`/rectify/${sessionId}/results`);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [isComplete, result, sessionId, router]);

    const handleCancel = useCallback(async () => {
        if (isCancelling || cancelled) return;
        setIsCancelling(true);
        try {
            const token = await getToken();
            const res = await fetch('/api/queue/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ sessionId }),
            });
            if (res.ok) {
                setCancelled(true);
                logger.info('Analysis cancelled', { sessionId });
            }
        } catch (err) {
            logger.error('Cancel failed', err);
        } finally {
            setIsCancelling(false);
        }
    }, [sessionId, getToken]);

    const handleRestart = useCallback(async () => {
        setIsCancelling(true); // Using isCancelling as a generic loading state for actions
        try {
            const token = await getToken();
            const res = await fetch('/api/queue/requeue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ sessionId }),
            });
            if (res.ok) {
                setCancelled(false); // Clear stale UI state
                // Refresh the page or just let SSE reconnect to the now-pending session
                window.location.reload();
            } else {
                const data = await res.json();
                logger.error('Restart failed', data.error);
                alert(`Failed to restart: ${data.error}`);
            }
        } catch (err) {
            logger.error('Restart error', err);
        } finally {
            setIsCancelling(false);
        }
    }, [sessionId, getToken]);

    const progressPercentage = useMemo(() =>
        progress?.percentage || (allSteps?.length ? ((progress?.stepIndex || 0) / allSteps.length) * 100 : 0),
        [progress?.percentage, progress?.stepIndex, allSteps?.length]
    );

    const hasError = streamError || connectionState.status === 'error';
    const errorMessage = streamError || connectionState.lastError || 'Unknown error';

    // Derive human-readable connection label
    const connectionLabel = useMemo(() => {
        switch (connectionState.status) {
            case 'streaming': return 'Connected to analysis engine';
            case 'polling': return 'Monitoring analysis progress';
            case 'connecting': return 'Establishing connection...';
            case 'rate_limited': return 'Rate limited — retrying shortly';
            case 'finished': return 'Analysis complete';
            case 'error': return 'Connection lost';
            default: return 'Initializing...';
        }
    }, [connectionState.status]);

    const isLive = connectionState.status === 'streaming' || connectionState.status === 'polling';

    // Loading state (only while establishing initial connection)
    if (!isConnected && !hasError && !result && connectionState.status !== 'polling') {
        return <LoadingState />;
    }

    if (hasError && !result) {
        return <ErrorDisplay error={errorMessage} onRetry={() => window.location.reload()} />;
    }

    return (
        <AnalysisErrorBoundary sectionName="Analysis Page">
            <main className="min-h-screen bg-[#FFFCF8]" aria-labelledby={pageTitleId}>
                <header className="sticky top-0 z-40 border-b bg-white border-[#F0E8DE]" role="banner">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                        <Breadcrumbs items={[
                            { label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
                            { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
                            { label: 'Analysis', icon: <Activity className="w-4 h-4" /> },
                        ]} />
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h1 id={pageTitleId} className="text-lg sm:text-2xl font-bold text-[#1A1612]">
                                    Analysis for {metadata?.fullName || 'Birth Time Analysis'}
                                </h1>
                                <p className="text-xs sm:text-sm text-[#7A756F]">
                                    Session ID: <span className="font-mono tabular-nums text-[#B8860B]">{sessionId.slice(0, 8)}...</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <AnalysisTimer startedAt={startedAt || null} isComplete={isComplete} />
                                {!isComplete && !cancelled && (
                                    <button
                                        onClick={handleCancel}
                                        disabled={isCancelling}
                                        className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border transition-colors disabled:opacity-50 outline-none focus:ring-2 focus:ring-[#C65D3B]/30 text-[#C65D3B] border-[#C65D3B30] bg-[#C65D3B05]"
                                        aria-label="Cancel analysis"
                                    >
                                        {isCancelling ? 'Cancelling...' : 'Cancel'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    {/* Connection indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        role="status"
                        aria-live="polite"
                        className="flex items-center gap-2 mb-4 sm:mb-6"
                    >
                        <motion.span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: isLive ? '#2D7A5C' : '#C65D3B' }}
                            animate={{ scale: isLive ? [1, 1.3, 1] : 1 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            aria-hidden="true"
                        />
                        <span className="text-xs sm:text-sm text-[#7A756F]">{connectionLabel}</span>
                    </motion.div>

                    {/* Progress bar (visible only during active analysis) */}
                    {!isComplete && !cancelled && (
                        <ProgressBar
                            percentage={progressPercentage}
                            stepIndex={progress?.stepIndex || 0}
                            totalSteps={allSteps?.length || 5}
                            message={progress?.message}
                        />
                    )}

                    {/* Cancelled or Failed state */}
                    {(cancelled || metadata?.status === 'failed') && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            role="alert"
                            className="rounded-2xl border p-6 sm:p-8 text-center mb-6 sm:mb-8 bg-white border-[#E8A84930]"
                        >
                            <h2 className="text-lg sm:text-xl font-bold mb-2 text-[#1A1612]">
                                {metadata?.status === 'failed' ? 'Analysis Failed' : 'Analysis Cancelled'}
                            </h2>
                            <p className="mb-6 text-sm text-[#7A756F]">
                                {metadata?.status === 'failed'
                                    ? (metadata?.errorMessage || 'An error occurred during analysis.')
                                    : 'The analysis was cancelled by user request.'}
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={handleRestart}
                                    disabled={isCancelling}
                                    className="px-8 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-2"
                                    style={{ background: 'linear-gradient(90deg, #2D7A5C, #45A049)' }}
                                >
                                    {isCancelling ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                    Restart This Analysis
                                </button>

                                <Link
                                    href="/rectify?new=true"
                                    className="px-8 py-3 rounded-xl font-semibold text-[#1A1612] transition-all hover:bg-gray-100 border border-gray-200 outline-none focus:ring-2 focus:ring-offset-2"
                                >
                                    Start New Analysis
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {/* Completion banner (brief — redirects to results page shortly) */}
                    {isComplete && result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-2xl border-2 border-[#2D7A5C]/30 bg-[#2D7A5C]/5 p-6 sm:p-8 text-center mb-6 sm:mb-8"
                            role="status"
                        >
                            <CheckCircle className="w-12 h-12 text-[#2D7A5C] mx-auto mb-3" />
                            <h2 className="text-lg sm:text-xl font-bold text-[#1A1612] mb-1">Analysis Complete!</h2>
                            <p className="text-sm text-[#7A756F] mb-3">
                                Rectified Time: <span className="font-mono font-bold text-[#1A1612]">{result.rectifiedTime}</span>
                                {' · '}
                                Confidence: <span className="font-semibold text-[#2D7A5C]">{result.confidence}</span>
                            </p>
                            <p className="text-xs text-[#7A756F]">Redirecting to full results...</p>
                        </motion.div>
                    )}

                    {/* Pipeline tracker */}
                    {allSteps && allSteps.length > 0 && (
                        <SectionErrorBoundary sectionName="Pipeline Tracker" icon={<Activity className="w-5 h-5" />}>
                            <AnalysisPipelineTracker
                                stats={stageStats || []}
                                allSteps={allSteps}
                                currentStage={progress?.stepIndex || 0}
                                isConnected={isConnected}
                                isComplete={isComplete}
                            />
                        </SectionErrorBoundary>
                    )}

                    {/* AI Thinking panel */}
                    {(aiThinking || (progress?.stepIndex || 0) >= 1) && !isComplete && (
                        <SectionErrorBoundary sectionName="AI Thinking" icon={<Brain className="w-5 h-5" />}>
                            <AIThinkingPanel thinking={aiThinking} isActive={!isComplete && !cancelled} />
                        </SectionErrorBoundary>
                    )}

                    {/* Advanced signals */}
                    {(advancedSignals || (isComplete && result)) && (
                        <SectionErrorBoundary sectionName="Advanced Signals" icon={<Gem className="w-5 h-5" />}>
                            <AdvancedSignalsDashboard signals={advancedSignals} isComplete={isComplete} />
                        </SectionErrorBoundary>
                    )}

                    {/* Candidate scores (visible during and after analysis if any exist) */}
                    {(candidateScores.length > 0 || (progress?.stepIndex || 0) >= 2) && !isComplete && (
                        <SectionErrorBoundary sectionName="Candidate Scores" icon={<Activity className="w-5 h-5" />}>
                            <CandidateScoreTable scores={candidateScores} />
                        </SectionErrorBoundary>
                    )}
                </div>
            </main>
        </AnalysisErrorBoundary>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const LoadingState = memo(() => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFFCF8] text-center p-4">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
            <Gem className="w-16 h-16 text-[#B8860B]" />
        </motion.div>
        <h1 className="text-2xl font-bold mt-6 text-[#1A1612]">Initiating Analysis Engine</h1>
        <p className="text-lg text-[#7A756F] mt-2">Please wait while we establish a secure connection to the AI Pandit...</p>
    </div>
));
LoadingState.displayName = 'LoadingState';

const ErrorDisplay = memo(({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFFCF8] text-center p-4" role="alert">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h1 className="text-2xl font-bold mt-6 text-red-700">An Error Occurred</h1>
        <p className="text-lg text-red-600 mt-2 max-w-md">{error}</p>
        <button
            onClick={onRetry}
            className="mt-8 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 bg-gray-800 flex items-center gap-2"
        >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
        </button>
    </div>
));
ErrorDisplay.displayName = 'ErrorDisplay';

const Breadcrumbs = memo(({ items }: { items: { label: string; href?: string; icon?: React.ReactNode }[] }) => (
    <nav aria-label="Breadcrumb" className="mb-3">
        <ol className="flex items-center gap-2 text-xs sm:text-sm text-[#7A756F]">
            {items.map((item, index) => (
                <li key={item.label} className="flex items-center gap-2">
                    {item.href ? (
                        <Link href={item.href} className="flex items-center gap-1.5 hover:text-[#B8860B] transition-colors">
                            {item.icon}{item.label}
                        </Link>
                    ) : (
                        <span className="flex items-center gap-1.5 font-semibold text-[#1A1612]">{item.icon}{item.label}</span>
                    )}
                    {index < items.length - 1 && <span className="opacity-50">/</span>}
                </li>
            ))}
        </ol>
    </nav>
));
Breadcrumbs.displayName = 'Breadcrumbs';

const AnalysisTimer = memo(({ startedAt, isComplete }: { startedAt: string | null; isComplete: boolean }) => {
    const [duration, setDuration] = useState(0);
    const finalDurationRef = useRef<number | null>(null);

    useEffect(() => {
        if (!startedAt) return;
        const startMs = new Date(startedAt).getTime();

        if (isComplete) {
            // Freeze at the final elapsed time
            if (finalDurationRef.current === null) {
                finalDurationRef.current = Date.now() - startMs;
            }
            setDuration(finalDurationRef.current);
            return;
        }

        // Live counter — updates every second
        const interval = setInterval(() => setDuration(Date.now() - startMs), 1000);
        return () => clearInterval(interval);
    }, [startedAt, isComplete]);

    if (!startedAt) return null;

    const totalSeconds = Math.floor(duration / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');

    return (
        <div className="flex items-center gap-2 font-mono text-sm tabular-nums">
            <Clock className="w-4 h-4 text-[#7A756F]" />
            <span className="text-[#1A1612]">{minutes}:{seconds}</span>
        </div>
    );
});
AnalysisTimer.displayName = 'AnalysisTimer';

const ProgressBar = memo(({ percentage, stepIndex, totalSteps, message }: {
    percentage: number; stepIndex: number; totalSteps: number; message?: string;
}) => (
    <div className="mb-6 sm:mb-8">
        <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-[#1A1612]">{message || 'Analysis in progress...'}</p>
            <p className="text-sm font-mono tabular-nums text-[#7A756F]">{`Step ${stepIndex + 1}/${totalSteps}`}</p>
        </div>
        <div className="w-full bg-[#F0E8DE] rounded-full h-2.5">
            <motion.div
                className="bg-[#B8860B] h-2.5 rounded-full"
                style={{ width: `${percentage}%` }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
        </div>
    </div>
));
ProgressBar.displayName = 'ProgressBar';



const AIThinkingPanel = memo(({ thinking, isActive }: { thinking: AIThinking; isActive: boolean }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [thinking?.fullText]);

    return (
        <div className="mb-6 sm:mb-8">
            <h2 className="text-lg font-bold text-[#1A1612] mb-4">AI Thinking</h2>
            <div
                ref={scrollRef}
                className="h-48 overflow-y-auto bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-600 font-mono whitespace-pre-wrap"
            >
                {thinking?.fullText || (isActive ? "Establishing connection to reasoning engine..." : "No reasoning logs available for this stage.")}
                {isActive && thinking?.fullText && <span className="inline-block w-2 h-4 bg-gray-800 animate-pulse ml-1" />}
            </div>
        </div>
    );
});
AIThinkingPanel.displayName = 'AIThinkingPanel';

const CandidateScoreTable = memo(({ scores }: { scores: CandidateScore[] }) => {
    const sortedScores = useMemo(() => [...scores].sort((a, b) => b.score - a.score), [scores]);

    return (
        <div className="mb-6 sm:mb-8">
            <h2 className="text-lg font-bold text-[#1A1612] mb-4">Candidate Scores</h2>
            <div className="overflow-x-auto rounded-lg border border-[#F0E8DE]">
                {scores.length > 0 ? (
                    <table className="min-w-full divide-y divide-[#F0E8DE]">
                        <thead className="bg-[#F8F4F0]">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#7A756F] uppercase tracking-wider">Time</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#7A756F] uppercase tracking-wider">Score</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#7A756F] uppercase tracking-wider">Stage</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-[#F0E8DE]">
                            {sortedScores.map((s, index) => (
                                <tr key={`${s.time}-stage${s.stage}-${index}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[#1A1612]">{s.time}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[#1A1612]">{s.score.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#7A756F]">{s.stage}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-8 text-center text-sm text-[#7A756F] bg-white">
                        Waiting for tournament to begin... Candidates will appear here soon.
                    </div>
                )}
            </div>
        </div>
    );
});
CandidateScoreTable.displayName = 'CandidateScoreTable';
