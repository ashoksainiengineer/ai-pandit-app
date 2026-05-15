import { Suspense, cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import type { Session } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { EditSessionClient, EditSessionClientProps } from './EditSessionClient';
import Layout from '@/components/Layout';
import { getWebEncryption } from '@/lib/crypto';
import { logger } from '@/lib/secure-logger';
import type { LifeEvent } from '@/lib/types';
import '@/app/globals.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


const crypto = getWebEncryption();
const getSessionData = cache(async (sessionId: string, userId: string): Promise<Record<string, unknown> | null> => {
    try {
        // 1. Primary Query using Drizzle Relation API
        let session = await db.query.sessions.findFirst({
            where: eq(sessions.id, sessionId),
        });

        // 2. SQL Fallback: If relation query fails or returns nothing, try raw SQL for resilience
        if (!session) {
            const results = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
            if (results && results.length > 0) {
                session = results[0] as unknown as Session;
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

        return {
            ...session,
            birthData,
            lifeEvents: crypto.parseField(session.lifeEvents, sessionUserId, []) as LifeEvent[],
            spouseData: crypto.parseField(session.spouseData, sessionUserId),
            offsetConfig: crypto.parseField(session.offsetConfig, sessionUserId),
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
                <div className="w-16 h-16 border-4 border-[#000000] border-t-transparent rounded-full animate-spin" />
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
            <EditSessionClient sessionId={id} initialData={initialData as unknown as EditSessionClientProps['initialData']} />
        </Suspense>
    );
}
