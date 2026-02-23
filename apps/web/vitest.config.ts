import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['lib/__tests__/**/*.test.ts', 'hooks/__tests__/**/*.test.ts'],
        exclude: ['node_modules', '.next'],
        setupFiles: ['./vitest.setup.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
});
