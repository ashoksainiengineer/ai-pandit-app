/**
 * Database Cleanup Service
 * Handles soft-deleted records, expired cache, and ephemeral data
 */

import { db, executeWithRetry } from '@ai-pandit/db';
import { sessions, calculations, users } from '@ai-pandit/db/schema';
import { eq, lt, and, isNotNull } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { getMutationRowCount } from './db-utils.js';

interface CleanupResult {
  table: string;
  deleted: number;
  errors?: string;
}


interface CleanupReport {
  timestamp: string;
  results: CleanupResult[];
  totalDeleted: number;
  durationMs: number;
}

// Retention periods (in days)
const RETENTION = {
  softDeletedSessions: 30,      // GDPR: 30 days after soft delete
  softDeletedUsers: 90,         // GDPR: 90 days for user data
  completedSessionsProgress: 1, // Clear progress 1 day after completion
  failedSessions: 7,            // Keep failed sessions for 7 days
  expiredCalculations: 30,      // Cache TTL: 30 days
  stalePendingSessions: 7,      // Pending for 7+ days
};

/**
 * Clean up soft-deleted sessions past retention period
 */
async function cleanupSoftDeletedSessions(): Promise<CleanupResult> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION.softDeletedSessions);

    const result = await executeWithRetry(() =>
      db.delete(sessions)
        .where(
          and(
            isNotNull(sessions.deletedAt),
            lt(sessions.deletedAt, cutoffDate.toISOString())
          )
        )
    );

    return {
      table: 'sessions',
      deleted: getMutationRowCount(result),
    };
  } catch (error) {
    logger.error('Failed to cleanup soft-deleted sessions', error);
    return {
      table: 'sessions',
      deleted: 0,
      errors: (error as Error).message,
    };
  }
}

/**
 * Clean up soft-deleted users past retention period
 */
async function cleanupSoftDeletedUsers(): Promise<CleanupResult> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION.softDeletedUsers);

    const result = await executeWithRetry(() =>
      db.delete(users)
        .where(
          and(
            isNotNull(users.deletedAt),
            lt(users.deletedAt, cutoffDate.toISOString())
          )
        )
    );

    return {
      table: 'users',
      deleted: getMutationRowCount(result),
    };
  } catch (error) {
    logger.error('Failed to cleanup soft-deleted users', error);
    return {
      table: 'users',
      deleted: 0,
      errors: (error as Error).message,
    };
  }
}

/**
 * Clear progressData from completed sessions
 */
async function cleanupCompletedSessionProgress(): Promise<CleanupResult> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION.completedSessionsProgress);

    const result = await executeWithRetry(() =>
      db.update(sessions)
        .set({
          progressData: null,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(sessions.status, 'complete'),
            isNotNull(sessions.completedAt),
            lt(sessions.completedAt, cutoffDate.toISOString()),
            isNotNull(sessions.progressData)
          )
        )
    );

    return {
      table: 'sessions.progressData',
      deleted: getMutationRowCount(result),
    };
  } catch (error) {
    logger.error('Failed to cleanup session progress data', error);
    return {
      table: 'sessions.progressData',
      deleted: 0,
      errors: (error as Error).message,
    };
  }
}

/**
 * Clean up expired calculations cache
 */
async function cleanupExpiredCalculations(): Promise<CleanupResult> {
  try {
    const now = new Date().toISOString();

    const result = await executeWithRetry(() =>
      db.delete(calculations)
        .where(
          and(
            isNotNull(calculations.expiresAt),
            lt(calculations.expiresAt, now)
          )
        )
    );

    return {
      table: 'calculations',
      deleted: getMutationRowCount(result),
    };
  } catch (error) {
    logger.error('Failed to cleanup expired calculations', error);
    return {
      table: 'calculations',
      deleted: 0,
      errors: (error as Error).message,
    };
  }
}

/**
 * Clean up stale pending sessions (orphaned/abandoned)
 */
async function cleanupStalePendingSessions(): Promise<CleanupResult> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION.stalePendingSessions);

    const result = await executeWithRetry(() =>
      db.delete(sessions)
        .where(
          and(
            eq(sessions.status, 'pending'),
            lt(sessions.createdAt, cutoffDate.toISOString()),
            isNotNull(sessions.lifeEvents) // Has data (not draft)
          )
        )
    );

    return {
      table: 'stale_pending_sessions',
      deleted: getMutationRowCount(result),
    };
  } catch (error) {
    logger.error('Failed to cleanup stale pending sessions', error);
    return {
      table: 'stale_pending_sessions',
      deleted: 0,
      errors: (error as Error).message,
    };
  }
}

/**
 * Run all cleanup operations
 */
export async function runDatabaseCleanup(): Promise<CleanupReport> {
  const startTime = Date.now();

  logger.info('Starting database cleanup...');

  const results = await Promise.all([
    cleanupSoftDeletedSessions(),
    cleanupSoftDeletedUsers(),
    cleanupCompletedSessionProgress(),
    cleanupExpiredCalculations(),
    cleanupStalePendingSessions(),
  ]);

  const totalDeleted = results.reduce((sum, r) => sum + r.deleted, 0);
  const durationMs = Date.now() - startTime;

  const report: CleanupReport = {
    timestamp: new Date().toISOString(),
    results,
    totalDeleted,
    durationMs,
  };

  logger.info('Database cleanup completed', {
    totalDeleted,
    durationMs,
    details: results,
  });

  return report;
}

/**
 * Get cleanup statistics without deleting
 */
export async function getCleanupPreview(): Promise<{
  wouldDelete: Record<string, number>;
}> {
  const cutoffSessions = new Date();
  cutoffSessions.setDate(cutoffSessions.getDate() - RETENTION.softDeletedSessions);

  const cutoffUsers = new Date();
  cutoffUsers.setDate(cutoffUsers.getDate() - RETENTION.softDeletedUsers);

  // Count queries (implementation depends on your Drizzle version)
  const wouldDelete: Record<string, number> = {
    softDeletedSessions: 0, // Query would go here
    softDeletedUsers: 0,
    completedSessionProgress: 0,
    expiredCalculations: 0,
    stalePendingSessions: 0,
  };

  return { wouldDelete };
}

export { RETENTION };
export type { CleanupReport, CleanupResult };
