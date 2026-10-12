/**
 * Validates the examples manifest against the example folders.
 *
 * Run: pnpm nx check examples
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { examples, viewportSizes } from '../index.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const errors: string[] = [];

function fail(message: string) {
  errors.push(message);
}

function read(file: string) {
  return readFileSync(path.join(root, file), 'utf8');
}

/** Every source file of an example (src/**), concatenated. */
function sources(folder: string) {
  const src = path.join(root, folder, 'src');
  return readdirSync(src, { recursive: true, encoding: 'utf8' })
    .filter(file => /\.(ts|css)$/.test(file))
    .map(file => readFileSync(path.join(src, file), 'utf8'))
    .join('\n');
}

// Unique ids, in the `<type>/<name>` format.
const ids = new Set<string>();
for (const { id, type } of examples) {
  if (ids.has(id)) {
    fail(`${id}: duplicate id`);
  }
  ids.add(id);
  if (!/^(line|bar|pie)\/[a-z0-9-]+$/.test(id) || !id.startsWith(type + '/')) {
    fail(
      `${id}: id must be "<type>/<kebab-case-name>" matching type "${type}"`
    );
  }
}

// Every example folder on disk is in the manifest.
for (const type of ['line', 'bar', 'pie']) {
  for (const name of readdirSync(path.join(root, type))) {
    if (!ids.has(`${type}/${name}`)) {
      fail(`${type}/${name}: folder is not in the manifest`);
    }
  }
}

const compatPattern = /\.on\(|\bSvg\b/;

for (const example of examples) {
  const { id, folder } = example;
  const html = path.join(folder, 'index.html');
  const main = path.join(folder, 'src/main.ts');

  if (!existsSync(path.join(root, html))) {
    fail(`${id}: ${html} is missing`);
    continue;
  }
  if (!existsSync(path.join(root, main))) {
    fail(`${id}: ${main} is missing`);
    continue;
  }

  const htmlSource = read(html);
  if (!htmlSource.includes('<script type="module" src="/src/main.ts">')) {
    fail(`${id}: index.html must load /src/main.ts as a module script`);
  }
  if (!htmlSource.includes('id="chart"')) {
    fail(`${id}: index.html must contain the #chart container`);
  }

  const code = sources(folder);
  if (!read(main).includes(`import 'chartist/styles.css';`)) {
    fail(`${id}: src/main.ts must import 'chartist/styles.css'`);
  }
  if (/chartist\/dist\//.test(code)) {
    fail(`${id}: import from 'chartist', not from 'chartist/dist/'`);
  }
  if (/Math\.random\(/.test(code)) {
    fail(`${id}: use a seeded generator instead of Math.random()`);
  }

  // Compat marking: 1.x event listeners or the Svg API need the compat plugin.
  const needsCompat = compatPattern.test(code);
  if (needsCompat && !example.compat) {
    fail(`${id}: uses .on(...) or Svg, so it needs compat: true`);
  }
  if (!needsCompat && example.compat) {
    fail(`${id}: compat: true, but uses neither .on(...) nor Svg`);
  }

  if (example.viewports.length === 0) {
    fail(`${id}: needs at least one viewport`);
  }
  for (const viewport of example.viewports) {
    if (!(viewport in viewportSizes)) {
      fail(`${id}: unknown viewport "${viewport}"`);
    }
  }
  if (!(example.settle.at >= 0)) {
    fail(`${id}: settle.at must be a non-negative number of milliseconds`);
  }
}

if (errors.length > 0) {
  console.error(errors.map(error => `✗ ${error}`).join('\n'));
  console.error(`\n${errors.length} problem(s) in the examples manifest.`);
  process.exit(1);
}

console.log(`✓ ${examples.length} examples checked.`);
