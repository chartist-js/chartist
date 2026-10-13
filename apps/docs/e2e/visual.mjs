// Screenshot comparison of the built site (docs:visual). Serves dist/ with
// serve.mjs, captures every [data-visual] block of the landing page and the
// whole Getting started and 404 pages, at a desktop and a phone width, in
// light and dark, and compares them with a baseline.
//
//   node e2e/visual.mjs --update            take the baseline
//   node e2e/visual.mjs                     compare, write .visual/report.html
//   --baseline <dir>  baseline elsewhere (worktrees use the lead's)
//   --only <a,b>      only shots whose name contains one of these
//   --port <n>        server port (default 4339)
//   --dist <dir>      serve another build instead of dist/apps/docs
/* eslint-disable no-console -- a CLI script that reports on stdout */
import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const { values: args } = parseArgs({
  options: {
    update: { type: 'boolean', default: false },
    baseline: { type: 'string' },
    only: { type: 'string' },
    port: { type: 'string', default: '4339' },
    dist: { type: 'string' }
  }
});
const out = resolve(here, '../.visual');
const baselineDir = resolve(args.baseline ?? join(out, 'baseline'));
const currentDir = args.update ? baselineDir : join(out, 'current');
const diffDir = join(out, 'diff');
const only = args.only?.split(',').filter(Boolean);
const base = `http://127.0.0.1:${args.port}`;

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  phone: { width: 390, height: 844 }
};
const PAGES = [
  { name: 'landing', path: '/', blocks: true },
  { name: 'getting-started', path: '/docs/getting-started/' },
  { name: '404', path: '/no-such-page/' }
];

const server = spawn(process.execPath, [join(here, 'serve.mjs')], {
  env: {
    ...process.env,
    PORT: args.port,
    ...(args.dist && { DOCS_DIST: resolve(args.dist) })
  },
  stdio: ['ignore', 'pipe', 'inherit']
});
await new Promise(ready => server.stdout.once('data', ready));

/** Waits until every lazy chart has drawn and motion has settled. */
async function settle(page) {
  // Charts mount within a screen of the viewport: walk the page once.
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate(top => scrollTo(0, top), y);
    await page.waitForTimeout(30);
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-chart], [data-board-chart]')].every(
      element => element.querySelector('svg')
    )
  );
  await page.evaluate(() => document.fonts.ready);
  // Sticky and fixed parts would cover the blocks being captured.
  await page.evaluate(() => {
    for (const element of document.querySelectorAll('body *')) {
      const { position } = getComputedStyle(element);
      if (position === 'sticky' || position === 'fixed') {
        element.style.position = 'relative';
      }
    }
  });
  await page.waitForTimeout(300);
}

const browser = await chromium.launch();
await mkdir(currentDir, { recursive: true });
const shots = [];
try {
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport,
        reducedMotion: 'reduce',
        colorScheme: theme
      });
      await context.addInitScript(value => {
        localStorage.setItem('chartist-theme', value);
      }, theme);
      const page = await context.newPage();
      for (const target of PAGES) {
        const prefix = `${target.name}`;
        const suffix = `${viewportName}-${theme}`;
        const wanted = name => !only || only.some(part => name.includes(part));
        await page.goto(base + target.path, { waitUntil: 'networkidle' });
        await settle(page);
        if (target.blocks) {
          for (const block of await page.locator('[data-visual]').all()) {
            const name = `${prefix}-${await block.getAttribute('data-visual')}-${suffix}`;
            if (wanted(name)) {
              // Scroll-driven parts (the story's easel) settle first, at
              // the same scroll position whichever shots came before.
              await block.evaluate(element =>
                element.scrollIntoView({ block: 'start' })
              );
              await page.waitForTimeout(500);
              await block.screenshot({ path: join(currentDir, `${name}.png`) });
              shots.push(name);
            }
          }
          // The first live example in edit mode: the playground's toolbar,
          // editor and preview as the site dresses them.
          const editing = `${prefix}-try-editing-${suffix}`;
          const live = page.locator('#try [data-live-example]');
          if (wanted(editing) && (await live.count())) {
            await live.evaluate(element =>
              element.scrollIntoView({ block: 'start' })
            );
            await live.locator('[data-live-edit]').click();
            await live.locator('.cm-content').waitFor();
            await page.waitForTimeout(1500);
            await live.screenshot({ path: join(currentDir, `${editing}.png`) });
            shots.push(editing);
          }
        } else {
          const name = `${prefix}-${suffix}`;
          if (wanted(name)) {
            await page.screenshot({
              path: join(currentDir, `${name}.png`),
              fullPage: true
            });
            shots.push(name);
          }
        }
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
  server.kill();
}

if (args.update) {
  console.log(`baseline: ${shots.length} shots in ${baselineDir}`);
  process.exit(0);
}

await rm(diffDir, { recursive: true, force: true });
await mkdir(diffDir, { recursive: true });
const rows = [];
for (const name of shots) {
  const file = `${name}.png`;
  const basePath = join(baselineDir, file);
  if (!existsSync(basePath)) {
    rows.push({ name, note: 'no baseline' });
    continue;
  }
  const before = PNG.sync.read(await readFile(basePath));
  const after = PNG.sync.read(await readFile(join(currentDir, file)));
  if (before.width !== after.width || before.height !== after.height) {
    rows.push({
      name,
      note: `size ${before.width}×${before.height} → ${after.width}×${after.height}`
    });
    continue;
  }
  const diff = new PNG({ width: before.width, height: before.height });
  const pixels = pixelmatch(
    before.data,
    after.data,
    diff.data,
    before.width,
    before.height,
    { threshold: 0.1 }
  );
  if (pixels > 0) {
    await writeFile(join(diffDir, file), PNG.sync.write(diff));
    rows.push({ name, note: `${pixels} pixels differ`, diff: true });
  }
}
const missing = (await readdir(baselineDir))
  .filter(file => file.endsWith('.png'))
  .map(file => file.slice(0, -4))
  .filter(
    name =>
      !shots.includes(name) && (!only || only.some(part => name.includes(part)))
  );
for (const name of missing) {
  rows.push({ name, note: 'missing now (block renamed or removed?)' });
}

const img = (dir, name) =>
  `<img src="${join(dir, `${name}.png`)}" loading="lazy">`;
await writeFile(
  join(out, 'report.html'),
  `<!doctype html><meta charset="utf-8"><title>Visual report</title>
<style>body{font:14px system-ui;margin:24px}section{margin:0 0 40px}
div{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;align-items:start}
img{width:100%;border:1px solid #ccc}</style>
<h1>${rows.length} of ${shots.length} shots differ</h1>
${rows
  .map(
    row => `<section><h2>${row.name}: ${row.note}</h2><div>
${existsSync(join(baselineDir, `${row.name}.png`)) ? img(baselineDir, row.name) : '<p>-</p>'}
${shots.includes(row.name) ? img(currentDir, row.name) : '<p>-</p>'}
${row.diff ? img(diffDir, row.name) : '<p>-</p>'}</div></section>`
  )
  .join('\n')}`
);
for (const row of rows) {
  console.log(`✗ ${row.name}: ${row.note}`);
}
console.log(
  `${rows.length} of ${shots.length} shots differ; report: ${join(out, 'report.html')}`
);
process.exit(rows.length ? 1 : 0);
