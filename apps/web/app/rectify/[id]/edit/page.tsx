import { Suspense, cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { parseSensitiveField, initializeEncryption } from '@/lib/crypto';
import { EditSessionClient } from './EditSessionClient';
import Layout from '@/components/Layout';

// Initialize encryption for server-side decryption
initializeEncryption(process.env.ENCRYPTION_SECRET || process.env.CLERK_ENCRYPTION_KEY);

const getSessionData = cache(async (sessionId: string, userId: string) => {
    try {
        const session = await db.query.sessions.findFirst({
            where: eq(sessions.id, sessionId),
        });

        if (!session || session.clerkId !== userId) {
            return null;
        }

        // Parse sensitive fields
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

        const lifeEvents = session.lifeEvents ? (typeof session.lifeEvents === 'string' ? JSON.parse(session.lifeEvents) : session.lifeEvents) : [];
        const physicalTraits = session.physicalTraits ? (typeof session.physicalTraits === 'string' ? JSON.parse(session.physicalTraits) : session.physicalTraits) : undefined;
        const forensicTraits = session.forensicTraits ? (typeof session.forensicTraits === 'string' ? JSON.parse(session.forensicTraits) : session.forensicTraits) : undefined;
        const spouseData = session.spouseData ? (typeof session.spouseData === 'string' ? JSON.parse(session.spouseData) : session.spouseData) : undefined;
        const offsetConfig = session.offsetConfig ? (typeof session.offsetConfig === 'string' ? JSON.parse(session.offsetConfig) : session.offsetConfig) : undefined;

        return {
            birthData,
            lifeEvents,
            physicalTraits,
            forensicTraits,
            spouseData,
            offsetConfig,
        };
    } catch (error) {
        console.error('Error fetching session data:', error);
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
