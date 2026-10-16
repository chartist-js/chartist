/**
 * Package smoke test: installs the built package into a temporary
 * node_modules (as a symlink) and checks, like a consumer would, that every
 * 1.x import path and every new entry point resolves, loads and compiles.
 *
 * Run: pnpm nx run chartist:test:smoke (builds first).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import * as sass from 'sass';

const run = promisify(execFile);
const pkgDir = await realpath(fileURLToPath(new URL('../..', import.meta.url)));
const pkg = JSON.parse(await readFile(path.join(pkgDir, 'package.json')));

/** Package fields of the published chartist@1.5.0 (after publishConfig). */
const V1_FIELDS = {
  main: './dist/index.cjs',
  module: './dist/index.js',
  types: './dist/index.d.ts',
  style: './dist/index.css',
  unpkg: './dist/index.umd.js',
  jsdelivr: './dist/index.umd.js',
  // Checked separately: v2 adds the compat files, which set up the global
  // `Chartist` for plugin scripts when imported.
  sideEffects: undefined
};

/** Specifier → file, for `import` (ESM) resolution. */
const IMPORTS = {
  // 1.x
  chartist: 'dist/index.js',
  'chartist/dist/index.js': 'dist/index.js',
  'chartist/dist/index.cjs': 'dist/index.cjs',
  'chartist/dist/index.umd.js': 'dist/index.umd.js',
  'chartist/dist/index.css': 'dist/index.css',
  'chartist/dist/index.scss': 'dist/index.scss',
  'chartist/dist/_settings.scss': 'dist/_settings.scss',
  'chartist/dist/index.d.ts': 'dist/index.d.ts',
  // new
  'chartist/styles.css': 'dist/index.css',
  'chartist/themes/accessible.css': 'dist/themes/accessible.css',
  'chartist/themes/accessible.min.css': 'dist/themes/accessible.min.css',
  'chartist/scss/index.scss': 'dist/scss/index.scss',
  'chartist/scss/_settings.scss': 'dist/scss/_settings.scss',
  'chartist/package.json': 'package.json',
  'chartist/dist/index.min.js': 'dist/index.min.js',
  'chartist/dist/index.min.css': 'dist/index.min.css',
  'chartist/dist/index.d.cts': 'dist/index.d.cts',
  'chartist/dist/chartist.min.js': 'dist/chartist.min.js',
  'chartist/dist/chartist.min.css': 'dist/chartist.min.css',
  'chartist/compat': 'dist/compat.js',
  'chartist/dist/compat.min.js': 'dist/compat.min.js',
  'chartist/dist/compat.umd.js': 'dist/compat.umd.js'
};

/** Same for `require`; only the root entry differs. */
const REQUIRES = {
  ...IMPORTS,
  chartist: 'dist/index.cjs',
  'chartist/compat': 'dist/compat.cjs'
};

let tmp;
let resolveImport;
let require;

before(async () => {
  tmp = await mkdtemp(path.join(os.tmpdir(), 'chartist-smoke-'));
  await mkdir(path.join(tmp, 'node_modules'));
  await symlink(pkgDir, path.join(tmp, 'node_modules/chartist'), 'dir');
  await writeFile(
    path.join(tmp, 'resolve.mjs'),
    'export default specifier => import.meta.resolve(specifier);\n'
  );
  resolveImport = (await import(pathToFileURL(path.join(tmp, 'resolve.mjs'))))
    .default;
  require = createRequire(path.join(tmp, 'index.cjs'));
});

after(async () => {
  await rm(tmp, { recursive: true, force: true });
});

test('1.x package fields are unchanged', () => {
  for (const [field, value] of Object.entries(V1_FIELDS)) {
    if (value !== undefined) {
      assert.deepEqual(pkg[field], value, field);
    }
  }
  assert.deepEqual(pkg.sideEffects, ['*.css', '*.scss', './dist/compat.*']);
  assert.equal(pkg.exports['./dist/*'], './dist/*');
});

test('every package field points to a built file', () => {
  for (const field of ['main', 'module', 'types', 'style', 'sass', 'unpkg']) {
    assert.ok(existsSync(path.join(pkgDir, pkg[field])), pkg[field]);
  }
});

test('import specifiers resolve through the exports map', () => {
  for (const [specifier, file] of Object.entries(IMPORTS)) {
    const resolved = fileURLToPath(resolveImport(specifier));
    assert.equal(resolved, path.join(pkgDir, file), specifier);
    assert.ok(existsSync(resolved), `${specifier} → ${file} exists`);
  }
});

