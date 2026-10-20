// Packs @chartist-js/tooltips and chartist as npm would publish them,
// installs both into an empty project and uses them there with require()
// and import. Run after a build: pnpm nx run tooltips:test:smoke
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const packageDir = fileURLToPath(new URL('../..', import.meta.url));
const chartistDir = join(packageDir, '../chartist');
const pkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
const work = mkdtempSync(join(tmpdir(), 'chartist-tooltips-smoke-'));
const project = join(work, 'project');
let tarball;

const run = (command, args, cwd) =>
  execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

/** Packs a package with pnpm (which rewrites workspace: ranges) into `work`. */
function pack(dir) {
  const before = new Set(readdirSync(work));
  run('pnpm', ['pack', '--pack-destination', work], dir);
  const file = readdirSync(work).find(
    name => name.endsWith('.tgz') && !before.has(name)
  );
  assert.ok(file, `no tarball for ${dir}`);
  return join(work, file);
}

before(() => {
  const chartistTarball = pack(chartistDir);
  tarball = pack(packageDir);
  run('mkdir', ['-p', project], work);
  writeFileSync(
    join(project, 'package.json'),
    '{ "name": "smoke", "private": true }\n'
  );
  run(
    'npm',
    [
      'install',
      '--no-audit',
      '--no-fund',
      '--prefer-offline',
      chartistTarball,
      tarball
    ],
    project
  );
});

after(() => rmSync(work, { recursive: true, force: true }));

test('the tarball holds package.json, README, licenses and dist only', () => {
  const files = run('tar', ['-tzf', tarball], work)
    .split('\n')
    .filter(Boolean)
    .map(file => file.replace(/^package\//, ''));
  for (const file of files) {
    assert.match(
      file,
      /^(package\.json|README\.md|LICENSE-MIT|LICENSE-WTFPL|dist\/.+)$/
    );
  }
  for (const file of [
    'dist/index.js',
    'dist/index.cjs',
    'dist/index.min.js',
    'dist/index.d.ts',
    'dist/index.d.cts',
    'dist/styles.css',
    'README.md'
  ]) {
    assert.ok(files.includes(file), `${file} is missing`);
  }
});

test('the published package.json depends on chartist with a range, not workspace:', () => {
  const packed = JSON.parse(
    run('tar', ['-xzOf', tarball, 'package/package.json'], work)
  );
  assert.equal(packed.dependencies.chartist, `^${pkg.version}`);
  assert.doesNotMatch(JSON.stringify(packed), /workspace:/);
});

test('require() and import give the same plugin', () => {
  const script = [
    "const cjs = require('@chartist-js/tooltips');",
    "import('@chartist-js/tooltips').then(esm => {",
    "  const names = o => Object.keys(o).filter(k => k !== 'default').sort().join();",
    '  if (names(cjs) !== names(esm)) throw new Error(names(cjs) + " != " + names(esm));',
    '  const plugin = esm.tooltips();',
    "  if (plugin.name !== 'tooltips' || typeof plugin.install !== 'function') throw new Error('not a plugin');",
    '  process.stdout.write(names(esm));',
    '});'
  ].join('\n');
  writeFileSync(join(project, 'both.cjs'), script);
  assert.equal(run('node', ['both.cjs'], project), 'tooltips');
});

test('the stylesheet resolves through the exports map', () => {
  const css = run(
    'node',
    ['-p', "require.resolve('@chartist-js/tooltips/styles.css')"],
    project
  );
  assert.match(readFileSync(css.trim(), 'utf8'), /\.ct-tooltip/);
});
