import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * 🔱 Configuration Integrity Tests
 * ================================
 * Validates that the configuration layer is bulletproof.
 * It must fail loudly on missing secrets and scale automatically.
 */

describe('🛡️ Configuration Integrity Audit', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
        // Clear potentially conflicting env vars
        delete process.env.AI_API_KEY;
        delete process.env.NEON_DATABASE_URL;
        delete process.env.DATABASE_URL;
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('Requirement: Should fail loudly if essential secrets are missing', async () => {
        // Config is now lazy — importing the module does NOT trigger env validation.
        // Validation only runs when a config property is accessed.
        // We explicitly call ensureEnv() to trigger validation.

        try {
            const mod = await import('../config/index.js');
            // Trigger lazy validation by accessing a property
            void mod.config.app.nodeEnv;
            throw new Error('Config should have failed but passed');
        } catch (error: any) {
            expect(error.message).toContain('Configuration Validation Failed');
            expect(error.message).toContain('AI_API_KEY');
        }
    });

    it('Scalability: Should automatically calculate secondary thresholds from HEAP_THRESHOLD_GB', async () => {
        process.env.NODE_ENV = 'test';
        process.env.AI_API_KEY = 'test_key';
        process.env.AI_BASE_URL = 'https://api.groq.com';
        process.env.AI_MODEL = 'llama-3';
        process.env.NEON_DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
        process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
        process.env.CLERK_SECRET_KEY = 'test_clerk';
        process.env.ENCRYPTION_SECRET = '0123456789abcdef0123456789abcdef'; // 32 chars

        process.env.HEAP_THRESHOLD_GB = '10';
        // Note: We don't set RSS_THRESHOLD_GB or PRESSURE_THRESHOLD_GB

        const { memoryConfig } = await import('../config/index.js');

        expect(memoryConfig.heapThresholdGB).toBe(10);
        // RSS should default to Heap + 2
        expect(memoryConfig.rssThresholdGB).toBe(12);
        // Pressure should default to 80% of Heap
        expect(memoryConfig.pressureThresholdGB).toBe(8);
        // GC threshold should be hardcoded to 10
        expect(memoryConfig.gcThresholdGB).toBe(10);
    });

    it('Environment Isolation: Should respect NODE_ENV settings', async () => {
        process.env.AI_API_KEY = 'test_key';
        process.env.AI_BASE_URL = 'https://api.groq.com';
        process.env.AI_MODEL = 'llama-3';
        process.env.NEON_DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
        process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
        process.env.CLERK_SECRET_KEY = 'test_clerk';
        process.env.ENCRYPTION_SECRET = '0123456789abcdef0123456789abcdef';

        process.env.NODE_ENV = 'production';
        const { appConfig } = await import('../config/index.js');
        expect(appConfig.nodeEnv).toBe('production');
    });
});
