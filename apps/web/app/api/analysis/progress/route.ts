import { NextRequest, NextResponse } from 'next/server';
import { proxyBackendJson } from '@/lib/server/backend-proxy';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const buildPhaseResponse = getBuildPhaseRouteResponse();
  if (buildPhaseResponse) return buildPhaseResponse;

  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 });
  }

  return proxyBackendJson(req, {
    method: 'GET',
    path: '/api/queue/progress',
    searchParams: new URLSearchParams({ sessionId }),
  });
}
