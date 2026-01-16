'use client';

// app/rectify/[id]/page.tsx
// Analysis Progress Page - Real-time stage tracking

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

interface SessionData {
    id: string;
    fullName: string;
    dateOfBirth: string;
    tentativeTime: string;
    birthPlace: string;
    status: string;
    rectifiedTime?: string;
    accuracy?: number;
    confidence?: string;
    createdAt: string;
}

const STAGES = [
    { num: 1, name: 'Coarse Grid', desc: 'Generating 5-15 min candidates', icon: '📍' },
    { num: 2, name: 'AI Level 1', desc: 'Gross screening analysis', icon: '🤖' },
    { num: 3, name: 'Convergence', desc: 'Finding best window', icon: '🎯' },
    { num: 4, name: 'Fine Grid', desc: '30-second intervals', icon: '⏲️' },
    { num: 5, name: 'AI Level 2', desc: 'Fine comparison', icon: '🧠' },
    { num: 6, name: 'Micro Grid', desc: '6-second intervals', icon: '🔬' },
    { num: 7, name: 'AI Level 3', desc: 'Final decision', icon: '✨' },
    { num: 8, name: 'Verification', desc: '15-method check', icon: '✅' },
    { num: 9, name: 'Boundary Check', desc: 'Safety validation', icon: '🛡️' },
    { num: 10, name: 'Complete', desc: 'Results ready', icon: '🏆' },
];

export default function ProgressPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    const [session, setSession] = useState<SessionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentStage, setCurrentStage] = useState(1);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch(`/api/queue?sessionId=${sessionId}`);
                const data = await res.json();

                if (data.session) {
                    setSession(data.session);

                    // Determine stage based on status
                    if (data.session.status === 'complete') {
                        setCurrentStage(10);
                        setProgress(100);
                        // Redirect to results after a moment
                        setTimeout(() => {
                            router.push(`/rectify/${sessionId}/results`);
                        }, 2000);
                    } else if (data.session.status === 'processing') {
                        // Simulate progress based on time elapsed
                        const createdAt = new Date(data.session.createdAt);
                        const elapsed = (Date.now() - createdAt.getTime()) / 1000;
                        const estimatedTotal = 600; // 10 minutes
                        const progressPct = Math.min(95, (elapsed / estimatedTotal) * 100);
                        setProgress(progressPct);
                        setCurrentStage(Math.min(9, Math.floor(progressPct / 10) + 1));
                    } else if (data.session.status === 'failed') {
                        setProgress(0);
                    }
                }
            } catch (error) {
                console.error('Error fetching session:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
        const interval = setInterval(fetchSession, 5000);
        return () => clearInterval(interval);
    }, [sessionId, router]);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#0F1419] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#C4B8AD]">Loading analysis...</p>
                </div>
            </main>
        );
    }

    if (!session) {
        return (
            <main className="min-h-screen bg-[#0F1419] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold text-[#F5F0EB] mb-2">Session Not Found</h1>
                    <p className="text-[#C4B8AD] mb-6">The analysis session could not be found.</p>
                    <Link href="/dashboard" className="text-[#D4AF37] hover:underline">
                        Return to Dashboard
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#0F1419]">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-[#0F1419]/90 backdrop-blur-xl border-b border-[#D4AF37]/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="text-2xl">🕉️</span>
                        <span className="font-bold text-xl text-[#D4AF37]">AI Pandit</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="text-[#C4B8AD] hover:text-[#D4AF37] transition-colors">
                            Dashboard
                        </Link>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-[#F5F0EB] mb-2">
                        {session.status === 'complete'
                            ? '✅ Analysis Complete!'
                            : session.status === 'failed'
                                ? '❌ Analysis Failed'
                                : '🔮 Analyzing Your Birth Time...'}
                    </h1>
                    <p className="text-[#C4B8AD]">
                        {session.fullName} • DOB: {session.dateOfBirth}
                    </p>
                </div>

                {/* Progress Circle */}
                <div className="flex justify-center mb-12">
                    <div className="relative w-48 h-48">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            {/* Background circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="#2A3442"
                                strokeWidth="8"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="url(#goldGradient)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${progress * 2.83} 283`}
                                className="transition-all duration-1000"
                            />
                            <defs>
                                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#D4AF37" />
                                    <stop offset="100%" stopColor="#E8C54D" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-[#D4AF37]">{Math.round(progress)}%</span>
                            <span className="text-sm text-[#8C7F72]">Stage {currentStage}/10</span>
                        </div>
                    </div>
                </div>

                {/* Stage List */}
                <div className="glass-card p-6">
                    <h2 className="font-semibold text-[#F5F0EB] mb-6">10-Stage Algorithm Progress</h2>
                    <div className="space-y-3">
                        {STAGES.map((stage) => {
                            const isComplete = stage.num < currentStage;
                            const isCurrent = stage.num === currentStage;
                            const isPending = stage.num > currentStage;

                            return (
                                <div
                                    key={stage.num}
                                    className={`flex items-center gap-4 p-3 rounded-xl transition-all ${isCurrent ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30' :
                                            isComplete ? 'opacity-60' : 'opacity-40'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isComplete ? 'bg-[#2D7A5C] text-white' :
                                            isCurrent ? 'bg-[#D4AF37] text-[#0F1419]' :
                                                'bg-[#2A3442] text-[#8C7F72]'
                                        }`}>
                                        {isComplete ? '✓' : isCurrent ? (
                                            <span className="animate-pulse">{stage.icon}</span>
                                        ) : stage.num}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-[#F5F0EB]">{stage.name}</div>
                                        <div className="text-xs text-[#8C7F72]">{stage.desc}</div>
                                    </div>
                                    {isCurrent && session.status === 'processing' && (
                                        <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Estimated Time */}
                {session.status === 'processing' && (
                    <div className="mt-8 text-center">
                        <p className="text-[#8C7F72]">
                            Estimated time remaining: <span className="text-[#D4AF37]">~{Math.max(1, Math.round((100 - progress) * 0.6))} minutes</span>
                        </p>
                        <p className="text-xs text-[#8C7F72] mt-2">
                            You can close this page. We'll save your results automatically.
                        </p>
                    </div>
                )}

                {session.status === 'complete' && (
                    <div className="mt-8 text-center">
                        <Link
                            href={`/rectify/${sessionId}/results`}
                            className="inline-block bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#0F1419] px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                        >
                            View Results →
                        </Link>
                    </div>
                )}

                {session.status === 'failed' && (
                    <div className="mt-8 text-center">
                        <p className="text-[#EF4444] mb-4">Something went wrong during analysis.</p>
                        <Link
                            href="/rectify"
                            className="inline-block bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#0F1419] px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                        >
                            Try Again
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
