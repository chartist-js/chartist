// Packs @chartist-js/essentials and chartist as npm would publish them,
// installs both into an empty project and uses them there with require()
// and import. Run after a build: pnpm nx run essentials:test:smoke
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

const essentialsDir = fileURLToPath(new URL('../..', import.meta.url));
const chartistDir = join(essentialsDir, '../chartist');
const pkg = JSON.parse(
  readFileSync(join(essentialsDir, 'package.json'), 'utf8')
);
const work = mkdtempSync(join(tmpdir(), 'chartist-essentials-smoke-'));
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
  tarball = pack(essentialsDir);
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

test('require() and import give the same exports and render a title', () => {
  const script = [
    "const cjs = require('@chartist-js/essentials');",
    "const { lineChartConfig, toScene } = require('chartist');",
    "const { renderToString } = require('chartist/server');",
    "import('@chartist-js/essentials').then(esm => {",
    "  const names = o => Object.keys(o).filter(k => k !== 'default').sort().join();",
    '  if (names(cjs) !== names(esm)) throw new Error(names(cjs) + " != " + names(esm));',
    "  const config = lineChartConfig({ series: [[1, 2, 3]] }, { layers: { above: [esm.axisTitle({ axis: 'y', text: 'Visits' })] } });",
    '  process.stdout.write(renderToString(toScene(config, { width: 400, height: 200 })));',
    '});'
  ].join('\n');
  writeFileSync(join(project, 'both.cjs'), script);
  assert.match(
    run('node', ['both.cjs'], project),
    /<text[^>]*class="ct-axis-title[^"]*"[^>]*>Visits<\/text>/
  );
});

test('the stylesheet resolves through the exports map', () => {
  const css = run(
    'node',
    ['-p', "require.resolve('@chartist-js/essentials/styles.css')"],
    project
  );
  assert.match(readFileSync(css.trim(), 'utf8'), /\.ct-axis-title/);
});
