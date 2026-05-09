import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/secure-logger';
import { env } from '@/lib/config/env';
import { randomUUID } from 'crypto';
import { auth, currentUser } from '@clerk/nextjs/server';
import { parseSensitiveField, encrypt, initializeEncryption } from '@/lib/crypto';
import { ensureUserRecord } from '@/lib/server/user-sync';
import { getProtectedFieldsPresent } from '@/lib/server/session-write-guards';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';
import { proxyBackendJson } from '@/lib/server/backend-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

initializeEncryption(env.security.encryptionSecret);

// ── Common helpers ──────────────────────────────────────────────────────────

const INTERNAL_ERROR = 'An internal error occurred. Please try again.';

/**
 * GET /api/sessions — Proxied to Express API (single source of truth).
 *
 * WHY PROXY: Previously this route queried the DB directly with its own
 * encryption context. Now it delegates to the Express API which is the
 * canonical session data layer. This eliminates:
 *   1. Dual encryption paths (Web vs API)
 *   2. Dual DB query logic
 *   3. Dual auth validation
 */
export async function GET(req: NextRequest) {
  const buildPhaseResponse = getBuildPhaseRouteResponse();
  if (buildPhaseResponse) return buildPhaseResponse;

  const requestId = randomUUID().slice(0, 8);

  try {
    // Delegate entirely to Express API
    const response = await proxyBackendJson(req, { path: '/api/sessions' });

    // If proxy returned a non-OK response, log but return as-is
    if (response.status >= 500) {
      logger.error('[Sessions] Backend proxy returned error', {
        status: response.status,
        requestId,
      });
    }

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[Sessions] Proxy error', { error: message, requestId });
    return NextResponse.json(
      { success: false, error: INTERNAL_ERROR },
      { status: 502 },
    );
  }
}

/**
 * POST /api/sessions — Create a new session locally then notify backend.
 *
 * Session creation stays local because it requires Clerk's currentUser()
 * for email/name extraction, and we need the user record created before
 * the backend can reference it. After creation, the backend can serve
 * the session via the proxy above.
 */
export async function POST(req: NextRequest) {
  const buildPhaseResponse = getBuildPhaseRouteResponse();
  if (buildPhaseResponse) return buildPhaseResponse;

  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const clerkId = clerkUser.id;
    const body = await req.json();
    const protectedFields = getProtectedFieldsPresent(
      body as Record<string, unknown>,
    );
    if (protectedFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Protected fields are backend-owned: ${protectedFields.join(', ')}`,
        },
        { status: 400 },
      );
    }

    if (!body.birthData) {
      return NextResponse.json(
        { success: false, error: 'Missing birth data' },
        { status: 400 },
      );
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const fullName =
      `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
      'User';
    const user = await ensureUserRecord({ clerkId, email, fullName });

    const newSessionId = randomUUID();
    const bd = body.birthData;

    const newSession = {
      id: newSessionId,
      userId: user.id,
      clerkId: clerkId,
      fullName: encrypt(bd.fullName || 'Unknown', user.id),
      dateOfBirth: encrypt(bd.dateOfBirth || '', user.id),
      tentativeTime: encrypt(bd.tentativeTime || '', user.id),
      birthPlace: encrypt(bd.birthPlace || '', user.id),
      latitude: bd.latitude || 0,
      longitude: bd.longitude || 0,
      timezone: String(bd.timezone ?? 5.5),
      gender: bd.gender || 'male',
      lifeEvents: body.lifeEvents
        ? encrypt(JSON.stringify(body.lifeEvents), user.id)
        : encrypt('[]', user.id),
      spouseData: body.spouseData
        ? encrypt(JSON.stringify(body.spouseData), user.id)
        : null,
      offsetConfig: body.offsetConfig
        ? encrypt(JSON.stringify(body.offsetConfig), user.id)
        : null,
      status: 'draft' as const,
      isEncrypted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create session in DB so it's immediately available via the proxy
    const { db } = await import('@ai-pandit/db');
    const { sessions } = await import('@ai-pandit/db/schema');
    await db.insert(sessions).values(newSession);

    return NextResponse.json({
      success: true,
      data: {
        ...newSession,
        birthData: bd,
        lifeEvents: body.lifeEvents || [],
        spouseData: body.spouseData,
        offsetConfig: body.offsetConfig,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[Sessions] POST failed', { error: message });
    return NextResponse.json(
      { success: false, error: INTERNAL_ERROR },
      { status: 500 },
    );
  }
}
