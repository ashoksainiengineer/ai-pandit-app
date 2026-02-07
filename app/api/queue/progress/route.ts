import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { env } from '@/lib/config';

/**
 * /api/queue/progress/route.ts
 * Proxy endpoint to fetch real-time analysis progress from the backend.
 * Ensures the frontend only communicates with Vercel, which then talks to the backend.
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // 1. Authenticate Request
        const { userId, getToken } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Extract Session ID
        const searchParams = request.nextUrl.searchParams;
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        // 3. Get Auth Token for Backend
        const token = await getToken();
        if (!token) {
            return NextResponse.json({ error: 'Backend token unavailable' }, { status: 401 });
        }

        // 4. Proxy to Backend
        const backendUrl = env.api.backendUrl;
        const progressUrl = `${backendUrl}/api/queue/progress?sessionId=${sessionId}`;

        const backendResponse = await fetch(progressUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            // Cache must be disabled for real-time progress
            cache: 'no-store',
        });

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            return NextResponse.json(
                { error: `Backend error: ${backendResponse.status}`, details: errorText },
                { status: backendResponse.status }
            );
        }

        const data = await backendResponse.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Queue progress proxy failed:', error);
        return NextResponse.json(
            { error: 'Internal server error while fetching progress' },
            { status: 500 }
        );
    }
}
