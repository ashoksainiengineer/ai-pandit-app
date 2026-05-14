import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      // More specific aliases first to avoid prefix collision with '@ai-pandit/db'
      { find: '@ai-pandit/db/schema', replacement: path.resolve(__dirname, '../../packages/db/src/schema.ts') },
      { find: '@ai-pandit/db', replacement: path.resolve(__dirname, '../../packages/db/src/index.ts') },
      { find: '@ai-pandit/shared', replacement: path.resolve(__dirname, '../../packages/shared/src/index.ts') },
      { find: '@ai-pandit/worker-runtime', replacement: path.resolve(__dirname, '../../packages/worker-runtime/src/index.ts') },
    ],
  },
  test: {
    environment: 'node',
    exclude: ['**/dist/**', '**/node_modules/**'],
  },
});
