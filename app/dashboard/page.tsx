// app/dashboard/page.tsx
// User Dashboard - Analysis History and Profile

import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/database/drizzle';
import { sessions, users } from '@/database/schema';
import { eq, desc } from 'drizzle-orm';
import { safeDecrypt } from '@/lib/crypto';

async function getUserSessions(clerkId: string) {
    try {
        // First get the user
        const user = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId),
        });

        if (!user) {
            return [];
        }

        // Get their sessions - handle missing forensicTraits column gracefully
        let userSessions: any[] = [];
        try {
            const result = await db.query.sessions.findMany({
                where: eq(sessions.userId, user.id),
                orderBy: [desc(sessions.createdAt)],
            });
            userSessions = result;
        } catch (dbError: any) {
            if (dbError.message?.includes('forensicTraits') || dbError.message?.includes('no such column')) {
                console.log('[Dashboard] forensicTraits column missing, using fallback query...');
                const { client } = await import('@/database/drizzle');
                const rawResult = await client.execute({
                    sql: `SELECT id, userId, clerkId, fullName, dateOfBirth, tentativeTime,
                          birthPlace, latitude, longitude, timezone, gender, physicalTraits,
                          lifeEvents, offsetConfig, rectifiedTime, accuracy, confidence,
                          analysisResult, progressData, reasoningLogs, status, errorMessage,
                          createdAt, updatedAt, completedAt
                          FROM sessions WHERE userId = ? ORDER BY createdAt DESC`,
                    args: [user.id]
                });
                userSessions = rawResult.rows as any[];
            } else {
                throw dbError;
            }
        }

        // Decrypt names for display
        return userSessions.map(s => ({
            ...s,
            fullName: safeDecrypt(s.fullName, clerkId)
        }));
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return [];
    }
}

