import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/database/drizzle';
import { sessions } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { addToQueue, startQueueProcessor } from '@/lib/queue-manager';

// ═════════════════════════════════════════════════════════════════════════════
// POST: Re-queue session for analysis
// ═════════════════════════════════════════════════════════════════════════════

interface SessionParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: SessionParams) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: sessionId } = await params;

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

        // Check if session is already processing
        if (session[0].status === 'processing') {
            return NextResponse.json({
                error: 'Session is already being processed'
            }, { status: 400 });
        }

        // Reset session status to pending
        await db.update(sessions)
            .set({
                status: 'pending',
                errorMessage: null,
                rectifiedTime: null,
                accuracy: null,
                confidence: null,
                analysisResult: null,
                progressData: null, // Clear old progress artifacts
                completedAt: null,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(sessions.id, sessionId));

        // Add to queue
        const queueResult = await addToQueue(sessionId);

        if (!queueResult.success) {
            return NextResponse.json({
                error: queueResult.error
            }, { status: 503 });
        }

        // Start processor
        startQueueProcessor();

        return NextResponse.json({
            success: true,
            message: 'Session queued for re-analysis',
            position: queueResult.position,
            estimatedWaitSeconds: queueResult.estimatedWaitSeconds,
        });

    } catch (error) {
        console.error('Requeue error:', error);
        return NextResponse.json({ error: 'Failed to requeue session' }, { status: 500 });
    }
}
