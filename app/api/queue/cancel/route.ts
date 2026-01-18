import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

/**
 * Cancel API Proxy Route
 * Proxies cancellation requests to the Leapcell backend.
 */
export async function POST(request: NextRequest) {
    try {
        // Authenticate
        const { userId, getToken } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = await getToken();
        if (!token) {
            // Allow dev fallback if in development or if token is explicitly bypassed
            if (process.env.NODE_ENV !== 'production') {
                logger.warn('No auth token, using dev bypass for cancel proxy');
            } else {
                return NextResponse.json(
                    { success: false, error: 'No authentication token' },
                    { status: 401 }
                );
            }
        }

        const body = await request.json();
        const sessionId = body.sessionId;

        if (!sessionId) {
            return NextResponse.json(
                { success: false, error: 'Session ID required' },
                { status: 400 }
            );
        }

        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

        logger.info('Proxying cancel request to backend', { sessionId, backendUrl: BACKEND_URL });

        const response = await fetch(`${BACKEND_URL}/api/queue/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || 'dev-token-fallback'}`,
            },
            body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Backend error' }));
            return NextResponse.json(
                { success: false, error: errorData.error || 'Failed to cancel on backend' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        logger.error('Cancel proxy error', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error while canceling' },
            { status: 500 }
        );
    }
}
