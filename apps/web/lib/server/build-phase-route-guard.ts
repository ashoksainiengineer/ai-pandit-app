export function getBuildPhaseRouteResponse(): Response | null {
  if (process.env.NEXT_PHASE !== 'phase-production-build') {
    return null;
  }

  return new Response(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store',
      'X-Build-Phase-Route': 'true',
    },
  });
}
