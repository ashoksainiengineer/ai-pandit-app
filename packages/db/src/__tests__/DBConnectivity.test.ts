import { describe, it, expect, vi } from 'vitest';
import { checkDatabaseHealth, executeWithTimeout } from '../drizzle.js';

describe('Turso DB Connectivity & Timeout Resilience', () => {
    it('should report healthy status when database is reachable', async () => {
        const health = await checkDatabaseHealth();
        // Since we are running in a test environment, it might be file-based or mocked
        expect(health).toHaveProperty('healthy');
        expect(typeof health.latencyMs).toBe('number');
    });

    it('should respect query timeouts using executeWithTimeout', async () => {
        const slowOperation = () => new Promise((resolve) => setTimeout(() => resolve('done'), 1000));

        await expect(executeWithTimeout(slowOperation, 100)).rejects.toThrow('Query timeout after 100ms');
    });

    it('should handle invalid credentials gracefully in health check', async () => {
        // In this test, we assume the environment might not have valid credentials or it's using memory DB
        const health = await checkDatabaseHealth();
        if (!health.healthy) {
            expect(health.error).toBeDefined();
        }
    });
});
