import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/database/drizzle';
import { sessions, users } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { encryptData } from '@/lib/crypto';

// ═════════════════════════════════════════════════════════════════════════════
// DRAFT API - Save form data without starting analysis
// ═════════════════════════════════════════════════════════════════════════════

// Helper: Ensure user exists in database
async function ensureUserExists(clerkUserId: string): Promise<string> {
    const existingUser = await db.select()
        .from(users)
        .where(eq(users.clerkId, clerkUserId))
        .limit(1);

    if (existingUser.length > 0) {
        return existingUser[0].id;
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
        throw new Error('Could not fetch user from Clerk');
    }

    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(users).values({
        id: userId,
        clerkId: clerkUserId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
        createdAt: now,
        updatedAt: now,
    });

    return userId;
}

// ═════════════════════════════════════════════════════════════════════════════
// POST: Save draft (without starting analysis)
// ═════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { birthData, lifeEvents, physicalTraits, offsetConfig, sessionId } = body;

        // Validate minimum data
        if (!birthData || !birthData.fullName) {
            return NextResponse.json(
                { error: 'At least fullName is required to save draft' },
                { status: 400 }
            );
        }

        const internalUserId = await ensureUserExists(clerkId);
        const now = new Date().toISOString();

        // Encrypt sensitive data
        const encryptedFullName = encryptData(birthData.fullName, clerkId);
        const encryptedLifeEvents = lifeEvents?.length > 0
            ? encryptData(JSON.stringify(lifeEvents), clerkId)
            : '';
        const encryptedPhysicalTraits = physicalTraits
            ? encryptData(JSON.stringify(physicalTraits), clerkId)
            : null;

        // If sessionId provided, update existing draft
        if (sessionId) {
            // Verify ownership
            const existing = await db.select()
                .from(sessions)
                .where(eq(sessions.id, sessionId))
                .limit(1);

            if (existing.length === 0) {
                return NextResponse.json({ error: 'Session not found' }, { status: 404 });
            }

            if (existing[0].clerkId !== clerkId) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }

            await db.update(sessions)
                .set({
                    fullName: encryptedFullName,
                    dateOfBirth: birthData.dateOfBirth || '',
                    tentativeTime: birthData.tentativeTime || '',
                    birthPlace: birthData.birthPlace || '',
                    latitude: birthData.latitude || 0,
                    longitude: birthData.longitude || 0,
                    timezone: birthData.timezone?.toString() || '5.5',
                    gender: birthData.gender || 'other',
                    physicalTraits: encryptedPhysicalTraits,
                    lifeEvents: encryptedLifeEvents,
                    offsetConfig: offsetConfig ? JSON.stringify(offsetConfig) : null,
                    updatedAt: now,
                })
                .where(eq(sessions.id, sessionId));

            return NextResponse.json({
                success: true,
                message: 'Draft updated',
                sessionId,
            });
        }

        // Create new draft
        const newSessionId = crypto.randomUUID();

        await db.insert(sessions).values({
            id: newSessionId,
            userId: internalUserId,
            clerkId: clerkId,
            fullName: encryptedFullName,
            dateOfBirth: birthData.dateOfBirth || '',
            tentativeTime: birthData.tentativeTime || '',
            birthPlace: birthData.birthPlace || '',
            latitude: birthData.latitude || 0,
            longitude: birthData.longitude || 0,
            timezone: birthData.timezone?.toString() || '5.5',
            gender: birthData.gender || 'other',
            physicalTraits: encryptedPhysicalTraits,
            lifeEvents: encryptedLifeEvents,
            offsetConfig: offsetConfig ? JSON.stringify(offsetConfig) : null,
            status: 'draft', // Special status for drafts
            createdAt: now,
            updatedAt: now,
        });

        return NextResponse.json({
            success: true,
            message: 'Draft saved to cloud',
            sessionId: newSessionId,
        });

    } catch (error) {
        console.error('Draft save error:', error);
        return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// GET: Get user's drafts
// ═════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's internal ID
        const user = await db.select()
            .from(users)
            .where(eq(users.clerkId, clerkId))
            .limit(1);

        if (user.length === 0) {
            return NextResponse.json({ success: true, drafts: [] });
        }

        // Get drafts
        const drafts = await db.select({
            id: sessions.id,
            birthPlace: sessions.birthPlace,
            dateOfBirth: sessions.dateOfBirth,
            status: sessions.status,
            updatedAt: sessions.updatedAt,
        })
            .from(sessions)
            .where(eq(sessions.userId, user[0].id));

        // Filter to only drafts and failed sessions (both can be continued)
        const continuableSessions = drafts.filter(d =>
            d.status === 'draft' || d.status === 'failed' || d.status === 'pending'
        );

        return NextResponse.json({
            success: true,
            drafts: continuableSessions,
        });

    } catch (error) {
        console.error('Get drafts error:', error);
        return NextResponse.json({ error: 'Failed to get drafts' }, { status: 500 });
    }
}