test('require specifiers resolve through the exports map', () => {
  for (const [specifier, file] of Object.entries(REQUIRES)) {
    assert.equal(
      require.resolve(specifier),
      path.join(pkgDir, file),
      specifier
    );
  }
});

test('unlisted paths are not exported', () => {
  for (const specifier of [
    'chartist/src/index.ts',
    'chartist/scripts/styles.cjs'
  ]) {
    assert.throws(() => require.resolve(specifier), {
      code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'
    });
  }
});

test('ESM and CJS builds load in Node with the same exports', async () => {
  const cjs = require('chartist');
  const esm = await import(resolveImport('chartist'));
  for (const name of ['LineChart', 'BarChart', 'PieChart', 'Svg']) {
    assert.equal(typeof cjs[name], 'function', name);
  }
  assert.deepEqual(Object.keys(cjs.Interpolation).sort(), [
    'cardinal',
    'monotoneCubic',
    'none',
    'simple',
    'step'
  ]);
  assert.deepEqual(Object.keys(esm).sort(), Object.keys(cjs).sort());
});

test('published source maps embed their sources', async () => {
  const maps = [
    'index.js',
    'index.cjs',
    'index.min.js',
    'index.umd.js',
    'index.css',
    'index.min.css'
  ];
  for (const file of maps) {
    const map = JSON.parse(
      await readFile(path.join(pkgDir, 'dist', `${file}.map`))
    );
    assert.equal(map.sourcesContent?.length, map.sources.length, file);
    assert.ok(map.sourcesContent.every(Boolean), `${file}: sources present`);
  }
  // CSS maps point to the published Sass copies (#1409).
  const cssMap = JSON.parse(
    await readFile(path.join(pkgDir, 'dist/index.css.map'))
  );
  for (const source of cssMap.sources) {
    assert.ok(existsSync(path.join(pkgDir, 'dist', source)), source);
  }
});

const SASS = { silenceDeprecations: ['import', 'global-builtin'] };

test('Sass: pkg:chartist with the Node package importer', () => {
  const importers = [new sass.NodePackageImporter(tmp)];
  const custom = sass.compileString(
    '@use "pkg:chartist" with ($ct-line-width: 7.5px);',
    { ...SASS, importers }
  ).css;
  // The Sass value is the fallback of the custom property.
  assert.match(custom, /stroke-width: var\(--ct-line-width, 7\.5px\)/);

  const settings = sass.compileString(
    '@use "pkg:chartist/scss/settings" as ct; .x { width: ct.$ct-line-width; }',
    { ...SASS, importers }
  ).css;
  assert.match(settings, /width: 4px/);
});

test('CSS: themable values read --ct-* properties with 1.x fallbacks', async () => {
  const css = String(await readFile(path.join(pkgDir, 'dist/index.css')));
  for (const [property, fallback] of [
    ['--ct-label-color', 'rgba(0, 0, 0, 0.4)'],
    ['--ct-label-size', '0.75rem'],
    ['--ct-grid-color', 'rgba(0, 0, 0, 0.2)'],
    ['--ct-grid-width', '1px'],
    ['--ct-grid-dasharray', '2px'],
    ['--ct-grid-background-fill', 'none'],
    ['--ct-line-width', '4px'],
    ['--ct-line-dasharray', 'none'],
    ['--ct-point-size', '10px'],
    ['--ct-point-shape', 'round'],
    ['--ct-area-opacity', '0.1'],
    ['--ct-bar-width', '10px'],
    ['--ct-donut-width', '60px'],
    ['--ct-series-a', '#d70206'],
    ['--ct-series-o', '#a748ca']
  ]) {
    assert.ok(
      css.includes(`var(${property}, ${fallback})`),
      `${property} with fallback ${fallback}`
    );
  }
  // Series elements take their color from --ct-color, 1.x selectors.
  assert.match(
    css,
    /\.ct-series-a \.ct-line,[\s\S]*?stroke: var\(--ct-color\)/
  );
});

