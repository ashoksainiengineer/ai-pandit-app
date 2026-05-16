export default [
  {
    extends: './apps/api/vitest.config.ts',
    test: {
      name: 'api',
      environment: 'node',
    },
  },
  {
    extends: './apps/web/vitest.config.ts',
    test: {
      name: 'web',
      environment: 'jsdom',
    },
  },
  {
    extends: './packages/db/vitest.config.ts',
    test: {
      name: 'db',
      environment: 'node',
    },
  },
  {
    extends: './packages/shared/vitest.config.ts',
    test: {
      name: 'shared',
      environment: 'node',
    },
  {
    extends: './packages/worker-runtime/vitest.config.ts',
    test: {
      name: 'worker-runtime',
      environment: 'node',
    },
  },
];
