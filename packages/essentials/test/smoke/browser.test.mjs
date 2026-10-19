/**
 * No-bundler smoke test: a static page with the README's import map, in
 * headless Chromium. Requests to jsDelivr are answered from the local dist
 * folders of chartist and this package, so it runs offline.
 *
 * Run: pnpm nx run essentials:test:smoke (builds first).
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const essentialsDir = fileURLToPath(new URL('../..', import.meta.url));
const DIST = {
  chartist: path.join(essentialsDir, '../chartist/dist'),
  '@chartist-js/essentials': path.join(essentialsDir, 'dist')
};
const TYPES = { '.js': 'text/javascript', '.css': 'text/css' };

const readme = await readFile(path.join(essentialsDir, 'README.md'), 'utf8');
const importMapPage = /```html\n([\s\S]*?)```/.exec(readme)[1];

const page = `<!doctype html>
  ${importMapPage.replace(
    /<script type="module">[\s\S]*?<\/script>/,
    `<div id="chart" style="width: 500px; height: 300px"></div>
    <script type="module">
      import { lineChart } from 'chartist';
      import { axisTitle } from '@chartist-js/essentials';
      lineChart('#chart', { labels: ['a', 'b'], series: [[1, 2]] }, {
        layers: { above: [axisTitle({ axis: 'y', text: 'Visits' })] }
      });
      window.done = true;
    </script>`
  )}`;

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
});

test('the import map draws a title with one copy of the core', async () => {
  const tab = await browser.newPage();
  const errors = [];
  const requested = [];
  tab.on('pageerror', error => errors.push(error.message));
  await tab.route('**/*', async route => {
    const url = route.request().url().split(/[?#]/)[0];
    if (url === 'https://chartist.test/') {
      return route.fulfill({ body: page, contentType: 'text/html' });
    }
    const match =
      /^https:\/\/cdn\.jsdelivr\.net\/npm\/(chartist|@chartist-js\/essentials)@2\/dist\/(.+)$/.exec(
        url
      );
    if (!match) {
      return route.abort();
    }
    requested.push(url);
    const file = path.join(DIST[match[1]], match[2]);
    return route.fulfill({
      body: await readFile(file),
      contentType: TYPES[path.extname(file)]
    });
  });
  await tab.goto('https://chartist.test/');
  await tab.waitForFunction(() => window.done === true);
  assert.deepEqual(errors, []);
  assert.equal(
    await tab.locator('#chart svg text.ct-axis-title').textContent(),
    'Visits'
  );
  const core = requested.filter(
    url => url.includes('/chartist@2/') && url.endsWith('.js')
  );
  assert.deepEqual(core, [
    'https://cdn.jsdelivr.net/npm/chartist@2/dist/index.min.js'
  ]);
  await tab.close();
});
