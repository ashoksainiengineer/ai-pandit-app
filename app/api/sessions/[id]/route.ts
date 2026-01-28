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
        console.log('[GET /api/sessions/:id] Starting request for session:', params.id);
        
        const { userId: clerkId } = await auth();
        console.log('[GET /api/sessions/:id] Clerk auth result - userId:', clerkId ? 'present' : 'null');
        
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sessionId = params.id;
        console.log('[GET /api/sessions/:id] Fetching session from database...');

        // Get session using raw SQL to handle missing forensicTraits column gracefully
        let session: any[] = [];
        try {
            // Try with forensicTraits column first
            const result = await db.query.sessions.findFirst({
                where: eq(sessions.id, sessionId)
            });
            if (result) {
                session = [result];
            }
        } catch (dbError: any) {
            console.error('[GET /api/sessions/:id] Database query error:', dbError.message);
            
            // If forensicTraits column is missing, use raw SQL without that column
            if (dbError.message?.includes('forensicTraits') || dbError.message?.includes('no such column')) {
                console.log('[GET /api/sessions/:id] forensicTraits column missing, using fallback query...');
                const { client } = await import('@/database/drizzle');
                const rawResult = await client.execute({
                    sql: `SELECT id, userId, clerkId, fullName, dateOfBirth, tentativeTime,
                          birthPlace, latitude, longitude, timezone, gender, physicalTraits,
                          lifeEvents, offsetConfig, rectifiedTime, accuracy, confidence,
                          analysisResult, progressData, reasoningLogs, status, errorMessage,
                          createdAt, updatedAt, completedAt
                          FROM sessions WHERE id = ?`,
                    args: [sessionId]
                });
                session = rawResult.rows as any[];
            } else {
                throw dbError;
            }
        }
        
        console.log('[GET /api/sessions/:id] Database query result - sessions found:', session.length);

        if (session.length === 0) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const s = session[0];
        console.log('[GET /api/sessions/:id] Session found - id:', s.id, 'clerkId:', s.clerkId);
        console.log('[GET /api/sessions/:id] Session fields - fullName exists:', !!s.fullName, 'lifeEvents exists:', !!s.lifeEvents, 'forensicTraits exists:', !!s.forensicTraits);

        // Verify ownership via clerkId
        if (s.clerkId !== clerkId) {
            console.log('[GET /api/sessions/:id] Authorization failed - session.clerkId:', s.clerkId, '!== auth.clerkId:', clerkId);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        console.log('[GET /api/sessions/:id] Starting decryption...');
        
        // Decrypt sensitive fields
        let decryptedFullName: string;
        try {
            decryptedFullName = safeDecrypt(s.fullName, clerkId);
            console.log('[GET /api/sessions/:id] Decrypted fullName successfully');
        } catch (e) {
            console.error('[GET /api/sessions/:id] Failed to decrypt fullName:', e);
            decryptedFullName = s.fullName || '';
        }
        
        let decryptedLifeEvents: any[] = [];
        try {
            if (s.lifeEvents) {
                const decrypted = safeDecrypt(s.lifeEvents, clerkId);
                decryptedLifeEvents = JSON.parse(decrypted);
                console.log('[GET /api/sessions/:id] Decrypted lifeEvents successfully');
            }
        } catch (e) {
            console.error('[GET /api/sessions/:id] Failed to decrypt/parse lifeEvents:', e);
            decryptedLifeEvents = [];
        }
        
        let decryptedPhysicalTraits: any = null;
        try {
            if (s.physicalTraits) {
                const decrypted = safeDecrypt(s.physicalTraits, clerkId);
                decryptedPhysicalTraits = JSON.parse(decrypted);
                console.log('[GET /api/sessions/:id] Decrypted physicalTraits successfully');
            }
        } catch (e) {
            console.error('[GET /api/sessions/:id] Failed to decrypt/parse physicalTraits:', e);
            decryptedPhysicalTraits = null;
        }
        
        let decryptedForensicTraits: any = null;
        try {
            if (s.forensicTraits) {
                const decrypted = safeDecrypt(s.forensicTraits, clerkId);
                decryptedForensicTraits = JSON.parse(decrypted);
                console.log('[GET /api/sessions/:id] Decrypted forensicTraits successfully');
            }
        } catch (e) {
            console.error('[GET /api/sessions/:id] Failed to decrypt/parse forensicTraits:', e);
            decryptedForensicTraits = null;
        }
        
        let offsetConfig: any = null;
        try {
            if (s.offsetConfig) {
                offsetConfig = JSON.parse(s.offsetConfig);
            }
        } catch (e) {
            console.error('[GET /api/sessions/:id] Failed to parse offsetConfig:', e);
            offsetConfig = null;
        }
        
        let analysisResult: any = null;
        try {
            if (s.analysisResult) {
                analysisResult = JSON.parse(s.analysisResult);
            }
        } catch (e) {
            console.error('[GET /api/sessions/:id] Failed to parse analysisResult:', e);
            analysisResult = null;
        }
        
        let reasoningLogs: any = null;
        try {
            if (s.reasoningLogs) {
                reasoningLogs = JSON.parse(s.reasoningLogs);
            }
        } catch (e) {
            console.error('[GET /api/sessions/:id] Failed to parse reasoningLogs:', e);
            reasoningLogs = null;
        }

        console.log('[GET /api/sessions/:id] All fields processed successfully, returning response');

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
                forensicTraits: decryptedForensicTraits,
                offsetConfig: offsetConfig,
                status: s.status,
                rectifiedTime: s.rectifiedTime,
                accuracy: s.accuracy,
                confidence: s.confidence,
                analysisResult: analysisResult,
                error: s.errorMessage,
                createdAt: s.createdAt,
                reasoningLogs: reasoningLogs,
            },
        });

    } catch (error: any) {
        console.error('[GET /api/sessions/:id] CRITICAL ERROR:', error);
        console.error('[GET /api/sessions/:id] Error stack:', error.stack);
        return NextResponse.json({
            error: 'Failed to fetch session',
            details: error.message
        }, { status: 500 });
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
        const { birthData, lifeEvents, physicalTraits, forensicTraits, offsetConfig, isDraft } = body;

        // Get session to verify ownership - handle missing forensicTraits column
        let session: any[] = [];
        try {
            const result = await db.query.sessions.findFirst({
                where: eq(sessions.id, sessionId)
            });
            if (result) {
                session = [result];
            }
        } catch (dbError: any) {
            if (dbError.message?.includes('forensicTraits') || dbError.message?.includes('no such column')) {
                console.log('[PUT /api/sessions/:id] forensicTraits column missing in initial query, using fallback...');
                const { client } = await import('@/database/drizzle');
                const rawResult = await client.execute({
                    sql: `SELECT id, clerkId FROM sessions WHERE id = ?`,
                    args: [sessionId]
                });
                session = rawResult.rows as any[];
            } else {
                throw dbError;
            }
        }

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
        const encryptedForensicTraits = forensicTraits
            ? encryptData(JSON.stringify(forensicTraits), clerkId)
            : null;

        const now = new Date().toISOString();

        try {
            // Update session
            await db.update(sessions)
                .set({
                    fullName: encryptedFullName,
                    dateOfBirth: birthData.dateOfBirth,
                    tentativeTime: birthData.tentativeTime,
                    birthPlace: birthData.birthPlace,
                    latitude: birthData.latitude,
                    longitude: birthData.longitude,
                    timezone: birthData.timezone.toString(),
                    gender: birthData.gender,
                    physicalTraits: encryptedPhysicalTraits,
                    forensicTraits: encryptedForensicTraits,
                    lifeEvents: encryptedLifeEvents,
                    offsetConfig: JSON.stringify(offsetConfig),
                    updatedAt: now,
                    // Reset status and results if NOT a draft save
                    ...(isDraft ? {} : {
                        status: 'pending',
                        errorMessage: null,
                        rectifiedTime: null,
                        accuracy: null,
                        confidence: null,
                        analysisResult: null,
                    })
                })
                .where(eq(sessions.id, sessionId));
        } catch (updateError: any) {
            // If forensicTraits column is missing, update without it
            if (updateError.message?.includes('forensicTraits') || updateError.message?.includes('no such column')) {
                console.log('[PUT /api/sessions/:id] forensicTraits column missing, updating without it...');
                await db.update(sessions)
                    .set({
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
                        ...(isDraft ? {} : {
                            status: 'pending',
                            errorMessage: null,
                            rectifiedTime: null,
                            accuracy: null,
                            confidence: null,
                            analysisResult: null,
                        })
                    })
                    .where(eq(sessions.id, sessionId));
            } else {
                throw updateError;
            }
        }

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
