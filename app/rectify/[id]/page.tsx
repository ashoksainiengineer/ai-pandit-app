'use client';

// app/rectify/[id]/page.tsx
// Analysis Progress Page - Real-time stage tracking with enhanced streaming feel

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

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

export default function ProgressPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [queueStatus, setQueueStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let pollInterval: NodeJS.Timeout;

        const fetchProgress = async () => {
            try {
                const res = await fetch(`/api/queue/progress?sessionId=${sessionId}`);

                if (res.status === 404) {
                    setError('Session not found');
                    setLoading(false);
                    return;
                }

                const data = await res.json();

                if (data.error) {
                    setError(data.error);
                    return;
                }

                setQueueStatus({
                    status: data.status,
                    position: data.position,
                    estimatedWait: data.estimatedWaitSeconds
                });

                if (data.progress) {
                    setProgress(data.progress);
                }

                // Handle completion redirect
                if (data.status === 'complete') {
                    // Slight delay to show 100%
                    setTimeout(() => {
                        router.push(`/rectify/${sessionId}/results`);
                    }, 1500);
                } else if (data.status === 'failed') {
                    setError('Analysis failed. Please try again.');
                }

                setLoading(false);

            } catch (err) {
                console.error('Error polling progress:', err);
                // Don't set error immediately, retry
            }
        };

        // Initial fetch
        fetchProgress();

        // Poll every 2 seconds for that "streaming" feel
        pollInterval = setInterval(fetchProgress, 2000);

        return () => clearInterval(pollInterval);
    }, [sessionId, router]);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#0F1419] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#C4B8AD]">Connecting to analysis engine...</p>
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
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Live Analysis
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-[#F5F0EB] mb-2 animate-fade-in">
                        {queueStatus?.status === 'queued' ? (
                            <span>⏳ Waiting in Queue (Position: {queueStatus.position})</span>
                        ) : (
                            <span>🔮 Rectifying Your Birth Time</span>
                        )}
                    </h1>
                    <p className="text-[#C4B8AD] h-6 transition-all duration-300">
                        {progress?.liveMessage || 'Initializing connection...'}
                    </p>
                </div>

                {/* Main Progress Display */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Circle Progress */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="relative w-64 h-64">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="#2A3442"
                                    strokeWidth="6"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="url(#goldGradient)"
                                    strokeWidth="6"
                                    strokeLinecap="round"
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
                                    {progress?.percentage}%
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
                                    className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-500 ${isActive ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/20 scale-[1.02]' :
                                            isPast ? 'opacity-50' : 'opacity-20'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${isPast ? 'bg-[#2D7A5C] text-[#F5F0EB]' :
                                            isActive ? 'bg-[#D4AF37] text-[#0F1419]' :
                                                'bg-[#2A3442] text-[#8C7F72]'
                                        }`}>
                                        {isPast ? '✓' : step.icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-medium ${isActive ? 'text-[#F5F0EB]' : 'text-[#C4B8AD]'}`}>
                                                {step.name}
                                            </span>
                                            {isActive && (
                                                <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded animate-pulse">
                                                    PROCESSING
                                                </span>
                                            )}
                                        </div>

                                        {/* Show details for active or recently completed steps */}
                                        {(isActive || (isPast && idx === progress.currentStep - 1)) && step.message && (
                                            <div className="text-xs text-[#8C7F72] truncate font-mono">
                                                {step.message}
                                            </div>
                                        )}
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