test('CSS: target lines and bands take a series color, else the text color', async () => {
  const css = String(await readFile(path.join(pkgDir, 'dist/index.css')));
  for (const declaration of [
    'stroke: var(--ct-color, var(--ct-target-line-color, currentColor))',
    'stroke-width: var(--ct-target-line-width, 1px)',
    'stroke-dasharray: var(--ct-target-line-dasharray, 4px 4px)',
    'fill: var(--ct-color, var(--ct-target-line-color, currentColor))',
    'fill: var(--ct-color, var(--ct-band-color, currentColor))',
    'fill-opacity: var(--ct-band-opacity, 0.12)'
  ]) {
    assert.ok(css.includes(declaration), declaration);
  }
  // A series group around them sets their color too.
  assert.match(
    css,
    /\.ct-series-c \.ct-target-line \{\s*stroke: var\(--ct-color\)/
  );
  assert.match(
    css,
    /\.ct-series-c \.ct-target-label,\s*\.ct-series-c \.ct-band-area \{\s*fill: var\(--ct-color\)/
  );
});

// light-dark() follows the chart's color-scheme. Browsers without it keep
// the declaration outside @supports, as a var() with a fallback they don't
// know would compute to unset.
const DARK_DEFAULTS =
  /\.ct-label \{[^}]*fill: var\(--ct-label-color, rgba\(0, 0, 0, 0\.4\)\);[^}]*\}\s*@supports \(color: light-dark\(#000, #fff\)\) \{\s*\.ct-label \{\s*fill: var\(--ct-label-color, light-dark\(rgba\(0, 0, 0, 0\.4\), rgba\(255, 255, 255, 0\.6\)\)\);\s*color: var\(--ct-label-color, light-dark\(rgba\(0, 0, 0, 0\.4\), rgba\(255, 255, 255, 0\.6\)\)\);\s*\}\s*\}/;
const DARK_GRID =
  /\.ct-grid \{[^}]*stroke: var\(--ct-grid-color, rgba\(0, 0, 0, 0\.2\)\);[^}]*\}\s*@supports \(color: light-dark\(#000, #fff\)\) \{\s*\.ct-grid \{\s*stroke: var\(--ct-grid-color, light-dark\(rgba\(0, 0, 0, 0\.2\), rgba\(255, 255, 255, 0\.2\)\)\);\s*\}\s*\}/;

test('CSS: labels and grid lines have defaults for a dark color scheme', async () => {
  const css = String(await readFile(path.join(pkgDir, 'dist/index.css')));
  assert.match(css, DARK_DEFAULTS);
  assert.match(css, DARK_GRID);
  const min = String(await readFile(path.join(pkgDir, 'dist/index.min.css')));
  assert.match(min, /@supports \(color:\s*light-dark\(#000,\s*#fff\)\)/);
});

test('Sass: false leaves out the dark defaults', () => {
  const importers = [new sass.NodePackageImporter(tmp)];
  const css = sass.compileString(
    '@use "pkg:chartist" with ($ct-text-color-dark: false, $ct-grid-color-dark: false);',
    { ...SASS, importers }
  ).css;
  assert.doesNotMatch(css, /light-dark|@supports/);
  assert.match(css, /fill: var\(--ct-label-color, rgba\(0, 0, 0, 0\.4\)\)/);

  const custom = sass.compileString(
    '@use "pkg:chartist" with ($ct-text-color-dark: #eee);',
    { ...SASS, importers }
  ).css;
  assert.match(
    custom,
    /fill: var\(--ct-label-color, light-dark\(rgba\(0, 0, 0, 0\.4\), #eee\)\)/
  );
});

test('CSS: series a to z, the colors repeating after o (#1456)', async () => {
  const css = String(await readFile(path.join(pkgDir, 'dist/index.css')));
  const names = 'abcdefghijklmnopqrstuvwxyz';
  for (const name of names.slice(15)) {
    // p repeats a's color, q b's, and so on.
    const repeated = names[names.indexOf(name) - 15];
    assert.match(
      css,
      new RegExp(
        `\\.ct-series-${name} \\{\\s*--ct-color: var\\(--ct-series-${name}, var\\(--ct-series-${repeated}, #[0-9a-f]{6}\\)\\);`
      ),
      `.ct-series-${name}`
    );
  }
  assert.match(
    css,
    /--ct-color: var\(--ct-series-p, var\(--ct-series-a, #d70206\)\)/
  );
});

test('Sass: fewer colors than series names repeat the colors', () => {
  const importers = [new sass.NodePackageImporter(tmp)];
  const css = sass.compileString(
    '@use "pkg:chartist" with ($ct-series-names: (a, b, c), $ct-series-colors: (#111111, #222222));',
    { ...SASS, importers }
  ).css;
  assert.match(css, /--ct-color: var\(--ct-series-a, #111111\)/);
  assert.match(css, /--ct-color: var\(--ct-series-b, #222222\)/);
  assert.match(
    css,
    /--ct-color: var\(--ct-series-c, var\(--ct-series-a, #111111\)\)/
  );
  assert.doesNotMatch(css, /ct-series-d/);
});

test('CSS: the accessible theme keeps light-dark()', async () => {
  for (const file of [
    'dist/themes/accessible.css',
    'dist/themes/accessible.min.css'
  ]) {
    const css = String(await readFile(path.join(pkgDir, file)));
    assert.match(css, /\.ct-theme-accessible/);
    assert.equal(
      css.match(/--ct-series-[a-h]:\s*light-dark\(/g)?.length,
      8,
      file
    );
  }
});

test('Sass: 1.x path chartist/dist/index with overrides', () => {
  const options = { ...SASS, loadPaths: [path.join(tmp, 'node_modules')] };
  const css = sass.compileString(
    '$ct-line-width: 7.5px; @import "chartist/dist/index";',
    options
  ).css;
  assert.match(css, /stroke-width: var\(--ct-line-width, 7\.5px\)/);

  const viaDist = sass.compileString('@import "chartist/dist/index";', options);
  const viaScss = sass.compileString('@import "pkg:chartist/scss/index";', {
    ...options,
    importers: [new sass.NodePackageImporter(tmp)]
  });
  assert.equal(viaDist.css, viaScss.css);
});

test('TypeScript resolves .d.ts for import and .d.cts for require', async () => {
  await writeFile(
    path.join(tmp, 'esm.mts'),
    `import { LineChart, type LineChartData } from 'chartist';
const data: LineChartData = { series: [[1, 2, 3]] };
export const chart = (el: Element) => new LineChart(el, data);
`
  );
  await writeFile(
    path.join(tmp, 'cjs.cts'),
    `import chartist = require('chartist');
export const chart = (el: Element) =>
  new chartist.BarChart(el, { series: [[1, 2, 3]] });
`
  );
  await writeFile(
    path.join(tmp, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        module: 'nodenext',
        moduleResolution: 'nodenext',
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        lib: ['es2022', 'dom'],
        types: []
      },
      files: ['esm.mts', 'cjs.cts']
    })
  );
  const tsc = path.join(pkgDir, 'node_modules/typescript/bin/tsc');
  const { stdout } = await run(
    process.execPath,
    [tsc, '-p', path.join(tmp, 'tsconfig.json'), '--traceResolution'],
    { maxBuffer: 64 * 1024 * 1024 }
  ).catch(error => {
    assert.fail(
      error.stdout
        .split('\n')
        .filter(l => /error/.test(l))
        .join('\n')
    );
  });
  assert.match(
    stdout,
    /'chartist' was successfully resolved to '[^']*index\.d\.ts'/
  );
  assert.match(
    stdout,
    /'chartist' was successfully resolved to '[^']*index\.d\.cts'/
  );
});

test('npm package contains the built files', async () => {
  const { stdout } = await run(
    'npm',
    ['pack', '--dry-run', '--json', '--ignore-scripts'],
    { cwd: pkgDir }
  );
  const files = JSON.parse(stdout)[0].files.map(file => file.path);
  // Every import path and package field, the README for the npm page and
  // both licenses.
  const fields = ['main', 'module', 'types', 'style', 'unpkg', 'jsdelivr'].map(
    field => pkg[field].replace(/^\.\//, '')
  );
  for (const file of new Set([
    ...Object.values(IMPORTS),
    ...fields,
    'README.md',
    'LICENSE-MIT',
    'LICENSE-WTFPL'
  ])) {
    assert.ok(files.includes(file), `${file} is packed`);
  }
  const unexpected = files.filter(
    file =>
      !file.startsWith('dist/') &&
      !['package.json', 'README.md', 'LICENSE-MIT', 'LICENSE-WTFPL'].includes(
        file
      )
  );
  assert.deepEqual(
    unexpected,
    [],
    'only dist/, package.json, the README and the licenses are packed'
  );
});

test('compat uses the same core instance as chartist', async () => {
  const esm = await import(resolveImport('chartist/compat'));
  const cjs = require('chartist/compat');
  assert.equal(esm.compat.name, 'compat');
  assert.equal(cjs.compat.name, 'compat');
  // The compat builds import the core build next to them, never a copy.
  const sources = {
    'dist/compat.js': './index.js',
    'dist/compat.cjs': './index.cjs',
    'dist/compat.min.js': './index.min.js',
    'dist/compat.umd.js': './index.umd.js'
  };
  for (const [file, core] of Object.entries(sources)) {
    const code = await readFile(path.join(pkgDir, file), 'utf8');
    assert.ok(code.includes(`"${core}"`), `${file} imports ${core}`);
    // The core build is ~140 kB unminified; compat alone is about 20 kB.
    assert.ok(
      code.length < 25_000,
      `${file} has no core copy (${code.length} bytes)`
    );
  }
});
