import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/secure-logger';
import { env } from '@/lib/config/env';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { auth } from '@clerk/nextjs/server';
import { encrypt, isEncrypted, parseSensitiveField, initializeEncryption } from '@/lib/crypto';
import { canFrontendMutateSession, getProtectedFieldsPresent } from '@/lib/server/session-write-guards';
import { buildOwnedSessionWhereClause, resolveSessionOwnershipContext } from '@/lib/server/session-ownership';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

initializeEncryption(env.security.encryptionSecret);

// Redundant local helper removed as per implementation plan

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        const session = await db.query.sessions.findFirst({
            where: buildOwnedSessionWhereClause(sessionId, ownershipContext),
        });

        if (!session) {
            return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
        }

        // Parse & Decrypt Fields with God-Tier robustness
        const parsedSession = {
            ...session,
            // 1. Birth Data Reconstruction (All PII Encrypted)
            birthData: {
                fullName: parseSensitiveField(session.fullName),
                dateOfBirth: parseSensitiveField(session.dateOfBirth),
                tentativeTime: parseSensitiveField(session.tentativeTime),
                birthPlace: parseSensitiveField(session.birthPlace),
                latitude: session.latitude,
                longitude: session.longitude,
                timezone: Number(session.timezone),
                gender: session.gender
            },

            // 2. Trait Clusters (All Encrypted)
            lifeEvents: parseSensitiveField(session.lifeEvents, []),
            physicalTraits: parseSensitiveField(session.physicalTraits, null),
            forensicTraits: parseSensitiveField(session.forensicTraits, null),
            spouseData: parseSensitiveField(session.spouseData, null),

            // 3. System & Results (Can be encrypted or plain depending on source)
            offsetConfig: parseSensitiveField(session.offsetConfig, null),
            analysisResult: parseSensitiveField(session.analysisResult, null),
            progressData: parseSensitiveField(session.progressData, null),
            reasoningLogs: parseSensitiveField(session.reasoningLogs, null),
            errorMessage: session.errorMessage, // Errors usually plain text for monitoring
        };

        // Extra check: If fullName is at the root and still looks encrypted, patch it
        if (isEncrypted(parsedSession.fullName)) {
            parsedSession.fullName = parseSensitiveField(parsedSession.fullName);
        }

        return NextResponse.json({ success: true, data: parsedSession });
    } catch (error: any) {
        logger.error('Failed to fetch session:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const buildPhaseResponse = getBuildPhaseRouteResponse();
    if (buildPhaseResponse) return buildPhaseResponse;

    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const sessionId = resolvedParams.id;
        const ownershipContext = await resolveSessionOwnershipContext(clerkId);
        const body = await req.json();
        const protectedFields = getProtectedFieldsPresent(body as Record<string, unknown>);
        if (protectedFields.length > 0) {
            return NextResponse.json({
                success: false,
                error: `Protected fields are backend-owned: ${protectedFields.join(', ')}`
            }, { status: 400 });
        }

        const existingSession = await db.query.sessions.findFirst({
            where: buildOwnedSessionWhereClause(sessionId, ownershipContext),
            columns: {
                id: true,
                status: true,
            }
        });
        if (!existingSession) {
            return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
        }
        if (!canFrontendMutateSession(existingSession.status)) {
            return NextResponse.json({
                success: false,
                error: `Session is locked for frontend edits in status: ${existingSession.status}`,
            }, { status: 409 });
        }

        // Prepare Update Object
        const updateData: any = {
            updatedAt: new Date().toISOString()
        };

        // Flatten birthData if present (Encrypting PII)
        if (body.birthData) {
            const bd = body.birthData;
            if (bd.fullName) updateData.fullName = encrypt(bd.fullName);
            if (bd.dateOfBirth) updateData.dateOfBirth = encrypt(bd.dateOfBirth);
            if (bd.tentativeTime) updateData.tentativeTime = encrypt(bd.tentativeTime);
            if (bd.birthPlace) updateData.birthPlace = encrypt(bd.birthPlace);

            // Numbers are typically not encrypted for geo-calculations
            if (bd.latitude !== undefined) updateData.latitude = bd.latitude;
            if (bd.longitude !== undefined) updateData.longitude = bd.longitude;
            if (bd.timezone !== undefined) updateData.timezone = String(bd.timezone);
            if (bd.gender) updateData.gender = bd.gender;
        }

        // Encrypt & Stringify JSON fields (Full Security Suite)
        if (body.lifeEvents !== undefined) {
            updateData.lifeEvents = encrypt(JSON.stringify(body.lifeEvents));
        }
        if (body.physicalTraits !== undefined) {
            updateData.physicalTraits = encrypt(JSON.stringify(body.physicalTraits));
        }
        if (body.forensicTraits !== undefined) {
            updateData.forensicTraits = encrypt(JSON.stringify(body.forensicTraits));
        }
        if (body.spouseData !== undefined) {
            updateData.spouseData = encrypt(JSON.stringify(body.spouseData));
        }
        if (body.offsetConfig !== undefined) {
            updateData.offsetConfig = encrypt(JSON.stringify(body.offsetConfig));
        }

        // Update in DB
        await db.update(sessions)
            .set(updateData)
            .where(buildOwnedSessionWhereClause(sessionId, ownershipContext));

        return NextResponse.json({ success: true, message: 'Session updated' });
    } catch (error: any) {
        logger.error('Failed to update session:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const sessionId = resolvedParams.id;
        const ownershipContext = await resolveSessionOwnershipContext(clerkId);

        const deletedRows = await db.delete(sessions)
            .where(buildOwnedSessionWhereClause(sessionId, ownershipContext))
            .returning({ id: sessions.id });

        if (deletedRows.length === 0) {
            return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Session deleted' });
    } catch (error: any) {
        logger.error('Failed to delete session:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
