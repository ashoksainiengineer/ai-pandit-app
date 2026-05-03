import fs from 'node:fs';
import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.test first for integration database
const testEnvPath = path.resolve(__dirname, '../../.env.test');
if (fs.existsSync(testEnvPath)) {
  dotenv.config({ path: testEnvPath, override: true });
}

export default defineConfig({
  test: {
    name: 'api-integration',
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.integration.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    testTimeout: 60000,
    setupFiles: ['./src/lib/__tests__/setup.ts'],
    env: {
      NODE_ENV: process.env.NODE_ENV ?? 'test',
      NEON_DATABASE_URL: process.env.NEON_DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5433/ai_pandit_test',
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5433/ai_pandit_test',
      AI_API_KEY: process.env.AI_API_KEY ?? 'test-ai-key',
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? 'sk_test_dummy',
      ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET ?? 'test-secret-key-for-vitest-32chars!',
      SKIP_EPHEMERIS_INIT: process.env.SKIP_EPHEMERIS_INIT ?? 'true',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
