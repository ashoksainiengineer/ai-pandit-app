import { Suspense, cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { EditSessionClient } from './EditSessionClient';
import Layout from '@/components/Layout';
import { env } from '@/lib/config/env';
import { initializeEncryption, parseSensitiveField } from '@/lib/crypto';
import { logger } from '@/lib/secure-logger';
import '@/app/prism-design-system.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Initialize encryption for server-side decryption
initializeEncryption(env.security.encryptionSecret);

const getSessionData = cache(async (sessionId: string, userId: string): Promise<any> => {
    try {
        // 1. Primary Query using Drizzle Relation API
        let session = await db.query.sessions.findFirst({
            where: eq(sessions.id, sessionId),
        });

        // 2. SQL Fallback: If relation query fails or returns nothing, try raw SQL for resilience
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
        const sessionUserId = session.userId;
        const birthData = {
            fullName: parseSensitiveField(session.fullName, sessionUserId, 'Unencryptable Session'),
            dateOfBirth: parseSensitiveField(session.dateOfBirth, sessionUserId, 'Not set'),
            tentativeTime: parseSensitiveField(session.tentativeTime, sessionUserId, 'Not set'),
            birthPlace: parseSensitiveField(session.birthPlace, sessionUserId, 'Unknown'),
            latitude: session.latitude,
            longitude: session.longitude,
            timezone: session.timezone,
            gender: session.gender || 'male',
        };

        return {
            ...session,
            birthData,
            lifeEvents: parseSensitiveField(session.lifeEvents, sessionUserId, []),
            physicalTraits: parseSensitiveField(session.physicalTraits, sessionUserId, undefined),
            forensicTraits: parseSensitiveField(session.forensicTraits, sessionUserId, undefined),
            spouseData: parseSensitiveField(session.spouseData, sessionUserId, undefined),
            offsetConfig: parseSensitiveField(session.offsetConfig, sessionUserId, undefined),
        };
    } catch (error) {
        logger.error('CRITICAL: Error in getSessionData', error instanceof Error ? error : new Error(String(error)));
        return null;
    }
});

function EditPageSkeleton() {
    return (
        <Layout hideFooter>
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
            </div>
        </Layout>
    );
}

export default async function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await currentUser();
    if (!user) {
        redirect('/sign-in');
    }

    const initialData = await getSessionData(id, user.id);

    if (!initialData) {
        notFound();
    }

    return (
        <Suspense fallback={<EditPageSkeleton />}>
            <EditSessionClient sessionId={id} initialData={initialData as any} />
        </Suspense>
    );
}
