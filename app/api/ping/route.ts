/**
 * Lightweight Ping Endpoint
 * Optimized for Edge runtime with minimal cold start time
 * Used by cron jobs and health checks to keep functions warm
 */

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return Response.json(
    {
      status: 'ok',
      timestamp: Date.now(),
      region: process.env.VERCEL_REGION || 'unknown',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Health-Check': 'true',
      },
    }
  );
}

export async function HEAD(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'X-Health-Check': 'true',
    },
  });
}
