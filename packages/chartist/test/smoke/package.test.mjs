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
  sideEffects: ['*.css', '*.scss']
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
  'chartist/scss/index.scss': 'dist/scss/index.scss',
  'chartist/scss/_settings.scss': 'dist/scss/_settings.scss',
  'chartist/package.json': 'package.json',
  'chartist/dist/index.min.js': 'dist/index.min.js',
  'chartist/dist/index.min.css': 'dist/index.min.css',
  'chartist/dist/index.d.cts': 'dist/index.d.cts',
  'chartist/dist/chartist.min.js': 'dist/chartist.min.js',
  'chartist/dist/chartist.min.css': 'dist/chartist.min.css'
};

/** Same for `require`; only the root entry differs. */
const REQUIRES = { ...IMPORTS, chartist: 'dist/index.cjs' };

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
    assert.deepEqual(pkg[field], value, field);
  }
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
  assert.match(custom, /stroke-width: 7\.5px/);

  const settings = sass.compileString(
    '@use "pkg:chartist/scss/settings" as ct; .x { width: ct.$ct-line-width; }',
    { ...SASS, importers }
  ).css;
  assert.match(settings, /width: 4px/);
});

test('Sass: 1.x path chartist/dist/index with overrides', () => {
  const options = { ...SASS, loadPaths: [path.join(tmp, 'node_modules')] };
  const css = sass.compileString(
    '$ct-line-width: 7.5px; @import "chartist/dist/index";',
    options
  ).css;
  assert.match(css, /stroke-width: 7\.5px/);

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
  for (const file of new Set([...Object.values(IMPORTS), pkg.unpkg.slice(2)])) {
    assert.ok(files.includes(file), `${file} is packed`);
  }
  const unexpected = files.filter(
    file => !/^(dist\/|package\.json$|README|LICENSE)/.test(file)
  );
  assert.deepEqual(
    unexpected,
    [],
    'only dist/ and package metadata are packed'
  );
});