export default async function DashboardPage() {
    const user = await currentUser();

    if (!user) {
        return null;
    }

    const userSessions = await getUserSessions(user.id);

    return (
        <main className="min-h-screen bg-[#0F1419]">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-[#0F1419]/90 backdrop-blur-xl border-b border-[#D4AF37]/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F5D061] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform">
                            <span className="text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">🕉️</span>
                        </div>
                        <span className="font-bold text-xl text-[#D4AF37] tracking-tight">AI Pandit</span>
                    </Link>

                    <div className="flex items-center gap-6">
                        <Link href="/rectify" className="text-[#C4B8AD] hover:text-[#D4AF37] transition-colors">
                            New Analysis
                        </Link>
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: 'w-10 h-10 border-2 border-[#D4AF37]/50'
                                }
                            }}
                        />
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-[#F5F0EB] mb-2">
                        Welcome back, {user.firstName || 'User'}! 👋
                    </h1>
                    <p className="text-[#C4B8AD]">
                        Manage your birth time analyses and view results
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <Link
                        href="/rectify"
                        className="glass-card p-6 hover:border-[#D4AF37]/40 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="text-2xl">✨</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#F5F0EB]">New Analysis</h3>
                                <p className="text-sm text-[#8C7F72]">Start a new BTR</p>
                            </div>
                        </div>
                    </Link>

                    <div className="glass-card p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#6A0572]/20 to-[#6A0572]/5 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">📊</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#F5F0EB]">Total Analyses</h3>
                                <p className="text-2xl font-bold text-[#D4AF37]">{userSessions.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#2D7A5C]/20 to-[#2D7A5C]/5 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">✅</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#F5F0EB]">Completed</h3>
                                <p className="text-2xl font-bold text-[#2D7A5C]">
                                    {userSessions.filter(s => s.status === 'complete').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analysis History */}
                <div>
                    <h2 className="text-2xl font-bold text-[#F5F0EB] mb-6">Your Analyses</h2>

                    {userSessions.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <div className="text-6xl mb-4">🔮</div>
                            <h3 className="text-xl font-semibold text-[#F5F0EB] mb-2">
                                No analyses yet
                            </h3>
                            <p className="text-[#C4B8AD] mb-6">
                                Start your first birth time rectification analysis to discover your precise birth time.
                            </p>
                            <Link
                                href="/rectify"
                                className="inline-block bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#0F1419] px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                            >
                                Start First Analysis →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {userSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="glass-card p-6 hover:border-[#D4AF37]/30 transition-all"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-[#F5F0EB]">👤 {session.fullName}</h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${session.status === 'complete'
                                                    ? 'bg-[#2D7A5C]/20 text-[#2D7A5C] border border-[#2D7A5C]/50'
                                                    : session.status === 'processing'
                                                        ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50 animate-pulse'
                                                        : session.status === 'failed'
                                                            ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/50'
                                                            : 'bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/50'
                                                    }`}>
                                                    {session.status === 'complete' ? '✓ GOD-TIER VERIFIED' :
                                                        session.status === 'processing' ? '⚡ ANALYZING MULTIVERSE' :
                                                            session.status === 'failed' ? '✗ FAILED' :
                                                                '🕒 QUEUED'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#8C7F72]">
                                                DOB: {session.dateOfBirth} • {session.birthPlace}
                                            </p>
                                            {session.rectifiedTime && (
                                                <div className="mt-2 flex items-center gap-4">
                                                    <p className="text-sm text-[#D4AF37]">
                                                        <span className="text-[#8C7F72] uppercase text-[10px] tracking-wider block mb-1">Rectified Truth</span>
                                                        <span className="font-mono font-bold text-lg">{session.rectifiedTime}</span>
                                                    </p>
                                                    {session.confidence && (
                                                        <div className="flex flex-col gap-1 items-end ml-auto">
                                                            <span className="text-[10px] text-[#2D7A5C] font-bold uppercase tracking-wider">
                                                                {session.confidence} Confidence
                                                            </span>
                                                            <div className="w-24 h-1 bg-[#151a21] rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-[#D4AF37] to-[#2D7A5C]"
                                                                    style={{ width: '99%' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Completed: View Results + Re-analyze */}
                                            {session.status === 'complete' && (
                                                <>
                                                    <Link
                                                        href={`/rectify/${session.id}/results`}
                                                        className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#0F1419] rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                                                    >
                                                        View Results
                                                    </Link>
                                                    <Link
                                                        href={`/rectify/${session.id}/edit`}
                                                        className="px-3 py-2 border border-[#6A0572]/50 text-[#6A0572] rounded-lg font-medium text-sm hover:bg-[#6A0572]/10 transition-colors"
                                                    >
                                                        🔄 Re-analyze
                                                    </Link>
                                                </>
                                            )}

                                            {/* Processing: View Progress */}
                                            {session.status === 'processing' && (
                                                <Link
                                                    href={`/rectify/${session.id}`}
                                                    className="px-4 py-2 border border-[#D4AF37]/50 text-[#D4AF37] rounded-lg font-medium text-sm hover:bg-[#D4AF37]/10 transition-colors animate-pulse"
                                                >
                                                    ⏳ View Progress
                                                </Link>
                                            )}

                                            {/* Failed: Edit + Delete */}
                                            {session.status === 'failed' && (
                                                <>
                                                    <Link
                                                        href={`/rectify/${session.id}/edit`}
                                                        className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#0F1419] rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                                                    >
                                                        ✏️ Edit & Retry
                                                    </Link>
                                                </>
                                            )}

                                            {/* Queued/Pending: View Progress (Waiting) */}
                                            {(session.status === 'queued' || session.status === 'pending') && (
                                                <Link
                                                    href={`/rectify/${session.id}`}
                                                    className="px-4 py-2 border border-[#3B82F6]/50 text-[#3B82F6] rounded-lg font-medium text-sm hover:bg-[#3B82F6]/10 transition-colors"
                                                >
                                                    🕒 View Status
                                                </Link>
                                            )}

                                            <span className="text-xs text-[#8C7F72]">
                                                {new Date(session.createdAt || '').toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
