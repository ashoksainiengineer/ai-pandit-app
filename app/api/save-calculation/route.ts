import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@libsql/client';

export const dynamic = "force-dynamic";

// Initialize Turso client inside the handler
async function getDbClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
}

export async function POST(request: NextRequest) {
  const db = await getDbClient();
  try {
    // Protect the route - ensure user is authenticated
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { birthData, physicalDescription, lifeEvents, result } = body;

    if (!birthData || !result) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // Start a transaction to save all data
    const birthDataId = `btr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const resultId = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save birth data
    await db.execute({
      sql: `
        INSERT INTO birth_data (
          id, user_id, full_name, date_of_birth, tentative_time, time_uncertainty,
          birth_place, latitude, longitude, timezone, gender, marital_status, current_age
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        birthDataId,
        userId,
        birthData.fullName || '',
        birthData.dateOfBirth || '',
        birthData.tentativeTime || '',
        birthData.timeUncertainty || 'unknown',
        birthData.birthPlace || '',
        birthData.latitude || 0,
        birthData.longitude || 0,
        birthData.timezone || 'UTC+5:30',
        birthData.gender || 'male',
        birthData.maritalStatus || 'single',
        birthData.currentAge || 0
      ]
    });

    // Save physical description
    if (physicalDescription) {
      await db.execute({
        sql: `
          INSERT INTO physical_descriptions (
            id, birth_data_id, body_structure, height, face_shape, complexion, distinctive_features
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          `phys_${Date.now()}`,
          birthDataId,
          physicalDescription.bodyStructure || 'average',
          physicalDescription.height || 'average',
          physicalDescription.faceShape || 'oval',
          physicalDescription.complexion || 'wheatish',
          physicalDescription.distinctiveFeatures || ''
        ]
      });
    }

    // Save life events
    for (const event of (lifeEvents || [])) {
      await db.execute({
        sql: `
          INSERT INTO life_events (
            id, birth_data_id, category, event_type, event_date, date_accuracy,
            description, importance, event_time, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          birthDataId,
          event.category || 'other',
          event.eventType || '',
          event.eventDate || '',
          event.dateAccuracy || 'exact',
          event.description || '',
          event.importance || 'medium',
          event.eventTime || null,
          JSON.stringify(event.metadata || {})
        ]
      });
    }

    // Save calculation session
    await db.execute({
      sql: `
        INSERT INTO calculation_sessions (
          id, birth_data_id, session_token, current_step, is_complete
        ) VALUES (?, ?, ?, ?, ?)
      `,
      args: [sessionId, birthDataId, `token_${Math.random().toString(36).substr(2, 9)}`, 4, true]
    });

    // Save rectification result
    await db.execute({
      sql: `
        INSERT INTO rectification_results (
          id, birth_data_id, session_id, original_time, rectified_time,
          adjustment_minutes, confidence_score, confidence_level, primary_method,
          methods_used, executive_summary, recommendations, rectified_chart_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        resultId,
        birthDataId,
        sessionId,
        result.originalTime || '',
        result.rectifiedTime || '',
        result.adjustmentMinutes || 0,
        result.confidenceScore || 0,
        result.confidenceLevel || 'low',
        result.primaryMethod || 'event-based',
        JSON.stringify(result.methodsUsed || []),
        result.executiveSummary || '',
        JSON.stringify(result.recommendations || []),
        JSON.stringify(result.rectifiedChart || {})
      ]
    });

    return NextResponse.json({
      success: true,
      message: 'Calculation saved successfully',
      data: {
        birthDataId,
        sessionId,
        resultId
      }
    });

  } catch (error) {
    console.error('Save calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to save calculation' },
      { status: 500 }
    );
  }
}