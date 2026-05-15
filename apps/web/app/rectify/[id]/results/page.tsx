import { Suspense, cache } from 'react';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { ResultsDashboardClient } from './ResultsDashboardClient';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { Breadcrumbs, predefinedBreadcrumbs } from '@/components/ui/Breadcrumbs';
import { getWebEncryption } from '@/lib/crypto';
import { logger } from '@/lib/secure-logger';
import '@/app/globals.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


const crypto = getWebEncryption();
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

        if (!session || session.externalId !== userId) {
            return null;
        }

        // 3. Robust Data Reconstruction
        const sessionUserId = session.userId;
        const birthData = {
            fullName: crypto.parseField(session.fullName, sessionUserId, 'Unencryptable Session'),
            dateOfBirth: crypto.parseField(session.dateOfBirth, sessionUserId, 'Not set'),
            tentativeTime: crypto.parseField(session.tentativeTime, sessionUserId, 'Not set'),
            birthPlace: crypto.parseField(session.birthPlace, sessionUserId, 'Unknown'),
            latitude: session.latitude,
            longitude: session.longitude,
            timezone: session.timezone,
            gender: session.gender || 'male',
        };

        // Use parseSensitiveField for complex JSON structures
        const analysisResult = crypto.parseField<Record<string, unknown>>(session.analysisResult as string | null, sessionUserId, {});
        const reasoningLogs = crypto.parseField<Record<string, unknown>[]>(session.reasoningLogs as string | null, sessionUserId, []);
        return {
            ...session,
            birthData,
            analysisResult,
            reasoningLogs,
            rectifiedTime: (session as Record<string, unknown>)?.rectifiedTime ?? (analysisResult as Record<string, unknown>)?.rectifiedTime ?? null,
            accuracy: (session as Record<string, unknown>)?.accuracy ?? (analysisResult as Record<string, unknown>)?.accuracy ?? null,
            confidence: (session as Record<string, unknown>)?.confidence ?? (analysisResult as Record<string, unknown>)?.confidence ?? null,
        } as Record<string, unknown>;
    } catch (error) {
        logger.error('CRITICAL: Error in getSessionResults', error instanceof Error ? error : new Error(String(error)));
        return null;
    }
});

function ResultsSkeleton() {
    return (
        <Layout>
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#000000] border-t-transparent mx-auto mb-4" />
                    <p className="text-black/40">Loading results...</p>
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
                    <div className="w-20 h-20 rounded-full bg-[#000000]/10 flex items-center justify-center mb-6">
                        <span className="text-4xl">🔍</span>
                    </div>
                    <h1 className="text-2xl font-medium text-black mb-4 font-sans">No Results Found</h1>
                    <p className="text-black/60 mb-8 max-w-md">The analysis may still be in progress or has not completed yet.</p>
                    <div className="flex gap-4">
                        <Link
                            href={`/rectify/${id}`}
                            className="px-6 py-3 bg-white border border-black/10 text-black rounded-2xl hover:border-[#000000]/50 transition-colors"
                        >
                            Check Progress
                        </Link>
                        <Link
                            href="/dashboard"
                            className="px-6 py-3 bg-black text-white rounded-2xl font-medium hover:shadow-sm transition-all"
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
