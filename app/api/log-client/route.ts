import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * /api/log-client/route.ts
 * Secure endpoint for receiving and processing client-side logs.
 * Ensures that browser errors and lifecycle events are visible in server logs.
 */

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        // We allow logging even for unauthenticated users (e.g., login errors)
        // But we tag it if a user is present
        const body = await req.json();

        const logEntry = {
            ...body,
            userId: userId || 'anonymous',
            source: 'browser-client',
            receivedAt: new Date().toISOString(),
        };

        // In production, we log to stdout which is captured by Vercel/Monitoring tools
        console.log(`[CLIENT_LOG] ${JSON.stringify(logEntry)}`);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        // Silently fail to ensure logging never breaks the user experience
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
