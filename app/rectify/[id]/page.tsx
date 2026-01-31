'use client';

// app/rectify/[id]/page.tsx
// Analysis Progress Page - Real-time SSE streaming with AI thinking display
// UPDATED: Sacred Ivory Theme for consistency with app design system

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    Info,
    CheckCircle2,
    Zap,
    Target,
    Trophy,
    ExternalLink,
    Clock,
    ShieldCheck,
    Download,
    Activity,
    ArrowLeft,
    Home,
    LayoutDashboard,
    AlertCircle
} from 'lucide-react';
import { useStreamProgress } from '@/lib/use-stream-progress';
import { UnifiedAIPanel } from '@/components/rectify/UnifiedAIPanel';
import { LiveScoreTable } from '@/components/rectify/LiveScoreTable';
import { AnalysisPipelineTracker } from '@/components/rectify/AnalysisPipelineTracker';
import { CandidateLevelTables } from '@/components/rectify/CandidateLevelTables';
import { CandidateComparisonView } from '@/components/rectify/CandidateComparisonView';

export const dynamic = 'force-dynamic';

interface ProgressStep {
    id: string;
    name: string;
    icon: string;
    status: 'pending' | 'running' | 'complete' | 'error';
    message?: string;
    details?: string[];
    startedAt?: string;
}

interface ProgressData {
    currentStep: number;
    totalSteps: number;
    percentage: number;
    steps: ProgressStep[];
    lastUpdate: string;
    liveMessage?: string;
}

// Sacred Ivory Theme Constants
const THEME = {
    bg: '#FFFCF8',
    surface: '#FFFFFF',
    surfaceWarm: '#FDF8F3',
    surfaceCream: '#FAF5EF',
    border: '#F0E8DE',
    borderHover: '#E8E0D5',
    textPrimary: '#1A1612',
    textSecondary: '#4A453F',
    textMuted: '#7A756F',
    textSubtle: '#A8A39D',
    gold: '#B8860B',
    goldLight: '#D4A853',
    goldPale: '#F2E4C6',
    success: '#2D7A5C',
    successLight: '#D4E5DE',
    warning: '#E8A849',
    error: '#C65D3B',
    plum: '#6B1F7A',
} as const;

