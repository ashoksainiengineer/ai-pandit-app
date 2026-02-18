import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { sessions, users } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { encrypt, decrypt, isEncrypted, parseSensitiveField, initializeEncryption } from '@/lib/crypto';

initializeEncryption(process.env.ENCRYPTION_SECRET || process.env.CLERK_ENCRYPTION_KEY);

// Redundant local helper removed as per implementation plan

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        const session = await db.query.sessions.findFirst({
            where: and(eq(sessions.id, sessionId), eq(sessions.clerkId, clerkId))
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
        console.error('Failed to fetch session:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const sessionId = resolvedParams.id;
        const body = await req.json();

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

        // Results & Logs - If coming from frontend (rare but possible in draft modes)
        if (body.analysisResult !== undefined) {
            updateData.analysisResult = encrypt(JSON.stringify(body.analysisResult));
        }
        if (body.progressData !== undefined) {
            updateData.progressData = encrypt(JSON.stringify(body.progressData));
        }

        // Update in DB
        await db.update(sessions)
            .set(updateData)
            .where(and(eq(sessions.id, sessionId), eq(sessions.clerkId, clerkId)));

        return NextResponse.json({ success: true, message: 'Session updated' });
    } catch (error: any) {
        console.error('Failed to update session:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const sessionId = resolvedParams.id;

        // Hard Delete
        await db.delete(sessions)
            .where(and(eq(sessions.id, sessionId), eq(sessions.clerkId, clerkId)));

        return NextResponse.json({ success: true, message: 'Session deleted' });
    } catch (error: any) {
        console.error('Failed to delete session:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
