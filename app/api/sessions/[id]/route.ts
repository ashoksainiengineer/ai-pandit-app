/**
 * Session API - Get/Update/Delete session
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, client } from '@/database/drizzle';
import { sessions } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { decrypt, encrypt, encryptObject, isEncrypted, initializeEncryption, decryptObject } from '@/lib/crypto';
import { logAuditEvent, getRequestMetadata } from '@/lib/audit';
import { LifeEvent, ForensicTraits, SpouseData, TimeOffsetConfig, BirthData } from '@/lib/types';

// Initialize encryption
initializeEncryption(process.env.ENCRYPTION_SECRET);

const safeJsonParse = <T>(jsonString: string | null | undefined, fallback: T): T => {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn('JSON Parse Error:', e);
    return fallback;
  }
};

const safeDecrypt = (data: string | null | undefined): string | null => {
  if (!data || !isEncrypted(data)) return data;
  try {
    return decrypt(data);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

const safeDecryptObject = <T>(data: string | null | undefined, fallback: T): T => {
  if (!data) return fallback;
  try {
    // Assuming data is an encrypted JSON string
    return decryptObject(data) as T;
  } catch (error) {
    console.error('Decryption failed for object:', error);
    return fallback;
  }
};

// GET: Fetch session data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { ipAddress, userAgent } = getRequestMetadata(request);
  const { id: sessionId } = await params;

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionResult = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (sessionResult.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const s = sessionResult[0];
    if (s.clerkId !== clerkId) {
      await logAuditEvent({ userId: clerkId, action: 'GET_SESSION_FORBIDDEN', ipAddress, userAgent, resourceId: sessionId });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fullName = safeDecrypt(s.fullName);
    if (fullName === null) {
      await logAuditEvent({ userId: clerkId, action: 'DECRYPTION_FAILED', resourceType: 'SESSION', resourceId: sessionId, details: { field: 'fullName' } });
    }

    const lifeEvents = safeDecryptObject<LifeEvent[]>(s.lifeEvents, []);
    const forensicTraits = safeDecryptObject<ForensicTraits>(s.forensicTraits, {} as ForensicTraits);
    const spouseData = safeDecryptObject<SpouseData | null>(s.spouseData, null);

    const birthData: BirthData = {
      fullName: fullName || '',
      dateOfBirth: s.dateOfBirth || '',
      tentativeTime: s.tentativeTime || '',
      birthPlace: s.birthPlace || '',
      latitude: s.latitude || 0,
      longitude: s.longitude || 0,
      timezone: Number(s.timezone) || 5.5,
      gender: s.gender as 'male' | 'female' | 'other' || 'other'
    };

    const decryptedData = {
      id: s.id,
      birthData,
      lifeEvents,
      forensicTraits,
      spouseData,
      offsetConfig: safeJsonParse<TimeOffsetConfig | null>(s.offsetConfig, null),
      status: s.status,
      updatedAt: s.updatedAt,
      createdAt: s.createdAt,
    };

    // NOTE: Logging every view event is too expensive for the free tier.
    // await logAuditEvent({ userId: clerkId, action: 'SESSION_VIEWED', resourceType: 'SESSION', resourceId: sessionId, ipAddress, userAgent });
    return NextResponse.json({ success: true, data: decryptedData });

  } catch (error: any) {
    console.error('[GET /api/sessions/[id]] Error:', error);
    await logAuditEvent({ action: 'GET_SESSION_FAILED', ipAddress, userAgent, resourceId: sessionId, details: { error: error.message } });
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

// PUT: Update session
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { ipAddress, userAgent } = getRequestMetadata(request);
  const { id: sessionId } = await params;

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      await logAuditEvent({ action: 'UPDATE_SESSION_UNAUTHORIZED', ipAddress, userAgent, resourceId: sessionId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const session = await db.select({ clerkId: sessions.clerkId }).from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session[0].clerkId !== clerkId) {
      await logAuditEvent({ userId: clerkId, action: 'UPDATE_SESSION_FORBIDDEN', ipAddress, userAgent, resourceId: sessionId });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { birthData, lifeEvents, physicalTraits, forensicTraits, offsetConfig, isDraft } = body;
    const updateData: any = { updatedAt: new Date().toISOString() };

    if (birthData?.fullName) updateData.fullName = encrypt(birthData.fullName);
    if (lifeEvents) updateData.lifeEvents = encryptObject(lifeEvents);
    if (forensicTraits) updateData.forensicTraits = encryptObject(forensicTraits);
    if (offsetConfig) updateData.offsetConfig = JSON.stringify(offsetConfig);


    if (!isDraft) {
      updateData.status = 'pending';
    }

    await db.update(sessions).set(updateData).where(eq(sessions.id, sessionId));
    await logAuditEvent({ userId: clerkId, action: 'SESSION_UPDATED', resourceType: 'SESSION', resourceId: sessionId, ipAddress, userAgent });

    return NextResponse.json({ success: true, message: 'Session updated' });

  } catch (error: any) {
    console.error('[PUT /api/sessions/[id]] Error:', error);
    await logAuditEvent({ action: 'UPDATE_SESSION_FAILED', ipAddress, userAgent, resourceId: sessionId, details: { error: error.message } });
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// DELETE: Delete session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { ipAddress, userAgent } = getRequestMetadata(request);
  const { id: sessionId } = await params;

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      await logAuditEvent({ action: 'DELETE_SESSION_UNAUTHORIZED', ipAddress, userAgent, resourceId: sessionId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await db.select({ clerkId: sessions.clerkId }).from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session[0].clerkId !== clerkId) {
      await logAuditEvent({ userId: clerkId, action: 'DELETE_SESSION_FORBIDDEN', ipAddress, userAgent, resourceId: sessionId });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cascade delete related data
    await client.execute({ sql: 'DELETE FROM payments WHERE sessionId = ?', args: [sessionId] });
    await client.execute({ sql: 'DELETE FROM calculations WHERE sessionId = ?', args: [sessionId] });
    await client.execute({ sql: 'DELETE FROM auditLogs WHERE resourceId = ?', args: [sessionId] });
    await db.delete(sessions).where(eq(sessions.id, sessionId));

    await logAuditEvent({ userId: clerkId, action: 'SESSION_DELETED', resourceType: 'SESSION', resourceId: sessionId, ipAddress, userAgent });

    return NextResponse.json({ success: true, message: 'Session and all related data deleted' });

  } catch (error: any) {
    console.error('[DELETE /api/sessions/[id]] Error:', error);
    await logAuditEvent({ action: 'DELETE_SESSION_FAILED', ipAddress, userAgent, resourceId: sessionId, details: { error: error.message } });
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
