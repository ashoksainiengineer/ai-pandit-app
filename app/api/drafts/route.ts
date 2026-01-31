import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/database/drizzle';
import { sessions, users } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { encryptData } from '@/lib/encryption';
import { parsePaginationParams, createPaginationMeta } from '@/lib/pagination';

// ═════════════════════════════════════════════════════════════════════════════
// DRAFT API - Save form data without starting analysis
// ═════════════════════════════════════════════════════════════════════════════

// Draft API - Save form data without starting analysis

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
        const { birthData, lifeEvents, physicalTraits, forensicTraits, spouseData, offsetConfig, sessionId } = body;

        // Validate minimum data
        if (!birthData || !birthData.fullName) {
            return NextResponse.json(
                { error: 'At least fullName is required to save draft' },
                { status: 400 }
            );
        }

        // Get or Create User from DB (Auto-sync if webhook hasn't run yet)
        let user = await db.select()
            .from(users)
            .where(eq(users.clerkId, clerkId))
            .limit(1);

        let internalUserId: string;

        if (user.length === 0) {
            // User not synced yet - fetch from Clerk and create locally
            const { userId } = await auth();
            const now = new Date().toISOString();
            
            // Create user with basic info (webhook will update with full details later)
            const newUserId = crypto.randomUUID();
            await db.insert(users).values({
                id: newUserId,
                clerkId: clerkId,
                email: '', // Will be updated by webhook
                fullName: null,
                createdAt: now,
                updatedAt: now,
            });
            
            internalUserId = newUserId;
            console.log('Auto-created user during draft save:', { clerkId, internalUserId });
        } else {
            internalUserId = user[0].id;
        }
        const now = new Date().toISOString();

        // Encrypt sensitive data
        const encryptedFullName = encryptData(birthData.fullName, clerkId);
        const encryptedLifeEvents = lifeEvents?.length > 0
            ? encryptData(JSON.stringify(lifeEvents), clerkId)
            : '';
        const encryptedPhysicalTraits = physicalTraits
            ? encryptData(JSON.stringify(physicalTraits), clerkId)
            : null;
        const encryptedForensicTraits = forensicTraits
            ? encryptData(JSON.stringify(forensicTraits), clerkId)
            : null;
        const encryptedSpouseData = spouseData
            ? encryptData(JSON.stringify(spouseData), clerkId)
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
                    forensicTraits: encryptedForensicTraits,
                    spouseData: encryptedSpouseData,
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

        // Check if draft already exists for this user + birth date combination
        // This prevents multiple drafts for the same person
        if (birthData.dateOfBirth) {
            const existingDraft = await db.select({
                id: sessions.id,
                status: sessions.status,
                dateOfBirth: sessions.dateOfBirth,
            })
            .from(sessions)
            .where(
                eq(sessions.userId, internalUserId)
            );
            
            // Find draft with matching birth date (decrypted comparison not possible, so we check dateOfBirth)
            const matchingDraft = existingDraft.find(d =>
                d.status === 'draft' && d.dateOfBirth === birthData.dateOfBirth
            );
            
            if (matchingDraft) {
                // Update existing draft for this birth date
                await db.update(sessions)
                    .set({
                        fullName: encryptedFullName,
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
                    })
                    .where(eq(sessions.id, matchingDraft.id));

                return NextResponse.json({
                    success: true,
                    message: 'Draft updated (same birth date)',
                    sessionId: matchingDraft.id,
                });
            }
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
            forensicTraits: encryptedForensicTraits,
            spouseData: encryptedSpouseData,
            lifeEvents: encryptedLifeEvents,
            offsetConfig: offsetConfig ? JSON.stringify(offsetConfig) : null,
            status: 'draft',
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
// GET: Get user's drafts (Paginated)
// ═════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse pagination parameters
        const { page, limit } = parsePaginationParams(request.nextUrl.searchParams);

        // Get user's internal ID
        const user = await db.select()
            .from(users)
            .where(eq(users.clerkId, clerkId))
            .limit(1);

        if (user.length === 0) {
            return NextResponse.json({
                success: true,
                drafts: [],
                pagination: createPaginationMeta(page, limit, 0),
            });
        }

        // Get all sessions for filtering (in production, use database-level filtering)
        // Note: Filtering by status in query requires index optimization
        const allDrafts = await db.select({
            id: sessions.id,
            birthPlace: sessions.birthPlace,
            dateOfBirth: sessions.dateOfBirth,
            status: sessions.status,
            updatedAt: sessions.updatedAt,
        })
            .from(sessions)
            .where(eq(sessions.userId, user[0].id));

        // Filter to only drafts and failed sessions (both can be continued)
        const continuableSessions = allDrafts.filter(d =>
            d.status === 'draft' || d.status === 'failed' || d.status === 'pending'
        );

        // Sort by updatedAt desc (most recent first)
        continuableSessions.sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        // Apply pagination
        const total = continuableSessions.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedDrafts = continuableSessions.slice(startIndex, endIndex);

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
