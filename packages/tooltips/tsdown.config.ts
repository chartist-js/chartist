import { defineConfig, type UserConfig } from 'tsdown';

/**
 * Package build. The sources import only types from `chartist`, so no
 * build imports anything at runtime.
 *
 * dist/index.js       ESM for bundlers (unminified, tree-shakable)
 * dist/index.min.js   minified ESM for browsers and CDNs
 * dist/index.cjs      CommonJS (+ index.d.cts)
 * dist/index.d.ts     bundled declarations for `import`
 *
 * scripts/styles.ts copies the stylesheet to dist/styles.css.
 */
const base: UserConfig = {
  entry: { index: 'src/index.ts' },
  outDir: 'dist',
  tsconfig: 'tsconfig.build.json',
  platform: 'neutral',
  target: 'es2022',
  sourcemap: true,
  clean: false,
  dts: false
};

// No declaration maps: they would point to sources that are not published.
const dts = { sourcemap: false };

export default defineConfig([
  { ...base, format: 'esm' },
  {
    ...base,
    format: 'esm',
    platform: 'browser',
    minify: true,
    outExtensions: () => ({ js: '.min.js' })
  },
  // CJS declarations (.d.cts) are built in a separate pass by tsdown.
  { ...base, format: 'cjs', dts },
  // Kept apart from the ESM build, as in chartist's build.
  {
    ...base,
    format: 'esm',
    sourcemap: false,
    dts: { ...dts, emitDtsOnly: true }
  }
]);
