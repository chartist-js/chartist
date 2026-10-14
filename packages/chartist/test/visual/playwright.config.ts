/**
 * Visual regression tests: screenshots every example of @chartist/examples
 * and compares it with the baseline in __screenshots__/.
 *
 * The baseline is authoritative for Linux x64 with the Chromium of the pinned
 * Playwright version (GitHub ubuntu-latest runners, WSL2). On other platforms
 * run the tests in the official Playwright Docker image or in CI.
 *
 * Run (see the Nx targets in package.json):
 * - pnpm nx run chartist:test:visual          local build (packages/chartist/dist)
 * - pnpm nx run chartist:test:visual:v1       published chartist@1.5.0
 * - pnpm nx run chartist:test:visual:update   re-record the baseline from 1.5.0
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const lib = process.env.CHARTIST_LIB === 'v1' ? 'v1' : 'local';
// Separate ports, so both builds can be tested at the same time.
const port = Number(process.env.VISUAL_PORT ?? (lib === 'v1' ? 4174 : 4173));

export default defineConfig({
  testDir: '.',
  testMatch: 'visual.spec.ts',
  outputDir: `./test-results/${lib}`,
  // Platform-free names: one baseline, recorded on Linux (see above).
  // VISUAL_SNAPSHOTS points at another baseline folder: for a machine whose
  // font rendering differs from the reference platform, record 1.5.0 there
  // (CHARTIST_LIB=v1 ... --update-snapshots) and test the local build
  // against it. The committed baseline is never touched that way.
  // (Relative to the working directory, not to this file.)
  snapshotPathTemplate: process.env.VISUAL_SNAPSHOTS
    ? `${path.resolve(process.env.VISUAL_SNAPSHOTS)}/{arg}{ext}`
    : '{testDir}/__screenshots__/{arg}{ext}',
  // A missing baseline fails; recording is explicit (--update-snapshots).
  updateSnapshots: 'none',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: `./playwright-report/${lib}` }]
  ],
  expect: {
    toHaveScreenshot: {
      // Anti-aliasing noise passes; a grid line moved by 1px fails.
      maxDiffPixelRatio: 0.001,
      threshold: 0.05,
      scale: 'css'
    }
  },
  use: {
    baseURL: `http://localhost:${port}`,
    browserName: 'chromium',
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'UTC',
    serviceWorkers: 'block'
  },
  projects: [{ name: `chromium (chartist ${lib})` }],
  webServer: {
    command: `pnpm exec vite --config test/visual/vite.config.ts --port ${port} --strictPort`,
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    url: `http://localhost:${port}/line/simple/`,
    reuseExistingServer: false,
    env: { CHARTIST_LIB: lib }
  }
});
