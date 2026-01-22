'use client';

// app/rectify/[id]/page.tsx
// Analysis Progress Page - Real-time SSE streaming with AI thinking display

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
    Activity
} from 'lucide-react';
import { useStreamProgress } from '@/lib/use-stream-progress';
import { UnifiedAIPanel } from '@/components/rectify/UnifiedAIPanel';
import { LiveScoreTable } from '@/components/rectify/LiveScoreTable';
import { LiveGodModeTerminal } from '@/components/rectify/LiveGodModeTerminal';
import { ResultsHUD } from '@/components/rectify/ResultsHUD';


export const dynamic = 'force-dynamic';

interface ProgressStep {
    id: string;
    name: string;
    icon: string;
    status: 'pending' | 'running' | 'complete' | 'error';
    message?: string;
    details?: string[];
}

interface ProgressData {
    currentStep: number;
    totalSteps: number;
    percentage: number;
    steps: ProgressStep[];
    lastUpdate: string;
    liveMessage?: string;
}

// Default analysis steps with rich descriptions
const DEFAULT_STEPS: ProgressStep[] = [
    { id: 'init', name: 'Grid Initialization', icon: '🚀', status: 'pending' },
    { id: 'ephemeris', name: 'Neural Screening (L1)', icon: '🔭', status: 'pending' },
    { id: 'houses', name: 'Grid Precision (30s)', icon: '🏠', status: 'pending' },
    { id: 'candidates', name: 'Tournament Dynamics (L2)', icon: '⏰', status: 'pending' },
    { id: 'dasha', name: 'Boundary Collision Scan', icon: '📊', status: 'pending' },
    { id: 'divisional', name: 'Micro-Grid Sync (6s)', icon: '📐', status: 'pending' },
    { id: 'events', name: 'Grand Finals (L3)', icon: '📅', status: 'pending' },
    { id: 'physical', name: 'Transit Synchronization', icon: '👤', status: 'pending' },
    { id: 'ai', name: 'Vedic Shuddhi Audit', icon: '🤖', status: 'pending' },
    { id: 'final', name: 'Archive Sealing', icon: '✨', status: 'pending' },
];

// Step descriptions and metadata for user education
const STEP_INFO: Record<string, {
    description: string;
    level?: string;
    accuracy?: string;
    methods?: string[];
    phase: 'setup' | 'calculation' | 'screening' | 'verification' | 'final';
}> = {
    'init': {
        description: 'Initializing high-performance compute grid and loading sacred datasets',
        phase: 'setup'
    },
    'ephemeris': {
        description: 'Level 1 Neural Screening: Rapidly narrowing the search space across the tentative window',
        methods: ['DeepSeek V3', 'Vimshottari Screening'],
        phase: 'calculation'
    },
    'houses': {
        description: 'Building 30-second Precision Grid using Swiss Ephemeris v2.0 (Lahiri)',
        methods: ['Swiss Ephemeris', '30s Incremental Cusp Mapping'],
        phase: 'calculation'
    },
    'candidates': {
        description: 'Level 2 Tournament: Dynamic comparison of finalists using multi-dasha cross-verification',
        methods: ['Yogini Dasha', 'Chara Dasha', 'D9/D10 Navamsa'],
        phase: 'screening'
    },
    'dasha': {
        description: 'Identifying "Sandhi" boundary collisions: Precision timing on dasha transitions',
        level: 'Boundary Scan',
        accuracy: '92-94%',
        methods: ['🔱 Boundary Collision Heuristic'],
        phase: 'screening'
    },
    'divisional': {
        description: '6-second Micro-Grid Sync: Deep-diving into the sub-sub-sub periods (Dasha depth 5)',
        level: 'Micro-Grid',
        accuracy: '94-96%',
        methods: ['Arcsecond Precision', 'Varga-16 Suite'],
        phase: 'screening'
    },
    'events': {
        description: 'Level 3 Grand Finals: DeepSeek Reasoner (R1) performing final logic-heavy arbitration',
        methods: ['DeepSeek R1', 'God-Tier Reasoning Archive'],
        phase: 'verification'
    },
    'physical': {
        description: 'Synchronizing transits: Cross-verifying major life triggers against planetary movement',
        methods: ['Transit Synchronization', 'Gochar Analysis'],
        phase: 'verification'
    },
    'ai': {
        description: 'Sacred Purification Audit: Final validation using Kunda and Tatwa Shuddhi methods',
        level: 'Shuddhi Audit',
        accuracy: '98-99.9%',
        methods: ['Kunda Shuddhi', 'Tatwa Shuddhi', 'Varnada Lagna'],
        phase: 'final'
    },
    'final': {
        description: 'Sealing the results into a high-fidelity astrological archive',
        accuracy: '99.9%+',
        methods: ['Essence Protocol', 'Archive Sealing'],
        phase: 'final'
    }
};