// 🏆 Industrial-Grade Results HUD Component - Ivory Theme
function ResultsHUD({ result, id }: { result: any, id: string }) {
    const confidenceColor =
        result.confidence === 'High' ? `text-[${THEME.success}] bg-[${THEME.success}]/10 border-[${THEME.success}]/20` :
            result.confidence === 'Medium' ? `text-[${THEME.warning}] bg-[${THEME.warning}]/10 border-[${THEME.warning}]/20` :
                `text-[${THEME.error}] bg-[${THEME.error}]/10 border-[${THEME.error}]/20`;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10"
        >
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#2D7A5C]/10 border-2 border-[#2D7A5C]/20 mb-4 shadow-[0_0_50px_rgba(45,122,92,0.1)] relative overflow-hidden group"
                    style={{ backgroundColor: `${THEME.success}10`, borderColor: `${THEME.success}30` }}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-t from-[#2D7A5C]/20 to-transparent opacity-50"
                    />
                    <Trophy className="w-10 h-10 text-[#2D7A5C] relative z-10" />
                </div>
                <h2 className="text-4xl font-bold text-[#1A1612] tracking-tight mb-2 font-[family-name:var(--font-cormorant)]">
                    Analysis <span className="text-[#B8860B]">Complete</span>
                </h2>
                <p className="text-[#7A756F] text-sm uppercase tracking-[0.3em] font-semibold">Analysis Successful</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-8 border border-[#D4A853]/30 rounded-2xl relative overflow-hidden group shadow-lg shadow-[#B8860B]/5">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock className="w-24 h-24 text-[#B8860B]" />
                    </div>
                    <div className="text-[10px] text-[#7A756F] uppercase tracking-[0.2em] font-bold mb-4">Rectified Birth Time</div>
                    <div className="text-6xl font-bold text-[#B8860B] tracking-tighter mb-4 font-mono">
                        {result.rectifiedTime}
                    </div>
                    <div className="flex items-center gap-2 text-[#2D7A5C] text-xs font-semibold">
                        <ShieldCheck className="w-4 h-4" />
                        Vedic Precision Verified
                    </div>
                </div>

                <div className="bg-white p-8 border border-[#D4A853]/30 rounded-2xl relative overflow-hidden flex flex-col justify-center shadow-lg shadow-[#B8860B]/5">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="text-[10px] text-[#7A756F] uppercase tracking-[0.2em] font-bold mb-1">Engine Accuracy</div>
                            <div className="text-4xl font-bold text-[#1A1612]">{result.accuracy}%</div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl border text-sm font-bold uppercase tracking-widest ${confidenceColor}`}>
                            {result.confidence} Confidence
                        </div>
                    </div>

                    <div className="h-3 w-full bg-[#F5EFE7] rounded-full overflow-hidden border border-[#F0E8DE]">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${result.accuracy}%` }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-[#B8860B] to-[#D4A853] shadow-[0_0_15px_rgba(184,134,11,0.4)]"
                        />
                    </div>
                    <p className="text-[10px] text-[#7A756F] mt-4 leading-relaxed font-medium">
                        Score calculated via <span className="text-[#B8860B] font-semibold">Nirayana Brain Protocol</span>. Precision is within <span className="text-[#2D7A5C] font-semibold">±1 second</span> verified by D60 Shashtiamsha & Nadi Transits.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-center">
                <Link
                    href={`/rectify/${id}/results`}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white font-bold uppercase tracking-widest text-sm flex items-center gap-3 shadow-[0_10px_30px_rgba(184,134,11,0.3)] hover:shadow-[0_15px_40px_rgba(184,134,11,0.4)] hover:-translate-y-1 transition-all group"
                >
                    <Target className="w-5 h-5" />
                    View Deep Report
                </Link>

                <Link
                    href="/rectify?new=true"
                    className="px-8 py-4 rounded-2xl border border-[#F0E8DE] bg-white text-[#1A1612] font-bold uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-[#FDF8F3] hover:border-[#D4A853]/50 transition-all"
                >
                    <Zap className="w-5 h-5 text-[#2D7A5C]" />
                    New Analysis
                </Link>

                <Link
                    href={`/api/sessions/${id}/pdf`}
                    target="_blank"
                    className="px-8 py-4 rounded-2xl border border-[#F0E8DE] bg-white text-[#7A756F] font-bold uppercase tracking-widest text-sm flex items-center gap-3 hover:text-[#1A1612] hover:border-[#D4A853]/50 transition-all"
                >
                    <Download className="w-5 h-5" />
                    Raw PDF
                </Link>
            </div>

            <p className="text-center mt-12 text-[10px] text-[#A8A39D] uppercase tracking-[0.4em]">
                Nirayana High-Precision BTR Engine v5.0 • God-Tier Verified Output
            </p>
        </motion.div>
    );
}

// ⏱️ Live Timer & ETA Component - Ivory Theme
function AnalysisTimer({ startTime, startedAt, estimatedTimeRemaining }: { startTime?: string, startedAt?: string, estimatedTimeRemaining?: number }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startedAt && !startTime) return;

        const start = new Date(startedAt || startTime!).getTime();
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - start) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime, startedAt]);

    const formatTime = (totalSeconds: number) => {
        if (totalSeconds < 0) return "00:00";
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF8F3] border border-[#F0E8DE] text-xs font-mono text-[#7A756F]">
                <Clock className="w-3 h-3 text-[#B8860B] animate-pulse" />
                <span>{formatTime(elapsed)}</span>
            </div>
            {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8860B]/10 border border-[#B8860B]/20 text-xs font-mono text-[#B8860B]">
                    <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">Est. Final:</span>
                    <span>{formatTime(estimatedTimeRemaining)}</span>
                </div>
            )}
        </div>
    );
}

