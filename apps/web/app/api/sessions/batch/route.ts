import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/server/auth';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { setFavorite, toggleFavorite } from '@/lib/server/favorite-store';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';
import { logger } from '@/lib/secure-logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BatchType = 'delete' | 'export' | 'favorite' | 'tag';

interface BatchRequestBody {
  type: BatchType;
  sessionIds: string[];
  payload?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const buildPhaseResponse = getBuildPhaseRouteResponse();
  if (buildPhaseResponse) return buildPhaseResponse;

  try {
    const sessionAuth = await getServerAuth();
    if (!sessionAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const externalId = sessionAuth.providerId;

    const body = (await req.json()) as BatchRequestBody;
    if (!body || !Array.isArray(body.sessionIds) || body.sessionIds.length === 0) {
      return NextResponse.json({ success: false, error: 'sessionIds are required' }, { status: 400 });
    }
    if (!body.type || !['delete', 'export', 'favorite', 'tag'].includes(body.type)) {
      return NextResponse.json({ success: false, error: 'Invalid batch operation type' }, { status: 400 });
    }

    const uniqueIds = [...new Set(body.sessionIds.filter((id): id is string => typeof id === 'string' && id.length > 0))];
    if (uniqueIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid session IDs provided' }, { status: 400 });
    }
    if (uniqueIds.length > 200) {
      return NextResponse.json({ success: false, error: 'Maximum 200 session IDs allowed per batch request' }, { status: 400 });
    }

    const ownedRows = await db.select({ id: sessions.id })
      .from(sessions)
      .where(and(
        eq(sessions.externalId, externalId),
        inArray(sessions.id, uniqueIds),
      ));
    const ownedIds = new Set(ownedRows.map((row) => row.id));
    const validIds = uniqueIds.filter((id) => ownedIds.has(id));

    if (validIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No authorized sessions found for operation' }, { status: 404 });
    }

    if (body.type === 'delete') {
      await db.delete(sessions)
        .where(and(
          eq(sessions.externalId, externalId),
          inArray(sessions.id, validIds),
        ));
      return NextResponse.json({
        success: true,
        data: {
          type: body.type,
          processed: validIds.length,
          skipped: uniqueIds.length - validIds.length,
        },
      });
    }

    if (body.type === 'favorite') {
      const explicitFavorite = body.payload && typeof body.payload.isFavorite === 'boolean'
        ? body.payload.isFavorite
        : undefined;
      const favoriteStates = [];
      for (const id of validIds) {
        const favoriteValue = explicitFavorite === undefined
          ? await toggleFavorite(externalId, id)
          : await setFavorite(externalId, id, explicitFavorite);
        favoriteStates.push({
          id,
          isFavorite: favoriteValue,
        });
      }
      return NextResponse.json({
        success: true,
        data: {
          type: body.type,
          processed: validIds.length,
          skipped: uniqueIds.length - validIds.length,
          favoriteStates,
        },
      });
    }

    if (body.type === 'export') {
      return NextResponse.json({
        success: true,
        data: {
          type: body.type,
          processed: validIds.length,
          skipped: uniqueIds.length - validIds.length,
          sessionIds: validIds,
          exportEndpoint: '/api/sessions/export',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        type: body.type,
        processed: validIds.length,
        skipped: uniqueIds.length - validIds.length,
        note: 'Tag operation is acknowledged but not persisted yet',
      },
    });
  } catch (error: unknown) {
    logger.error('Batch operation failed:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, error: 'Batch operation failed. Please try again.' }, { status: 500 });
  }
}
