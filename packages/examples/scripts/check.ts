/**
 * Validates the examples manifest against the example folders.
 *
 * Run: pnpm nx check examples
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { examples, viewportSizes, type ViewportName } from '../index.ts';

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
  if (
    !/^(line|bar|pie|composed)\/[a-z0-9-]+$/.test(id) ||
    !id.startsWith(type + '/')
  ) {
    fail(
      `${id}: id must be "<type>/<kebab-case-name>" matching type "${type}"`
    );
  }
}

// Every example folder on disk is in the manifest.
for (const type of ['line', 'bar', 'pie', 'composed']) {
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

  // v2 marking: examples using the v2 API can't run on chartist@1.5.0.
  const usesV2 = /\bchart\(|\bcartesianAxes\(|\b(line|bar|pie)Chart\(/.test(
    code
  );
  if (usesV2 && !example.v2) {
    fail(`${id}: uses the v2 API, so it needs v2: true`);
  }
  if (!usesV2 && example.v2) {
    fail(`${id}: v2: true, but uses no v2 API`);
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

// The README's story coverage table: every 1.x story maps to an example
// that is tested at (at least) the story's viewports.
const STORY_COUNT = 49;
const byId = new Map(examples.map(example => [example.id, example]));
const storyRows = read('README.md')
  .split('\n')
  .filter(line => /^\| (Line|Bar|Pie)Chart\//.test(line))
  .map(line => line.split('|').map(cell => cell.trim()));
const stories = new Set<string>();
const storyExamples = new Set<string>();

if (storyRows.length !== STORY_COUNT) {
  fail(
    `README.md: ${storyRows.length} stories in the table, expected ${STORY_COUNT}`
  );
}
for (const [, story, id, viewports, mapping] of storyRows) {
  if (stories.has(story)) {
    fail(`README.md: story ${story} is listed twice`);
  }
  stories.add(story);
  storyExamples.add(id);

  const example = byId.get(id);
  if (!example) {
    fail(`README.md: story ${story} maps to unknown example ${id}`);
    continue;
  }
  for (const viewport of viewports.split(',').map(name => name.trim())) {
    if (!example.viewports.includes(viewport as ViewportName)) {
      fail(`${id}: missing viewport "${viewport}" of story ${story}`);
    }
  }
  if (mapping.startsWith('merged') !== example.docs) {
    fail(`${id}: story ${story} is "${mapping}", but docs is ${example.docs}`);
  }
}
// v2 test-only examples (e.g. SVG-label variants) have no 1.x story.
for (const { id, docs, v2 } of examples) {
  if (!docs && !v2 && !storyExamples.has(id)) {
    fail(`${id}: test-only example without a story in the README table`);
  }
}

if (errors.length > 0) {
  console.error(errors.map(error => `✗ ${error}`).join('\n'));
  console.error(`\n${errors.length} problem(s) in the examples manifest.`);
  process.exit(1);
}

console.log(
  `✓ ${examples.length} examples and ${stories.size} stories checked.`
);
