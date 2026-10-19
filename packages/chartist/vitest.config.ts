import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['{test,src}/**/*.spec.ts'],
    // The public API suite (test:api) has its own config.
    exclude: ['test/api/**'],
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
