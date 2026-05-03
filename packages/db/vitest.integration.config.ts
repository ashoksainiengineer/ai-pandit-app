import fs from 'node:fs';
import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.test for TEST_DATABASE_URL override
const testEnvPath = path.resolve(__dirname, '../../.env.test');
if (fs.existsSync(testEnvPath)) {
  dotenv.config({ path: testEnvPath, override: true });
}

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.NEON_DATABASE_URL ??
  'postgresql://postgres:postgres@127.0.0.1:5433/ai_pandit_test';

export default defineConfig({
  test: {
    name: 'db-integration',
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.integration.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    testTimeout: 30000,
    env: {
      NODE_ENV: process.env.NODE_ENV ?? 'test',
      NEON_DATABASE_URL: TEST_DATABASE_URL,
      DATABASE_URL: TEST_DATABASE_URL,
      TEST_DATABASE_URL,
    },
  },
});
