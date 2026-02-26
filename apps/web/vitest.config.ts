import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        environmentOptions: {
            jsdom: { url: 'http://localhost/' }
        },
        include: ['lib/**/*.test.ts', 'hooks/**/*.test.ts', 'components/**/*.test.tsx', '__tests__/**/*.test.tsx'],
        exclude: ['node_modules', '.next'],
        setupFiles: ['./vitest.setup.ts', './__tests__/setup.ts'],
        pool: 'forks',
        // @ts-ignore - Vitest 4 top-level pool options
        forks: {
            singleFork: true,
        },
        retry: 2,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
});
