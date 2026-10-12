import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['{test,src}/**/*.spec.ts'],
    // Playwright screenshot tests (test:visual), not unit tests.
    exclude: ['test/visual/**'],
    setupFiles: ['test/setup.ts'],
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['lcovonly', 'text'],
      reportsDirectory: 'coverage'
    }
  }
});
