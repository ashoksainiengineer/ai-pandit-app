import { Suspense, cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { parseSensitiveField, initializeEncryption } from '@/lib/crypto';
import { ResultsDashboardClient } from './ResultsDashboardClient';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { Breadcrumbs, predefinedBreadcrumbs } from '@/components/ui/Breadcrumbs';

// Initialize encryption for server-side decryption
initializeEncryption(process.env.ENCRYPTION_SECRET || process.env.CLERK_ENCRYPTION_KEY);

const getSessionResults = cache(async (sessionId: string, userId: string): Promise<any> => {
    try {
        // 1. Primary Query
        let session = await db.query.sessions.findFirst({
            where: eq(sessions.id, sessionId),
        });

        // 2. SQL Fallback
        if (!session) {
            const results = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
            if (results && results.length > 0) {
                session = results[0] as any;
            }
        }

        if (!session || session.clerkId !== userId) {
            return null;
        }

        // 3. Robust Data Reconstruction
        const birthData = {
            fullName: parseSensitiveField(session.fullName, 'Unencryptable Session'),
            dateOfBirth: parseSensitiveField(session.dateOfBirth, 'Not set'),
            tentativeTime: parseSensitiveField(session.tentativeTime, 'Not set'),
            birthPlace: parseSensitiveField(session.birthPlace, 'Unknown'),
            latitude: session.latitude,
            longitude: session.longitude,
            timezone: session.timezone,
            gender: session.gender || 'male',
        };

        // Use parseSensitiveField for complex JSON structures
        const analysisResult = parseSensitiveField(session.analysisResult, null);
        const reasoningLogs = parseSensitiveField(session.reasoningLogs, null);

        return {
            ...session,
            birthData,
            analysisResult,
            reasoningLogs,
            rectifiedTime: session.rectifiedTime || analysisResult?.rectifiedTime,
            accuracy: session.accuracy || analysisResult?.accuracy,
            confidence: session.confidence || analysisResult?.confidence,
        };
    } catch (error) {
        console.error('CRITICAL: Error in getSessionResults:', error);
        return null;
    }
});

function ResultsSkeleton() {
    return (
        <Layout>
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#78611D] border-t-transparent mx-auto mb-4" />
                    <p className="text-[#8C7F72]">Loading results...</p>
                </div>
            </div>
        </Layout>
    );
}

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await currentUser();
    if (!user) {
        redirect('/sign-in');
    }

    const session = await getSessionResults(id, user.id);

    if (!session) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-6 pt-6">
                    <Breadcrumbs items={predefinedBreadcrumbs.results(id)} className="mb-6" />
                </div>
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                    <div className="w-20 h-20 rounded-full bg-[#B8860B]/10 flex items-center justify-center mb-6">
                        <span className="text-4xl">🔍</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#1A1612] mb-4 font-[family-name:var(--font-cormorant)]">No Results Found</h1>
                    <p className="text-[#7A756F] mb-8 max-w-md">The analysis may still be in progress or has not completed yet.</p>
                    <div className="flex gap-4">
                        <Link
                            href={`/rectify/${id}`}
                            className="px-6 py-3 bg-white border border-[#F0E8DE] text-[#1A1612] rounded-xl hover:border-[#78611D]/50 transition-colors"
                        >
                            Check Progress
                        </Link>
                        <Link
                            href="/dashboard"
                            className="px-6 py-3 bg-gradient-to-r from-[#B8860B] to-[#78611D] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Suspense fallback={<ResultsSkeleton />}>
            <ResultsDashboardClient id={id} initialSession={session as any} />
        </Suspense>
    );
}
