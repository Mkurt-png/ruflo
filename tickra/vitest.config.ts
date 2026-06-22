import { defineConfig } from 'vitest/config';
import path from 'node:path';

// TICKRA-PHASE-3: unit-test foundation. Node environment is enough for the
// pure logic modules we test first (analytics, parsers, spaced repetition).
// jsdom can be added later if we test React components.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
