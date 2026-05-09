import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/secure-logger';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';
import { proxyBackendJson } from '@/lib/server/backend-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INTERNAL_ERROR = 'An internal error occurred. Please try again.';

/**
 * GET /api/sessions/:id — Proxied to Express API.
 * PUT /api/sessions/:id — Proxied to Express API.
 * DELETE /api/sessions/:id — Proxied to Express API.
 *
 * All session CRUD goes through the Express API (single source of truth).
 * The Express API handles auth, ownership, encryption, and DB access.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const buildPhaseResponse = getBuildPhaseRouteResponse();
  if (buildPhaseResponse) return buildPhaseResponse;

  try {
    const { id } = await params;
    const response = await proxyBackendJson(req, {
      path: `/api/sessions/${id}`,
    });

    if (response.status >= 500) {
      logger.error('[Session] Backend proxy returned error', {
        sessionId: id,
        status: response.status,
      });
    }

    return response;
  } catch (error: unknown) {
    logger.error('[Session] Proxy error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: INTERNAL_ERROR },
      { status: 502 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const buildPhaseResponse = getBuildPhaseRouteResponse();
  if (buildPhaseResponse) return buildPhaseResponse;

  try {
    const { id } = await params;
    const body = await req.json();

    const response = await proxyBackendJson(req, {
      method: 'PUT',
      path: `/api/sessions/${id}`,
      body,
    });

    return response;
  } catch (error: unknown) {
    logger.error('[Session] PUT proxy error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: INTERNAL_ERROR },
      { status: 502 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const buildPhaseResponse = getBuildPhaseRouteResponse();
  if (buildPhaseResponse) return buildPhaseResponse;

  try {
    const { id } = await params;

    const response = await proxyBackendJson(req, {
      method: 'DELETE',
      path: `/api/sessions/${id}`,
    });

    return response;
  } catch (error: unknown) {
    logger.error('[Session] DELETE proxy error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: INTERNAL_ERROR },
      { status: 502 },
    );
  }
}
