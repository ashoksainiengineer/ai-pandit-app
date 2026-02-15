import React, { useEffect, useState, useRef, useCallback, useMemo, memo, useId } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Clock, Activity, Home, LayoutDashboard, AlertCircle, Gem,
    CheckCircle, RefreshCw, XCircle, ChevronRight, Play, PauseCircle
} from 'lucide-react';
import { useStreamProgress, type CandidateScore, type StreamStep, type StageStat, type AIThinking } from '@/lib/use-stream-progress';
import { logger } from '@/lib/secure-logger';
import { AnalysisPipelineTracker } from '@/components/rectify/AnalysisPipelineTracker';
import { AnalysisErrorBoundary, SectionErrorBoundary } from '@/components/rectify/AnalysisErrorBoundary';
import AdvancedSignalsDashboard from '@/components/rectify/advanced-signals/AdvancedSignalsDashboard';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & THEME
// ═══════════════════════════════════════════════════════════════════════════════

const THEME = {
    bg: '#FFFCF8',
    surface: '#FFFFFF',
    border: '#F0E8DE',
    textPrimary: '#1A1612',
    textSecondary: '#4A453F',
    gold: '#B8860B',
    success: '#2D7A5C',
    error: '#C65D3B',
};

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
    <nav aria-label="Breadcrumb" className="mb-1">
        <ol className="flex items-center gap-2 text-xs text-[#7A756F]">
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
            if (finalDurationRef.current === null) {
                finalDurationRef.current = Date.now() - startMs;
            }
            setDuration(finalDurationRef.current);
            return;
        }

        const interval = setInterval(() => setDuration(Date.now() - startMs), 1000);
        return () => clearInterval(interval);
    }, [startedAt, isComplete]);

    if (!startedAt) return null;

    const totalSeconds = Math.floor(duration / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');

    return (
        <div className="flex items-center gap-1.5 font-mono text-sm tabular-nums bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
            <Clock className="w-3.5 h-3.5 text-[#7A756F]" />
            <span className="text-[#1A1612] font-semibold">{minutes}:{seconds}</span>
        </div>
    );
});
AnalysisTimer.displayName = 'AnalysisTimer';

const ProgressBar = memo(({ percentage, stepIndex, totalSteps, message }: {
    percentage: number; stepIndex: number; totalSteps: number; message?: string;
}) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-medium text-stone-500">
            <span>{message || 'Processing...'}</span>
            <span>Step {stepIndex + 1} of {totalSteps}</span>
        </div>
    </div>
));
ProgressBar.displayName = 'ProgressBar';

