import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@ai-pandit/db';
import { sessions, users } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, encryptObject, initializeEncryption } from '@/lib/crypto';
import { parsePaginationParams, createPaginationMeta } from '@/lib/pagination';
import { logAuditEvent, getRequestMetadata } from '@/lib/audit';
import { env } from '@/lib/config/env';
import { currentUser } from '@clerk/nextjs/server';
import { ensureUserRecord } from '@/lib/server/user-sync';
import { canFrontendMutateSession, getProtectedFieldsPresent } from '@/lib/server/session-write-guards';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize encryption
initializeEncryption(env.security.encryptionSecret);

// ═════════════════════════════════════════════════════════════════════════════
// DRAFT API - Save form data without starting analysis
// ═════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
    const buildPhaseResponse = getBuildPhaseRouteResponse();
    if (buildPhaseResponse) return buildPhaseResponse;

    const { ipAddress, userAgent } = getRequestMetadata(request);

    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const protectedFields = getProtectedFieldsPresent(body as Record<string, unknown>);
        if (protectedFields.length > 0) {
            return NextResponse.json(
                { error: `Protected fields are backend-owned: ${protectedFields.join(', ')}` },
                { status: 400 }
            );
        }
        const { birthData, lifeEvents, physicalTraits, forensicTraits, spouseData, offsetConfig, sessionId } = body;

        if (!birthData || !birthData.fullName) {
            return NextResponse.json(
                { error: 'At least fullName is required to save draft' },
                { status: 400 }
            );
        }

        const clerkUser = await currentUser();
        const email = clerkUser?.emailAddresses[0]?.emailAddress || '';
        const fullName = `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() || null;
        const user = await ensureUserRecord({ clerkId, email, fullName });
        const internalUserId = user.id;

        const now = new Date().toISOString();

        const encryptedFullName = encrypt(birthData.fullName);
        const encryptedLifeEvents = lifeEvents && lifeEvents.length > 0 ? encryptObject(lifeEvents) : '';
        const encryptedPhysicalTraits = physicalTraits ? encryptObject(physicalTraits) : null;
        const encryptedForensicTraits = forensicTraits ? encryptObject(forensicTraits) : null;
        const encryptedSpouseData = spouseData ? encryptObject(spouseData) : null;

        const draftData = {
            fullName: encryptedFullName,
            dateOfBirth: birthData.dateOfBirth || '',
            tentativeTime: birthData.tentativeTime || '',
            birthPlace: birthData.birthPlace || '',
            latitude: birthData.latitude || 0,
            longitude: birthData.longitude || 0,
            timezone: birthData.timezone?.toString() || '5.5',
            gender: birthData.gender || 'other',
            physicalTraits: encryptedPhysicalTraits,
            forensicTraits: encryptedForensicTraits,
            spouseData: encryptedSpouseData,
            lifeEvents: encryptedLifeEvents,
            offsetConfig: offsetConfig ? JSON.stringify(offsetConfig) : null,
            updatedAt: now,
        };

        if (sessionId) {
            const existing = await db.select({ clerkId: sessions.clerkId, status: sessions.status }).from(sessions).where(eq(sessions.id, sessionId)).limit(1);
            if (existing.length === 0) {
                if (env.app.isProduction) {
                    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
                }
            }
            if (existing[0].clerkId !== clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            if (!canFrontendMutateSession(existing[0].status)) {
                return NextResponse.json(
                    { error: `Session is locked for draft edits in status: ${existing[0].status}` },
                    { status: 409 }
                );
            }

            await db.update(sessions).set(draftData).where(eq(sessions.id, sessionId));
            await logAuditEvent({ userId: clerkId, action: 'DRAFT_UPDATED', resourceType: 'SESSION', resourceId: sessionId, ipAddress, userAgent });

            return NextResponse.json({ success: true, message: 'Draft updated', sessionId });
        }

        if (birthData.dateOfBirth) {
            const existingDrafts = await db.select({ id: sessions.id, status: sessions.status, dateOfBirth: sessions.dateOfBirth })
                .from(sessions)
                .where(eq(sessions.userId, internalUserId));
            const matchingDraft = existingDrafts.find(d => d.status === 'draft' && d.dateOfBirth === birthData.dateOfBirth);

            if (matchingDraft) {
                await db.update(sessions).set(draftData).where(eq(sessions.id, matchingDraft.id));
                await logAuditEvent({ userId: clerkId, action: 'DRAFT_UPDATED', resourceType: 'SESSION', resourceId: matchingDraft.id, ipAddress, userAgent, details: { reason: 'Matching birth date' } });
                return NextResponse.json({ success: true, message: 'Draft updated (same birth date)', sessionId: matchingDraft.id });
            }
        }

        const newSessionId = crypto.randomUUID();
        await db.insert(sessions).values({
            ...draftData,
            id: newSessionId,
            userId: internalUserId,
            clerkId: clerkId,
            status: 'draft',
            createdAt: now,
        });

        await logAuditEvent({ userId: clerkId, action: 'DRAFT_CREATED', resourceType: 'SESSION', resourceId: newSessionId, ipAddress, userAgent });

        return NextResponse.json({ success: true, message: 'Draft saved to cloud', sessionId: newSessionId });

    } catch (error: any) {
        console.error('Draft save error:', error);
        await logAuditEvent({ action: 'DRAFT_SAVE_FAILED', ipAddress, userAgent, details: { error: error.message } });
        return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
    }
}

// ... (GET function remains the same)
export async function GET(request: NextRequest) {
    const buildPhaseResponse = getBuildPhaseRouteResponse();
    if (buildPhaseResponse) return buildPhaseResponse;

    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse pagination parameters
        const { page, limit } = parsePaginationParams(request.nextUrl.searchParams);

        const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });

        if (!user) {
            return NextResponse.json({
                success: true,
                drafts: [],
                pagination: createPaginationMeta(page, limit, 0),
            });
        }

        const allUserSessions = await db.select({
            id: sessions.id,
            birthPlace: sessions.birthPlace,
            dateOfBirth: sessions.dateOfBirth,
            status: sessions.status,
            updatedAt: sessions.updatedAt,
        })
            .from(sessions)
            .where(eq(sessions.userId, user.id));

        // Filter for sessions that can be continued
        const continuableSessions = allUserSessions.filter(d =>
            ['draft', 'failed', 'pending'].includes(d.status)
        );

        // Sort by most recently updated
        continuableSessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        // Apply pagination
        const total = continuableSessions.length;
        const paginatedDrafts = continuableSessions.slice((page - 1) * limit, page * limit);

        return NextResponse.json({
            success: true,
            drafts: paginatedDrafts,
            pagination: createPaginationMeta(page, limit, total),
        });

    } catch (error) {
        console.error('Get drafts error:', error);
        return NextResponse.json({ error: 'Failed to get drafts' }, { status: 500 });
    }
}
