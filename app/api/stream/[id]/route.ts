import { NextRequest, NextResponse } from 'next/server';

// Use Node.js runtime (not Edge) for better SSE support in development
export const dynamic = 'force-dynamic';

/**
 * SSE Proxy Route
 * 
 * Proxies Server-Sent Events from the backend to the frontend.
 * Uses Node.js runtime for stable streaming.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const sessionId = params.id;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const streamUrl = `${backendUrl}/api/stream/${sessionId}`;

    console.log('SSE Proxy: Connecting to', streamUrl);

    try {
        const response = await fetch(streamUrl, {
            headers: {
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache',
            },
            // @ts-ignore - Next.js specific option
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('SSE Proxy: Backend returned', response.status);
            return NextResponse.json(
                { error: `Backend error: ${response.status}` },
                { status: response.status }
            );
        }

        if (!response.body) {
            console.error('SSE Proxy: No response body');
            return NextResponse.json(
                { error: 'No stream available' },
                { status: 502 }
            );
        }

        // Create a readable stream that transforms the backend response
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const transformedStream = new ReadableStream({
            async start(controller) {
                const reader = response.body!.getReader();

                try {
                    while (true) {
                        const { done, value } = await reader.read();

                        if (done) {
                            controller.close();
                            break;
                        }

                        // Forward the chunk directly
                        controller.enqueue(value);
                    }
                } catch (error) {
                    console.error('SSE Proxy: Stream read error', error);
                    controller.error(error);
                }
            },
            cancel() {
                console.log('SSE Proxy: Stream cancelled by client');
            }
        });

        return new Response(transformedStream, {
            status: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        });

    } catch (error) {
        console.error('SSE Proxy: Connection error', error);
        return NextResponse.json(
            { error: 'Failed to connect to backend stream' },
            { status: 500 }
        );
    }
}
