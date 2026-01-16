import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts'],
        setupFiles: ['./vitest.setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/engine/**/*.ts', 'src/components/game/ui/**/*.tsx'],
            exclude: ['src/engine/**/*.test.ts', 'src/engine/index.ts']
        }
    }
});
