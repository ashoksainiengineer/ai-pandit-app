import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/secure-logger';
import { env } from '@/lib/config/env';
import { randomUUID } from 'crypto';
import { db } from '@ai-pandit/db';
import { sessions, users } from '@ai-pandit/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getServerAuth, getServerCurrentUser } from '@/lib/server/auth';
import { getWebEncryption } from '@/lib/crypto';
import { ensureUserRecord } from '@/lib/server/user-sync';
import { getProtectedFieldsPresent } from '@/lib/server/session-write-guards';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INTERNAL_ERROR = 'An internal error occurred. Please try again.';

/**
 * GET /api/sessions — Direct DB query (fast, reliable, correct encryption).
 *
 * Dashboard is our most critical page. Users spend the most time here.
 * We query DB directly with proper encryption context because:
 *   1. Proxy to Express API adds latency + failure point
 *   2. Express API uses externalId as primary decrypt key — but data was
 *      encrypted with UUID by the Web BFF, causing fallback decryption
 *   3. Direct DB ensures encrypted text NEVER appears on dashboard
 */
export async function GET(_req: NextRequest) {
  const buildPhaseResponse = getBuildPhaseRouteResponse();
  if (buildPhaseResponse) return buildPhaseResponse;

  const requestId = randomUUID().slice(0, 8);

  try {
    const sessionAuth = await getServerAuth();
    if (!sessionAuth) {
      return NextResponse.json(
        { success: false, error: 'Session expired. Please sign in again.' },
        { status: 401 },
      );
    }

    // Resolve internal user
    const user = await db.query.users.findFirst({
      where: eq(users.externalId, sessionAuth.providerId),
    });

    if (!user) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch sessions owned by this user
    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, user.id))
      .orderBy(desc(sessions.createdAt));

    // Load favorites (non-critical — don't fail if table doesn't exist)
    let favoriteSet: Set<string> = new Set();
    try {
      const { getFavoriteSetForSessions } = await import('@/lib/server/favorite-store');
      favoriteSet = await getFavoriteSetForSessions(
        sessionAuth.providerId,
        userSessions.map((s) => s.id),
      );
    } catch { /* favorites unavailable */ }

    // Only decrypt fields dashboard list actually needs
    const crypto = getWebEncryption();
    const parsedSessions = userSessions.map((s) => ({
      ...s,
      isFavorite: favoriteSet.has(s.id),
      fullName: crypto.isEncrypted(s.fullName) ? (crypto.parseField(s.fullName, user.id) as string) : (s.fullName || 'Unknown'),
      dateOfBirth: crypto.isEncrypted(s.dateOfBirth) ? (crypto.parseField(s.dateOfBirth, user.id) as string) : (s.dateOfBirth || ''),
      tentativeTime: crypto.isEncrypted(s.tentativeTime) ? (crypto.parseField(s.tentativeTime, user.id) as string) : (s.tentativeTime || ''),
      birthPlace: crypto.isEncrypted(s.birthPlace) ? (crypto.parseField(s.birthPlace, user.id) as string) : (s.birthPlace || ''),
    }));

    return NextResponse.json({ success: true, data: parsedSessions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[Sessions] GET failed', { error: message, requestId });

    const isTransient =
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('network');

    return NextResponse.json(
      {
        success: false,
        error: isTransient
          ? 'Service temporarily unavailable. Please try again.'
          : INTERNAL_ERROR,
      },
      { status: isTransient ? 503 : 500 },
    );
  }
}

/**
 * POST /api/sessions — Create session locally (needs Clerk currentUser).
 * Writes proxy to Express API for consistency.
 */
export async function POST(req: NextRequest) {
  const buildPhaseResponse = getBuildPhaseRouteResponse();
  if (buildPhaseResponse) return buildPhaseResponse;

  try {
    const profile = await getServerCurrentUser();
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const providerId = profile.providerId;
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

    const email = profile.email || '';
    const fullName = profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User';
    const user = await ensureUserRecord({ externalId: providerId, email, fullName });

    const newSessionId = randomUUID();
    const bd = body.birthData;

    const webCrypto = getWebEncryption();
    const newSession = {
      id: newSessionId,
      userId: user.id,
      externalId: providerId,
      fullName: webCrypto.encrypt(bd.fullName || 'Unknown', user.id),
      dateOfBirth: webCrypto.encrypt(bd.dateOfBirth || '', user.id),
      tentativeTime: webCrypto.encrypt(bd.tentativeTime || '', user.id),
      birthPlace: webCrypto.encrypt(bd.birthPlace || '', user.id),
      latitude: bd.latitude || 0,
      longitude: bd.longitude || 0,
      timezone: String(bd.timezone ?? 5.5),
      gender: bd.gender || 'male',
      lifeEvents: body.lifeEvents
        ? webCrypto.encrypt(JSON.stringify(body.lifeEvents), user.id)
        : webCrypto.encrypt('[]', user.id),
      spouseData: body.spouseData
        ? webCrypto.encrypt(JSON.stringify(body.spouseData), user.id)
        : null,
      offsetConfig: body.offsetConfig
        ? webCrypto.encrypt(JSON.stringify(body.offsetConfig), user.id)
        : null,
      status: 'draft' as const,
      isEncrypted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { sessions: sessionsTable } = await import('@ai-pandit/db/schema');
    await db.insert(sessionsTable).values(newSession);

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
