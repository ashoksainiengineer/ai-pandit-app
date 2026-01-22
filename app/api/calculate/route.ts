export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '../../../database/drizzle';
import { sessions } from '../../../database/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import {
  generateCandidateTimes,
  validateOffsetConfig,
  TimeOffsetConfig,
} from '@/lib/time-offset-manager';
import analyzeAndFilterCandidates from '@/lib/candidate-analyzer';
import { analyzeTopCandidatesWithAI } from '@/lib/ai-thinking-client';
import { BirthData, LifeEvent, RankedCandidates } from '@/lib/types';

interface CalculateRequest {
  birthData: BirthData;
  lifeEvents: LifeEvent[];
  physicalTraits?: any;
  offsetConfig: TimeOffsetConfig;
}

interface CalculateResponse {
  success: boolean;
  data?: {
    sessionId: string;
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
    topRecommendation: any;
    alternativeOptions: any[];
    statistics: any;
  };
  error?: string;
}

function generateId(): string {
  return crypto.randomUUID();
}

function validateRequest(data: any): { isValid: boolean; error?: string } {
  const { birthData, lifeEvents, offsetConfig } = data;

  if (!birthData) return { isValid: false, error: 'Birth data is required' };
  if (!lifeEvents) return { isValid: false, error: 'Life events are required' };
  if (!offsetConfig) return { isValid: false, error: 'Offset configuration is required' };

  // Check birth data fields
  const requiredFields = ['fullName', 'dateOfBirth', 'tentativeTime', 'birthPlace', 'latitude', 'longitude', 'timezone', 'gender'];
  for (const field of requiredFields) {
    if (!birthData[field]) return { isValid: false, error: `${field} is required` };
  }

  // Validate date
  const birthDate = new Date(birthData.dateOfBirth);
  if (isNaN(birthDate.getTime())) return { isValid: false, error: 'Invalid date of birth' };
  if (birthDate > new Date()) return { isValid: false, error: 'Date of birth cannot be in the future' };

  // Validate time
  if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(birthData.tentativeTime)) {
    return { isValid: false, error: 'Invalid time format (HH:MM or HH:MM:SS required)' };
  }

  // Validate coordinates
  if (birthData.latitude < -90 || birthData.latitude > 90) {
    return { isValid: false, error: 'Invalid latitude' };
  }
  if (birthData.longitude < -180 || birthData.longitude > 180) {
    return { isValid: false, error: 'Invalid longitude' };
  }

  // Check life events
  if (!Array.isArray(lifeEvents) || lifeEvents.length < 3) {
    return { isValid: false, error: 'At least 3 life events are required' };
  }

  // Validate each life event
  for (const event of lifeEvents) {
    if (!event.category || !event.eventType || !event.eventDate || !event.description) {
      return { isValid: false, error: 'All life events must have category, type, date, and description' };
    }
    const eventDate = new Date(event.eventDate);
    if (isNaN(eventDate.getTime())) {
      return { isValid: false, error: 'Invalid event date' };
    }
  }

  return { isValid: true };
}

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

    // Validate offset configuration
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

    await db.insert(sessions).values({
      id: sessionId,
      userId,
      clerkId: userId, // Clerk user ID - same as userId from auth
      fullName: birthData.fullName,
      dateOfBirth: birthData.dateOfBirth,
      tentativeTime: birthData.tentativeTime,
      birthPlace: birthData.birthPlace,
      latitude: birthData.latitude,
      longitude: birthData.longitude,
      timezone: birthData.timezone.toString(),
      gender: birthData.gender,
      physicalTraits: physicalTraits ? JSON.stringify(physicalTraits) : null,
      lifeEvents: JSON.stringify(lifeEvents),
      offsetConfig: JSON.stringify(offsetConfig),
      status: 'processing',
      createdAt: now,
      updatedAt: now,
    });

    logger.info('Database session created', { sessionId });

    // ─────────────────────────────────────────────────────────────────────
    // 5. GENERATE CANDIDATE TIMES
    // ─────────────────────────────────────────────────────────────────────

    const candidates = generateCandidateTimes(birthData.tentativeTime, offsetConfig);

    logger.info('Generated candidate times', {
      count: candidates.length,
      sessionId,
    });

    // ─────────────────────────────────────────────────────────────────────
    // 6. QUICK FILTER & ANALYZE CANDIDATES
    // ─────────────────────────────────────────────────────────────────────

    const rankedCandidates: RankedCandidates = await analyzeAndFilterCandidates(
      birthData.dateOfBirth,
      candidates,
      birthData.latitude,
      birthData.longitude,
      birthData.timezone,
      lifeEvents
    );

    logger.info('Candidates analyzed and filtered', {
      topCandidates: rankedCandidates.topCandidates.length,
      allCandidates: rankedCandidates.allCandidates.length,
      sessionId,
    });

    // ─────────────────────────────────────────────────────────────────────
    // 7. DEEP ANALYSIS WITH AI FOR TOP CANDIDATES
    // ─────────────────────────────────────────────────────────────────────
    const aiResults = await analyzeTopCandidatesWithAI(
      rankedCandidates.topCandidates,
      lifeEvents
    );

    logger.info('AI deep analysis complete', {
      topTime: aiResults.topRecommendation.time,
      topScore: aiResults.topRecommendation.score,
      sessionId,
    });

    // ─────────────────────────────────────────────────────────────────────
    // 8. SAVE COMPLETE RESULTS TO DATABASE
    // ─────────────────────────────────────────────────────────────────────

    const updateNow = new Date().toISOString();

    await db.update(sessions)
      .set({
        rectifiedTime: aiResults.topRecommendation.time,
        accuracy: aiResults.topRecommendation.score,
        confidence: aiResults.topRecommendation.confidence,
        analysisResult: JSON.stringify({
          topRecommendation: aiResults.topRecommendation,
          alternativeOptions: aiResults.alternativeOptions,
          allCandidates: rankedCandidates.allCandidates.map((c) => ({
            time: c.time,
            offsetDescription: c.offsetDescription,
            quickScore: c.quickScore,
            eventMatches: c.eventMatches,
          })),
          totalCandidatesAnalyzed: rankedCandidates.totalAnalyzed,
          totalCandidatesWithAI: aiResults.candidates.length,
          processingTime: aiResults.processingTime,
        }),
        status: 'complete',
        updatedAt: updateNow,
      })
      .where(eq(sessions.id, sessionId));

    logger.info('Results saved to database', { sessionId });

    // ─────────────────────────────────────────────────────────────────────
    // 9. RETURN COMPREHENSIVE RESPONSE
    // ─────────────────────────────────────────────────────────────────────

    const totalProcessingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        rectifiedTime: aiResults.topRecommendation.time,
        accuracy: aiResults.topRecommendation.score,
        confidence: aiResults.topRecommendation.confidence,

        // Top recommendation
        topRecommendation: {
          time: aiResults.topRecommendation.time,
          offsetMinutes: aiResults.topRecommendation.offsetMinutes,
          offsetDescription: aiResults.topRecommendation.offsetDescription,
          score: aiResults.topRecommendation.score,
          confidence: aiResults.topRecommendation.confidence,
          analysis: aiResults.topRecommendation.analysis.substring(0, 2000),
          recommendation: aiResults.topRecommendation.recommendation,
        },

        // Alternative options (top 4 alternatives)
        alternativeOptions: aiResults.alternativeOptions.slice(0, 4).map((c) => ({
          time: c.time,
          offsetMinutes: c.offsetMinutes,
          offsetDescription: c.offsetDescription,
          score: c.score,
          confidence: c.confidence,
        })),

        // Summary statistics
        statistics: {
          totalCandidatesGenerated: candidates.length,
          topCandidatesAnalyzed: rankedCandidates.topCandidates.length,
          deepAnalysisCount: aiResults.candidates.length,
          allCandidateScores: rankedCandidates.allCandidates.map((c) => ({
            time: c.time,
            quickScore: c.quickScore,
            offsetDescription: c.offsetDescription,
          })),
          processingTime: {
            totalMs: totalProcessingTime,
            totalSeconds: (totalProcessingTime / 1000).toFixed(2),
          },
        },
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