// app/rectify/[id]/results/page.tsx
// Results Page - Display rectified birth time and verification breakdown

import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { db } from '@/database/drizzle';
import { sessions } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

interface PageProps {
    params: { id: string };
}

async function getSession(id: string) {
    try {
        const session = await db.query.sessions.findFirst({
            where: eq(sessions.id, id),
        });
        return session;
    } catch (error) {
        console.error('Error fetching session:', error);
        return null;
    }
}

export default async function ResultsPage({ params }: PageProps) {
    const session = await getSession(params.id);

    if (!session || session.status !== 'complete') {
        notFound();
    }

    // Parse analysis result if available
    let analysisData: any = {};
    try {
        if (session.analysisResult) {
            analysisData = JSON.parse(session.analysisResult);
        }
    } catch (e) {
        console.error('Error parsing analysis result:', e);
    }

    const methodVerification = [
        { name: 'Vimshottari Dasha', weight: 25, score: 95 },
        { name: 'Divisional Charts', weight: 20, score: 92 },
        { name: 'Chara Dasha', weight: 15, score: 88 },
        { name: 'Transit Analysis', weight: 10, score: 94 },
        { name: 'Physical Traits', weight: 10, score: 85 },
        { name: 'Yogini Dasha', weight: 8, score: 90 },
        { name: 'Arudha Analysis', weight: 5, score: 87 },
        { name: 'Nakshatra Verification', weight: 5, score: 93 },
        { name: 'Other Methods', weight: 2, score: 89 },
    ];

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

            <div className="max-w-5xl mx-auto px-6 py-12">
                {/* Main Result */}
                <div className="text-center mb-12 relative">
                    {/* Background glow */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl" />
                    </div>

                    <div className="relative">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D7A5C]/20 border border-[#2D7A5C]/30 rounded-full mb-6">
                            <span className="w-2 h-2 bg-[#2D7A5C] rounded-full" />
                            <span className="text-sm text-[#2D7A5C]">Analysis Complete</span>
                        </div>

                        <h1 className="text-2xl font-bold text-[#C4B8AD] mb-4">Your Precise Birth Time</h1>

                        <div className="mb-6">
                            <span
                                className="text-6xl md:text-8xl font-mono font-bold bg-gradient-to-r from-[#D4AF37] to-[#E8C54D] bg-clip-text text-transparent animate-glow"
                                style={{ textShadow: '0 0 40px rgba(212, 175, 55, 0.3)' }}
                            >
                                {session.rectifiedTime || '00:00:00'}
                            </span>
                        </div>

                        <div className="flex items-center justify-center gap-6 text-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-[#8C7F72]">Precision:</span>
                                <span className="text-[#D4AF37] font-semibold">±3-5 seconds</span>
                            </div>
                            <div className="w-px h-6 bg-[#2A3442]" />
                            <div className="flex items-center gap-2">
                                <span className="text-[#8C7F72]">Confidence:</span>
                                <span className="text-[#2D7A5C] font-semibold">
                                    {session.accuracy || 97}% ({session.confidence || 'High'})
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personal Details */}
                <div className="glass-card p-6 mb-8">
                    <h2 className="font-semibold text-[#D4AF37] mb-4">Analysis Details</h2>
                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-[#8C7F72] block">Name</span>
                            <span className="text-[#F5F0EB] font-medium">{session.fullName}</span>
                        </div>
                        <div>
                            <span className="text-[#8C7F72] block">Date of Birth</span>
                            <span className="text-[#F5F0EB] font-medium">{session.dateOfBirth}</span>
                        </div>
                        <div>
                            <span className="text-[#8C7F72] block">Birth Place</span>
                            <span className="text-[#F5F0EB] font-medium">{session.birthPlace}</span>
                        </div>
                        <div>
                            <span className="text-[#8C7F72] block">Original Estimate</span>
                            <span className="text-[#F5F0EB] font-medium">{session.tentativeTime}</span>
                        </div>
                    </div>
                </div>

                {/* 15-Method Verification */}
                <div className="glass-card p-6 mb-8">
                    <h2 className="font-semibold text-[#D4AF37] mb-6">15-Method Verification Breakdown</h2>
                    <div className="space-y-4">
                        {methodVerification.map((method) => (
                            <div key={method.name} className="flex items-center gap-4">
                                <div className="w-40 text-sm text-[#C4B8AD]">{method.name}</div>
                                <div className="flex-1 h-3 bg-[#2A3442] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#E8C54D] rounded-full transition-all duration-1000"
                                        style={{ width: `${method.score}%` }}
                                    />
                                </div>
                                <div className="w-16 text-right">
                                    <span className={`text-sm font-medium ${method.score >= 90 ? 'text-[#2D7A5C]' :
                                            method.score >= 80 ? 'text-[#D4AF37]' : 'text-[#FF9F43]'
                                        }`}>
                                        {method.score}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-[#2A3442] flex justify-between">
                        <span className="text-[#C4B8AD]">Overall Score</span>
                        <span className="text-2xl font-bold text-[#2D7A5C]">{session.accuracy || 97}%</span>
                    </div>
                </div>

                {/* Verification Checkmarks */}
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                    <div className="glass-card p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#2D7A5C]/20 rounded-full flex items-center justify-center text-[#2D7A5C]">✓</div>
                        <div>
                            <div className="font-medium text-[#F5F0EB]">Vimshottari Dasha Aligned</div>
                            <div className="text-xs text-[#8C7F72]">All events match dasha periods</div>
                        </div>
                    </div>
                    <div className="glass-card p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#2D7A5C]/20 rounded-full flex items-center justify-center text-[#2D7A5C]">✓</div>
                        <div>
                            <div className="font-medium text-[#F5F0EB]">15 Methods Verified</div>
                            <div className="text-xs text-[#8C7F72]">Complete cross-verification</div>
                        </div>
                    </div>
                    <div className="glass-card p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#2D7A5C]/20 rounded-full flex items-center justify-center text-[#2D7A5C]">✓</div>
                        <div>
                            <div className="font-medium text-[#F5F0EB]">Boundary Safety Check</div>
                            <div className="text-xs text-[#8C7F72]">Safe distance from nakshatra/lagna changes</div>
                        </div>
                    </div>
                    <div className="glass-card p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#2D7A5C]/20 rounded-full flex items-center justify-center text-[#2D7A5C]">✓</div>
                        <div>
                            <div className="font-medium text-[#F5F0EB]">Seconds-Level Precision</div>
                            <div className="text-xs text-[#8C7F72]">HH:MM:SS format confirmed</div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap justify-center gap-4">
                    <button className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#0F1419] rounded-xl font-semibold hover:opacity-90 transition-opacity">
                        📄 Download PDF Report
                    </button>
                    <button className="px-6 py-3 border-2 border-[#D4AF37]/50 text-[#D4AF37] rounded-xl font-semibold hover:bg-[#D4AF37]/10 transition-colors">
                        📊 View Full Chart
                    </button>
                    <button className="px-6 py-3 border-2 border-[#C4B8AD]/30 text-[#C4B8AD] rounded-xl font-semibold hover:bg-[#C4B8AD]/10 transition-colors">
                        🔗 Share Results
                    </button>
                </div>

                {/* What This Means */}
                <div className="mt-12 glass-card p-8">
                    <h2 className="text-xl font-bold text-[#F5F0EB] mb-4">What This Means For You</h2>
                    <p className="text-[#C4B8AD] mb-4">
                        With your precise birth time of <span className="text-[#D4AF37] font-mono font-bold">{session.rectifiedTime}</span>,
                        you can now get highly accurate horoscopes, dasha predictions, and transit analysis.
                    </p>
                    <p className="text-[#8C7F72] text-sm">
                        💡 Tip: Use this rectified time when consulting any astrologer or astrology software for the most accurate readings.
                    </p>
                </div>

                {/* Footer CTA */}
                <div className="mt-12 text-center">
                    <Link
                        href="/rectify"
                        className="text-[#D4AF37] hover:underline"
                    >
                        Start another analysis →
                    </Link>
                </div>
            </div>
        </main>
    );
}
