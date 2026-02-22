/**
 * Admin Dashboard API Routes
 * Provides endpoints for admin dashboard metrics and data
 */

import { Router, Request, Response } from 'express';
import { db } from '@ai-pandit/db';
import { sessions, users } from '@ai-pandit/db/schema';
import { eq, and, gte, lte, sql, desc, count, SQL } from 'drizzle-orm';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';
import { AppError, ErrorCodes } from '../errors/index.js';

const router = Router();

/**
 * GET /api/admin/metrics
 * Get dashboard overview metrics
 */
router.get('/metrics', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clerkId = req.clerkId!;

    // Get total readings count
    const totalReadingsResult = await db
      .select({ count: count() })
      .from(sessions);
    const totalReadings = totalReadingsResult[0]?.count || 0;

    // Get readings by status
    const statusCounts = await db
      .select({
        status: sessions.status,
        count: count(),
      })
      .from(sessions)
      .groupBy(sessions.status);

    const activeReadings = statusCounts.find(s => s.status === 'processing')?.count || 0;
    const completedReadings = statusCounts.find(s => s.status === 'completed')?.count || 0;
    const failedReadings = statusCounts.find(s => s.status === 'failed')?.count || 0;

    // Calculate success rate
    const successRate = completedReadings + failedReadings > 0
      ? (completedReadings / (completedReadings + failedReadings)) * 100
      : 0;

    // Get total users
    const totalUsersResult = await db
      .select({ count: count() })
      .from(users);
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Get active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.lastLoginAt, thirtyDaysAgo.toISOString()));
    const activeUsers = activeUsersResult[0]?.count || 0;

    // Get today's readings
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const readingsTodayResult = await db
      .select({ count: count() })
      .from(sessions)
      .where(gte(sessions.createdAt, today.toISOString()));
    const readingsToday = readingsTodayResult[0]?.count || 0;

    // Get this week's readings
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const readingsThisWeekResult = await db
      .select({ count: count() })
      .from(sessions)
      .where(gte(sessions.createdAt, weekAgo.toISOString()));
    const readingsThisWeek = readingsThisWeekResult[0]?.count || 0;

    // Get this month's readings
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const readingsThisMonthResult = await db
      .select({ count: count() })
      .from(sessions)
      .where(gte(sessions.createdAt, monthAgo.toISOString()));
    const readingsThisMonth = readingsThisMonthResult[0]?.count || 0;

    // Calculate average processing time
    const avgProcessingResult = await db
      .select({
        avgTime: sql<number>`AVG(
          CASE 
            WHEN ${sessions.completedAt} IS NOT NULL AND ${sessions.startedProcessingAt} IS NOT NULL 
            THEN (julianday(${sessions.completedAt}) - julianday(${sessions.startedProcessingAt})) * 24 * 60
            ELSE NULL 
          END
        )`,
      })
      .from(sessions)
      .where(eq(sessions.status, 'completed'));

    const averageProcessingTime = avgProcessingResult[0]?.avgTime || 0;

    res.json({
      success: true,
      data: {
        totalReadings,
        activeReadings,
        completedReadings,
        successRate: Math.round(successRate * 10) / 10,
        averageProcessingTime: Math.round(averageProcessingTime),
        totalUsers,
        activeUsers,
        readingsToday,
        readingsThisWeek,
        readingsThisMonth,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch dashboard metrics', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch dashboard metrics',
      },
    });
  }
});

/**
 * GET /api/admin/db-check
 * Industrial diagnostic for Turso connectivity and session sync
 */
// Intercept HEAD requests (used by uptime bots) to prevent auth warning logs
router.head('/db-check', (req: Request, res: Response) => {
  res.status(200).end();
});

