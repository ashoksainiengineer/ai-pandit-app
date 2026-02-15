import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { env } from '@/lib/config';

/**
 * POST /api/queue/cancel — Proxy cancel requests to backend.
 *
 * Authenticates user via Clerk and forwards the cancel request
 * with a real Clerk JWT to the backend's `/api/queue/cancel`.
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
        const response = await fetch(`${backendUrl}/api/queue/cancel`, {
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
                { success: false, error: errorData.error || 'Failed to cancel' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        console.error('[POST /api/queue/cancel] Error:', message);
        return NextResponse.json(
            { success: false, error: 'Internal server error while canceling' },
            { status: 500 }
        );
    }
}
