'use client';

// app/rectify/[id]/page.tsx
// Analysis Progress Page - Real-time SSE streaming with AI thinking display

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useStreamProgress } from '@/lib/use-stream-progress';
import AIThinkingStream from '@/components/rectify/AIThinkingStream';

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

// Default analysis steps
const DEFAULT_STEPS: ProgressStep[] = [
    { id: 'init', name: 'Initializing Analysis', icon: '🚀', status: 'pending' },
    { id: 'ephemeris', name: 'Calculating Planetary Positions', icon: '🔭', status: 'pending' },
    { id: 'houses', name: 'Determining House Cusps', icon: '🏠', status: 'pending' },
    { id: 'candidates', name: 'Generating Candidate Times', icon: '⏰', status: 'pending' },
    { id: 'dasha', name: 'Analyzing Vimshottari Dasha', icon: '📊', status: 'pending' },
    { id: 'divisional', name: 'Processing Divisional Charts', icon: '📐', status: 'pending' },
    { id: 'events', name: 'Correlating Life Events', icon: '📅', status: 'pending' },
    { id: 'physical', name: 'Matching Physical Traits', icon: '👤', status: 'pending' },
    { id: 'ai', name: 'AI Cross-Verification', icon: '🤖', status: 'pending' },
    { id: 'final', name: 'Finalizing Results', icon: '✨', status: 'pending' },
];

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
        result
    } = useStreamProgress(sessionId); // Use local relative proxy

    // Cancel analysis state
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelled, setCancelled] = useState(false);

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

            if (!token) {
                console.warn('No auth token available for cancellation');
            }

            const response = await fetch(`/api/queue/cancel`, { // Use local relative proxy
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ sessionId }),
                credentials: 'include',
            });

            const data = await response.json();
            if (data.success) {
                setCancelled(true);
                setTimeout(() => router.push('/rectify'), 2000);
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
        }
    }, [streamError]);

    // Check if AI step is active (Stages 2, 5, 7 use AI)
    // stepIndex mapping: 0=init, 1=ephemeris, 2=houses, 3=candidates(Stage2), 4=dasha(Stage5), 5=divisional(Stage7), 6=events, 7=physical, 8=ai, 9=final
    const aiSteps = ['candidates', 'dasha', 'divisional', 'ai'];
    const isAIStepActive = aiSteps.includes(streamProgress?.step || '') ||
        (streamProgress?.stepIndex !== undefined && [3, 4, 5, 8].includes(streamProgress.stepIndex));

    if (loading && !isConnected) {
        return (
            <main className="min-h-screen bg-[#0F1419] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#C4B8AD]">Connecting to analysis engine...</p>
                    <p className="text-xs text-[#8C7F72] mt-2">Establishing real-time connection...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-[#0F1419] flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold text-[#F5F0EB] mb-2">Something went wrong</h1>
                    <p className="text-[#C4B8AD] mb-6">{error}</p>
                    <Link href="/rectify" className="inline-block px-6 py-3 bg-[#D4AF37] text-[#0F1419] rounded-lg font-bold hover:opacity-90 transition-opacity">
                        Start New Analysis
                    </Link>
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

            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-[#F5F0EB] mb-2 animate-fade-in">
                        🔮 Rectifying Your Birth Time
                    </h1>
                    <p className="text-[#C4B8AD] h-6 transition-all duration-300">
                        {progress?.liveMessage || 'Initializing analysis...'}
                    </p>
                </div>

                {/* Main Progress Display */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Circle Progress */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="relative w-64 h-64">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#2A3442" strokeWidth="6" />
                                <circle
                                    cx="50" cy="50" r="45" fill="none"
                                    stroke="url(#goldGradient)" strokeWidth="6" strokeLinecap="round"
                                    strokeDasharray={`${(progress?.percentage || 0) * 2.83} 283`}
                                    className="transition-all duration-700 ease-out"
                                />
                                <defs>
                                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#D4AF37" />
                                        <stop offset="100%" stopColor="#E8C54D" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                                <div className="text-5xl font-bold text-[#D4AF37] mb-1">
                                    {progress?.percentage || 0}%
                                </div>
                                <div className="text-sm text-[#8C7F72] uppercase tracking-wider">Complete</div>
                            </div>
                        </div>
                    </div>

                    {/* Current Activity Card */}
                    <div className="glass-card p-6 border border-[#D4AF37]/30 flex flex-col justify-center min-h-[250px]">
                        {currentStepData ? (
                            <div className="animate-fade-in">
                                <div className="text-4xl mb-4">{currentStepData.icon}</div>
                                <h3 className="text-xl font-bold text-[#F5F0EB] mb-2">{currentStepData.name}</h3>
                                <div className="text-[#D4AF37] text-sm font-mono mb-4">
                                    {'>'} {currentStepData.message || 'Processing...'}
                                    <span className="animate-pulse">_</span>
                                </div>
                                {currentStepData.details && (
                                    <div className="space-y-1">
                                        {currentStepData.details.slice(-3).map((detail, idx) => (
                                            <div key={idx} className="text-xs text-[#8C7F72] flex items-center gap-2">
                                                <span className="w-1 h-1 bg-[#2D7A5C] rounded-full" />
                                                {detail}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-[#8C7F72]">
                                <div className="animate-spin text-2xl mb-2">⏳</div>
                                Waiting for processor...
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Thinking Stream - Shows when AI step is active */}
                {(isAIStepActive || aiThinking) && (() => {
                    // Determine AI Stage for title (Default to 2/Level 1)
                    let aiStage = 2;
                    if (streamProgress) {
                        if (streamProgress.step === 'dasha' || streamProgress.stepIndex === 4) aiStage = 5;
                        else if (['divisional', 'ai', 'final'].includes(streamProgress.step || '') || [5, 8, 9].includes(streamProgress.stepIndex || -1)) aiStage = 7;
                    }

                    return (
                        <div className="mb-12">
                            <AIThinkingStream
                                thinking={aiThinking}
                                isActive={isAIStepActive}
                                stage={aiStage}
                            />
                        </div>
                    );
                })()}

                {/* Steps Timeline */}
                <div className="glass-card p-6">
                    <h3 className="font-semibold text-[#8C7F72] uppercase tracking-wider text-sm mb-6">Analysis Pipeline</h3>
                    <div className="space-y-2">
                        {progress?.steps.map((step, idx) => {
                            const isActive = idx === progress.currentStep;
                            const isPast = idx < progress.currentStep || step.status === 'complete';

                            return (
                                <div
                                    key={step.id}
                                    className={`p-3 rounded-lg transition-all duration-500 ${isActive ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/20 scale-[1.02]' :
                                        isPast ? 'bg-[#2D7A5C]/5 border border-[#2D7A5C]/20' :
                                            'opacity-30 bg-[#2A3442]/30'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors flex-shrink-0 ${isPast ? 'bg-[#2D7A5C] text-[#F5F0EB]' :
                                            isActive ? 'bg-[#D4AF37] text-[#0F1419]' :
                                                'bg-[#2A3442] text-[#8C7F72]'
                                            }`}>
                                            {isPast ? '✓' : step.icon}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`font-medium ${isActive ? 'text-[#F5F0EB]' : isPast ? 'text-[#2D7A5C]' : 'text-[#8C7F72]'}`}>
                                                    {step.name}
                                                </span>
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

                                            {(isActive || isPast) && step.message && (
                                                <div className="text-xs text-[#C4B8AD] font-mono">
                                                    {step.message}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </main>
    );
}
