/**
 * Lightweight Ping Endpoint
 * Optimized for Edge runtime with minimal cold start time
 * Used by cron jobs and health checks to keep functions warm
 */

import { env } from '@/lib/config/env'; // Assuming this import is needed for env.app.region

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return Response.json(
    {
      status: 'ok',
      timestamp: Date.now(),
      region: env.app.region,
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
