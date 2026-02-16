import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { sessions, users } from '@/database/schema';
import { eq, desc } from 'drizzle-orm';
import { auth, currentUser } from '@clerk/nextjs/server';
import { parseSensitiveField } from '@/lib/crypto';

export async function GET(req: NextRequest) {
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

        // Parse JSON fields for frontend consumption
        const parsedSessions = userSessions.map(s => ({
            ...s,
            fullName: parseSensitiveField(s.fullName),
            lifeEvents: parseSensitiveField(s.lifeEvents, []),
            forensicTraits: parseSensitiveField(s.forensicTraits),
            spouseData: parseSensitiveField(s.spouseData),
            offsetConfig: parseSensitiveField(s.offsetConfig),
            // Reconstruct birthData object
            birthData: {
                fullName: parseSensitiveField(s.fullName),
                dateOfBirth: parseSensitiveField(s.dateOfBirth),
                tentativeTime: parseSensitiveField(s.tentativeTime),
                birthPlace: parseSensitiveField(s.birthPlace),
                latitude: s.latitude,
                longitude: s.longitude,
                timezone: Number(s.timezone),
                gender: s.gender
            }
        }));

        return NextResponse.json({ success: true, data: parsedSessions });
    } catch (error: any) {
        console.error('Failed to fetch sessions:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const clerkUser = await currentUser();
        if (!clerkUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const clerkId = clerkUser.id;
        const body = await req.json();

        // Basic validation
        if (!body.birthData) {
            return NextResponse.json({ success: false, error: 'Missing birth data' }, { status: 400 });
        }

        // 1. Get or Create User
        let user = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId)
        });

        if (!user) {
            const email = clerkUser.emailAddresses[0]?.emailAddress || '';
            const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User';
            const newUserId = crypto.randomUUID();

            await db.insert(users).values({
                id: newUserId,
                clerkId: clerkId,
                email: email,
                fullName: fullName,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            user = { id: newUserId, clerkId } as any; // Minimal user object for reference
        }

        const newSessionId = crypto.randomUUID();
        const bd = body.birthData;

        // 2. Prepare Session Object (Flattened & Stringified)
        const newSession = {
            id: newSessionId,
            userId: user!.id,
            clerkId: clerkId,

            // Flattened Birth Data
            fullName: bd.fullName || 'Unknown',
            dateOfBirth: bd.dateOfBirth,
            tentativeTime: bd.tentativeTime,
            birthPlace: bd.birthPlace,
            latitude: bd.latitude || 0,
            longitude: bd.longitude || 0,
            timezone: String(bd.timezone || 5.5),
            gender: bd.gender || 'male',

            // Stringified JSON fields
            lifeEvents: body.lifeEvents ? JSON.stringify(body.lifeEvents) : JSON.stringify([]),
            spouseData: body.spouseData ? JSON.stringify(body.spouseData) : null,
            forensicTraits: body.forensicTraits ? JSON.stringify(body.forensicTraits) : null,
            offsetConfig: body.offsetConfig ? JSON.stringify(body.offsetConfig) : null,

            status: 'draft',
            isEncrypted: false, // Start unencrypted for simplicity in hybrid mode (or handle encryption if needed)

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // 3. Insert into Turso via Drizzle
        await db.insert(sessions).values(newSession);

        // Return the structure expected by the frontend (with nested objects)
        return NextResponse.json({
            success: true,
            data: {
                ...newSession,
                birthData: bd,
                lifeEvents: body.lifeEvents || [],
                spouseData: body.spouseData,
                forensicTraits: body.forensicTraits,
                offsetConfig: body.offsetConfig
            }
        });
    } catch (error: any) {
        console.error('Failed to create session:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
