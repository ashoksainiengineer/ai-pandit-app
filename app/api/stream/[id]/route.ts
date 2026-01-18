import { NextRequest } from 'next/server';

export const runtime = 'edge'; // Use Edge Runtime for long-lived SSE connections
export const dynamic = 'force-dynamic';

/**
 * SSE Proxy Route (Edge Runtime)
 * Proxies real-time progress events from Leapcell backend to the Vercel frontend.
 * Edge Runtime is required for long-lived streaming connections on Vercel.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const sessionId = params.id;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const streamUrl = `${backendUrl}/api/stream/${sessionId}`;

    console.log('Edge SSE Proxy: Connecting to', streamUrl);

    try {
        const response = await fetch(streamUrl, {
            headers: {
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache',
            },
        });

        if (!response.ok || !response.body) {
            console.error('Edge SSE Proxy: Backend connection failed', response.status);
            return new Response(`Backend stream unavailable: ${response.status}`, {
                status: response.status
            });
        }

        // Create a TransformStream to pipe data through
        const { readable, writable } = new TransformStream();

        // Pipe the backend response to the client
        response.body.pipeTo(writable).catch((err) => {
            console.error('Edge SSE Proxy: Pipe error', err);
        });

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        });
    } catch (error) {
        console.error('Edge SSE Proxy: Error', error);
        return new Response('SSE Proxy connection failed', { status: 500 });
    }
}