// 🧭 Breadcrumb Navigation Component
function Breadcrumbs({ items }: { items: { label: string; href?: string; icon?: React.ReactNode }[] }) {
    return (
        <nav className="flex items-center gap-2 text-sm text-[#7A756F] mb-6">
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    {index > 0 && <span className="text-[#D0CBC5]">/</span>}
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="flex items-center gap-1.5 hover:text-[#B8860B] transition-colors"
                        >
                            {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                            <span>{item.label}</span>
                        </Link>
                    ) : (
                        <span className="flex items-center gap-1.5 text-[#1A1612] font-medium">
                            {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}

// 📊 Progress Bar Component - Ivory Theme
function ProgressBar({ percentage, isConnected }: { percentage: number; isConnected: boolean }) {
    return (
        <div className="w-full mb-8">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#7A756F]">Analysis Progress</span>
                <span className="text-sm font-bold text-[#B8860B]">{Math.round(percentage)}%</span>
            </div>
            <div className="h-3 w-full bg-[#F5EFE7] rounded-full overflow-hidden border border-[#F0E8DE]">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`h-full rounded-full transition-all duration-300 ${
                        isConnected 
                            ? 'bg-gradient-to-r from-[#B8860B] to-[#D4A853]' 
                            : 'bg-[#A8A39D]'
                    }`}
                />
            </div>
        </div>
    );
}

// 🔴 Error Display Component - Ivory Theme
function ErrorDisplay({ error, onRetry }: { error: string; onRetry?: () => void }) {
    return (
        <div className="min-h-screen bg-[#FFFCF8] pt-24 pb-16">
            <div className="max-w-4xl mx-auto px-6">
                <div className="bg-white border border-[#C65D3B]/30 rounded-2xl p-8 text-center shadow-lg">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#C65D3B]/10 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-[#C65D3B]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#1A1612] mb-2 font-[family-name:var(--font-cormorant)]">
                        Analysis Error
                    </h2>
                    <p className="text-[#7A756F] mb-6">{error}</p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="px-6 py-3 bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                        >
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// 🔄 Loading State Component - Ivory Theme
function LoadingState() {
    return (
        <div className="min-h-screen bg-[#FFFCF8] pt-24 pb-16">
            <div className="max-w-4xl mx-auto px-6">
                <div className="bg-white border border-[#F0E8DE] rounded-2xl p-8 text-center shadow-lg">
                    <div className="w-16 h-16 mx-auto mb-4">
                        <div className="w-16 h-16 border-4 border-[#B8860B]/20 border-t-[#B8860B] rounded-full animate-spin" />
                    </div>
                    <h2 className="text-xl font-bold text-[#1A1612] mb-2 font-[family-name:var(--font-cormorant)]">
                        Connecting to Analysis Engine...
                    </h2>
                    <p className="text-[#7A756F]">Establishing secure connection to backend</p>
                </div>
            </div>
        </div>
    );
}

export default function ProgressPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    // Use SSE streaming hook for real-time updates
    const {
        isConnected,
        isComplete,
        error: streamError,
        progress: streamProgress,
        aiThinking,
        stageHistory,
        aiContext,
        candidateScores,
        calculationLogs,
        stageStats,
        analyzedCount,
        totalCandidates,
        allCandidates,
        result,
        startedAt,
        displayedCandidate,
        metadata: sessionMetadata,
        estimatedTimeRemaining,
        readyState,
        url: connectionUrl,
        lastError,
        allSteps
    } = useStreamProgress(
        sessionId,
        process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080',
        useAuth().getToken
    );

    // Cancel analysis state
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelled, setCancelled] = useState(false);

    // Sync cancellation state from backend status
    useEffect(() => {
        if (sessionMetadata?.status === 'cancelled') {
            setCancelled(true);
        }
    }, [sessionMetadata?.status]);

    // Cancel analysis handler
    const { getToken } = useAuth();

    const handleCancelAnalysis = async () => {
        if (isCancelling || cancelled) return;
        
        try {
            setIsCancelling(true);
            const token = await getToken();
            
            const response = await fetch(`/api/queue/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sessionId })
            });

            if (response.ok) {
                setCancelled(true);
            }
        } catch (error) {
            console.error('Failed to cancel analysis:', error);
        } finally {
            setIsCancelling(false);
        }
    };

    // Loading state
    if (!isConnected && !streamError && !result) {
        return <LoadingState />;
    }

    // Error state
    if (streamError) {
        return <ErrorDisplay error={streamError} onRetry={() => window.location.reload()} />;
    }

    // Calculate progress percentage
    const progressPercentage = streamProgress?.percentage ||
        (allSteps && allSteps.length > 0 ? ((streamProgress?.stepIndex || 0) / allSteps.length) * 100 : 0);

    return (
        <main className="min-h-screen bg-[#FFFCF8]">
            {/* Header with Breadcrumbs */}
            <div className="bg-white border-b border-[#F0E8DE] sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <Breadcrumbs
                        items={[
                            { label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
                            { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
                            { label: 'Analysis', icon: <Activity className="w-4 h-4" /> }
                        ]}
                    />
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[#1A1612] font-[family-name:var(--font-cormorant)]">
                                Birth Time Analysis
                            </h1>
                            <p className="text-sm text-[#7A756F]">
                                Session ID: <span className="font-mono text-[#B8860B]">{sessionId.slice(0, 8)}...</span>
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <AnalysisTimer 
                                startTime={startedAt} 
                                estimatedTimeRemaining={estimatedTimeRemaining}
                            />
                            
                            {!isComplete && !cancelled && (
                                <button
                                    onClick={handleCancelAnalysis}
                                    disabled={isCancelling}
                                    className="px-4 py-2 text-sm text-[#C65D3B] border border-[#C65D3B]/30 rounded-lg hover:bg-[#C65D3B]/5 transition-colors disabled:opacity-50"
                                >
                                    {isCancelling ? 'Cancelling...' : 'Cancel'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Connection Status */}
                <div className="flex items-center gap-2 mb-6">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#2D7A5C]' : 'bg-[#C65D3B]'} animate-pulse`} />
                    <span className="text-sm text-[#7A756F]">
                        {isConnected ? 'Connected to analysis engine' : 'Reconnecting...'}
                    </span>
                </div>

                {/* Progress Bar */}
                {!isComplete && !cancelled && (
                    <ProgressBar percentage={progressPercentage} isConnected={isConnected} />
                )}

                {/* Results HUD (shown when complete) */}
                {isComplete && result && (
                    <div className="mb-8">
                        <ResultsHUD result={result} id={sessionId} />
                    </div>
                )}

                {/* Cancelled State */}
                {cancelled && (
                    <div className="bg-white border border-[#E8A849]/30 rounded-2xl p-8 text-center mb-8">
                        <h2 className="text-xl font-bold text-[#1A1612] mb-2">Analysis Cancelled</h2>
                        <p className="text-[#7A756F] mb-4">The analysis was cancelled by user request.</p>
                        <Link
                            href="/rectify?new=true"
                            className="inline-block px-6 py-3 bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white font-semibold rounded-xl"
                        >
                            Start New Analysis
                        </Link>
                    </div>
                )}

                {/* Analysis Pipeline Tracker */}
                {allSteps && allSteps.length > 0 && (
                    <div className="mb-8">
                        <AnalysisPipelineTracker
                            stats={stageStats || []}
                            allSteps={allSteps}
                            currentStage={streamProgress?.stepIndex || 0}
                            isConnected={isConnected}
                            isComplete={isComplete}
                        />
                    </div>
                )}

                {/* AI Analysis Panel */}
                {aiThinking && (
                    <div className="mb-8">
                        <UnifiedAIPanel
                            thinking={aiThinking}
                            stageHistory={stageHistory}
                            context={aiContext}
                            isActive={!isComplete && !cancelled}
                            stage={streamProgress?.stepIndex}
                            analyzedCount={analyzedCount}
                            totalCandidates={totalCandidates}
                            allCandidates={allCandidates}
                            displayedCandidate={displayedCandidate}
                            candidateScores={candidateScores}
                            calculationLogs={calculationLogs}
                            isComplete={isComplete}
                        />
                    </div>
                )}

                {/* Live Score Table */}
                {candidateScores && candidateScores.length > 0 && !isComplete && (
                    <div className="mb-8">
                        <LiveScoreTable
                            scores={candidateScores}
                        />
                    </div>
                )}

                {/* Candidate Comparison View */}
                {candidateScores && candidateScores.length > 0 && (
                    <div className="mb-8">
                        <CandidateComparisonView
                            candidates={candidateScores.map((score, index) => ({
                                time: score.time,
                                score: score.score,
                                stage: score.stage,
                                rank: index + 1,
                                offsetMinutes: score.offsetMinutes,
                                minifiedEph: score.minifiedEph
                            }))}
                        />
                    </div>
                )}
            </div>
        </main>
    );
}
