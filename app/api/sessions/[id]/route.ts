/**
 * Session API - Get/Update/Delete session
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, client } from '@/database/drizzle';
import { sessions } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { safeDecrypt, encryptData, isEncrypted } from '@/lib/encryption';

// GET: Fetch session data for editing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch session
    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify ownership
    if (session[0].clerkId !== clerkId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const s = session[0];

    // Decrypt sensitive data with safety fallbacks
    const decryptedData = {
      id: s.id,
      fullName: s.fullName ? (safeDecrypt(s.fullName, clerkId) || 'Unencryptable name') : '',
      dateOfBirth: s.dateOfBirth,
      tentativeTime: s.tentativeTime,
      birthPlace: s.birthPlace,
      latitude: s.latitude,
      longitude: s.longitude,
      timezone: s.timezone,
      gender: s.gender,
      status: s.status,
      birthData: {
        fullName: s.fullName ? (safeDecrypt(s.fullName, clerkId) || 'Unencryptable name') : '',
        dateOfBirth: s.dateOfBirth,
        tentativeTime: s.tentativeTime,
        birthPlace: s.birthPlace,
        latitude: s.latitude,
        longitude: s.longitude,
        timezone: parseFloat(s.timezone || '5.5'),
        gender: s.gender,
      },
      lifeEvents: s.lifeEvents
        ? (safeDecrypt(s.lifeEvents, clerkId) ? JSON.parse(safeDecrypt(s.lifeEvents, clerkId)!) : [])
        : [],
      physicalTraits: s.physicalTraits
        ? (safeDecrypt(s.physicalTraits, clerkId) ? JSON.parse(safeDecrypt(s.physicalTraits, clerkId)!) : null)
        : null,
      forensicTraits: s.forensicTraits
        ? (safeDecrypt(s.forensicTraits, clerkId) ? JSON.parse(safeDecrypt(s.forensicTraits, clerkId)!) : null)
        : null,
      offsetConfig: s.offsetConfig ? JSON.parse(s.offsetConfig) : null,
    };

    return NextResponse.json({ success: true, data: decryptedData });

  } catch (error: any) {
    console.error('[GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT: Update session (for editing drafts)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { birthData, lifeEvents, physicalTraits, forensicTraits, offsetConfig, isDraft } = body;

    // Verify ownership
    const session = await db
      .select({ id: sessions.id, clerkId: sessions.clerkId })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session[0].clerkId !== clerkId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Encrypt sensitive data
    const encryptedFullName = birthData?.fullName ? encryptData(birthData.fullName, clerkId) : undefined;
    const encryptedLifeEvents = lifeEvents ? encryptData(JSON.stringify(lifeEvents), clerkId) : undefined;
    const encryptedPhysicalTraits = physicalTraits ? encryptData(JSON.stringify(physicalTraits), clerkId) : undefined;
    const encryptedForensicTraits = forensicTraits ? encryptData(JSON.stringify(forensicTraits), clerkId) : undefined;

    // Build update object
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (encryptedFullName !== undefined) updateData.fullName = encryptedFullName;
    if (birthData?.dateOfBirth !== undefined) updateData.dateOfBirth = birthData.dateOfBirth;
    if (birthData?.tentativeTime !== undefined) updateData.tentativeTime = birthData.tentativeTime;
    if (birthData?.birthPlace !== undefined) updateData.birthPlace = birthData.birthPlace;
    if (birthData?.latitude !== undefined) updateData.latitude = birthData.latitude;
    if (birthData?.longitude !== undefined) updateData.longitude = birthData.longitude;
    if (birthData?.timezone !== undefined) updateData.timezone = birthData.timezone.toString();
    if (birthData?.gender !== undefined) updateData.gender = birthData.gender;
    if (encryptedLifeEvents !== undefined) updateData.lifeEvents = encryptedLifeEvents;
    if (encryptedPhysicalTraits !== undefined) updateData.physicalTraits = encryptedPhysicalTraits;
    if (encryptedForensicTraits !== undefined) updateData.forensicTraits = encryptedForensicTraits;
    if (offsetConfig !== undefined) updateData.offsetConfig = JSON.stringify(offsetConfig);

    // Only update status if not explicitly preserving as draft
    if (!isDraft) {
      updateData.status = 'pending';
    }

    await db.update(sessions).set(updateData).where(eq(sessions.id, sessionId));

    return NextResponse.json({ success: true, message: 'Session updated' });

  } catch (error: any) {
    console.error('[PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update session', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const errors: string[] = [];

  console.log(`[DELETE] Starting delete for session: ${sessionId}`);

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      console.log('[DELETE] No auth');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`[DELETE] User: ${clerkId}`);

    // Verify ownership
    const session = await db
      .select({ id: sessions.id, clerkId: sessions.clerkId })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    console.log(`[DELETE] Session found: ${session.length > 0}`);

    if (session.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session[0].clerkId !== clerkId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Try to delete payments
    try {
      await client.execute({
        sql: 'DELETE FROM payments WHERE sessionId = ?',
        args: [sessionId]
      });
      console.log('[DELETE] Payments deleted');
    } catch (e: any) {
      console.log('[DELETE] Payments error:', e.message);
      errors.push(`payments: ${e.message}`);
    }

    // Try to delete calculations
    try {
      await client.execute({
        sql: 'DELETE FROM calculations WHERE sessionId = ?',
        args: [sessionId]
      });
      console.log('[DELETE] Calculations deleted');
    } catch (e: any) {
      console.log('[DELETE] Calculations error:', e.message);
      errors.push(`calculations: ${e.message}`);
    }

    // Try to delete auditLogs
    try {
      await client.execute({
        sql: 'DELETE FROM auditLogs WHERE resourceId = ?',
        args: [sessionId]
      });
      console.log('[DELETE] AuditLogs deleted');
    } catch (e: any) {
      console.log('[DELETE] AuditLogs error:', e.message);
      errors.push(`auditLogs: ${e.message}`);
    }

    // Delete the session
    try {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
      console.log('[DELETE] Session deleted successfully');
    } catch (e: any) {
      console.error('[DELETE] Session delete error:', e);
      return NextResponse.json(
        {
          error: 'Failed to delete session',
          details: e.message,
          previousErrors: errors
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Session deleted' });

  } catch (error: any) {
    console.error('[DELETE] Top level error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete session',
        details: error?.message || String(error),
        stack: error?.stack
      },
      { status: 500 }
    );
  }
}
