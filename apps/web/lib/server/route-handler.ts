import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/secure-logger';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';

type RouteHandler = (
  req: NextRequest,
  ctx: { clerkId: string; params?: Record<string, string> },
) => Promise<NextResponse>;

/**
 * Wraps a Next.js API route handler with build-phase guard, Clerk auth check,
 * parameter resolution, and standardized error handling.
 *
 * Eliminates copy-paste boilerplate across 10+ route files.
 */
export function withRouteHandler(
  handler: RouteHandler,
): (req: NextRequest, routeParams?: { params: Promise<Record<string, string>> }) => Promise<NextResponse> {
  return async (req: NextRequest, routeParams?: { params: Promise<Record<string, string>> }) => {
    // Build-phase guard (no DB available during Next.js build)
    const buildPhaseResponse = getBuildPhaseRouteResponse();
    if (buildPhaseResponse) return buildPhaseResponse;

    try {
      const { userId: clerkId } = await auth();
      if (!clerkId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 },
        );
      }

      const params = routeParams ? await routeParams.params : undefined;
      return handler(req, { clerkId, params });
    } catch (error) {
      logger.error('Route handler error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 },
      );
    }
  };
}
