import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { env } from '@/lib/config';

/**
 * GET /api/queue/progress — Proxy progress polling to backend.
 *
 * Forwards progress requests to the backend's `/api/queue` (GET)
 * with a real Clerk JWT. Passes through ALL backend response data
 * so the frontend receives complete progress, results, and metadata.
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const requestId = crypto.randomUUID().slice(0, 8);

    try {
        // 1. Authenticate
        const { userId, getToken } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Validate session ID
        const sessionId = request.nextUrl.searchParams.get('sessionId');
        if (!sessionId) {
            return NextResponse.json(
                { success: false, error: 'Session ID required' },
                { status: 400 }
            );
        }

        // 3. Get Clerk JWT
        const token = await getToken();
        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Token unavailable' },
                { status: 401 }
            );
        }

        // 4. Proxy to backend — backend GET /api/queue?sessionId=...
        const backendUrl = env.api.backendUrl;
        const progressUrl = `${backendUrl}/api/queue?sessionId=${sessionId}`;

        const response = await fetch(progressUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'X-Request-ID': requestId,
            },
            cache: 'no-store',
        });

        // Forward 429 directly for rate limiting
        if (response.status === 429) {
            return new NextResponse(null, { status: 429 });
        }

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error(`[${requestId}] Backend error ${response.status}:`, errorText);

            return NextResponse.json(
                { success: false, error: `Backend error: ${response.status}` },
                { status: response.status >= 500 ? 502 : response.status }
            );
        }

        // 5. Forward ALL backend response data (don't strip fields)
        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error(`[${requestId}] Progress proxy error:`, error);
        return NextResponse.json(
            { success: false, error: 'Proxy error' },
            { status: 500 }
        );
    }
}
