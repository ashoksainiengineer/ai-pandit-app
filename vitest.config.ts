import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './apps/web'),
            '@ai-pandit/db': path.resolve(__dirname, './packages/db/src/drizzle.ts'),
            '@ai-pandit/shared': path.resolve(__dirname, './packages/shared/src/index.ts'),
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./apps/web/__tests__/setup.ts'],
        globals: true,
    },
});
