import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { env } from '@/lib/config';

/**
 * POST /api/queue/requeue — Proxy restart/requeue requests to backend.
 *
 * Authenticates user via Clerk and forwards the request
 * with a real Clerk JWT to the backend's `/api/queue/requeue`.
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate
        const { userId, getToken } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = await getToken();
        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Authentication token unavailable' },
                { status: 401 }
            );
        }

        // 2. Validate request body
        const body = await request.json();
        if (!body.sessionId) {
            return NextResponse.json(
                { success: false, error: 'Session ID required' },
                { status: 400 }
            );
        }

        // 3. Forward to backend with Clerk JWT
        const backendUrl = env.api.backendUrl;
        const response = await fetch(`${backendUrl}/api/queue/requeue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ sessionId: body.sessionId }),
        });

        // 4. Forward response
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Backend error' }));
            return NextResponse.json(
                { success: false, error: errorData.error || 'Failed to restart analysis' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        console.error('[POST /api/queue/requeue] Error:', message);
        return NextResponse.json(
            { success: false, error: 'Internal server error while restarting analysis' },
            { status: 500 }
        );
    }
}
