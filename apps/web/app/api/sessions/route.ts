import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/secure-logger';
import { env } from '@/lib/config/env';
import { randomUUID } from 'crypto';
import { db } from '@ai-pandit/db';
import { sessions, users } from '@ai-pandit/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth, currentUser } from '@clerk/nextjs/server';
import { parseSensitiveField, encrypt, initializeEncryption } from '@/lib/crypto';
import { ensureUserRecord } from '@/lib/server/user-sync';
import { getProtectedFieldsPresent } from '@/lib/server/session-write-guards';
import { getFavoriteSetForSessions } from '@/lib/server/favorite-store';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

initializeEncryption(env.security.encryptionSecret);

export async function GET(_req: NextRequest) {
    const buildPhaseResponse = getBuildPhaseRouteResponse();
    if (buildPhaseResponse) return buildPhaseResponse;

    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // We need to resolve the internal userId from the Clerk ID
        const user = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId)
        });

        if (!user) {
            // If user doesn't exist in our DB yet, they have no sessions.
            return NextResponse.json({ success: true, data: [] });
        }

        const userSessions = await db.select().from(sessions)
            .where(eq(sessions.userId, user.id))
            .orderBy(desc(sessions.createdAt));
        const favoriteSet = await getFavoriteSetForSessions(clerkId, userSessions.map((s) => s.id));

        // Parse JSON fields for frontend consumption
        const parsedSessions = userSessions.map(s => ({
            ...s,
            isFavorite: favoriteSet.has(s.id),
            fullName: parseSensitiveField(s.fullName, user.id, undefined),
            lifeEvents: parseSensitiveField(s.lifeEvents, user.id, []),
            spouseData: parseSensitiveField(s.spouseData, user.id, undefined),
            offsetConfig: parseSensitiveField(s.offsetConfig, user.id, undefined),
            // Reconstruct birthData object
            birthData: {
                fullName: parseSensitiveField(s.fullName, user.id, undefined),
                dateOfBirth: parseSensitiveField(s.dateOfBirth, user.id, undefined),
                tentativeTime: parseSensitiveField(s.tentativeTime, user.id, undefined),
                birthPlace: parseSensitiveField(s.birthPlace, user.id, undefined),
                latitude: s.latitude,
                longitude: s.longitude,
                timezone: Number(s.timezone),
                gender: s.gender
            }
        }));

        return NextResponse.json({ success: true, data: parsedSessions });
    } catch (error: any) {
        logger.error('Failed to fetch sessions:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const buildPhaseResponse = getBuildPhaseRouteResponse();
    if (buildPhaseResponse) return buildPhaseResponse;

    try {
        const clerkUser = await currentUser();
        if (!clerkUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const clerkId = clerkUser.id;
        const body = await req.json();
        const protectedFields = getProtectedFieldsPresent(body as Record<string, unknown>);
        if (protectedFields.length > 0) {
            return NextResponse.json({
                success: false,
                error: `Protected fields are backend-owned: ${protectedFields.join(', ')}`
            }, { status: 400 });
        }

        // Basic validation
        if (!body.birthData) {
            return NextResponse.json({ success: false, error: 'Missing birth data' }, { status: 400 });
        }

        // 1. Get or Create User
        const email = clerkUser.emailAddresses[0]?.emailAddress || '';
        const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User';
        const user = await ensureUserRecord({
            clerkId,
            email,
            fullName,
        });

        const newSessionId = randomUUID();
        const bd = body.birthData;

        // 2. Prepare Session Object (Flattened & Encrypted)
        const newSession = {
            id: newSessionId,
            userId: user.id,
            clerkId: clerkId,

            // Flattened Birth Data (Encrypted)
            fullName: encrypt(bd.fullName || 'Unknown', user.id),
            dateOfBirth: encrypt(bd.dateOfBirth || '', user.id),
            tentativeTime: encrypt(bd.tentativeTime || '', user.id),
            birthPlace: encrypt(bd.birthPlace || '', user.id),
            latitude: bd.latitude || 0,
            longitude: bd.longitude || 0,
            timezone: String(bd.timezone ?? 5.5), // BUG-FIX: ?? instead of || to allow UTC 0
            gender: bd.gender || 'male',

            // Encrypted JSON fields
            lifeEvents: body.lifeEvents ? encrypt(JSON.stringify(body.lifeEvents), user.id) : encrypt('[]', user.id),
            spouseData: body.spouseData ? encrypt(JSON.stringify(body.spouseData), user.id) : null,
            offsetConfig: body.offsetConfig ? encrypt(JSON.stringify(body.offsetConfig), user.id) : null,

            status: 'draft' as const,
            isEncrypted: true,

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // 3. Insert into Neon Postgres via Drizzle
        await db.insert(sessions).values(newSession);

        // Return the structure expected by the frontend (with nested objects)
        return NextResponse.json({
            success: true,
            data: {
                ...newSession,
                birthData: bd,
                lifeEvents: body.lifeEvents || [],
                spouseData: body.spouseData,
                offsetConfig: body.offsetConfig
            }
        });
    } catch (error: any) {
        console.error('Failed to create session:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
