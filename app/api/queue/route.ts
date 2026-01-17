import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/database/drizzle';
import { sessions } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { addToQueue, getQueueStatus, startQueueProcessor } from '@/lib/queue-manager';
import { validateOffsetConfig, TimeOffsetConfig } from '@/lib/time-offset-manager';
import { BirthData, LifeEvent } from '@/lib/types';
import { encryptData, decryptData } from '@/lib/crypto';

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE API - Submit and Poll for BTR Analysis
// ═════════════════════════════════════════════════════════════════════════════

interface SubmitRequest {
    birthData: BirthData;
    lifeEvents: LifeEvent[];
    physicalTraits?: {
        height?: string;
        build?: string;
        complexion?: string;
    };
    offsetConfig: TimeOffsetConfig;
}

// ═════════════════════════════════════════════════════════════════════════════
// POST: Submit new analysis request to queue
// ═════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
    try {
        // Authenticate
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse request
        const body: SubmitRequest = await request.json();
        const { birthData, lifeEvents, physicalTraits, offsetConfig } = body;

        // Validate input
        if (!birthData) {
            return NextResponse.json(
                { success: false, error: 'Birth data is required' },
                { status: 400 }
            );
        }

        if (!lifeEvents || lifeEvents.length < 3) {
            return NextResponse.json(
                { success: false, error: 'At least 3 life events are required' },
                { status: 400 }
            );
        }

        // Validate offset config
        const offsetValidation = validateOffsetConfig(offsetConfig);
        if (!offsetValidation.valid) {
            return NextResponse.json(
                { success: false, error: offsetValidation.error },
                { status: 400 }
            );
        }

        // Validate birth data fields
        const requiredFields = ['fullName', 'dateOfBirth', 'tentativeTime', 'birthPlace', 'latitude', 'longitude', 'timezone'];
        for (const field of requiredFields) {
            if (!birthData[field as keyof BirthData]) {
                return NextResponse.json(
                    { success: false, error: `${field} is required` },
                    { status: 400 }
                );
            }
        }

        // Validate date
        const birthDate = new Date(birthData.dateOfBirth);
        if (isNaN(birthDate.getTime())) {
            return NextResponse.json(
                { success: false, error: 'Invalid date of birth' },
                { status: 400 }
            );
        }

        // Validate coordinates
        if (birthData.latitude < -90 || birthData.latitude > 90) {
            return NextResponse.json(
                { success: false, error: 'Invalid latitude' },
                { status: 400 }
            );
        }
        if (birthData.longitude < -180 || birthData.longitude > 180) {
            return NextResponse.json(
                { success: false, error: 'Invalid longitude' },
                { status: 400 }
            );
        }

        // Create session in database with ENCRYPTED sensitive data
        const sessionId = crypto.randomUUID();
        const now = new Date().toISOString();

        // Encrypt sensitive fields - only user can decrypt with their userId
        const encryptedFullName = encryptData(birthData.fullName, userId);
        const encryptedLifeEvents = encryptData(JSON.stringify(lifeEvents), userId);
        const encryptedPhysicalTraits = physicalTraits
            ? encryptData(JSON.stringify(physicalTraits), userId)
            : null;

        await db.insert(sessions).values({
            id: sessionId,
            userId,
            fullName: encryptedFullName, // 🔐 Encrypted
            dateOfBirth: birthData.dateOfBirth, // Not encrypted (needed for calculations)
            tentativeTime: birthData.tentativeTime, // Not encrypted (needed for calculations)
            birthPlace: birthData.birthPlace, // Not encrypted (needed for display)
            latitude: birthData.latitude,
            longitude: birthData.longitude,
            timezone: birthData.timezone.toString(),
            gender: birthData.gender || 'other',
            physicalTraits: encryptedPhysicalTraits, // 🔐 Encrypted
            lifeEvents: encryptedLifeEvents, // 🔐 Encrypted
            offsetConfig: JSON.stringify(offsetConfig),
            status: 'pending',
            createdAt: now,
            updatedAt: now,
        });

        logger.info('Session created', { sessionId, userId });

        // Add to queue
        const queueResult = await addToQueue(sessionId);

        if (!queueResult.success) {
            // Queue full - update session status
            await db.update(sessions)
                .set({ status: 'failed', errorMessage: queueResult.error })
                .where(eq(sessions.id, sessionId));

            return NextResponse.json(
                { success: false, error: queueResult.error },
                { status: 503 }
            );
        }

        // Start queue processor (if not running)
        startQueueProcessor();

        return NextResponse.json({
            success: true,
            data: {
                sessionId,
                position: queueResult.position,
                estimatedWaitSeconds: queueResult.estimatedWaitSeconds,
                message: `Your request is in queue at position ${queueResult.position}`,
            },
        });

    } catch (error) {
        logger.error('Queue submit error', error);
        return NextResponse.json(
            { success: false, error: 'Failed to submit request' },
            { status: 500 }
        );
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// GET: Poll queue status
// ═════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
    try {
        // Authenticate
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get session ID from query params
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json(
                { success: false, error: 'sessionId is required' },
                { status: 400 }
            );
        }

        // Verify session belongs to user
        const session = await db.select()
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

        if (session.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Session not found' },
                { status: 404 }
            );
        }

        if (session[0].userId !== userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Get queue status
        const queueStatus = await getQueueStatus(sessionId);

        if (!queueStatus) {
            return NextResponse.json(
                { success: false, error: 'Failed to get queue status' },
                { status: 500 }
            );
        }

        // If complete, return results
        if (queueStatus.status === 'complete') {
            const analysisResult = session[0].analysisResult
                ? JSON.parse(session[0].analysisResult)
                : null;

            return NextResponse.json({
                success: true,
                data: {
                    status: 'complete',
                    rectifiedTime: session[0].rectifiedTime,
                    accuracy: session[0].accuracy,
                    confidence: session[0].confidence,
                    analysisResult,
                },
            });
        }

        // If failed, return error
        if (queueStatus.status === 'failed') {
            return NextResponse.json({
                success: true,
                data: {
                    status: 'failed',
                    error: session[0].errorMessage || 'Analysis failed',
                },
            });
        }

        // Still processing or queued
        return NextResponse.json({
            success: true,
            data: {
                status: queueStatus.status,
                position: queueStatus.position,
                estimatedWaitSeconds: queueStatus.estimatedWaitSeconds,
                totalInQueue: queueStatus.totalInQueue,
            },
        });

    } catch (error) {
        logger.error('Queue poll error', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get status' },
            { status: 500 }
        );
    }
}
