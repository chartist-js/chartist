import { defineConfig, devices } from '@playwright/test';

// E2E_PORT lets parallel worktrees test their own builds side by side.
const PORT = Number(process.env.E2E_PORT ?? 4329);

/** E2E tests of the built site, served from dist/apps/docs by e2e/serve.mjs. */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // A busy CI runner now and then misses a click or a page load; retry there
  // so one slow moment doesn't block the docs deploy. Retried passes are
  // reported as flaky.
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Desktop Chrome']
  },
  webServer: {
    command: `node e2e/serve.mjs`,
    env: { PORT: String(PORT) },
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
