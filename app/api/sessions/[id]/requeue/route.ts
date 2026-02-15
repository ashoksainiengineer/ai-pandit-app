import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { env } from '@/lib/config';

// ═════════════════════════════════════════════════════════════════════════════
// POST: Proxy Re-queue session for analysis to backend engine
// ═════════════════════════════════════════════════════════════════════════════

interface SessionParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: SessionParams) {
    try {
        const { userId: clerkId, getToken } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = await getToken();
        if (!token) {
            return NextResponse.json({ error: 'Authentication token unavailable' }, { status: 401 });
        }

        const { id: sessionId } = await params;

        // Forward to the unified Express Backend requeue handler
        // This ensures cleanupSession() is called and the engine is kicked off properly
        const backendUrl = env.api.backendUrl;
        const response = await fetch(`${backendUrl}/api/queue/requeue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Backend error' }));
            return NextResponse.json(
                { success: false, error: errorData.error || 'Failed to restart analysis' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Requeue Proxy error:', error);
        return NextResponse.json({ error: 'Failed to proxy requeue request' }, { status: 500 });
    }
}