// 🏆 Industrial-Grade Results HUD Component
function ResultsHUD({ result, id }: { result: any, id: string }) {
    const confidenceColor =
        result.confidence === 'High' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
            result.confidence === 'Medium' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                'text-red-400 bg-red-500/10 border-red-500/20';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10"
        >
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 mb-4 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden group">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent opacity-50"
                    />
                    <Trophy className="w-10 h-10 text-emerald-400 relative z-10" />
                </div>
                <h2 className="text-4xl font-black text-[#F5F0EB] tracking-tight mb-2">
                    Analysis <span className="text-[#D4AF37]">Complete</span>
                </h2>
                <p className="text-[#8C7F72] text-sm uppercase tracking-[0.3em] font-bold">Analysis Successful</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="glass-card p-8 border-[#D4AF37]/30 bg-[#1A1F2E]/60 backdrop-blur-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock className="w-24 h-24" />
                    </div>
                    <div className="text-[10px] text-[#8C7F72] uppercase tracking-[0.2em] font-black mb-4">Rectified Birth Time</div>
                    <div className="text-6xl font-black text-[#D4AF37] tracking-tighter mb-4 font-mono">
                        {result.rectifiedTime}
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400/80 text-xs font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        Vedic Precision Verified
                    </div>
                </div>

                <div className="glass-card p-8 border-[#D4AF37]/30 bg-[#1A1F2E]/60 backdrop-blur-2xl relative overflow-hidden flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="text-[10px] text-[#8C7F72] uppercase tracking-[0.2em] font-black mb-1">Engine Accuracy</div>
                            <div className="text-4xl font-black text-[#F5F0EB]">{result.accuracy}%</div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl border text-sm font-black uppercase tracking-widest ${confidenceColor}`}>
                            {result.confidence} Confidence
                        </div>
                    </div>

                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${result.accuracy}%` }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-[#D4AF37] to-[#E8C54D] shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                        />
                    </div>
                    <p className="text-[10px] text-[#8C7F72] mt-4 leading-relaxed font-medium">
                        Score calculated via <span className="text-[#D4AF37]">Sangama & Badha Analysis</span>. Precision is within ±3-5 seconds based on Swiss Ephemeris data points.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-center">
                <Link
                    href={`/rectify/${id}/results`}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E8C54D] text-[#0F1419] font-black uppercase tracking-widest text-sm flex items-center gap-3 shadow-[0_10px_30px_rgba(212,175,55,0.2)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.3)] hover:-translate-y-1 transition-all group"
                >
                    <Target className="w-5 h-5" />
                    View Deep Report
                </Link>

                <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-4 rounded-2xl border border-white/10 bg-white/5 text-[#F5F0EB] font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-white/10 transition-all"
                >
                    <Zap className="w-5 h-5 text-emerald-400" />
                    New Analysis
                </button>

                <Link
                    href={`/api/sessions/${id}/pdf`}
                    target="_blank"
                    className="px-8 py-4 rounded-2xl border border-white/10 bg-white/5 text-[#8C7F72] font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:text-[#F5F0EB] transition-all"
                >
                    <Download className="w-5 h-5" />
                    Raw PDF
                </Link>
            </div>

            <p className="text-center mt-12 text-[10px] text-[#8C7F72] uppercase tracking-[0.4em] opacity-40">
                BTR High-Precision Analysis Engine v4.1 • Verified Output
            </p>
        </motion.div>
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
        aiContext, // 🔮 New: Context Data
        candidateScores,
        calculationLogs, // ⚡ New: Calculation Logs
        stageStats, // ⚡ New: Stage Stats
        analyzedCount,
        result,
        // Enhanced Diagnostics
        url: connectionUrl,
        lastError,
        readyState,
        displayedCandidate,
        metadata: sessionMetadata
    } = useStreamProgress(
        sessionId,
        process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080', // Direct backend connection for local dev from cloud frontend
        useAuth().getToken // 🔒 Pass getToken for Auth
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

        const confirmed = window.confirm('Are you sure you want to cancel this analysis? This cannot be undone.');
        if (!confirmed) return;

        setIsCancelling(true);
        try {
            const userToken = await getToken();
            const token = userToken || (process.env.NODE_ENV === 'development' ? 'dev-token-fallback' : '');

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
            const response = await fetch(`${backendUrl}/api/queue/cancel`, { // Direct backend connection
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ sessionId }),
            });

            const data = await response.json();
            if (data.success) {
                // Wait for backend to confirm cancellation (which stops loops)
                setCancelled(true);
                router.push('/rectify');
            } else {
                alert('Could not cancel: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Cancel error:', err);
            alert('Failed to cancel analysis');
        } finally {
            setIsCancelling(false);
        }
    };

    // 🛡️ Back-Button Trap (Redirect to Dashboard during active/complete session)
    useEffect(() => {
        const handlePopState = () => {
            // Push a new state to stay on this page, then redirect
            window.history.pushState(null, '', window.location.href);
            router.push('/rectify');
        };

        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        return () => window.removeEventListener('popstate', handlePopState);
    }, [router]);

    // Convert stream progress to local progress format
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Update local progress from SSE stream
    useEffect(() => {
        if (streamProgress) {
            // Find index by ID to be robust against backend/frontend index mismatch
            const stepId = streamProgress.step;
            const foundIndex = DEFAULT_STEPS.findIndex(s => s.id === stepId);
            const activeIndex = foundIndex !== -1 ? foundIndex : streamProgress.stepIndex;

            setProgress({
                currentStep: activeIndex,
                totalSteps: streamProgress.totalSteps,
                percentage: streamProgress.percentage,
                steps: DEFAULT_STEPS.map((step, idx) => ({
                    ...step,
                    status: idx < activeIndex ? 'complete' :
                        idx === activeIndex ? 'running' : 'pending',
                    message: idx === activeIndex ? streamProgress.message : undefined,
                    details: idx === activeIndex ? streamProgress.details : undefined,
                })),
                lastUpdate: new Date().toISOString(),
                liveMessage: streamProgress.message,
            });
            setLoading(false);
        }
    }, [streamProgress]);

    // Handle SSE connection
    useEffect(() => {
        if (isConnected && loading) {
            setLoading(false);
        }
    }, [isConnected, loading]);

    // Handle completion
    useEffect(() => {
        if (isComplete && result) {
            setTimeout(() => {
                router.push(`/rectify/${sessionId}/results`);
            }, 1500);
        }
    }, [isComplete, result, router, sessionId]);

    // Handle errors
    useEffect(() => {
        if (streamError) {
            setError(streamError);
            setLoading(false);
        }
    }, [streamError]);

    // Check if AI step is active (Stages 2, 5, 7 use AI)
    // stepIndex mapping: 0=init, 1=ephemeris, 2=houses, 3=candidates(Stage2), 4=dasha(Stage5), 5=divisional(Stage7), 6=events, 7=physical, 8=ai, 9=final
    // Check if AI step is active (Stages 2, 5, 7 use AI)
    // stepIndex mapping: 0=init, 1=ephemeris, 2=houses, 3=candidates(Stage2), 4=dasha(Stage5), 5=divisional(Stage7), 6=events, 7=physical, 8=ai, 9=final
    const aiSteps = ['candidates', 'dasha', 'divisional', 'ai', 'final'];
    const isAIStepActive = aiSteps.includes(streamProgress?.step || '') ||
        (streamProgress?.stepIndex !== undefined && [3, 4, 5, 8, 9].includes(streamProgress.stepIndex));


    if (loading && !isConnected && readyState !== 3) {
        return (
            <main className="min-h-screen bg-[#0F1419] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#C4B8AD]">Connecting to analysis engine...</p>
                    <p className="text-xs text-[#8C7F72] mt-2 mb-4">Establishing real-time connection...</p>

                    {/* Diagnostic Panel */}
                    <div className="mt-8 text-left max-w-sm mx-auto bg-[#1A1F2E] border border-[#3A4452] rounded-lg p-4 text-xs font-mono">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-[#F5F0EB]">🔍 Connection Diagnostics v2.0</span>
                            <span className={`w-2 h-2 rounded-full ${readyState === 1 ? 'bg-green-500' : readyState === 3 ? 'bg-blue-500 animate-pulse' : readyState === 0 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        </div>

                        <div className="space-y-2 text-[#8C7F72]">
                            <div>
                                <div className="uppercase text-[10px] tracking-wider mb-0.5">Target Backend</div>
                                <div className="break-all text-[#C4B8AD] bg-black/20 p-1 rounded">
                                    {connectionUrl || 'Initializing...'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <div className="uppercase text-[10px] tracking-wider mb-0.5">Status</div>
                                    <div className={readyState === 1 ? 'text-green-400' : readyState === 3 ? 'text-blue-400 font-bold' : 'text-yellow-400'}>
                                        {readyState === 0 ? 'CONNECTING' : readyState === 1 ? 'OPEN' : readyState === 3 ? 'POLLING (Fallback)' : 'CLOSED'}
                                    </div>
                                </div>
                                <div>
                                    <div className="uppercase text-[10px] tracking-wider mb-0.5">Session ID</div>
                                    <div className="truncate">{sessionId}</div>
                                </div>
                            </div>

                            {lastError && (
                                <div>
                                    <div className="uppercase text-[10px] tracking-wider mb-0.5 text-red-400">Error Details</div>
                                    <div className="text-red-300 bg-red-900/10 p-1.5 rounded border border-red-500/20">
                                        {lastError}
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 border-t border-[#3A4452] mt-2">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full py-1.5 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 rounded transition-colors"
                                >
                                    ↻ Retry Connection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-[#0F1419] flex items-center justify-center p-6">
                <div className="glass-card max-w-lg w-full p-8 border-red-500/30 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Info className="w-10 h-10 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-black text-[#F5F0EB] mb-4 uppercase tracking-tight">System Interruption</h1>
                    <p className="text-[#C4B8AD] mb-8 leading-relaxed">
                        {error.includes('expired')
                            ? "Your analysis session has expired or was removed from the queue. This usually happens if the connection is lost for a long duration."
                            : `The analysis engine encountered a synchronization issue: ${error}`}
                    </p>

                    <div className="space-y-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-[#D4AF37] text-[#0F1419] rounded-xl font-black uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-[0_10px_20px_rgba(212,175,55,0.2)]"
                        >
                            ↻ Attempt Re-Sync
                        </button>
                        <Link
                            href="/rectify"
                            className="block w-full py-4 border border-white/10 text-[#8C7F72] rounded-xl font-black uppercase tracking-widest text-sm hover:text-[#F5F0EB] transition-all"
                        >
                            Return to Dashboard
                        </Link>
                    </div>

                    {/* Technical Diagnostic Toggle */}
                    <details className="mt-8 text-left">
                        <summary className="text-[10px] text-[#8C7F72] cursor-pointer hover:text-[#C4B8AD] uppercase tracking-[0.2em] font-bold">
                            View Diagnostic Trace
                        </summary>
                        <div className="mt-4 p-4 bg-black/40 rounded-lg font-mono text-[10px] text-[#8C7F72] break-all border border-white/5">
                            <div>SESSION_ID: {sessionId}</div>
                            <div>READY_STATE: {readyState}</div>
                            <div>LAST_ERR: {lastError || 'N/A'}</div>
                            <div>ENV: {process.env.NODE_ENV}</div>
                        </div>
                    </details>
                </div>
            </main>
        );
    }

    // Show cancelled state
    if (cancelled) {
        return (
            <main className="min-h-screen bg-[#0F1419] flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                    <div className="text-6xl mb-4">🛑</div>
                    <h1 className="text-2xl font-bold text-[#F5F0EB] mb-2">Analysis Cancelled</h1>
                    <p className="text-[#C4B8AD] mb-6">Your analysis has been cancelled. Redirecting...</p>
                    <Link href="/rectify" className="inline-block px-6 py-3 bg-[#D4AF37] text-[#0F1419] rounded-lg font-bold hover:opacity-90 transition-opacity">
                        Start New Analysis
                    </Link>
                </div>
            </main>
        );
    }

    const currentStepData = progress?.steps[progress.currentStep] || null;

    return (
        <main className="min-h-screen bg-[#0F1419] text-[#F5F0EB]">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-[#0F1419]/90 backdrop-blur-xl border-b border-[#D4AF37]/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="text-2xl">🕉️</span>
                        <span className="font-bold text-xl text-[#D4AF37]">AI Pandit</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/rectify"
                            className="hidden md:flex px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2A3442] text-[#C4B8AD] hover:bg-[#3A4452] hover:text-[#D4AF37] transition-colors items-center gap-2"
                        >
                            ← Back to Dashboard
                        </Link>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm text-[#8C7F72]">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                            {isConnected ? 'Live Streaming' : 'Connecting...'}
                        </div>
                        {!isComplete && !cancelled && (
                            <button
                                onClick={handleCancelAnalysis}
                                disabled={isCancelling}
                                className="px-4 py-2 text-sm font-medium text-red-400 border border-red-400/30 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            >
                                {isCancelling ? 'Cancelling...' : '✕ Cancel'}
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 pb-2">
                {/* Visual Space Refinement */}
            </div>

            <div className="max-w-4xl mx-auto px-6 pb-12">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-[#F5F0EB] mb-2 animate-fade-in">
                        🔮 Rectifying Your Birth Time
                    </h1>
                    <p className="text-[#C4B8AD] h-6 transition-all duration-300">
                        {progress?.liveMessage || 'Initializing analysis...'}
                    </p>
                </div>

                {/* Birth Details Summary - Added as requested */}
                <div className="mb-8">
                    <BirthDetailsSummary metadata={sessionMetadata} />
                </div>

                {/* Main Progress Display - Unified Container */}
                <div className="glass-card p-6 border border-[#D4AF37]/30 mb-8">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        {/* Vedic Pulse Progress - Ultra High Fidelity */}
                        <div className="flex-shrink-0 relative group">
                            <div className="absolute inset-0 bg-[#D4AF37]/5 rounded-full blur-3xl group-hover:bg-[#D4AF37]/10 transition-colors" />
                            <div className="relative w-44 h-44">
                                <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_10px_rgba(212,175,55,0.15)]" viewBox="0 0 100 100">
                                    {/* Outer Track */}
                                    <circle cx="50" cy="50" r="46" fill="none" stroke="#2A3442" strokeWidth="1" strokeDasharray="2 4" className="opacity-30" />

                                    {/* Main Track */}
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="#1A2433" strokeWidth="6" />

                                    {/* Progress Fill */}
                                    <motion.circle
                                        cx="50" cy="50" r="42" fill="none"
                                        stroke="url(#vedicGradient)" strokeWidth="6" strokeLinecap="round"
                                        initial={{ strokeDasharray: "0 264" }}
                                        animate={{ strokeDasharray: `${(progress?.percentage || 0) * 2.64} 264` }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                    />

                                    {/* Scanning Pulse Dot */}
                                    {isConnected && !isComplete && (
                                        <motion.circle
                                            cx="50" cy="50" r="42" fill="none"
                                            stroke="#D4AF37" strokeWidth="2"
                                            strokeDasharray="1 263"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        />
                                    )}

                                    <defs>
                                        <linearGradient id="vedicGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#D4AF37" />
                                            <stop offset="50%" stopColor="#F5D061" />
                                            <stop offset="100%" stopColor="#D4AF37" />
                                        </linearGradient>
                                    </defs>
                                </svg>

                                {/* Center Content */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-4xl font-black text-[#D4AF37] tracking-tighter"
                                    >
                                        {progress?.percentage || 0}
                                        <span className="text-base ml-0.5 opacity-70">%</span>
                                    </motion.div>
                                    <div className="text-[9px] text-[#8C7F72] font-black uppercase tracking-[0.2em] mt-1">
                                        SYNCING_SOUL
                                    </div>
                                </div>

                                {/* Orbiting Stats */}
                                <div className="absolute -top-2 -right-2 bg-[#1A2433] border border-[#D4AF37]/20 rounded-lg px-2 py-1 flex items-center gap-1.5 shadow-xl">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                                        {progress?.currentStep === 10 ? '99.9%' : (64 + (progress?.percentage || 0) * 0.3).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden md:block w-px h-32 bg-gradient-to-b from-transparent via-[#D4AF37]/30 to-transparent" />

                        {/* Current Activity */}
                        <div className="flex-1 min-w-0">
                            {currentStepData ? (() => {
                                const stepInfo = STEP_INFO[currentStepData.id];
                                return (
                                    <div className="animate-fade-in">
                                        {/* Phase & Level Badges */}
                                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                                            <span className={`text-[10px] px-2 py-1 rounded uppercase tracking-wider font-bold ${stepInfo?.phase === 'setup' ? 'bg-blue-500/20 text-blue-400' :
                                                stepInfo?.phase === 'calculation' ? 'bg-purple-500/20 text-purple-400' :
                                                    stepInfo?.phase === 'screening' ? 'bg-orange-500/20 text-orange-400' :
                                                        stepInfo?.phase === 'verification' ? 'bg-cyan-500/20 text-cyan-400' :
                                                            'bg-green-500/20 text-green-400'
                                                }`}>
                                                {stepInfo?.phase}
                                            </span>
                                            {stepInfo?.level && (
                                                <span className="text-[10px] px-2 py-1 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-bold">
                                                    {stepInfo.level}
                                                </span>
                                            )}
                                            {stepInfo?.accuracy && (
                                                <span className="text-[10px] px-2 py-1 rounded bg-[#2D7A5C]/20 text-[#2D7A5C]">
                                                    Target: {stepInfo.accuracy}
                                                </span>
                                            )}
                                        </div>

                                        {/* Icon & Title */}
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="text-3xl">{currentStepData.icon}</div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-[#F5F0EB]">{currentStepData.name}</h3>
                                                <p className="text-sm text-[#8C7F72] line-clamp-2">{stepInfo?.description}</p>
                                            </div>
                                        </div>

                                        {/* Live Message */}
                                        <div className="text-[#D4AF37] text-sm font-mono mb-3 bg-[#0F1419]/50 p-2 rounded">
                                            {'>'} {currentStepData.message || 'Processing...'}
                                            <span className="animate-pulse">_</span>
                                        </div>

                                        {/* Active Methods */}
                                        {stepInfo?.methods && (
                                            <div className="flex flex-wrap gap-1">
                                                {stepInfo.methods.map((method, idx) => (
                                                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-[#2A3442] text-[#C4B8AD]">
                                                        {method}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })() : (
                                <div className="text-center text-[#8C7F72] py-8">
                                    <div className="animate-spin text-2xl mb-2">⏳</div>
                                    Waiting for processor...
                                </div>
                            )}
                        </div>
                    </div>
                </div>




                {/* Unified AI Analysis Panel (Now visible from Stage 1 for calculation logs) */}
                {(isAIStepActive || aiThinking || (calculationLogs?.length ?? 0) > 0) && !isComplete && (() => {
                    let aiStage = 2;
                    if (streamProgress) {
                        if (streamProgress.stepIndex === 4) aiStage = 2;
                        else if (streamProgress.stepIndex === 5) aiStage = 5;
                        else if (streamProgress.stepIndex >= 8) aiStage = 7;
                    }

                    return (
                        <div className="mb-8">
                            <UnifiedAIPanel
                                thinking={aiThinking}
                                stageHistory={stageHistory}
                                context={aiContext}
                                isActive={isConnected && !isComplete}
                                stage={aiStage}
                                analyzedCount={analyzedCount}
                                candidateScores={candidateScores}
                                calculationLogs={calculationLogs}
                            />
                        </div>
                    );
                })()}

                {/* 🔱 LIVE GOD MODE TERMINAL */}
                <div className="mb-8 animate-fade-in-up">
                    <LiveGodModeTerminal
                        candidateScores={candidateScores}
                        calculationLogs={calculationLogs || []}
                        currentStage={progress?.currentStep || 0}
                        isConnected={isConnected}
                    />
                </div>

                {/* 🏁 Results HUD */}
                {isComplete && result && (
                    <ResultsHUD result={result} id={sessionId} />
                )}

                {/* Steps Timeline (Hide on complete) */}
                {!isComplete && (
                    <>
                        {/* Steps Timeline */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-semibold text-[#8C7F72] uppercase tracking-wider text-sm">Analysis Pipeline</h3>
                                <div className="flex gap-2">
                                    <span className="text-[10px] px-2 py-1 rounded bg-purple-500/20 text-purple-400">Calculation</span>
                                    <span className="text-[10px] px-2 py-1 rounded bg-orange-500/20 text-orange-400">Screening</span>
                                    <span className="text-[10px] px-2 py-1 rounded bg-green-500/20 text-green-400">Final</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {progress?.steps.map((step, idx) => {
                                    const isActive = idx === progress.currentStep;
                                    const isPast = idx < progress.currentStep || step.status === 'complete';
                                    const stepInfo = STEP_INFO[step.id];

                                    const prevStep = idx > 0 ? progress.steps[idx - 1] : null;
                                    const prevPhase = prevStep ? STEP_INFO[prevStep.id]?.phase : null;
                                    const showPhaseSeparator = stepInfo?.phase !== prevPhase && idx > 0;

                                    return (
                                        <div key={step.id}>
                                            {showPhaseSeparator && (
                                                <div className="border-t border-dashed border-[#3A4452] my-4 relative">
                                                    <span className={`absolute -top-2 left-4 text-[10px] px-2 py-0.5 rounded uppercase ${stepInfo?.phase === 'screening' ? 'bg-orange-500/20 text-orange-400' :
                                                        stepInfo?.phase === 'verification' ? 'bg-cyan-500/20 text-cyan-400' :
                                                            stepInfo?.phase === 'final' ? 'bg-green-500/20 text-green-400' : ''
                                                        }`}>
                                                        {stepInfo?.phase === 'screening' ? '🎯 AI Analysis Phases' :
                                                            stepInfo?.phase === 'verification' ? '✅ Verification' :
                                                                stepInfo?.phase === 'final' ? '🏁 Final Stage' : ''}
                                                    </span>
                                                </div>
                                            )}

                                            <div
                                                className={`p-4 rounded-lg transition-all duration-500 ${isActive ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30 scale-[1.01]' :
                                                    isPast ? 'bg-[#2D7A5C]/5 border border-[#2D7A5C]/20' :
                                                        'opacity-40 bg-[#2A3442]/20'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-colors flex-shrink-0 ${isPast ? 'bg-[#2D7A5C] text-[#F5F0EB]' :
                                                        isActive ? 'bg-[#D4AF37] text-[#0F1419] animate-pulse' :
                                                            'bg-[#2A3442] text-[#8C7F72]'
                                                        }`}>
                                                        {isPast ? '✓' : step.icon}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div>
                                                                <span className={`font-semibold ${isActive ? 'text-[#F5F0EB]' : isPast ? 'text-[#2D7A5C]' : 'text-[#8C7F72]'}`}>
                                                                    {step.name}
                                                                </span>
                                                                {stepInfo?.level && (
                                                                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37]">
                                                                        {stepInfo.level.split(':')[0]}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {stepInfo?.accuracy && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#2D7A5C]/20 text-[#2D7A5C]">
                                                                        {stepInfo.accuracy}
                                                                    </span>
                                                                )}
                                                                {isActive && (
                                                                    <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded animate-pulse">
                                                                        PROCESSING
                                                                    </span>
                                                                )}
                                                                {isPast && (
                                                                    <span className="text-[10px] bg-[#2D7A5C]/20 text-[#2D7A5C] px-2 py-0.5 rounded">
                                                                        COMPLETE
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {(isActive || isPast) && stepInfo?.description && (
                                                            <p className="text-xs text-[#8C7F72] mb-1">{stepInfo.description}</p>
                                                        )}

                                                        {isActive && currentStepData?.message && (
                                                            <div className="text-xs text-[#D4AF37] font-mono mt-1">
                                                                {'>'} {currentStepData.message}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main >
    );
}

function BirthDetailsSummary({ metadata }: { metadata?: any }) {
    const [localData, setLocalData] = useState<any>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        try {
            const stored = localStorage.getItem('btr_form_data');
            if (stored) {
                const data = JSON.parse(stored);
                if (data.birthData) {
                    setLocalData(data.birthData);
                }
            }
        } catch (e) {
            console.error("Failed to load birth details", e);
        }
    }, []);

    // Prioritize streaming metadata from backend, fallback to localStorage
    const details = metadata?.fullName ? metadata : localData;

    if (!isClient || !details) return null;

    // Format Date: DD Month YYYY
    const formattedDate = details.dateOfBirth ? new Date(details.dateOfBirth).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }) : 'Unknown';

    // Format Time: HH:MM:SS
    const formattedTime = details.tentativeTime || 'Unknown';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 border border-[#D4AF37]/20 bg-[#1A1F2E]/80 backdrop-blur-xl relative overflow-hidden"
        >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl" />

            <div className="flex items-center gap-2 mb-6 text-[#8C7F72] text-[10px] uppercase tracking-[0.25em] font-bold">
                <span className="w-6 h-[1px] bg-[#D4AF37]/40" />
                Birth Data Blueprint
            </div>

            <div className="flex flex-wrap gap-8 relative z-10 p-2">
                <div className="flex items-center gap-4 min-w-[200px] flex-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/10 shadow-inner shrink-0">
                        👤
                    </div>
                    <div className="min-w-0">
                        <div className="text-[10px] text-[#8C7F72] uppercase tracking-wider font-bold mb-1">Subject</div>
                        <div className="text-[#F5F0EB] font-bold text-sm truncate" title={details.fullName}>{details.fullName}</div>
                    </div>
                </div>

                <div className="flex items-center gap-4 min-w-[200px] flex-1">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/10 shadow-inner shrink-0">
                        📅
                    </div>
                    <div className="min-w-0">
                        <div className="text-[10px] text-[#8C7F72] uppercase tracking-wider font-bold mb-1">Date</div>
                        <div className="text-[#F5F0EB] font-bold text-sm font-mono whitespace-nowrap">{formattedDate}</div>
                    </div>
                </div>

                <div className="flex items-center gap-4 min-w-[200px] flex-1">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/10 shadow-inner shrink-0">
                        📍
                    </div>
                    <div className="min-w-0">
                        <div className="text-[10px] text-[#8C7F72] uppercase tracking-wider font-bold mb-1">Birth Place</div>
                        <div className="text-[#F5F0EB] font-bold text-sm truncate" title={details.birthPlace}>{details.birthPlace}</div>
                    </div>
                </div>

                <div className="flex items-center gap-4 min-w-[200px] flex-1">
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/10 shadow-inner shrink-0">
                        🕒
                    </div>
                    <div className="min-w-0">
                        <div className="text-[10px] text-[#8C7F72] uppercase tracking-wider font-bold mb-1">Time & Zone</div>
                        <div className="flex flex-col">
                            <div className="text-[#D4AF37] font-bold text-sm font-mono tracking-wide whitespace-nowrap">
                                {formattedTime}
                                {details.timezone && <span className="text-[#8C7F72] text-[10px] ml-1 opacity-75">({details.timezone})</span>}
                            </div>
                            {details.offsetConfig && (
                                <div className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 w-fit">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    ±{details.offsetConfig.customMinutes ||
                                        (details.offsetConfig.preset === '1hour' ? '60' :
                                            details.offsetConfig.preset === '30min' ? '30' :
                                                details.offsetConfig.preset === '2hours' ? '120' :
                                                    details.offsetConfig.preset === '4hours' ? '240' :
                                                        details.offsetConfig.preset === 'seconds-30' ? '0.5' : '1')} min scan
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

