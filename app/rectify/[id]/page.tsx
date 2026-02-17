'use client';

import React, { useState, useEffect, useCallback, memo, useRef, useMemo, useId } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { APIClient } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Clock, Activity, Home, LayoutDashboard, AlertCircle, Gem,
    CheckCircle, RefreshCw, XCircle, ChevronRight, ChevronDown, ChevronUp, Play, PauseCircle, Filter, Database,
    Maximize2, ArrowLeft, Cpu, Zap, ShieldCheck
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStreamProgress, type CandidateScore, type StreamStep, type StageStat, type AIThinking, type AIContextData, type AnalysisDecision } from '@/lib/use-stream-progress';
import { logger } from '@/lib/secure-logger';
import { env } from '@/lib/config';
import { AnalysisPipelineTracker } from '@/components/rectify/AnalysisPipelineTracker';
import { AnalysisErrorBoundary, SectionErrorBoundary } from '@/components/rectify/AnalysisErrorBoundary';
import AdvancedSignalsDashboard from '@/components/rectify/advanced-signals/AdvancedSignalsDashboard';

// ═══════════════════════════════════════════════════════════════════════════════

const GlobalStyles = () => (
    <style jsx global>{`
        .style-scroll::-webkit-scrollbar {
            width: 5px;
            height: 5px;
        }
        .style-scroll::-webkit-scrollbar-track {
            background: #FDF8F3;
            border-radius: 10px;
        }
        .style-scroll::-webkit-scrollbar-thumb {
            background: #E5E0D8;
            border-radius: 10px;
        }
        .style-scroll::-webkit-scrollbar-thumb:hover {
            background: #B8860B;
        }
    `}</style>
);

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
        <p className="text-xs text-red-800 mt-2 max-w-2xl whitespace-pre-wrap text-left bg-red-50 p-4 rounded border border-red-200 overflow-auto max-h-96">{error}</p>
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

