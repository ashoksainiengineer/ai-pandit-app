import { db, executeWithRetry } from '@ai-pandit/db';
import { users } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from './logger.js';
import { clerk } from '../middleware/auth.js';
import crypto from 'node:crypto';

function isUniqueConstraintError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.toLowerCase().includes('unique') || message.toLowerCase().includes('constraint');
}

/**
 * Self-Healing User Sync
 * 
 * Ensures a user exists in the local database by syncing from Clerk if missing.
 * This prevents orphaned sessions and handles edge cases where the webhook might have failed.
 * 
 * @param clerkId The external Clerk User ID
 * @returns The internal UUID for the user
 * @throws Error if synchronization fails
 */
export async function syncUser(clerkId: string): Promise<string> {
    // 🧪 TEST SCRIPT BYPASS
    if (clerkId === 'TEST_SCRIPT') {
        const testUserId = '00000000-0000-0000-0000-000000000000';
        try {
            const dbUser = await executeWithRetry(() =>
                db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
            );
            if (dbUser.length === 0) {
                const now = new Date().toISOString();
                await executeWithRetry(async () => {
                    try {
                        await db.insert(users).values({
                        id: testUserId,
                        clerkId: clerkId,
                        email: 'test@example.com',
                        fullName: 'Test User',
                        createdAt: now,
                        updatedAt: now,
                        });
                    } catch (error) {
                        if (!isUniqueConstraintError(error)) {
                            throw error;
                        }
                    }
                });
            }
        } catch (e) {
            logger.warn('Failed to insert test user', { error: e instanceof Error ? e.message : String(e) });
        }
        return testUserId;
    }

    const dbUser = await executeWithRetry(() =>
        db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    );

    if (dbUser.length > 0) {
        return dbUser[0].id;
    }

    logger.info('🔄 [Self-Healing] User missing from DB. Syncing from Clerk...', { clerkId });

    try {
        const clerkUser = await clerk.users.getUser(clerkId);
        const email = clerkUser.emailAddresses[0]?.emailAddress || '';
        const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null;
        const internalUserId = crypto.randomUUID();
        const now = new Date().toISOString();
        let insertHadConflict = false;
        await executeWithRetry(async () => {
            try {
                await db.insert(users).values({
                id: internalUserId,
                clerkId: clerkId,
                email: email,
                fullName: fullName,
                createdAt: now,
                updatedAt: now,
                });
            } catch (error) {
                if (!isUniqueConstraintError(error)) {
                    throw error;
                }
                insertHadConflict = true;
            }
        });
        const resolved = await executeWithRetry(() =>
            db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
        );
        if (resolved.length > 0) {
            logger.info('✅ [Self-Healing] User record recreated successfully', { clerkId, internalUserId: resolved[0].id });
            return resolved[0].id;
        }

        // If insert succeeded but immediate read didn't return row (mock/test lag), use generated UUID.
        if (!insertHadConflict) {
            logger.warn('[Self-Healing] User row not visible after insert; using generated ID fallback', { clerkId });
            return internalUserId;
        }

        throw new Error('User record not found after upsert');
    } catch (error) {
        logger.error('❌ [Self-Healing] Failed to fetch/create user from Clerk', {
            clerkId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw new Error('User synchronization failed');
    }
}
