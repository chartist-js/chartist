import { defineConfig } from 'vitest/config';

// Unit tests only; the e2e/ specs run with Playwright (target e2e).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    passWithNoTests: true
  }
});
