import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/database/drizzle';
import { sessions, users } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { addToQueue, getQueueStatus, startQueueProcessor } from '@/lib/queue-manager';
import { env } from '@/lib/config';
import { validateOffsetConfig, TimeOffsetConfig } from '@/lib/time-offset-manager';
import { BirthData, LifeEvent } from '@/lib/types';
import { encryptObject as encryptData, decryptObject as decryptData } from '@/lib/crypto';

// Queue API - Submit and Poll for BTR Analysis


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
// POST: Submit new analysis request to queue (Proxies to Backend)
// ═════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
    try {
        // Authenticate
        const { userId, getToken } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = await getToken();
        if (!token) {
            return NextResponse.json(
                { success: false, error: 'No authentication token' },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Backend URL (Leapcell or Local)
        const BACKEND_URL = env.api.backendUrl;

        logger.info('Proxying BTR request to backend', { backendUrl: BACKEND_URL, userId });

        // Forward request to Backend
        const backendResponse = await fetch(`${BACKEND_URL}/api/queue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            let errorJson;
            try {
                errorJson = JSON.parse(errorText);
            } catch (e) {
                errorJson = { error: errorText };
            }

            logger.error('Backend submission failed', { status: backendResponse.status, error: errorJson });

            return NextResponse.json(
                { success: false, error: errorJson.error || 'Backend processing failed' },
                { status: backendResponse.status }
            );
        }

        const result = await backendResponse.json();
        return NextResponse.json(result);

    } catch (error: any) {
        logger.error('Queue proxy error', error);
        return NextResponse.json(
            { success: false, error: 'Failed to submit request to backend' },
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

        if (session[0].clerkId !== userId) {
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
