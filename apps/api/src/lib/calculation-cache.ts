/**
 * Calculation Cache Service
 * Manages ephemeris calculations with TTL-based expiration
 * Reduces redundant calculations and improves performance
 */

import crypto from 'node:crypto';
import { db } from '@ai-pandit/db';
import { calculations } from '@ai-pandit/db/schema';
import { eq, and, lt, isNotNull, sql } from 'drizzle-orm';
import { logger } from './logger.js';

interface CacheEntry {
  id: string;
  sessionId: string;
  birthDateTime: string;
  latitude: number;
  longitude: number;
  timezone: string;
  ephemerisData: string;
  cacheHitCount: number;
  expiresAt: string | null;
  createdAt: string;
}

interface CacheLookupResult {
  found: boolean;
  data?: unknown;
  entry?: CacheEntry;
}

// Default TTL: 30 days
const DEFAULT_TTL_DAYS = 30;

/**
 * Generate cache key from calculation parameters
 */
export function generateCacheKey(
  birthDateTime: string,
  latitude: number,
  longitude: number,
  timezone: string
): string {
  // Normalize coordinates to 4 decimal places for consistent caching
  const normalizedLat = Math.round(latitude * 10000) / 10000;
  const normalizedLon = Math.round(longitude * 10000) / 10000;
  return `${birthDateTime}_${normalizedLat}_${normalizedLon}_${timezone}`;
}

/**
 * Lookup calculation in cache
 */
export async function lookupCalculation(
  birthDateTime: string,
  latitude: number,
  longitude: number,
  timezone: string
): Promise<CacheLookupResult> {
  try {
    const cacheKey = generateCacheKey(birthDateTime, latitude, longitude, timezone);
    const now = new Date().toISOString();

    // Find valid cache entry (not expired)
    const result = await db
      .select({
        id: calculations.id,
        sessionId: calculations.sessionId,
        birthDateTime: calculations.birthDateTime,
        latitude: calculations.latitude,
        longitude: calculations.longitude,
        timezone: calculations.timezone,
        ephemerisData: calculations.ephemerisData,
        cacheHitCount: calculations.cacheHitCount,
        expiresAt: calculations.expiresAt,
        createdAt: calculations.createdAt,
      })
      .from(calculations)
      .where(
        and(
          eq(calculations.birthDateTime, birthDateTime),
          eq(calculations.latitude, latitude),
          eq(calculations.longitude, longitude),
          eq(calculations.timezone, timezone),
          sql`${calculations.expiresAt} IS NULL OR ${calculations.expiresAt} > ${now}`
        )
      )
      .limit(1);

    if (result.length === 0) {
      return { found: false };
    }

    const entry = result[0];

    // Increment hit count
    await db
      .update(calculations)
      .set({
        cacheHitCount: entry.cacheHitCount + 1,
      })
      .where(eq(calculations.id, entry.id));

    // Parse and return data
    return {
      found: true,
      data: JSON.parse(entry.ephemerisData),
      entry: entry as CacheEntry,
    };
  } catch (error) {
    logger.error('Cache lookup failed', { error });
    return { found: false };
  }
}

/**
 * Store calculation in cache with TTL
 */
export async function storeCalculation(
  sessionId: string,
  birthDateTime: string,
  latitude: number,
  longitude: number,
  timezone: string,
  ephemerisData: unknown,
  ttlDays: number = DEFAULT_TTL_DAYS
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    await db.insert(calculations).values({
      id: crypto.randomUUID(),
      sessionId,
      birthDateTime,
      latitude,
      longitude,
      timezone,
      ephemerisData: JSON.stringify(ephemerisData),
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    });

    logger.info('Calculation cached', {
      sessionId,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    // Non-critical: Log but don't fail the calculation
    logger.warn('Failed to cache calculation', { error, sessionId });
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  expiredEntries: number;
  totalHits: number;
  averageHits: number;
}> {
  try {
    const now = new Date().toISOString();

    // Total entries
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(calculations);
    const totalEntries = totalResult[0]?.count ?? 0;

    // Expired entries
    const expiredResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(calculations)
      .where(and(isNotNull(calculations.expiresAt), lt(calculations.expiresAt, now)));
    const expiredEntries = expiredResult[0]?.count ?? 0;

    // Hit statistics
    const hitResult = await db
      .select({
        totalHits: sql<number>`sum(${calculations.cacheHitCount})`,
        avgHits: sql<number>`avg(${calculations.cacheHitCount})`,
      })
      .from(calculations);

    return {
      totalEntries,
      expiredEntries,
      totalHits: hitResult[0]?.totalHits ?? 0,
      averageHits: Math.round(hitResult[0]?.avgHits ?? 0),
    };
  } catch (error) {
    logger.error('Failed to get cache stats', { error });
    return {
      totalEntries: 0,
      expiredEntries: 0,
      totalHits: 0,
      averageHits: 0,
    };
  }
}

function getMutationRowCount(result: unknown): number {
  if (
    typeof result === 'object' &&
    result !== null &&
    'rowCount' in result &&
    typeof (result as { rowCount?: unknown }).rowCount === 'number'
  ) {
    return (result as { rowCount: number }).rowCount;
  }

  if (
    typeof result === 'object' &&
    result !== null &&
    'rowsAffected' in result &&
    typeof (result as { rowsAffected?: unknown }).rowsAffected === 'number'
  ) {
    return (result as { rowsAffected: number }).rowsAffected;
  }

  return 0;
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<number> {
  try {
    const now = new Date().toISOString();

    const result = await db
      .delete(calculations)
      .where(and(isNotNull(calculations.expiresAt), lt(calculations.expiresAt, now)));

    const deleted = getMutationRowCount(result);
    logger.info('Cleared expired cache entries', { deleted });
    return deleted;
  } catch (error) {
    logger.error('Failed to clear expired cache', { error });
    return 0;
  }
}

/**
 * Clear cache for a specific session
 */
export async function clearSessionCache(sessionId: string): Promise<void> {
  try {
    await db.delete(calculations).where(eq(calculations.sessionId, sessionId));
    logger.info('Cleared session cache', { sessionId });
  } catch (error) {
    logger.error('Failed to clear session cache', { error, sessionId });
  }
}
