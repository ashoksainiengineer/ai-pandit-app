import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * SSE Proxy Route
 * Proxies real-time progress events from Leapcell backend to the Vercel frontend.
 * This avoids CORS/Mixed Content issues in the browser.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const sessionId = params.id;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const streamUrl = `${backendUrl}/api/stream/${sessionId}`;

    logger.info('Proxying SSE stream request', { sessionId, streamUrl });

    try {
        const response = await fetch(streamUrl, {
            headers: {
                'Accept': 'text/event-stream',
            },
            // Important for long-running SSE connections on some environments
            cache: 'no-store',
        });

        if (!response.ok || !response.body) {
            logger.error('Failed to connect to backend stream', {
                sessionId,
                status: response.status,
                statusText: response.statusText
            });
            return new NextResponse('Stream source not available', { status: response.status });
        }

        // Return the stream directly from the backend
        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error) {
        logger.error('SSE Proxy error', { sessionId, error });
        return new NextResponse('Internal Server Error while proxying stream', { status: 500 });
    }
}
