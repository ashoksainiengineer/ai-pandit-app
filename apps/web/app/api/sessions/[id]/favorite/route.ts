import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { and, eq } from 'drizzle-orm';
import { setFavorite, toggleFavorite } from '@/lib/server/favorite-store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const existing = await db.query.sessions.findFirst({
      where: and(eq(sessions.id, sessionId), eq(sessions.clerkId, clerkId)),
      columns: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const nextValue = typeof body.isFavorite === 'boolean'
      ? await setFavorite(clerkId, sessionId, body.isFavorite)
      : await toggleFavorite(clerkId, sessionId);

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        isFavorite: nextValue,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to toggle favorite' }, { status: 500 });
  }
}
