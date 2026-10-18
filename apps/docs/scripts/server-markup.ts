/**
 * The server markup of the examples whose page holds a chart for
 * `lineChart()` and friends to take over: the markup between the
 * server-markup comments of an example's index.html comes from the
 * `serverMarkup()` its src/chart.ts exports, with the current build.
 *
 * pnpm nx run docs:server-markup checks that every such page is current
 * (part of docs:check) and names the ones that aren't; with --write, it
 * writes the markup into the pages.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  hasServerMarkup,
  serverMarkupOf,
  withServerMarkup
} from '../src/lib/server-markup.ts';

const examplesDir = fileURLToPath(new URL('../src/examples/', import.meta.url));
const write = process.argv.includes('--write');

const pages = (await readdir(examplesDir, { recursive: true }))
  .filter(file => path.basename(file) === 'index.html')
  .sort();
const stale: string[] = [];
let count = 0;
for (const page of pages) {
  const file = path.join(examplesDir, page);
  const html = await readFile(file, 'utf8');
  if (!hasServerMarkup(html)) {
    continue;
  }
  count++;
  const example = path.dirname(page);
  const { serverMarkup } = (await import(
    pathToFileURL(path.join(examplesDir, example, 'src/chart.ts')).href
  )) as { serverMarkup: () => string };
  const markup = serverMarkup();
  if (serverMarkupOf(html) === markup) {
    continue;
  }
  if (write) {
    await writeFile(file, withServerMarkup(html, markup));
    console.log(`Wrote the server markup of ${example}`);
  } else {
    stale.push(example);
  }
}

if (stale.length) {
  console.error(
    `The server markup in these examples isn't what the current build renders:\n${stale
      .map(example => `- ${example}/index.html`)
      .join('\n')}\nRun pnpm nx run docs:server-markup --write`
  );
  process.exit(1);
}
console.log(
  `${count} example${count === 1 ? '' : 's'} with server markup ${write ? 'written' : 'checked'}`
);
