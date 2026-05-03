import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@ai-pandit/db': path.resolve(__dirname, '../../packages/db/src/index.ts'),
      '@ai-pandit/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@ai-pandit/worker-runtime': path.resolve(__dirname, '../../packages/worker-runtime/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
  },
});
