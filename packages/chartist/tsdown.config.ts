import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { defineConfig, type UserConfig } from 'tsdown';

/**
 * Library build. The formats and their reasons: openspec/specs/library-distribution/spec.md.
 *
 * dist/index.js       ESM for bundlers (unminified, tree-shakable)
 * dist/index.cjs      CommonJS (+ index.d.cts)
 * dist/index.d.ts     bundled declarations for `import`
 * dist/index.min.js   minified, self-contained ESM for browsers and CDNs
 * dist/index.umd.js   minified UMD, global `Chartist` (1.x path)
 * dist/chartist.min.js  copy of the UMD build under the 0.x file name
 * dist/compat.*        the compat plugin (chartist/compat) in the same
 *                      formats; it imports the core instead of bundling it.
 *                      Every build also sets up the global `Chartist` for
 *                      plugin scripts (src/compat/global.ts)
 * dist/live.*          live updates (chartist/live) in the same formats,
 *                      importing the core the same way
 * dist/server.*        server rendering (chartist/server) in the same
 *                      formats, importing the core the same way
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

/**
 * The compat entry imports only `../index` (the package root). That import
 * stays external and points to the matching core build per format.
 */
const CORE = '../index';
const isCore = (id: string) =>
  id === CORE || /[\\/]src[\\/]index(\.ts)?$/.test(id);
const compatBase: UserConfig = {
  ...base,
  entry: { compat: 'src/compat/entry.ts' },
  deps: { neverBundle: [CORE] }
};
const liveBase: UserConfig = {
  ...base,
  entry: { live: 'src/live/index.ts' },
  deps: { neverBundle: [CORE] }
};
const serverBase: UserConfig = {
  ...base,
  entry: { server: 'src/server/index.ts' },
  deps: { neverBundle: [CORE] }
};
const toCore =
  (file: string): UserConfig['outputOptions'] =>
  options => ({
    ...options,
    paths: (id: string) => (isCore(id) ? file : id)
  });

/**
 * UMD builds of the subpaths add their exports to the global `Chartist` of
 * index.umd.js: classic scripts get the global, CommonJS and AMD loaders the
 * core UMD file.
 */
const extendGlobal: UserConfig['outputOptions'] = options => ({
  ...options,
  globals: (id: string) => (isCore(id) ? 'Chartist' : id),
  paths: (id: string) => (isCore(id) ? './index.umd.js' : id),
  extend: true
});

/**
 * Compat declares the 1.x events by augmenting `ChartEvents` in
 * src/chart/types. The declaration bundler rewrites imports to the core
 * entry but not `declare module` paths, so point the augmentation at the
 * published core declarations (`./index.js` / `./index.cjs`).
 */
const augmentCore = (file: string, core: string) => ({
  async 'build:done'() {
    const text = await readFile(file, 'utf8');
    const fixed = text.replaceAll(
      "declare module '../chart/types'",
      `declare module '${core}'`
    );
    if (fixed === text) {
      throw new Error(`${file}: the ChartEvents augmentation wasn't found`);
    }
    await writeFile(file, fixed);
  }
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
  },
  { ...compatBase, format: 'esm', outputOptions: toCore('./index.js') },
  {
    ...compatBase,
    format: 'cjs',
    dts,
    outputOptions: toCore('./index.cjs'),
    hooks: augmentCore('dist/compat.d.cts', './index.cjs')
  },
  {
    ...compatBase,
    format: 'esm',
    sourcemap: false,
    dts: { ...dts, emitDtsOnly: true },
    outputOptions: toCore('./index.js'),
    hooks: augmentCore('dist/compat.d.ts', './index.js')
  },
  {
    ...compatBase,
    minify: true,
    format: 'esm',
    outExtensions: () => ({ js: '.min.js' }),
    outputOptions: toCore('./index.min.js')
  },
  {
    // Adds compat to the global `Chartist` of index.umd.js; the entry also
    // adds the 0.x names plugin scripts use, as in the module builds.
    ...compatBase,
    minify: true,
    format: 'umd',
    globalName: 'Chartist',
    outputOptions: options => ({
      ...options,
      // Classic scripts: the global; CommonJS/AMD loaders: the core UMD file.
      globals: (id: string) => (isCore(id) ? 'Chartist' : id),
      paths: (id: string) => (isCore(id) ? './index.umd.js' : id),
      extend: true
    })
  },
  { ...liveBase, format: 'esm', outputOptions: toCore('./index.js') },
  {
    ...liveBase,
    format: 'cjs',
    dts,
    outputOptions: toCore('./index.cjs')
  },
  {
    ...liveBase,
    format: 'esm',
    sourcemap: false,
    dts: { ...dts, emitDtsOnly: true },
    outputOptions: toCore('./index.js')
  },
  {
    ...liveBase,
    minify: true,
    format: 'esm',
    outExtensions: () => ({ js: '.min.js' }),
    outputOptions: toCore('./index.min.js')
  },
  {
    // Adds the live exports to the global `Chartist` of index.umd.js.
    ...liveBase,
    minify: true,
    format: 'umd',
    globalName: 'Chartist',
    outputOptions: extendGlobal
  },
  { ...serverBase, format: 'esm', outputOptions: toCore('./index.js') },
  {
    ...serverBase,
    format: 'cjs',
    dts,
    outputOptions: toCore('./index.cjs')
  },
  {
    ...serverBase,
    format: 'esm',
    sourcemap: false,
    dts: { ...dts, emitDtsOnly: true },
    outputOptions: toCore('./index.js')
  },
  {
    ...serverBase,
    minify: true,
    format: 'esm',
    outExtensions: () => ({ js: '.min.js' }),
    outputOptions: toCore('./index.min.js')
  },
  {
    // Adds the server exports to the global `Chartist` of index.umd.js.
    ...serverBase,
    entry: { server: 'src/server/umd.ts' },
    minify: true,
    format: 'umd',
    globalName: 'Chartist',
    outputOptions: extendGlobal
  }
]);
