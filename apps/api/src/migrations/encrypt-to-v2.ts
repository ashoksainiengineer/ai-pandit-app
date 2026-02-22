/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * C5 FIX: Database Migration Script
 * Migrates all encrypted data from OLD encryption to NEW secure encryption
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * OLD Format: iv:authTag:ciphertext (uses scrypt(userId + secret, 'salt', 32))
 * NEW Format: salt:iv:authTag:ciphertext (uses pbkdf2(secret, randomSalt, 100000, 32))
 *
 * Usage: npx ts-node src/migrations/encrypt-to-v2.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { db } from '@ai-pandit/db';
import { sessions, users } from '@ai-pandit/db/schema';
import { eq, isNotNull } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';

// Import BOTH old and new encryption functions
import {
    decryptData as decryptDataOld,
    isEncrypted as isEncryptedOld
} from '../lib/encryption/DANGER_DO_NOT_MODIFY.js';

import {
    encryptData as encryptDataNew,
    isEncrypted as isEncryptedNew
} from '../lib/encryption/encryption-v2.js';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const BATCH_SIZE = 10;  // Process 10 records at a time
const DELAY_MS = 1000;  // 1 second delay between batches

// ═══════════════════════════════════════════════════════════════════════════════
// MIGRATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface MigrationStats {
    totalSessions: number;
    migratedSessions: number;
    failedSessions: number;
    skippedSessions: number;
    totalUsers: number;
    migratedUsers: number;
    failedUsers: number;
}

/**
 * Main migration function
 */
export async function migrateToEncryptionV2(): Promise<MigrationStats> {
    const stats: MigrationStats = {
        totalSessions: 0,
        migratedSessions: 0,
        failedSessions: 0,
        skippedSessions: 0,
        totalUsers: 0,
        migratedUsers: 0,
        failedUsers: 0,
    };

    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('STARTING ENCRYPTION MIGRATION: v1 → v2');
    logger.info('═══════════════════════════════════════════════════════════');

    // Step 1: Migrate Sessions Table
    await migrateSessions(stats);

    // Step 2: Migrate Users Table (if any encrypted fields)
    await migrateUsers(stats);

    // Step 3: Print Summary
    printSummary(stats);

    return stats;
}

/**
 * Migrate sessions table
 */
async function migrateSessions(stats: MigrationStats): Promise<void> {
    logger.info('\n📦 MIGRATING SESSIONS TABLE...\n');

    // Get all sessions with encrypted data
    const allSessions = await db
        .select({
            id: sessions.id,
            clerkId: sessions.clerkId,
            lifeEvents: sessions.lifeEvents,
            physicalTraits: sessions.physicalTraits,
            forensicTraits: sessions.forensicTraits,
        })
        .from(sessions)
        .where(isNotNull(sessions.lifeEvents));

    stats.totalSessions = allSessions.length;
    logger.info(`Found ${allSessions.length} sessions to process`);

    // Process in batches
    for (let i = 0; i < allSessions.length; i += BATCH_SIZE) {
        const batch = allSessions.slice(i, i + BATCH_SIZE);
        logger.info(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allSessions.length / BATCH_SIZE)}`);

        for (const session of batch) {
            try {
                await migrateSession(session);
                stats.migratedSessions++;
            } catch (error) {
                logger.error(`Failed to migrate session ${session.id}`, error);
                stats.failedSessions++;
            }
        }

        // Delay between batches
        if (i + BATCH_SIZE < allSessions.length) {
            await sleep(DELAY_MS);
        }
    }
}

/**
 * Migrate a single session
 */
async function migrateSession(session: {
    id: string;
    clerkId: string;
    lifeEvents: string | null;
    physicalTraits: string | null;
    forensicTraits: string | null;
}): Promise<void> {
    const updates: Record<string, string | null> = {};

    // Migrate lifeEvents
    if (session.lifeEvents && isEncryptedOld(session.lifeEvents)) {
        try {
            // 1. DECRYPT with OLD method
            const decrypted = decryptDataOld(
                session.lifeEvents,
                session.clerkId,
                config.encryption.secret
            );

            // 2. ENCRYPT with NEW method
            const reencrypted = encryptDataNew(decrypted, config.encryption.secret);

            updates.lifeEvents = reencrypted;
            logger.debug(`Migrated lifeEvents for session ${session.id.slice(0, 8)}`);
        } catch (error) {
            logger.error(`Failed to migrate lifeEvents for ${session.id}`, error);
            throw error;
        }
    }

    // Migrate physicalTraits
    if (session.physicalTraits && isEncryptedOld(session.physicalTraits)) {
        try {
            const decrypted = decryptDataOld(
                session.physicalTraits,
                session.clerkId,
                config.encryption.secret
            );
            const reencrypted = encryptDataNew(decrypted, config.encryption.secret);
            updates.physicalTraits = reencrypted;
        } catch (error) {
            logger.error(`Failed to migrate physicalTraits for ${session.id}`, error);
            throw error;
        }
    }

    // Migrate forensicTraits
    if (session.forensicTraits && isEncryptedOld(session.forensicTraits)) {
        try {
            const decrypted = decryptDataOld(
                session.forensicTraits,
                session.clerkId,
                config.encryption.secret
            );
            const reencrypted = encryptDataNew(decrypted, config.encryption.secret);
            updates.forensicTraits = reencrypted;
        } catch (error) {
            logger.error(`Failed to migrate forensicTraits for ${session.id}`, error);
            throw error;
        }
    }

    // Update database if any changes
    if (Object.keys(updates).length > 0) {
        await db
            .update(sessions)
            .set({
                ...updates,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(sessions.id, session.id));

        logger.info(`✅ Migrated session ${session.id.slice(0, 8)}...`);
    } else {
        logger.debug(`⏭️  Skipped session ${session.id.slice(0, 8)} (no encrypted data)`);
    }
}

/**
 * Migrate users table (if needed)
 */
async function migrateUsers(stats: MigrationStats): Promise<void> {
    // Check if users table has any encrypted fields
    // Currently it doesn't, but this is for future-proofing
    logger.info('\n📦 MIGRATING USERS TABLE...\n');
    logger.info('No encrypted fields in users table - skipping');
    stats.totalUsers = 0;
}

/**
 * Print migration summary
 */
function printSummary(stats: MigrationStats): void {
    logger.info('\n═══════════════════════════════════════════════════════════');
    logger.info('MIGRATION COMPLETE');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info(`Sessions: ${stats.migratedSessions}/${stats.totalSessions} migrated`);
    logger.info(`Failed: ${stats.failedSessions} sessions`);
    logger.info(`Users: ${stats.migratedUsers}/${stats.totalUsers} migrated`);
    logger.info('═══════════════════════════════════════════════════════════\n');

    if (stats.failedSessions > 0) {
        logger.error('⚠️  WARNING: Some sessions failed to migrate!');
        logger.error('Please review the logs above for details.');
        process.exit(1);
    } else {
        logger.info('✅ All sessions migrated successfully!');
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    migrateToEncryptionV2()
        .then(() => {
            logger.info('Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Migration failed', error);
            process.exit(1);
        });
}
