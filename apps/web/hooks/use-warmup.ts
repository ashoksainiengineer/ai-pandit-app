'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { env } from '@/lib/config/env';
import { getTokenWithRetry } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';

/**
 * Hook to warm up backend analysis endpoints
 * Sends a background ping to the backend when a component mounts
 */
export function useWarmup() {
    const hasWarmedUp = useRef(false);
    const { getToken } = useAuth();

    useEffect(() => {
        if (hasWarmedUp.current || !env.warmup.enabled) return;

        const warmupEngine = async () => {
            try {
                const backendUrl = env.api.backendUrl;
                // Ping both /api/health and /api/warmup for maximum wake-up signal
                const endpoints = ['/api/health', '/api/warmup'];

                logger.info('🚀 Pre-warming backend engine...');

                const token = await getTokenWithRetry(getToken);

                await Promise.all(
                    endpoints.map(endpoint => {
                        const url = `${backendUrl}${endpoint}`;
                        return fetch(url, {
                            method: 'GET',
                            mode: 'cors',
                            headers: {
                                'Accept': 'application/json',
                                'Authorization': token ? `Bearer ${token}` : 'Bearer missing'
                            }
                        }).catch(e => logger.warn(`Warmup for ${endpoint} failed`, e));
                    })
                );

                hasWarmedUp.current = true;
                logger.info('✅ Engine warmed up.');
            } catch (error) {
                logger.error('❌ Engine warmup failed', error);
            }
        };

        // Small delay to prioritize main page load
        const timeoutId = setTimeout(warmupEngine, 1000);

        return () => clearTimeout(timeoutId);
    }, []);
}
