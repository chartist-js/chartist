/**
 * Browser smoke test: what jsdom can't check. Both browser builds from a CDN
 * URL, on a page with a strict Content Security Policy and Trusted Types,
 * in headless Chromium: the tooltip shows in the top layer, outside a
 * clipping box, keyboard focus reaches the chart's values, and nothing
 * violates the policy. Requests to jsDelivr are answered from the local
 * dist folders.
 *
 * Run: pnpm nx run tooltips:test:smoke (builds first).
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const packageDir = fileURLToPath(new URL('../..', import.meta.url));
const DIST = {
  chartist: path.join(packageDir, '../chartist/dist'),
  '@chartist-js/tooltips': path.join(packageDir, 'dist')
};
const TYPES = { '.js': 'text/javascript', '.css': 'text/css' };
const ORIGIN = 'https://tooltips.test';
const CDN = 'https://cdn.jsdelivr.net/npm';
const POLICY = [
  "default-src 'none'",
  `script-src ${ORIGIN} ${CDN}/`,
  `style-src ${ORIGIN} ${CDN}/`,
  "require-trusted-types-for 'script'"
].join('; ');

const page = `<!doctype html>
<meta charset="utf-8">
<link rel="stylesheet" href="${CDN}/chartist@2/dist/index.css">
<link rel="stylesheet" href="${CDN}/@chartist-js/tooltips@2/dist/styles.css">
<link rel="stylesheet" href="/page.css">
<div id="clip"><div id="chart"></div></div>
<script type="module" src="/main.js"></script>`;

const css = `
body { margin: 0; }
#clip { margin: 200px 40px; width: 420px; height: 200px; overflow: hidden; }
#chart { width: 400px; height: 200px; }`;

// The first bar is the highest: its tooltip goes above the clipping box.
const main = `
import { barChart } from '${CDN}/chartist@2/dist/index.min.js';
import { tooltips } from '${CDN}/@chartist-js/tooltips@2/dist/index.min.js';
window.violations = [];
document.addEventListener('securitypolicyviolation', event =>
  window.violations.push(event.violatedDirective)
);
barChart('#chart', { labels: ['Q1', 'Q2', 'Q3'], series: [{ name: 'Sales', data: [9, 4, 5] }] }, {
  plugins: [tooltips()], chartPadding: 0
});
window.ready = true;`;

let browser;
let tab;
const errors = [];

before(async () => {
  browser = await chromium.launch();
  tab = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  tab.on('pageerror', error => errors.push(error.message));
  await tab.route('**/*', async route => {
    const url = route.request().url().split(/[?#]/)[0];
    if (url === `${ORIGIN}/`) {
      return route.fulfill({
        body: page,
        contentType: 'text/html',
        headers: { 'content-security-policy': POLICY }
      });
    }
    if (url === `${ORIGIN}/main.js`) {
      return route.fulfill({ body: main, contentType: 'text/javascript' });
    }
    if (url === `${ORIGIN}/page.css`) {
      return route.fulfill({ body: css, contentType: 'text/css' });
    }
    const match =
      /^https:\/\/cdn\.jsdelivr\.net\/npm\/(chartist|@chartist-js\/tooltips)@2\/dist\/(.+)$/.exec(
        url
      );
    if (!match) {
      return route.abort();
    }
    const file = path.join(DIST[match[1]], match[2]);
    return route.fulfill({
      body: await readFile(file),
      contentType: TYPES[path.extname(file)]
    });
  });
  await tab.goto(`${ORIGIN}/`);
  await tab.waitForFunction(() => window.ready === true);
});

after(async () => {
  await browser?.close();
});

/** The tooltip: open, its text, its box, and whether anything covers it. */
const tooltip = () =>
  tab.evaluate(() => {
    const element = document.querySelector('.ct-tooltip');
    const box = element.getBoundingClientRect();
    return {
      open: element.matches(':popover-open'),
      text: element.textContent,
      top: box.top,
      bottom: box.bottom,
      onTop: element.contains(
        document.elementFromPoint(
          (box.left + box.right) / 2,
          (box.top + box.bottom) / 2
        )
      )
    };
  });

test('hover shows the tooltip in full, above its clipping box', async () => {
  // Bars are SVG lines without an area for Playwright's hover: move there.
  const { x, y } = await tab.evaluate(() => {
    const box = document.querySelector('.ct-bar').getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + 2 };
  });
  await tab.mouse.move(x, y);
  await tab.waitForFunction(() =>
    document.querySelector('.ct-tooltip').matches(':popover-open')
  );
  const shown = await tooltip();
  assert.equal(shown.text, 'Q1Sales9');
  // The clipping box starts at 200 px; the tooltip shows above it.
  assert.ok(shown.bottom <= 200 && shown.top >= 0, JSON.stringify(shown));
  assert.ok(shown.onTop);
  await tab.mouse.move(900, 650);
  await tab.waitForFunction(
    () => !document.querySelector('.ct-tooltip').matches(':popover-open')
  );
});

test('Tab focuses a value with its name, Escape hides the tooltip', async () => {
  await tab.keyboard.press('Tab');
  assert.equal(
    await tab.evaluate(() => document.activeElement.getAttribute('aria-label')),
    'Q1, Sales, 9'
  );
  assert.equal((await tooltip()).open, true);
  await tab.keyboard.press('ArrowRight');
  assert.equal((await tooltip()).text, 'Q2Sales4');
  await tab.keyboard.press('Escape');
  assert.equal((await tooltip()).open, false);
});

test('nothing violates the strict policy', async () => {
  assert.deepEqual(errors, []);
  assert.deepEqual(await tab.evaluate(() => window.violations), []);
});
