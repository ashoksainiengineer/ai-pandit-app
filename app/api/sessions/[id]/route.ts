import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/database/drizzle';
import { sessions, users } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { safeDecrypt, encryptData } from '@/lib/crypto';

// ═════════════════════════════════════════════════════════════════════════════
// Sessions API - Manage individual sessions (Get, Update, Delete)
// ═════════════════════════════════════════════════════════════════════════════

interface SessionParams {
    params: { id: string };
}

// ═════════════════════════════════════════════════════════════════════════════
// GET: Fetch session with decrypted data (for editing)
// ═════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest, { params }: SessionParams) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sessionId = params.id;

        // Get session
        const session = await db.select()
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

        if (session.length === 0) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const s = session[0];

        // Verify ownership via clerkId
        if (s.clerkId !== clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Decrypt sensitive fields
        const decryptedFullName = safeDecrypt(s.fullName, clerkId);
        const decryptedLifeEvents = s.lifeEvents
            ? JSON.parse(safeDecrypt(s.lifeEvents, clerkId))
            : [];
        const decryptedPhysicalTraits = s.physicalTraits
            ? JSON.parse(safeDecrypt(s.physicalTraits, clerkId))
            : null;

        return NextResponse.json({
            success: true,
            data: {
                id: s.id,
                birthData: {
                    fullName: decryptedFullName,
                    dateOfBirth: s.dateOfBirth,
                    tentativeTime: s.tentativeTime,
                    birthPlace: s.birthPlace,
                    latitude: s.latitude,
                    longitude: s.longitude,
                    timezone: parseFloat(s.timezone),
                    gender: s.gender,
                },
                lifeEvents: decryptedLifeEvents,
                physicalTraits: decryptedPhysicalTraits,
                offsetConfig: s.offsetConfig ? JSON.parse(s.offsetConfig) : null,
                status: s.status,
                rectifiedTime: s.rectifiedTime,
                accuracy: s.accuracy,
                confidence: s.confidence,
                analysisResult: s.analysisResult ? JSON.parse(s.analysisResult) : null,
                error: s.errorMessage,
                createdAt: s.createdAt,
                reasoningLogs: s.reasoningLogs ? JSON.parse(s.reasoningLogs) : null,
            },
        });

    } catch (error) {
        console.error('GET session error:', error);
        return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// PUT: Update session data (for re-analysis)
// ═════════════════════════════════════════════════════════════════════════════

export async function PUT(request: NextRequest, { params }: SessionParams) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sessionId = params.id;
        const body = await request.json();
        const { birthData, lifeEvents, physicalTraits, offsetConfig, isDraft } = body;

        // Get session to verify ownership
        const session = await db.select()
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

        if (session.length === 0) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        if (session[0].clerkId !== clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Re-encrypt updated data
        const encryptedFullName = encryptData(birthData.fullName, clerkId);
        const encryptedLifeEvents = encryptData(JSON.stringify(lifeEvents), clerkId);
        const encryptedPhysicalTraits = physicalTraits
            ? encryptData(JSON.stringify(physicalTraits), clerkId)
            : null;

        const now = new Date().toISOString();

        // Update object
        const updateData: any = {
            fullName: encryptedFullName,
            dateOfBirth: birthData.dateOfBirth,
            tentativeTime: birthData.tentativeTime,
            birthPlace: birthData.birthPlace,
            latitude: birthData.latitude,
            longitude: birthData.longitude,
            timezone: birthData.timezone.toString(),
            gender: birthData.gender,
            physicalTraits: encryptedPhysicalTraits,
            lifeEvents: encryptedLifeEvents,
            offsetConfig: JSON.stringify(offsetConfig),
            updatedAt: now,
        };

        // Only reset status and results if NOT a draft save
        if (!isDraft) {
            Object.assign(updateData, {
                status: 'pending', // Reset to pending for re-queue
                errorMessage: null, // Clear previous error
                rectifiedTime: null, // Clear previous result
                accuracy: null,
                confidence: null,
                analysisResult: null,
            });
        }

        // Update session
        await db.update(sessions)
            .set(updateData)
            .where(eq(sessions.id, sessionId));

        return NextResponse.json({
            success: true,
            message: 'Session updated. Ready for re-analysis.',
            sessionId,
        });

    } catch (error) {
        console.error('PUT session error:', error);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// DELETE: Remove session
// ═════════════════════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest, { params }: SessionParams) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sessionId = params.id;

        // Get session to verify ownership
        const session = await db.select()
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

        if (session.length === 0) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        if (session[0].clerkId !== clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Delete the session
        await db.delete(sessions)
            .where(eq(sessions.id, sessionId));

        return NextResponse.json({
            success: true,
            message: 'Session deleted successfully',
        });

    } catch (error) {
        console.error('DELETE session error:', error);
        return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }
}
