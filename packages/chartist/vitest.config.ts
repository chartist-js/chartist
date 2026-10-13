import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['{test,src}/**/*.spec.ts'],
    // Playwright screenshot tests (test:visual) and the public API suite
    // (test:api) have their own configs.
    exclude: ['test/visual/**', 'test/api/**'],
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
