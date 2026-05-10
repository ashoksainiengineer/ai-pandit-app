'use server';

import { getServerAuth } from '@/lib/server/auth';
import { env } from '@/lib/config';
import { APIClient } from '@/lib/api-client';
import { logger } from '@/lib/secure-logger';

export async function cancelAnalysis(sessionId: string) {
    const sessionAuth = await getServerAuth();
    if (!sessionAuth) {
        throw new Error('Unauthorized: No session token found');
    }

    const token = await sessionAuth.getToken();

    try {
        const backendUrl = env.api.backendUrl.replace(/\/$/, '');
        const data = await APIClient.post(`${backendUrl}/api/queue/cancel`, { sessionId }, async () => token);
        logger.info('Analysis cancelled via Server Action', { sessionId });
        return { success: true, data };
    } catch (err: any) {
        logger.error('Cancel failed in Server Action', { error: err.message, sessionId });
        return { success: false, error: err.message };
    }
}

export async function restartAnalysis(sessionId: string) {
    const sessionAuth = await getServerAuth();
    if (!sessionAuth) {
        throw new Error('Unauthorized: No session token found');
    }

    const token = await sessionAuth.getToken();

    try {
        const backendUrl = env.api.backendUrl.replace(/\/$/, '');
        const data = await APIClient.post(`${backendUrl}/api/queue/requeue`, { sessionId }, async () => token);
        logger.info('Analysis restarted via Server Action', { sessionId });
        return { success: true, data };
    } catch (err: any) {
        logger.error('Restart failed in Server Action', { error: err.message, sessionId });
        return { success: false, error: err.message };
    }
}