const AnalysisTimer = memo(({ startedAt, isComplete, updatedAt }: { startedAt: string | null; isComplete: boolean; updatedAt?: string }) => {
    const [duration, setDuration] = useState(0);
    const finalDurationRef = useRef<number | null>(null);

    useEffect(() => {
        // 🛡️ User Robustness: Use startedAt if available, else fallback to updatedAt for "rough" start time
        const effectiveStart = startedAt || updatedAt;

        if (!effectiveStart) return;
        const startMs = new Date(effectiveStart).getTime();

        if (isComplete) {
            if (finalDurationRef.current === null) {
                finalDurationRef.current = Date.now() - startMs;
            }
            setDuration(finalDurationRef.current);
            return;
        }

        // Live update
        const interval = setInterval(() => setDuration(Date.now() - startMs), 1000);
        setDuration(Date.now() - startMs); // Immediate tick
        return () => clearInterval(interval);
    }, [startedAt, updatedAt, isComplete]);

    if (!startedAt && !updatedAt) {
        return (
            <div className="flex items-center gap-1.5 font-mono text-sm tabular-nums bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200 animate-pulse">
                <Clock className="w-3.5 h-3.5 text-[#7A756F]" />
                <span className="text-[#1A1612] font-semibold text-xs">Waiting...</span>
            </div>
        );
    }

    const totalSeconds = Math.max(0, Math.floor(duration / 1000));
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

// ... imports at top ...
import { UnifiedAIPanel } from '@/components/rectify/UnifiedAIPanel';
import { LiveCalculationPanel } from '@/components/rectify/LiveCalculationPanel';
// Remove AIThinkingPanel and CandidateScoreTable inline components


interface PersistentCandidate {
    time: string;
    ascendant?: string;
    moon?: string;
}

const AIContextPanel = memo(({ persistentCandidates, isActive, offsetConfig, totalAnalyzed }: { persistentCandidates: PersistentCandidate[]; isActive: boolean; offsetConfig?: any; totalAnalyzed?: number }) => {
    // Always show if we have data, even if not strictly "active" (active just means streaming now)
    if (persistentCandidates.length === 0 && !isActive) return null;

    return (
        <div className="bg-[#FAF9F6] border border-[#F0E8DE] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0E8DE] pb-3">
                <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#B8860B]" />
                    <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-[#1A1612]">Candidates Astrological Data</h3>
                        <p className="text-[10px] text-stone-400 font-medium">Powered by Swiss Ephemeris Engine</p>
                    </div>
                </div>
                {totalAnalyzed !== undefined && (
                    <div className="bg-stone-100 px-3 py-1 rounded-lg border border-stone-200 text-xs font-mono font-bold text-[#7A756F]">
                        Analyzed: <span className="text-[#B8860B]">{persistentCandidates.length}</span>
                    </div>
                )}
            </div>

            <div className="rounded-lg border border-[#F0E8DE] bg-white overflow-hidden max-h-[300px] overflow-y-auto style-scroll">
                <table className="min-w-full text-[10px]">
                    <thead className="bg-[#FAF8F5] border-b border-[#F0E8DE] sticky top-0 z-10">
                        <tr>
                            <th className="px-3 py-1.5 text-left font-bold text-stone-600 uppercase">Birth Time</th>
                            <th className="px-3 py-1.5 text-left font-bold text-stone-600 uppercase">Ascendant</th>
                            <th className="px-3 py-1.5 text-left font-bold text-stone-600 uppercase">Moon (Chandra)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0E8DE]">
                        {persistentCandidates.map((c, i) => (
                            <tr key={`${c.time}-${i}`} className="hover:bg-stone-50 transition-colors">
                                <td className="px-3 py-2 font-mono font-bold text-[#1A1612]">{c.time}</td>
                                <td className="px-3 py-2 text-stone-600 font-medium">{c.ascendant || 'Pending...'}</td>
                                <td className="px-3 py-2 text-stone-600 font-medium">{c.moon || 'Pending...'}</td>
                            </tr>
                        ))}
                        {persistentCandidates.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-3 py-8 text-center text-stone-400 italic">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-[#B8860B]/30 border-t-[#B8860B] rounded-full animate-spin" />
                                        <span>Hydrating candidate pool...</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Legend/Footer */}
            <div className="flex items-center gap-4 text-[9px] text-stone-400 pt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#B8860B]"></span>Precise Match</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-stone-300"></span>Candidate</span>
            </div>
        </div>
    );
});
AIContextPanel.displayName = 'AIContextPanel';

// ... (rest of the file until LiveCalculationPanel usage)

// Inside the main return, usually near the bottom
// Replace the LiveCalculationPanel block:



// Funnel removed as requested

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
        isConnected, isComplete, error: streamError, progress, aiThinking, aiContext, decisions,
        candidateScores, stageStats, advancedSignals, result, startedAt, allSteps, metadata,
        connectionState, persistentCandidates
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
            const backendUrl = env.api.backendUrl.replace(/\/$/, '');
            await APIClient.post(
                `${backendUrl}/api/queue/cancel`,
                { sessionId },
                getToken
            );
            setCancelled(true);
            logger.info('Analysis cancelled', { sessionId });
        } catch (err: any) {
            logger.error('Cancel failed', err);
            alert(`Failed to cancel: ${err.message}`);
        } finally {
            setIsCancelling(false);
            setShowCancelConfirm(false);
        }
    }, [sessionId, getToken, isCancelling, cancelled]);

    const handleRestart = useCallback(async () => {
        setIsCancelling(true);
        try {
            const backendUrl = env.api.backendUrl.replace(/\/$/, '');
            await APIClient.post(
                `${backendUrl}/api/queue/requeue`,
                { sessionId },
                getToken
            );
            setCancelled(false);
            window.location.reload();
        } catch (err: any) {
            logger.error('Restart failed', err.message);
            alert(`Failed to restart: ${err.message}`);
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

    // Show loading state while connecting (but not if polling - polling means we're reconnecting)
    if (!isConnected && !hasError && !result && connectionState.status !== 'polling' && connectionState.status !== 'connecting') {
        return <LoadingState />;
    }

    // Show error only if we have a real error and no result to display
    if (hasError && !result && connectionState.status === 'error') {
        return <ErrorDisplay error={errorMessage} onRetry={() => {
            // Use router navigation instead of reload to avoid server action cache issues
            router.push('/dashboard');
            setTimeout(() => router.push(`/rectify/${sessionId}`), 100);
        }} />;
    }

    return (
        <AnalysisErrorBoundary sectionName="Analysis Page">
            <GlobalStyles />
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
                                {!isComplete && !cancelled && (
                                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-stone-100/50 rounded-lg border border-stone-200">
                                        <span className="text-[10px] uppercase font-bold text-stone-400">Precision</span>
                                        <span className="text-xs font-bold text-[#B8860B] font-mono">
                                            {metadata?.offsetConfig?.customMinutes
                                                ? `±${metadata.offsetConfig.customMinutes} min`
                                                : metadata?.offsetConfig?.preset === '1hour'
                                                    ? '±1 hour'
                                                    : 'Standard'}
                                        </span>
                                    </div>
                                )}
                                <AnalysisTimer
                                    startedAt={startedAt || null}
                                    updatedAt={metadata?.updatedAt} // 🛡️ Pass fallback
                                    isComplete={isComplete}
                                />
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
                                <AnalysisPipelineTracker
                                    stats={stageStats || []}
                                    allSteps={allSteps}
                                    currentStage={progress?.stepIndex || 0}
                                    isConnected={isConnected}
                                    isComplete={isComplete}
                                    aiModel={metadata?.aiModel}
                                />
                            </SectionErrorBoundary>
                        )}

                        {/* 2. AI Context Panel (What AI sees) */}
                        {!isComplete && !cancelled && persistentCandidates && persistentCandidates.length > 0 && (
                            <SectionErrorBoundary sectionName="AI Context" icon={<Activity className="w-5 h-5" />}>
                                <AIContextPanel
                                    persistentCandidates={persistentCandidates}
                                    isActive={isConnected && !isComplete}
                                    offsetConfig={metadata?.offsetConfig}
                                />
                            </SectionErrorBoundary>
                        )}


                        {/* 4. AI Reasoning & Ranking (Unified) */}
                        {(aiThinking || (progress?.stepIndex || 0) >= 1) && !isComplete && !cancelled && (
                            <AnalysisErrorBoundary sectionName="AI Reasoning">
                                <UnifiedAIPanel
                                    thinking={aiThinking ? (Object.values(aiThinking)[0] as any) : null}
                                    stageHistory={streamData.stageHistory}
                                    context={aiContext}
                                    isActive={isConnected && !isComplete}
                                    stage={progress?.stepIndex}
                                    allCandidates={streamData.allCandidates}
                                    displayedCandidate={streamData.displayedCandidate}
                                    unifiedMode={true}
                                />
                            </AnalysisErrorBoundary>
                        )}

                        {/* 5. Live Logs & Advanced Signals */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SectionErrorBoundary sectionName="Live Logs">
                                <LiveCalculationPanel
                                    logs={progress?.calculationLogs || []}
                                    isConnected={isConnected}
                                    engineName="DeepSeek-V3 + Swiss Eph"
                                    latency={12}
                                />
                            </SectionErrorBoundary>

                            {/* Advanced Signals (if available) */}
                            {advancedSignals && (
                                <SectionErrorBoundary sectionName="Advanced Signals">
                                    <AdvancedSignalsDashboard signals={advancedSignals} isComplete={isComplete} />
                                </SectionErrorBoundary>
                            )}
                        </div>


                    </div>
                </div>
            </main>
        </AnalysisErrorBoundary>
    );
}
