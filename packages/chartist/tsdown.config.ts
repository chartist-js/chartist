import { copyFile } from 'node:fs/promises';
import { defineConfig, type UserConfig } from 'tsdown';

/**
 * Library build. See openspec/changes/add-library-distribution/design.md.
 *
 * dist/index.js       ESM for bundlers (unminified, tree-shakable)
 * dist/index.cjs      CommonJS (+ index.d.cts)
 * dist/index.d.ts     bundled declarations for `import`
 * dist/index.min.js   minified, self-contained ESM for browsers and CDNs
 * dist/index.umd.js   minified UMD, global `Chartist` (1.x path)
 * dist/chartist.min.js  copy of the UMD build under the 0.x file name
 *
 * Styles are built by scripts/styles.cjs.
 */
const base: UserConfig = {
  entry: { index: 'src/index.ts' },
  outDir: 'dist',
  tsconfig: 'tsconfig.build.json',
  platform: 'neutral',
  // Matches the 1.x output (native classes and class fields) for the
  // browserslist `defaults` query in .browserslistrc.
  target: 'es2022',
  sourcemap: true,
  clean: false,
  dts: false
};

// No declaration maps: they would point to sources that are not published.
const dts = { sourcemap: false };

const min = (ext: string) => ({
  ...base,
  minify: true,
  outExtensions: () => ({ js: ext })
});

export default defineConfig([
  { ...base, format: 'esm' },
  // CJS declarations (.d.cts) are built in a separate pass by tsdown.
  { ...base, format: 'cjs', dts },
  // Kept apart from the ESM build: declarations in the same graph would
  // split the runtime helpers into a shared chunk.
  {
    ...base,
    format: 'esm',
    sourcemap: false,
    dts: { ...dts, emitDtsOnly: true }
  },
  { ...min('.min.js'), format: 'esm' },
  {
    // tsdown names UMD output `[name].umd.js`.
    ...min('.js'),
    format: 'umd',
    globalName: 'Chartist',
    hooks: {
      async 'build:done'() {
        // 0.x file name, so `dist/chartist.min.js` URLs keep working.
        // The copy keeps pointing to index.umd.js.map, which is published too.
        await copyFile('dist/index.umd.js', 'dist/chartist.min.js');
      }
    }
  }
]);
