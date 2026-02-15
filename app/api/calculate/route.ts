export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logAuditEvent, getRequestMetadata } from '@/lib/audit';
import { env } from '@/lib/config';

/**
 * POST /api/calculate — Thin proxy to backend queue.
 *
 * Authenticates the user via Clerk, forwards the raw request body
 * and a fresh Clerk JWT to the backend's `/api/queue` endpoint.
 * Backend owns session creation, encryption, and queue processing.
 */
export async function POST(request: NextRequest) {
  const { ipAddress, userAgent } = getRequestMetadata(request);

  try {
    // 1. Authenticate — get Clerk user ID and a fresh JWT
    const { userId: clerkId, getToken } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = await getToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication token unavailable' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body (basic check — backend validates fully)
    const body = await request.json();
    const { birthData, lifeEvents } = body;

    if (!birthData || !lifeEvents || lifeEvents.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Invalid input: birthData and at least 3 life events are required.' },
        { status: 400 }
      );
    }

    // 3. Forward to backend with Clerk JWT (backend verifies via authMiddleware)
    const backendUrl = env.api.backendUrl;
    const response = await fetch(`${backendUrl}/api/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    // 4. Handle backend errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Backend error' }));
      console.error('[POST /api/calculate] Backend returned', response.status, errorData);

      await logAuditEvent({
        userId: clerkId,
        action: 'QUEUE_SUBMISSION_FAILED',
        ipAddress,
        userAgent,
        details: { status: response.status, error: errorData.error },
      });

      return NextResponse.json(
        { success: false, error: errorData.error || 'Failed to queue for processing' },
        { status: response.status >= 500 ? 503 : response.status }
      );
    }

    // 5. Forward successful response
    const result = await response.json();

    await logAuditEvent({
      userId: clerkId,
      action: 'CALCULATION_QUEUED',
      resourceType: 'SESSION',
      resourceId: result.data?.sessionId,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(result);

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    console.error('[POST /api/calculate] CRITICAL ERROR:', error);

    await logAuditEvent({
      action: 'CALCULATION_REQUEST_FAILED',
      ipAddress,
      userAgent,
      details: { error: errorMsg },
    });

    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
