/**
 * Scheduled Database Cleanup Script
 * Run via cron job or scheduler (e.g., GitHub Actions, Vercel Cron)
 * 
 * Usage: tsx backend/src/scripts/scheduled-cleanup.ts
 */

import { runDatabaseCleanup } from '../lib/db-cleanup.js';
import { clearExpiredCache } from '../lib/calculation-cache.js';
import { logger } from '../utils/logger.js';

interface CleanupJobResult {
  success: boolean;
  timestamp: string;
  durationMs: number;
  details: {
    databaseCleanup?: {
      totalDeleted: number;
      results: Array<{
        table: string;
        deleted: number;
        errors?: string;
      }>;
    };
    cacheCleanup?: {
      expiredEntriesCleared: number;
    };
  };
  errors?: string[];
}

async function runScheduledCleanup(): Promise<CleanupJobResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  logger.info('🧹 Scheduled cleanup job started');

  try {
    // 1. Run database cleanup (soft deletes, progress data, etc.)
    const dbResult = await runDatabaseCleanup();

    // 2. Clear expired calculation cache
    const expiredCacheCount = await clearExpiredCache();

    const durationMs = Date.now() - startTime;

    const result: CleanupJobResult = {
      success: true,
      timestamp: new Date().toISOString(),
      durationMs,
      details: {
        databaseCleanup: {
          totalDeleted: dbResult.totalDeleted,
          results: dbResult.results,
        },
        cacheCleanup: {
          expiredEntriesCleared: expiredCacheCount,
        },
      },
    };

    logger.info('✅ Scheduled cleanup completed', result as Record<string, unknown>);
    return result;
  } catch (error) {
    const errorMsg = (error as Error).message;
    errors.push(errorMsg);

    const durationMs = Date.now() - startTime;

    const result: CleanupJobResult = {
      success: false,
      timestamp: new Date().toISOString(),
      durationMs,
      details: {},
      errors,
    };

    logger.error('❌ Scheduled cleanup failed', { error: errorMsg });
    return result;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runScheduledCleanup()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runScheduledCleanup };
export type { CleanupJobResult };
