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
    extends: './apps/worker/vitest.config.ts',
    test: {
      name: 'worker',
      environment: 'node',
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
  },
];
