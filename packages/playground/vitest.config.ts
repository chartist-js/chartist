import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Unit tests only; test/e2e holds the Playwright tests (test:e2e).
    include: ['test/unit/**/*.test.ts']
  }
});
