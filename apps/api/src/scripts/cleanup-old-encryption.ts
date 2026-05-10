/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * C5 FIX: Cleanup Script for Old Encryption Format Data
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This script scans the database for any data using the OLD weak encryption format
 * (3-part: iv:authTag:ciphertext) and clears it to ensure security.
 *
 * NEW secure format (4-part: salt:iv:authTag:ciphertext) is preserved.
 *
 * Usage: npx ts-node src/scripts/cleanup-old-encryption.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq, isNotNull } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

// ═══════════════════════════════════════════════════════════════════════════════
// DETECTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if data is in OLD format (3 parts)
 */
function isOldFormat(data: string | null): boolean {
    if (!data || typeof data !== 'string') return false;
    if (!data.includes(':')) return false;

    const parts = data.split(':');
    return parts.length === 3; // OLD format: iv:authTag:ciphertext
}

/**
 * Check if data is in NEW format (4 parts)
 */
function isNewFormat(data: string | null): boolean {
    if (!data || typeof data !== 'string') return false;
    if (!data.includes(':')) return false;

    const parts = data.split(':');
    return parts.length === 4; // NEW format: salt:iv:authTag:ciphertext
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLEANUP FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface CleanupStats {
    totalSessions: number;
    sessionsWithOldFormat: number;
    sessionsWithNewFormat: number;
    sessionsCleared: number;
    fieldsCleared: {
        lifeEvents: number;
    };
}

/**
 * Main cleanup function
 */
export async function cleanupOldEncryption(): Promise<CleanupStats> {
    const stats: CleanupStats = {
        totalSessions: 0,
        sessionsWithOldFormat: 0,
        sessionsWithNewFormat: 0,
        sessionsCleared: 0,
        fieldsCleared: {
            lifeEvents: 0,
        },
    };

    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('🧹 CLEANUP: Scanning for OLD encryption format data');
    logger.info('═══════════════════════════════════════════════════════════');

    // Get all sessions with any encrypted data
    const allSessions = await db
        .select({
            id: sessions.id,
            externalId: sessions.externalId,
            lifeEvents: sessions.lifeEvents,
        })
        .from(sessions)
        .where(isNotNull(sessions.lifeEvents));

    stats.totalSessions = allSessions.length;
    logger.info(`Found ${allSessions.length} sessions with data to check`);

    for (const session of allSessions) {
        const oldFields: string[] = [];
        const newFields: string[] = [];
        const updates: Record<string, null> = {};

        // Check lifeEvents
        if (session.lifeEvents) {
            if (isOldFormat(session.lifeEvents)) {
                oldFields.push('lifeEvents');
                updates.lifeEvents = null;
                stats.fieldsCleared.lifeEvents++;
            } else if (isNewFormat(session.lifeEvents)) {
                newFields.push('lifeEvents');
            }
        }



        // Update stats
        if (oldFields.length > 0) {
            stats.sessionsWithOldFormat++;
        }
        if (newFields.length > 0 && oldFields.length === 0) {
            stats.sessionsWithNewFormat++;
        }

        // Clear old format data
        if (Object.keys(updates).length > 0) {
            await db
                .update(sessions)
                .set({
                    ...updates,
                    status: 'failed',
                    errorMessage: 'Data cleared: OLD weak encryption format detected (C5 security fix)',
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(sessions.id, session.id));

            stats.sessionsCleared++;
            logger.warn(`🧹 CLEARED session ${session.id.slice(0, 8)}...`, {
                clearedFields: oldFields,
                preservedFields: newFields,
            });
        }
    }

    printSummary(stats);
    return stats;
}

/**
 * Print cleanup summary
 */
function printSummary(stats: CleanupStats): void {
    logger.info('\n═══════════════════════════════════════════════════════════');
    logger.info('🧹 CLEANUP COMPLETE');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info(`Total sessions checked: ${stats.totalSessions}`);
    logger.info(`Sessions with NEW format: ${stats.sessionsWithNewFormat}`);
    logger.info(`Sessions with OLD format: ${stats.sessionsWithOldFormat}`);
    logger.info(`Sessions cleared: ${stats.sessionsCleared}`);
    logger.info('');
    logger.info('Fields cleared:');
    logger.info(`  - lifeEvents: ${stats.fieldsCleared.lifeEvents}`);
    logger.info('═══════════════════════════════════════════════════════════\n');

    if (stats.sessionsWithOldFormat > 0) {
        logger.warn('⚠️  WARNING: Some sessions had OLD format data that was cleared!');
        logger.warn('Users will need to re-enter their data.');
    } else {
        logger.info('✅ No OLD format data found. All data is using secure encryption!');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    cleanupOldEncryption()
        .then(() => {
            logger.info('Cleanup script completed');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Cleanup failed', error);
            process.exit(1);
        });
}
