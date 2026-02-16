import { logger } from './secure-logger';

/**
 * 🔱 GOD-TIER TOKEN RETRIEVAL
 * Robustly acquires a Clerk token with retries and exponential backoff.
 */
export async function getTokenWithRetry(getToken: () => Promise<string | null>, maxRetries = 10): Promise<string | null> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const token = await getToken();

            // Clean common garbage tokens
            if (token && token !== 'null' && token !== 'undefined' && token.length > 20) {
                if (i > 0) logger.info(`✅ [Auth] Token acquired after ${i} retries (len: ${token.length})`);
                return token;
            }

            if (i === 0) logger.debug('⏳ [Auth] Waiting for Clerk session...');
        } catch (err) {
            logger.warn(`⚠️ [Auth] Retry ${i} failed`, err);
        }

        // Exponential backoff
        const delay = Math.min(100 * Math.pow(1.5, i), 2000);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    logger.error('❌ [Auth] Maximum retries reached for token acquisition');
    return null;
}