router.get('/db-check', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();
  try {
    // 1. Check raw connectivity
    const dbTest = await db.select({ val: sql`1` }).from(sessions).limit(1);

    // 2. Check session counts
    const sessionCount = await db.select({ count: count() }).from(sessions);

    // 3. Check user counts
    const userCount = await db.select({ count: count() }).from(users);

    res.json({
      success: true,
      diagnostics: {
        database: 'Turso/libSQL',
        connected: true,
        latencyMs: Date.now() - startTime,
        stats: {
          sessions: sessionCount[0]?.count || 0,
          users: userCount[0]?.count || 0
        },
        engineVersion: '3.0.0',
        environment: process.env.NODE_ENV
      }
    });
  } catch (error: any) {
    logger.error('❌ Database diagnostic failed', error);
    res.status(500).json({
      success: false,
      error: 'Database diagnostic failed',
      details: error.message
    });
  }
});

/**
 * GET /api/admin/readings
 * Get recent readings with pagination
 */
router.get('/readings', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const offset = (page - 1) * limit;

    const clerkId = req.clerkId!;
    const conditions: SQL<unknown>[] = [];
    if (status) {
      conditions.push(eq(sessions.status, status));
    }

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(sessions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    const total = totalResult[0]?.count || 0;

    // Get readings
    const readingsData = await db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        clerkId: sessions.clerkId,
        fullName: sessions.fullName,
        dateOfBirth: sessions.dateOfBirth,
        tentativeTime: sessions.tentativeTime,
        birthPlace: sessions.birthPlace,
        status: sessions.status,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
        completedAt: sessions.completedAt,
        confidence: sessions.accuracy,
        rectifiedTime: sessions.rectifiedTime,
      })
      .from(sessions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(sessions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get user details for each reading
    const readingsWithUsers = await Promise.all(
      readingsData.map(async (reading) => {
        const userData = await db
          .select({
            email: users.email,
            fullName: users.fullName,
          })
          .from(users)
          .where(eq(users.id, reading.userId))
          .limit(1);

        const user = userData[0];

        return {
          ...reading,
          userName: user?.fullName || reading.fullName || 'Unknown',
          userEmail: user?.email || 'unknown@email.com',
          processingDuration: reading.completedAt && reading.createdAt
            ? Math.round((new Date(reading.completedAt).getTime() - new Date(reading.createdAt).getTime()) / 1000)
            : undefined,
        };
      })
    );

    res.json({
      success: true,
      data: readingsWithUsers,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to fetch readings', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch readings',
      },
    });
  }
});

/**
 * GET /api/admin/readings/:id
 * Get single reading details
 */
router.get('/readings/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const readingData = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    if (readingData.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Reading not found',
        },
      });
    }

    const reading = readingData[0];

    // Get user details
    const userData = await db
      .select({
        email: users.email,
        fullName: users.fullName,
      })
      .from(users)
      .where(eq(users.id, reading.userId))
      .limit(1);

    const user = userData[0];

    res.json({
      success: true,
      data: {
        ...reading,
        userName: user?.fullName || reading.fullName || 'Unknown',
        userEmail: user?.email || 'unknown@email.com',
      },
    });
  } catch (error) {
    logger.error('Failed to fetch reading', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch reading',
      },
    });
  }
});

/**
 * GET /api/admin/analytics/timeseries
 * Get time series data for charts
 */
router.get('/analytics/timeseries', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily readings count
    const dailyData = await db
      .select({
        date: sql<string>`date(${sessions.createdAt})`,
        readings: count(),
      })
      .from(sessions)
      .where(gte(sessions.createdAt, startDate.toISOString()))
      .groupBy(sql`date(${sessions.createdAt})`)
      .orderBy(sql`date(${sessions.createdAt})`);

    // Fill in missing dates
    const dataMap = new Map(dailyData.map(d => [d.date, d.readings]));
    const filledData: Array<{ date: string; readings: number }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];

      filledData.push({
        date: dateStr,
        readings: dataMap.get(dateStr) || 0,
      });
    }

    res.json({
      success: true,
      data: filledData,
    });
  } catch (error) {
    logger.error('Failed to fetch time series data', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch analytics data',
      },
    });
  }
});

export default router;
