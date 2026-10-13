/**
 * Public API suite: tests Chartist only through its package name.
 * `CHARTIST_API_TARGET` selects what `chartist` resolves to:
 * - `local`: the local build (dist/)
 * - `v1`: the published chartist@1.5.0 (dev dependency `chartist-v1`)
 *
 * Run: pnpm nx run chartist:test:api (or :test:api:v1).
 */
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const TARGETS = {
  local: {
    entry: '../../dist/index.js',
    tsconfig: 'tsconfig.json'
  },
  v1: {
    entry: '../../node_modules/chartist-v1/dist/index.js',
    tsconfig: 'tsconfig.v1.json'
  }
} as const;

const targetName = process.env.CHARTIST_API_TARGET ?? 'local';
if (!(targetName in TARGETS)) {
  throw new Error(
    `Unknown CHARTIST_API_TARGET "${targetName}". Use one of: ${Object.keys(TARGETS).join(', ')}.`
  );
}
const target = TARGETS[targetName as keyof typeof TARGETS];
const resolve = (file: string) => fileURLToPath(new URL(file, import.meta.url));

export default defineConfig({
  root: resolve('.'),
  resolve: {
    alias: [{ find: /^chartist$/, replacement: resolve(target.entry) }]
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['**/*.api.ts'],
    setupFiles: ['setup.ts'],
    typecheck: {
      enabled: true,
      include: ['**/*.test-d.ts'],
      tsconfig: resolve(target.tsconfig)
    }
  }
});
