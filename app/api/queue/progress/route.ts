import { NextRequest, NextResponse } from 'next/server';
import { getSessionProgress } from '@/lib/progress-tracker';
import { getQueueStatus } from '@/lib/queue-manager';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        // Get queue status to know if we are processing
        const queueStatus = await getQueueStatus(sessionId);

        if (!queueStatus) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // Get detailed progress
        const progress = await getSessionProgress(sessionId);

        return NextResponse.json({
            sessionId,
            status: queueStatus.status,
            position: queueStatus.position,
            estimatedWaitSeconds: queueStatus.estimatedWaitSeconds,
            progress: progress || {
                currentStep: 0,
                totalSteps: 10,
                percentage: 0,
                steps: [],
                lastUpdate: new Date().toISOString(),
                liveMessage: 'Waiting in queue...'
            }
        });

    } catch (error) {
        console.error('Progress fetch failed:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