// DEEPSEEK STYLE THINKING PANEL
const AIThinkingPanel = memo(({ thinking, isActive }: { thinking: AIThinking; isActive: boolean }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        if (scrollRef.current && isActive) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [thinking?.fullText, isActive]);

    return (
        <div className="border-l-4 border-[#e5e7eb] pl-4 ml-2 my-6">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors mb-2 select-none"
            >
                {isActive ? (
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
                    </span>
                ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                )}
                Thought Process
                <span className="text-xs text-gray-400 font-normal ml-2">
                    {isExpanded ? 'Hide' : 'Show'} details
                </span>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div
                            ref={scrollRef}
                            className="text-gray-600 text-[15px] leading-7 font-normal font-sans max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
                            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                        >
                            {thinking?.fullText ? (
                                <div className="whitespace-pre-wrap">
                                    {thinking.fullText}
                                    {isActive && <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse ml-1 align-middle" />}
                                </div>
                            ) : (
                                <div className="text-gray-400 italic">
                                    Initializing reasoning engine...
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
AIThinkingPanel.displayName = 'AIThinkingPanel';

const CandidateScoreTable = memo(({ scores }: { scores: CandidateScore[] }) => {
    const sortedScores = useMemo(() => [...scores].sort((a, b) => b.score - a.score).slice(0, 10), [scores]);

    return (
        <div className="h-full">
            <h2 className="text-sm font-bold text-[#1A1612] mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#B8860B]" />
                Live Leaderboard
            </h2>
            <div className="overflow-hidden rounded-xl border border-[#F0E8DE] bg-white shadow-sm">
                {scores.length > 0 ? (
                    <table className="min-w-full divide-y divide-[#F0E8DE]">
                        <thead className="bg-[#FAF8F5]">
                            <tr>
                                <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-bold text-[#7A756F] uppercase tracking-wider">Candidate</th>
                                <th scope="col" className="px-4 py-2.5 text-right text-[10px] font-bold text-[#7A756F] uppercase tracking-wider">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0E8DE]">
                            {sortedScores.map((s, index) => (
                                <tr key={`${s.time}-stage${s.stage}-${index}`} className="hover:bg-stone-50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono font-medium text-[#1A1612]">
                                        {s.time}
                                        {index === 0 && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800">TOP</span>}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-right font-mono" style={{ color: index === 0 ? THEME.success : THEME.textSecondary }}>
                                        {s.score.toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-8 text-center text-xs text-[#7A756F] bg-stone-50 flex flex-col items-center justify-center h-32">
                        <Clock className="w-8 h-8 opacity-20 mb-2" />
                        Awaiting tournament results...
                    </div>
                )}
            </div>
        </div>
    );
});
CandidateScoreTable.displayName = 'CandidateScoreTable';

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
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    useEffect(() => {
        if (metadata?.status === 'cancelled') {
            setCancelled(true);
        } else if (metadata?.status && ['pending', 'queued', 'processing'].includes(metadata.status)) {
            setCancelled(false);
        }
    }, [metadata?.status]);

    useEffect(() => {
        if (isComplete && result) {
            try {
                localStorage.setItem(`rectification_result_${sessionId}`, JSON.stringify({
                    rectifiedTime: result.rectifiedTime,
                    accuracy: result.accuracy,
                    confidence: result.confidence,
                }));
            } catch { /* localStorage may be unavailable */ }

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
            setShowCancelConfirm(false);
        }
    }, [sessionId, getToken, isCancelling, cancelled]);

    const handleRestart = useCallback(async () => {
        setIsCancelling(true);
        try {
            const token = await getToken();
            const res = await fetch('/api/queue/requeue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ sessionId }),
            });
            if (res.ok) {
                setCancelled(false);
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

    if (!isConnected && !hasError && !result && connectionState.status !== 'polling') {
        return <LoadingState />;
    }

    if (hasError && !result) {
        return <ErrorDisplay error={errorMessage} onRetry={() => window.location.reload()} />;
    }

    return (
        <AnalysisErrorBoundary sectionName="Analysis Page">
            <main className="min-h-screen font-sans" style={{ backgroundColor: THEME.bg }} aria-labelledby={pageTitleId}>
                <header className="sticky top-0 z-40 border-b backdrop-blur-md bg-white/80" style={{ borderColor: THEME.border }} role="banner">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <Breadcrumbs items={[
                            { label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
                            { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
                            { label: 'Analysis Workspace', icon: <Activity className="w-4 h-4" /> },
                        ]} />
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
                            <div>
                                <h1 id={pageTitleId} className="text-xl sm:text-2xl font-bold flex items-center gap-3" style={{ color: THEME.textPrimary }}>
                                    Analysis for {metadata?.fullName || 'Birth Time Analysis'}
                                    <span className="text-xs font-normal px-2 py-1 rounded-full border bg-white/50 hidden sm:inline-block" style={{ borderColor: THEME.border, color: THEME.textSecondary }}>
                                        {sessionId.slice(0, 8)}
                                    </span>
                                </h1>
                            </div>
                            <div className="flex items-center gap-3">
                                <AnalysisTimer startedAt={startedAt || null} isComplete={isComplete} />
                                {!isComplete && !cancelled && (
                                    <div className="relative">
                                        {showCancelConfirm ? (
                                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                                                <button
                                                    onClick={handleCancel}
                                                    className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                                                >
                                                    Confirm Stop
                                                </button>
                                                <button
                                                    onClick={() => setShowCancelConfirm(false)}
                                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                                >
                                                    Keep Running
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowCancelConfirm(true)}
                                                disabled={isCancelling}
                                                className="px-4 py-2 text-sm font-medium rounded-lg border transition-all hover:bg-red-50 flex items-center gap-2"
                                                style={{ borderColor: `${THEME.error}40`, color: THEME.error }}
                                                aria-label="Cancel analysis"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Stop Analysis
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto p-6 space-y-6">
                    {/* Connection Status Bar */}
                    <div className="flex items-center justify-between">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            role="status"
                            aria-live="polite"
                            className="flex items-center gap-2"
                        >
                            <motion.span
                                className="w-2.5 h-2.5 rounded-full shadow-sm"
                                style={{ backgroundColor: isLive ? THEME.success : THEME.error }}
                                animate={{ scale: isLive ? [1, 1.2, 1] : 1 }}
                                transition={{ duration: 2, repeat: Infinity }}
                                aria-hidden="true"
                            />
                            <span className="text-sm font-medium" style={{ color: THEME.textSecondary }}>{connectionLabel}</span>
                        </motion.div>
                        {progress?.percentage !== undefined && !isComplete && !cancelled && (
                            <span className="text-sm font-mono font-bold" style={{ color: THEME.gold }}>
                                {progress.percentage}% Complete
                            </span>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {!isComplete && !cancelled && (
                        <div className="w-full h-1.5 bg-[#E5E0D8] rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: THEME.gold }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercentage}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                            />
                        </div>
                    )}

                    {/* Cancelled or Failed State Banner */}
                    <AnimatePresence>
                        {(cancelled || metadata?.status === 'failed') && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="rounded-xl border shadow-sm overflow-hidden"
                                style={{ backgroundColor: THEME.surface, borderColor: `${THEME.error}30` }}
                            >
                                <div className="p-8 text-center bg-gradient-to-b from-red-50/50 to-transparent">
                                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                        <XCircle className="w-8 h-8 text-red-600" />
                                    </div>
                                    <h2 className="text-xl font-bold mb-2" style={{ color: THEME.textPrimary }}>
                                        {metadata?.status === 'failed' ? 'Analysis Failed' : 'Analysis Aborted'}
                                    </h2>
                                    <p className="mb-8 text-sm max-w-lg mx-auto" style={{ color: THEME.textSecondary }}>
                                        {metadata?.status === 'failed'
                                            ? (metadata?.errorMessage || 'An error occurred during the analysis process.')
                                            : 'The analysis has been terminated. All backend operations have been stopped.'}
                                    </p>

                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                        <button
                                            onClick={handleRestart}
                                            disabled={isCancelling}
                                            className="px-6 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 shadow-lg shadow-green-900/10 flex items-center gap-2 min-w-[200px] justify-center"
                                            style={{ backgroundColor: THEME.success }}
                                        >
                                            {isCancelling ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                            Restart Analysis
                                        </button>

                                        <Link
                                            href="/rectify?new=true"
                                            className="px-6 py-3 rounded-xl font-semibold transition-all hover:bg-stone-100 border flex items-center gap-2 min-w-[200px] justify-center text-center"
                                            style={{ borderColor: THEME.border, color: THEME.textPrimary }}
                                        >
                                            <Home className="w-4 h-4" />
                                            Return Home
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Completion Banner */}
                    <AnimatePresence>
                        {isComplete && result && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-xl border p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm"
                                style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-green-900">Analysis Complete!</h2>
                                        <p className="text-sm text-green-700">
                                            Rectified Time: <strong>{result.rectifiedTime}</strong> · Confidence: <strong>{result.confidence}</strong>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-sm text-green-600 font-medium animate-pulse flex items-center gap-2">
                                    Finalizing report... <ChevronRight className="w-4 h-4" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* MAIN VERTICAL STACK LAYOUT */}
                    <div className="space-y-8 max-w-4xl mx-auto">

                        {/* 1. Pipeline Tracker (Top) */}
                        {allSteps && allSteps.length > 0 && (
                            <SectionErrorBoundary sectionName="Pipeline Tracker" icon={<Activity className="w-5 h-5" />}>
                                <div className="bg-white rounded-xl border border-[#F0E8DE] p-6 shadow-sm">
                                    <h3 className="text-sm font-bold text-[#1A1612] mb-4">Analysis Pipeline</h3>
                                    <AnalysisPipelineTracker
                                        stats={stageStats || []}
                                        allSteps={allSteps}
                                        currentStage={progress?.stepIndex || 0}
                                        isConnected={isConnected}
                                        isComplete={isComplete}
                                    />
                                </div>
                            </SectionErrorBoundary>
                        )}

                        {/* 2. AI Thinking (DeepSeek Style) */}
                        {(aiThinking || (progress?.stepIndex || 0) >= 1) && !isComplete && (
                            <SectionErrorBoundary sectionName="AI Thinking" icon={<Brain className="w-5 h-5" />}>
                                <AIThinkingPanel thinking={aiThinking} isActive={!isComplete && !cancelled} />
                            </SectionErrorBoundary>
                        )}

                        {/* 3. Candidate Scores (Leaderboard) */}
                        {(candidateScores.length > 0 || (progress?.stepIndex || 0) >= 2) && !isComplete && (
                            <SectionErrorBoundary sectionName="Candidate Scores" icon={<Activity className="w-5 h-5" />}>
                                <div className="bg-white rounded-xl border border-[#F0E8DE] p-6 shadow-sm">
                                    <CandidateScoreTable scores={candidateScores} />
                                </div>
                            </SectionErrorBoundary>
                        )}

                        {/* 4. Advanced Signals (Bottom) */}
                        {(advancedSignals || (isComplete && result)) && (
                            <SectionErrorBoundary sectionName="Advanced Signals" icon={<Gem className="w-5 h-5" />}>
                                <div className="bg-white rounded-xl border border-[#F0E8DE] p-6 shadow-sm">
                                    <h3 className="text-sm font-bold text-[#1A1612] mb-4">Real-time Signals</h3>
                                    <AdvancedSignalsDashboard signals={advancedSignals} isComplete={isComplete} />
                                </div>
                            </SectionErrorBoundary>
                        )}
                    </div>
                </div>
            </main>
        </AnalysisErrorBoundary>
    );
}
