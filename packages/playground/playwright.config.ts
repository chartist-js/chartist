import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;

/**
 * End-to-end test of the built demo (dist/, built with --base /chartist/),
 * served like GitHub Pages. Run: pnpm nx run playground:test:e2e
 */
export default defineConfig({
  testDir: 'test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}/chartist/`
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // Approximates Safari; real iOS Safari is not covered.
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  webServer: {
    command: `node test/e2e/serve.mjs ${PORT}`,
    url: `http://localhost:${PORT}/chartist/`,
    reuseExistingServer: !process.env.CI
  }
});
