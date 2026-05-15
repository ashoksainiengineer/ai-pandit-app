import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      // More specific aliases first to avoid prefix collision with '@ai-pandit/db'
      { find: '@ai-pandit/db/jobs', replacement: path.resolve(__dirname, '../../packages/db/src/jobs.ts') },
      { find: '@ai-pandit/db/schema', replacement: path.resolve(__dirname, '../../packages/db/src/schema.ts') },
      { find: '@ai-pandit/db', replacement: path.resolve(__dirname, '../../packages/db/src/index.ts') },
      { find: '@ai-pandit/shared/event-store', replacement: path.resolve(__dirname, '../../packages/shared/src/event-store.ts') },
      { find: '@ai-pandit/worker-runtime/session-events', replacement: path.resolve(__dirname, '../../packages/worker-runtime/src/session-events.ts') },
      { find: '@ai-pandit/shared', replacement: path.resolve(__dirname, '../../packages/shared/src/index.ts') },
      { find: '@ai-pandit/worker-runtime/progress-tracker', replacement: path.resolve(__dirname, '../../packages/worker-runtime/src/progress-tracker.ts') },
      { find: '@ai-pandit/worker-runtime', replacement: path.resolve(__dirname, '../../packages/worker-runtime/src/index.ts') },
    ],
  },
  test: {
    environment: 'node',
    exclude: ['**/dist/**', '**/node_modules/**'],
  },
});
