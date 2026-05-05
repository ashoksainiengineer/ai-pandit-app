import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/secure-logger';
import { auth } from '@clerk/nextjs/server';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';

/**
 * /api/log-client/route.ts
 * Secure endpoint for receiving and processing client-side logs.
 * Ensures that browser errors and lifecycle events are visible in server logs.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const buildPhaseResponse = getBuildPhaseRouteResponse();
    if (buildPhaseResponse) return buildPhaseResponse;

    try {
        const { userId } = await auth();

        // Require authentication for client logging (BUG-023: prevent log flooding)
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
        }
        const body = await req.json();

        const logEntry = {
            ...body,
            userId: userId || 'anonymous',
            source: 'browser-client',
            receivedAt: new Date().toISOString(),
        };

        // In production, stdout is captured by the hosting platform and monitoring pipeline.
        logger.info(`[CLIENT_LOG] ${JSON.stringify(logEntry)}`);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        // Silently fail to ensure logging never breaks the user experience
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
