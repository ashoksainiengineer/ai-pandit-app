export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '../../../database/drizzle';
import { sessions, users } from '../../../database/schema';
import { eq } from 'drizzle-orm';
import { encrypt, encryptObject, initializeEncryption } from '@/lib/crypto';
import { logAuditEvent, getRequestMetadata } from '@/lib/audit';
import { env } from '@/lib/config';

// Initialize dependencies
initializeEncryption(process.env.ENCRYPTION_SECRET);

/**
 * @description API route to initiate a birth time rectification calculation.
 * It secures data, creates a session, and queues it for backend processing.
 */
export async function POST(request: NextRequest) {
  const { ipAddress, userAgent } = getRequestMetadata(request);

  try {
    // 1. Authenticate the user
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      // No audit log here as there's no user to associate with the event.
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate the request body
    const body = await request.json();
    const { birthData, lifeEvents, offsetConfig } = body;

    if (!birthData || !lifeEvents || lifeEvents.length < 3) {
      return NextResponse.json({ success: false, error: 'Invalid input: birthData and at least 3 life events are required.' }, { status: 400 });
    }

    // 3. Get or create the internal user record
    let user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
    if (!user) {
        const newUserId = crypto.randomUUID();
        await db.insert(users).values({
            id: newUserId,
            clerkId: clerkId,
            email: '', // This will be populated by a webhook
            role: 'user',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
        // Log this critical security event
        await logAuditEvent({ userId: clerkId, action: 'USER_AUTOCREATED', ipAddress, userAgent, details: { source: 'POST /api/calculate' } });
    }

    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 4. Securely encrypt all PII and sensitive data
    const encryptedData = {
        fullName: encrypt(birthData.fullName),
        birthPlace: encrypt(birthData.birthPlace), // Critical PII now encrypted
        lifeEvents: encryptObject(lifeEvents),
        physicalTraits: body.physicalTraits ? encryptObject(body.physicalTraits) : null,
        forensicTraits: body.forensicTraits ? encryptObject(body.forensicTraits) : null,
    };

    // 5. Create the session record in the database
    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      clerkId: clerkId,
      status: 'pending', // Start as pending
      // Encrypted fields
      fullName: encryptedData.fullName,
      birthPlace: encryptedData.birthPlace,
      lifeEvents: encryptedData.lifeEvents,
      physicalTraits: encryptedData.physicalTraits,
      forensicTraits: encryptedData.forensicTraits,
      // Unencrypted but non-PII fields
      dateOfBirth: birthData.dateOfBirth,
      tentativeTime: birthData.tentativeTime,
      latitude: birthData.latitude,
      longitude: birthData.longitude,
      timezone: birthData.timezone.toString(),
      gender: birthData.gender,
      offsetConfig: JSON.stringify(offsetConfig),
      createdAt: now,
      updatedAt: now,
    });
    
    // Log the successful queuing of the calculation - THIS IS A CRITICAL EVENT
    await logAuditEvent({ userId: clerkId, action: 'CALCULATION_QUEUED', resourceType: 'SESSION', resourceId: sessionId, ipAddress, userAgent });

    // 6. Forward only the sessionId to the backend processing queue
    const backendUrl = env.api.backendUrl;
    const queueResponse = await fetch(`${backendUrl}/api/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.api.internalApiKey || ''}`,
      },
      body: JSON.stringify({ sessionId }), // Securely send only the ID
    });

    if (!queueResponse.ok) {
      const errorText = await queueResponse.text();
      await db.update(sessions).set({ status: 'failed', errorMessage: 'Failed to queue for processing' }).where(eq(sessions.id, sessionId));
      // Log this critical failure event
      await logAuditEvent({ userId: clerkId, action: 'QUEUE_SUBMISSION_FAILED', resourceType: 'SESSION', resourceId: sessionId, details: { error: errorText } });
      return NextResponse.json({ success: false, error: 'Failed to queue request for processing' }, { status: 503 });
    }

    const queueResult = await queueResponse.json();

    // 7. Return the queue position to the client
    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        position: queueResult.position || 0,
        estimatedWaitSeconds: queueResult.estimatedWaitSeconds || 0,
        status: 'queued',
      },
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    console.error('[POST /api/calculate] CRITICAL ERROR:', error);
    // Log the overarching failure without a userId if it's not available
    await logAuditEvent({ action: 'CALCULATION_REQUEST_FAILED', ipAddress, userAgent, details: { error: errorMsg } });
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
