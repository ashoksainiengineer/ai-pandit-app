export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '../../../database/drizzle';
import { sessions } from '../../../database/schema';
import { eq } from 'drizzle-orm';
import { encryptData } from '@/lib/encryption';
import { env } from '@/lib/config';

// ═════════════════════════════════════════════════════════════════════════════
// SIMPLE LOGGER (avoids import issues)
// ═════════════════════════════════════════════════════════════════════════════
const logger = {
  info: (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta || ''),
  warn: (msg: string, meta?: any) => console.warn(`[WARN] ${msg}`, meta || ''),
  error: (msg: string, meta?: any) => console.error(`[ERROR] ${msg}`, meta || ''),
};

// ═════════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════════
interface TimeOffsetConfig {
  preset?: '30min' | '1hour' | '2hours' | '4hours' | '6hours' | '12hours';
  customMinutes?: number;
}

interface BirthData {
  fullName: string;
  dateOfBirth: string;
  tentativeTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: number;
  gender: string;
}

interface LifeEvent {
  category: string;
  eventType: string;
  eventDate: string;
  description: string;
  importance?: string;
  eventTime?: string;
  datePrecision?: string;
  endDate?: string;
}

interface CalculateRequest {
  birthData: BirthData;
  lifeEvents: LifeEvent[];
  physicalTraits?: any;
  forensicTraits?: any;
  offsetConfig: TimeOffsetConfig;
}

interface CalculateResponse {
  success: boolean;
  data?: {
    sessionId: string;
    position: number;
    estimatedWaitSeconds: number;
    status: string;
  };
  error?: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═════════════════════════════════════════════════════════════════════════════
function validateOffsetConfig(config: TimeOffsetConfig): { valid: boolean; error?: string } {
  if (!config) return { valid: false, error: 'Config is required' };
  
  const validPresets = ['30min', '1hour', '2hours', '4hours', '6hours', '12hours'];
  
  if (config.preset && !validPresets.includes(config.preset)) {
    return { valid: false, error: `Invalid preset. Must be one of: ${validPresets.join(', ')}` };
  }
  
  if (config.customMinutes !== undefined) {
    if (config.customMinutes < 1 || config.customMinutes > 720) {
      return { valid: false, error: 'Custom minutes must be between 1 and 720' };
    }
  }
  
  return { valid: true };
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN API ROUTE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/calculate - Submit birth time rectification for async processing
 * 
 * This endpoint creates a session and forwards it to the backend processing queue.
 * The backend queue-manager handles the actual BTR processing via seconds-precision-btr.ts.
 * 
 * Client should poll /api/queue/progress/:sessionId for results.
 */
export async function POST(request: NextRequest): Promise<NextResponse<CalculateResponse>> {
  const startTime = Date.now();

  try {
    // ─────────────────────────────────────────────────────────────────────
    // 1. AUTHENTICATE USER
    // ─────────────────────────────────────────────────────────────────────
    const { userId } = await auth();
    if (!userId) {
      logger.warn('Unauthorized calculate request');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. PARSE REQUEST
    // ─────────────────────────────────────────────────────────────────────
    const body = await request.json();
    const {
      birthData,
      lifeEvents,
      physicalTraits,
      forensicTraits,
      offsetConfig,
    }: CalculateRequest = body;

    // ─────────────────────────────────────────────────────────────────────
    // 3. VALIDATE INPUT
    // ─────────────────────────────────────────────────────────────────────
    if (!birthData || !lifeEvents || lifeEvents.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Invalid input: need birthData and minimum 3 life events' },
        { status: 400 }
      );
    }

    const offsetValidation = validateOffsetConfig(offsetConfig);
    if (!offsetValidation.valid) {
      return NextResponse.json(
        { success: false, error: offsetValidation.error || 'Invalid offset configuration' },
        { status: 400 }
      );
    }

    logger.info('Birth time rectification request', {
      userId,
      dateOfBirth: birthData.dateOfBirth,
      eventCount: lifeEvents.length,
      offsetConfig,
    });

    // ─────────────────────────────────────────────────────────────────────
    // 4. CREATE DATABASE SESSION
    // ─────────────────────────────────────────────────────────────────────
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Encrypt sensitive data using the same method as backend
    const encryptedLifeEvents = encryptData(JSON.stringify(lifeEvents), userId);
    const encryptedPhysicalTraits = physicalTraits
      ? encryptData(JSON.stringify(physicalTraits), userId)
      : null;
    const encryptedForensicTraits = forensicTraits
      ? encryptData(JSON.stringify(forensicTraits), userId)
      : null;

    // Encrypt fullName as well
    const encryptedFullName = encryptData(birthData.fullName, userId);

    await db.insert(sessions).values({
      id: sessionId,
      userId,
      clerkId: userId,
      fullName: encryptedFullName,
      dateOfBirth: birthData.dateOfBirth,
      tentativeTime: birthData.tentativeTime,
      birthPlace: birthData.birthPlace,
      latitude: birthData.latitude,
      longitude: birthData.longitude,
      timezone: birthData.timezone.toString(),
      gender: birthData.gender,
      physicalTraits: encryptedPhysicalTraits,
      forensicTraits: encryptedForensicTraits,
      lifeEvents: encryptedLifeEvents,
      offsetConfig: JSON.stringify(offsetConfig),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    logger.info('Database session created', { sessionId });

    // ─────────────────────────────────────────────────────────────────────
    // 5. FORWARD TO BACKEND QUEUE
    // ─────────────────────────────────────────────────────────────────────
    
    const backendUrl = env.api.backendUrl;
    const queueResponse = await fetch(`${backendUrl}/api/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.api.internalApiKey || ''}`,
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!queueResponse.ok) {
      const errorText = await queueResponse.text();
      logger.error('Backend queue submission failed', { sessionId, error: errorText });
      
      // Update session status to failed
      await db.update(sessions)
        .set({
          status: 'failed',
          errorMessage: 'Failed to queue for processing',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(sessions.id, sessionId));
      
      return NextResponse.json(
        { success: false, error: 'Failed to queue request for processing' },
        { status: 503 }
      );
    }

    const queueResult = await queueResponse.json();

    logger.info('Request queued for processing', {
      sessionId,
      position: queueResult.position,
      estimatedWait: queueResult.estimatedWaitSeconds,
    });

    const totalProcessingTime = Date.now() - startTime;

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
    logger.error('Calculate endpoint error', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
