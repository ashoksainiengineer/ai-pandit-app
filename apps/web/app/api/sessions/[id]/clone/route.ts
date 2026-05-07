import { NextRequest, NextResponse } from 'next/server';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/secure-logger';
import { randomUUID } from 'crypto';
import { buildOwnedSessionWhereClause, resolveSessionOwnershipContext } from '@/lib/server/session-ownership';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const buildPhaseResponse = getBuildPhaseRouteResponse();
    if (buildPhaseResponse) return buildPhaseResponse;

    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const sessionId = resolvedParams.id;

        if (!sessionId) {
            return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
        }

        const ownershipContext = await resolveSessionOwnershipContext(clerkId);

        // 1. Fetch original session safely verifying ownership
        const originalSession = await db.query.sessions.findFirst({
            where: buildOwnedSessionWhereClause(sessionId, ownershipContext),
        });

        if (!originalSession) {
            return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
        }

        // 2. Generate new ID
        const newSessionId = randomUUID();

        // 3. Create clone payload omitting results but keeping encrypted strings
        const clonePayload = {
            id: newSessionId,
            userId: ownershipContext.internalUserId ?? originalSession.userId,
            clerkId,

            // Core Data (Already Encrypted from DB)
            fullName: originalSession.fullName,
            dateOfBirth: originalSession.dateOfBirth,
            tentativeTime: originalSession.tentativeTime,
            birthPlace: originalSession.birthPlace,
            latitude: originalSession.latitude,
            longitude: originalSession.longitude,
            timezone: originalSession.timezone,
            gender: originalSession.gender,

            // Traits (Already Encrypted from DB)
            lifeEvents: originalSession.lifeEvents,
            spouseData: originalSession.spouseData,

            // Configuration
            offsetConfig: originalSession.offsetConfig,

            // Status and Reset fields (Resetting results)
            status: 'draft' as const,
            rectifiedTime: null,
            accuracy: null,
            confidence: null,
            analysisResult: null,
            progressData: null,
            reasoningLogs: null,
            errorMessage: null,
            errorCode: null,

            // Encrypted Flag
            isEncrypted: originalSession.isEncrypted,

            // Audit/Timestamps
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // 4. Insert clone gracefully
        await db.insert(sessions).values(clonePayload as any);

        return NextResponse.json({
            success: true,
            message: 'Session cloned successfully',
            data: { id: newSessionId }
        }, { status: 201 });

    } catch (error: any) {
        logger.error('Failed to clone session:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
