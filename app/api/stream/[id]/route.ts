import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/database/drizzle';
import { sessions } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/lib/config';

// Use Node.js runtime (not Edge) for better SSE support in development
export const dynamic = 'force-dynamic';

/**
 * SSE Proxy Route
 * 
 * Proxies Server-Sent Events from the backend to the frontend.
 * Uses Node.js runtime for stable streaming.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: sessionId } = await params;

    // 1. Authenticate user
    const { userId, getToken } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify Session Ownership - handle missing forensicTraits column
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
            console.log('[GET /api/stream/:id] forensicTraits column missing, using fallback query...');
            const { client } = await import('@/database/drizzle');
            const rawResult = await client.execute({
                sql: `SELECT id, userId, clerkId FROM sessions WHERE id = ?`,
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

    if (session[0].userId !== userId) {
        console.warn(`User ${userId} attempted to access session ${sessionId} owned by ${session[0].userId}`);
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const token = await getToken();
    const backendUrl = env.api.backendUrl;
    const streamUrl = `${backendUrl}/api/stream/${sessionId}`;

    console.log(`SSE Proxy: User ${userId} connecting to`, streamUrl);

    try {
        const response = await fetch(streamUrl, {
            headers: {
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Authorization': `Bearer ${token}`,
            },
            // @ts-ignore - Next.js specific option
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('SSE Proxy: Backend returned', response.status);
            return NextResponse.json(
                { error: `Backend error: ${response.status}` },
                { status: response.status }
            );
        }

        if (!response.body) {
            console.error('SSE Proxy: No response body');
            return NextResponse.json(
                { error: 'No stream available' },
                { status: 502 }
            );
        }

        // Create a readable stream that transforms the backend response
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const transformedStream = new ReadableStream({
            async start(controller) {
                const reader = response.body!.getReader();

                try {
                    while (true) {
                        const { done, value } = await reader.read();

                        if (done) {
                            controller.close();
                            break;
                        }

                        // Forward the chunk directly
                        controller.enqueue(value);
                    }
                } catch (error) {
                    console.error('SSE Proxy: Stream read error', error);
                    controller.error(error);
                }
            },
            cancel() {
                console.log('SSE Proxy: Stream cancelled by client');
            }
        });

        return new Response(transformedStream, {
            status: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        });

    } catch (error) {
        console.error('SSE Proxy: Connection error', error);
        return NextResponse.json(
            { error: 'Failed to connect to backend stream' },
            { status: 500 }
        );
    }
}
