/**
 * Stylesheet smoke test: markup without inline styles, as
 * renderForHydration() writes it, laid out by dist/index.css alone in
 * Chromium, Firefox and WebKit. A label span fills its foreignObject like
 * an inline-sized one, and a donut slice's stroke-width attribute wins over
 * the default donut width.
 *
 * Run: pnpm nx run chartist:test:smoke (builds first).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

const pkgDir = fileURLToPath(new URL('../..', import.meta.url));
const ORIGIN = 'http://chartist.test';

const page = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="/dist/index.css">
</head><body>
<svg class="ct-chart-line" width="300" height="100" xmlns:ct="http://gionkunz.github.com/chartist-js/ct">
  <g class="ct-labels">
    <foreignObject id="bare" x="10" y="10" width="47.3" height="20.6" overflow="visible">
      <span class="ct-label ct-horizontal ct-end">Mon</span>
    </foreignObject>
    <foreignObject id="styled" x="100" y="10" width="47.3" height="20.6" style="overflow: visible">
      <span class="ct-label ct-horizontal ct-end" style="width: 47.3px; height: 20.6px">Mon</span>
    </foreignObject>
  </g>
</svg>
<svg class="ct-chart-donut" width="200" height="200">
  <path id="attribute" class="ct-slice-donut" stroke-width="20" d="M100,10A90,90,0,0,1,190,100"/>
  <path id="default" class="ct-slice-donut" d="M100,190A90,90,0,0,1,10,100"/>
</svg>
</body></html>`;

let browsers;

before(async () => {
  const engines = { chromium, firefox, webkit };
  const launched = await Promise.allSettled(
    Object.values(engines).map(engine => engine.launch())
  );
  const failed = launched.find(result => result.status === 'rejected');
  if (failed) {
    // An open browser would keep the test process from ever ending.
    await Promise.all(
      launched
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value.close())
    );
    throw failed.reason;
  }
  browsers = Object.fromEntries(
    Object.keys(engines).map((name, i) => [name, launched[i].value])
  );
});

after(async () => {
  await Promise.all(
    Object.values(browsers ?? {}).map(browser => browser.close())
  );
});

/** Opens the page in a browser, with the stylesheet served from dist. */
async function open(name) {
  const tab = await browsers[name].newPage();
  await tab.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== ORIGIN) {
      return route.abort();
    }
    if (url.pathname === '/') {
      return route.fulfill({ body: page, contentType: 'text/html' });
    }
    if (url.pathname === '/dist/index.css') {
      return route.fulfill({
        body: await readFile(path.join(pkgDir, 'dist/index.css')),
        contentType: 'text/css'
      });
    }
    return route.fulfill({ status: 404 });
  });
  await tab.goto(`${ORIGIN}/`);
  return tab;
}

for (const name of ['chromium', 'firefox', 'webkit']) {
  test(`${name}: a label span without a style fills its foreignObject`, async () => {
    const tab = await open(name);
    const boxes = await tab.evaluate(() =>
      Object.fromEntries(
        ['bare', 'styled'].map(id => {
          const object = document.getElementById(id);
          const span = object.querySelector('span').getBoundingClientRect();
          const box = object.getBoundingClientRect();
          return [
            id,
            {
              width: span.width,
              height: span.height,
              left: span.left - box.left,
              top: span.top - box.top
            }
          ];
        })
      )
    );
    for (const field of ['width', 'height', 'left', 'top']) {
      assert.ok(
        Math.abs(boxes.bare[field] - boxes.styled[field]) < 0.5,
        `${field}: ${boxes.bare[field]} vs ${boxes.styled[field]}`
      );
    }
    assert.ok(Math.abs(boxes.bare.width - 47.3) < 0.5, `${boxes.bare.width}`);
    assert.ok(Math.abs(boxes.bare.height - 20.6) < 0.5, `${boxes.bare.height}`);
    await tab.close();
  });

  test(`${name}: a donut slice's stroke-width attribute wins over the default width`, async () => {
    const tab = await open(name);
    const widths = await tab.evaluate(() =>
      ['attribute', 'default'].map(
        id => getComputedStyle(document.getElementById(id)).strokeWidth
      )
    );
    assert.deepEqual(widths, ['20px', '60px']);
    await tab.close();
  });
}
