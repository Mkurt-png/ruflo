import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Unit-test harness for Tickra's pure logic (no DOM, no I/O). Tests live
// next to the modules they cover under src/lib/**/__tests__. The `@` alias
// mirrors tsconfig so test imports match app imports.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
  },
});
