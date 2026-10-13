import { defineConfig, devices } from '@playwright/test';

const PORT = 4329;

/** E2E tests of the built site, served from dist/apps/docs by e2e/serve.mjs. */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
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
