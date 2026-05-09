import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/secure-logger';
import { env } from '@/lib/config/env';
import { auth } from '@clerk/nextjs/server';
import { encrypt, parseSensitiveField, initializeEncryption, isEncrypted } from '@/lib/crypto';
import {
  resolveSessionOwnershipContext,
} from '@/lib/server/session-ownership';
import { getProtectedFieldsPresent } from '@/lib/server/session-write-guards';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

initializeEncryption(env.security.encryptionSecret);

const INTERNAL_ERROR = 'An internal error occurred. Please try again.';

/**
 * Industry Standard BFF (Backend For Frontend) Pattern:
 * Web BFF handles ALL CRUD directly — no proxy to Express API.
 * Express API is for the worker and external consumers.
 * This ensures:
 *   1. No single point of failure (proxy timeout)
 *   2. Correct encryption context (UUID key, not clerkId)
 *   3. Consistent auth via Clerk cookie
 *   4. Lowest possible latency
 */

// ── GET /api/sessions/:id ──────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const buildPhaseResponse = getBuildPhaseRouteResponse();
  if (buildPhaseResponse) return buildPhaseResponse;

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const { db } = await import('@ai-pandit/db');
    const { sessions } = await import('@ai-pandit/db/schema');
    const { eq } = await import('drizzle-orm');

    const ctx = await resolveSessionOwnershipContext(clerkId);
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, id),
    });

    if (!session || (session.clerkId !== ctx.clerkId && session.userId !== ctx.internalUserId)) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    // Decrypt fields using the correct key (internal userId)
    const uid = ctx.internalUserId || clerkId;
    const decrypt = (val: string | null) =>
      isEncrypted(val) ? (parseSensitiveField(val, uid) as string) : val;

    return NextResponse.json({
      success: true,
      data: {
        ...session,
        fullName: decrypt(session.fullName),
        dateOfBirth: decrypt(session.dateOfBirth),
        tentativeTime: decrypt(session.tentativeTime),
        birthPlace: decrypt(session.birthPlace),
        lifeEvents: parseSensitiveField(session.lifeEvents, uid, undefined, []),
        spouseData: parseSensitiveField(session.spouseData, uid),
        offsetConfig: parseSensitiveField(session.offsetConfig, uid),
      },
    });
  } catch (error: unknown) {
    logger.error('[Session] GET failed', { error: (error as Error)?.message });
    return NextResponse.json({ success: false, error: INTERNAL_ERROR }, { status: 500 });
  }
}

// ── PUT /api/sessions/:id ──────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const buildPhaseResponse = getBuildPhaseRouteResponse();
  if (buildPhaseResponse) return buildPhaseResponse;

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const body = await req.json();
    const protectedFields = getProtectedFieldsPresent(body as Record<string, unknown>);
    if (protectedFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Protected fields are backend-owned: ${protectedFields.join(', ')}`,
      }, { status: 400 });
    }

    const { db } = await import('@ai-pandit/db');
    const { sessions } = await import('@ai-pandit/db/schema');
    const { eq } = await import('drizzle-orm');

    const ctx = await resolveSessionOwnershipContext(clerkId);
    const existing = await db.query.sessions.findFirst({
      where: eq(sessions.id, id),
      columns: { id: true, clerkId: true, userId: true, status: true },
    });

    if (!existing || (existing.clerkId !== ctx.clerkId && existing.userId !== ctx.internalUserId)) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    // Only allow editing draft, failed, pending sessions
    const MUTABLE_STATUSES = ['draft', 'failed', 'pending'];
    if (!MUTABLE_STATUSES.includes(existing.status)) {
      return NextResponse.json({
        success: false,
        error: `Session is locked for editing (status: ${existing.status})`,
      }, { status: 409 });
    }

    const uid = ctx.internalUserId || clerkId;
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.birthData) {
      const bd = body.birthData;
      if (bd.fullName) updateData.fullName = encrypt(bd.fullName, uid);
      if (bd.dateOfBirth) updateData.dateOfBirth = encrypt(bd.dateOfBirth, uid);
      if (bd.tentativeTime) updateData.tentativeTime = encrypt(bd.tentativeTime, uid);
      if (bd.birthPlace) updateData.birthPlace = encrypt(bd.birthPlace, uid);
      if (bd.latitude !== undefined) updateData.latitude = bd.latitude;
      if (bd.longitude !== undefined) updateData.longitude = bd.longitude;
      if (bd.timezone !== undefined) updateData.timezone = String(bd.timezone);
      if (bd.gender) updateData.gender = bd.gender;
    }

    if (body.lifeEvents !== undefined) {
      updateData.lifeEvents = encrypt(JSON.stringify(body.lifeEvents), uid);
    }
    if (body.spouseData !== undefined) {
      updateData.spouseData = encrypt(JSON.stringify(body.spouseData), uid);
    }
    if (body.offsetConfig !== undefined) {
      updateData.offsetConfig = encrypt(JSON.stringify(body.offsetConfig), uid);
    }

    await db.update(sessions).set(updateData).where(eq(sessions.id, id));

    return NextResponse.json({ success: true, message: 'Session updated' });
  } catch (error: unknown) {
    logger.error('[Session] PUT failed', { error: (error as Error)?.message });
    return NextResponse.json({ success: false, error: INTERNAL_ERROR }, { status: 500 });
  }
}

// ── DELETE /api/sessions/:id ───────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const buildPhaseResponse = getBuildPhaseRouteResponse();
  if (buildPhaseResponse) return buildPhaseResponse;

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const { db } = await import('@ai-pandit/db');
    const { sessions } = await import('@ai-pandit/db/schema');
    const { eq } = await import('drizzle-orm');

    const ctx = await resolveSessionOwnershipContext(clerkId);
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, id),
      columns: { id: true, clerkId: true, userId: true },
    });

    if (!session || (session.clerkId !== ctx.clerkId && session.userId !== ctx.internalUserId)) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    await db.delete(sessions).where(eq(sessions.id, id));

    return NextResponse.json({ success: true, message: 'Session deleted' });
  } catch (error: unknown) {
    logger.error('[Session] DELETE failed', { error: (error as Error)?.message });
    return NextResponse.json({ success: false, error: INTERNAL_ERROR }, { status: 500 });
  }
}
