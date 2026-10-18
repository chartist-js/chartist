/**
 * No-bundler smoke test: opens the standalone examples in headless Chromium
 * and checks that the charts render. Requests to jsDelivr and unpkg are
 * answered from the local dist/, so the examples run unchanged and offline.
 *
 * Run: pnpm nx run chartist:test:smoke (builds first).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const pkgDir = fileURLToPath(new URL('../..', import.meta.url));
const pkg = JSON.parse(await readFile(path.join(pkgDir, 'package.json')));
const ORIGIN = 'https://chartist.test';
const CDNS = [
  { prefix: 'https://cdn.jsdelivr.net/npm/', field: 'jsdelivr' },
  { prefix: 'https://unpkg.com/', field: 'unpkg' }
];
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.map': 'application/json'
};

/** Maps a CDN URL to a published file, like jsDelivr/unpkg would. */
function cdnFile(url) {
  for (const { prefix, field } of CDNS) {
    if (!url.startsWith(prefix)) {
      continue;
    }
    const match = url
      .slice(prefix.length)
      .match(/^chartist(?:@[^/]+)?(\/.*)?$/);
    if (!match) {
      return null;
    }
    // A bare package URL serves the file named by the CDN's package field.
    const subpath =
      match[1] && match[1] !== '/' ? match[1].slice(1) : pkg[field];
    const file = path.join(pkgDir, subpath);
    // Only files in dist/ are published.
    return file.startsWith(path.join(pkgDir, 'dist') + path.sep) ? file : null;
  }
  return null;
}

// Server markup from the build, for the hydration pages.
const { lineChartConfig } = await import(
  pathToFileURL(path.join(pkgDir, 'dist/index.js'))
);
const { renderForHydration } = await import(
  pathToFileURL(path.join(pkgDir, 'dist/server.js'))
);
const week = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  series: [[1, 5, 3, 4, 2]]
};
const serverChart = renderForHydration(lineChartConfig(week), {
  width: 600,
  height: 300
});

/**
 * A page with server markup in #chart that takes it over with the live
 * renderer, from a dynamic import() of the builds, after 500 ms. Its
 * `.ct-line` animates for 2 s from page load, and every animation frame
 * records whether the chart is drawn.
 */
const hydratePage = `<!doctype html>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/chartist/dist/index.css">
  <style>
    #chart { width: 600px; height: 300px; }
    @keyframes ct-load { from { opacity: 0.2; } to { opacity: 1; } }
    .ct-line { animation: ct-load 2s linear; }
  </style>
  <div id="chart">${serverChart}</div>
  <script>
    window.frames = [];
    const drawn = () => !!document.querySelector('#chart svg .ct-line');
    (function frame() {
      window.frames.push(drawn());
      if (!window.result) requestAnimationFrame(frame);
    })();
    const svg = document.querySelector('#chart svg');
    const points = [...svg.querySelectorAll('.ct-point')];
    const line = svg.querySelector('.ct-line');
    setTimeout(async () => {
      const [animation] = line.getAnimations();
      const startTime = animation.startTime;
      const { lineChart } = await import('https://cdn.jsdelivr.net/npm/chartist/dist/index.min.js');
      const { liveDomRenderer } = await import('https://cdn.jsdelivr.net/npm/chartist/dist/live.min.js');
      const causes = [];
      lineChart('#chart', ${JSON.stringify(week)}, {
        renderer: liveDomRenderer(),
        on: { mount: ({ cause }) => { causes.push(cause); } }
      });
      // A few frames with the chart taken over.
      await new Promise(resolve => setTimeout(resolve, 100));
      const after = line.getAnimations();
      window.result = {
        causes,
        sameSvg: document.querySelector('#chart svg') === svg,
        samePoints: [...svg.querySelectorAll('.ct-point')].every((point, i) => point === points[i]),
        sameLine: svg.querySelector('.ct-line') === line,
        sameAnimation: after.length === 1 && after[0] === animation,
        startTime: [startTime, after[0]?.startTime],
        currentTime: after[0]?.currentTime
      };
    }, 500);
  </script>`;

/** Extra test pages, served from ORIGIN/inline/<name>. */
const inlinePages = {
  hydrate: hydratePage,
  // The server markup without JavaScript, in a phone-wide container.
  'hydrate-no-js': `<!doctype html>
    <meta name="viewport" content="width=device-width">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/chartist/dist/index.css">
    <style>
      body { margin: 16px; }
      #chart { width: 343px; aspect-ratio: 2 / 1; }
      #chart svg { display: block; }
    </style>
    <div id="chart">${serverChart}</div>`,
  'chartist-min-js': `<!doctype html>
    <script src="https://cdn.jsdelivr.net/npm/chartist/dist/chartist.min.js"></script>`,
  'bare-jsdelivr': `<!doctype html>
    <script src="https://cdn.jsdelivr.net/npm/chartist"></script>`,
  'bare-unpkg': `<!doctype html>
    <script src="https://unpkg.com/chartist@1"></script>`,
  esm: `<!doctype html>
    <script type="module">
      window.esm = await import('https://cdn.jsdelivr.net/npm/chartist/dist/index.min.js');
    </script>`,
  // The compat plugin from its browser module, next to the core module.
  'compat-esm': `<!doctype html>
    <div id="chart" style="width: 400px; height: 200px"></div>
    <script type="module">
      import { LineChart } from 'https://cdn.jsdelivr.net/npm/chartist/dist/index.min.js';
      import { compat } from 'https://cdn.jsdelivr.net/npm/chartist/dist/compat.min.js';
      const draws = [];
      new LineChart('#chart', { series: [[1, 2, 3]] }, { plugins: [compat] })
        .on('draw', data => draws.push(data.type))
        .on('created', () => { window.draws = draws; });
    </script>`,
  // Classic scripts: compat.umd.js adds compat to the global Chartist.
  'compat-umd': `<!doctype html>
    <div id="chart" style="width: 400px; height: 200px"></div>
    <script src="https://cdn.jsdelivr.net/npm/chartist/dist/index.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartist/dist/compat.umd.js"></script>
    <script>
      const draws = [];
      new Chartist.LineChart('#chart', { series: [[1, 2, 3]] }, { plugins: [Chartist.compat] })
        .on('draw', data => draws.push(data.type))
        .on('created', () => { window.draws = draws; });
    </script>`,
  // Live updates from their browser module, next to the core module.
  'live-esm': `<!doctype html>
    <div id="chart" style="width: 400px; height: 200px"></div>
    <script type="module">
      import { lineChart } from 'https://cdn.jsdelivr.net/npm/chartist/dist/index.min.js';
      import { liveDomRenderer } from 'https://cdn.jsdelivr.net/npm/chartist/dist/live.min.js';
      const chart = lineChart('#chart', { series: [[1, 2, 3]] }, { renderer: liveDomRenderer() });
      const svg = document.querySelector('#chart svg');
      chart.update({ data: { series: [[3, 2, 1, 4]] } });
      window.result = {
        kept: document.querySelector('#chart svg') === svg,
        points: svg.querySelectorAll('.ct-point').length
      };
    </script>`,
  // Classic scripts: live.umd.js adds live updates to the global Chartist.
  'live-umd': `<!doctype html>
    <div id="chart" style="width: 400px; height: 200px"></div>
    <script src="https://cdn.jsdelivr.net/npm/chartist/dist/index.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartist/dist/live.umd.js"></script>
    <script>
      const chart = Chartist.lineChart('#chart', { series: [[1, 2, 3]] }, {
        renderer: Chartist.liveDomRenderer()
      });
      const svg = document.querySelector('#chart svg');
      chart.update({ data: { series: [[3, 2, 1, 4]] } });
      window.result = {
        kept: document.querySelector('#chart svg') === svg,
        points: svg.querySelectorAll('.ct-point').length
      };
    </script>`,
  // A 0.x plugin script after compat.umd.js; a plugin registered before
  // compat loads stays.
  'compat-umd-0x': `<!doctype html>
    <div id="chart" style="width: 400px; height: 200px"></div>
    <script src="https://cdn.jsdelivr.net/npm/chartist/dist/index.umd.js"></script>
    <script>Chartist.plugins = { early() {} };</script>
    <script src="https://cdn.jsdelivr.net/npm/chartist/dist/compat.umd.js"></script>
    <script>
      Chartist.plugins = Chartist.plugins || {};
      Chartist.plugins.ctLate = function () {
        return function (chart) {
          chart.on('created', () => {
            window.result = {
              plugins: Object.keys(Chartist.plugins),
              aliases: Chartist.Line === Chartist.LineChart &&
                Chartist.Bar === Chartist.BarChart &&
                Chartist.Pie === Chartist.PieChart,
              isLine: chart instanceof Chartist.Line,
              data: Chartist.getDataArray(chart.data, true)
            };
          });
        };
      };
      Chartist.lineChart('#chart', { series: [[1, 2, 3]] }, {
        plugins: [Chartist.fromLegacyPlugin(Chartist.plugins.ctLate())]
      });
    </script>`,
  // The default stylesheet on a light page, a dark one, and a dark one that
  // sets its own label color.
  'color-scheme': `<!doctype html>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/chartist/dist/index.css">
    <div id="light" style="width: 400px; height: 200px"></div>
    <div style="color-scheme: dark">
      <div id="dark" style="width: 400px; height: 200px"></div>
      <div id="custom" style="width: 400px; height: 200px; --ct-label-color: orange"></div>
    </div>
    <script type="module">
      import { lineChart } from 'https://cdn.jsdelivr.net/npm/chartist/dist/index.min.js';
      for (const id of ['light', 'dark', 'custom']) {
        lineChart('#' + id, { labels: ['a', 'b'], series: [[1, 2]] });
      }
      window.drawn = true;
    </script>`
};

let browser;

before(async () => {
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
});

async function openPage(url) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`console: ${msg.text()}`);
    }
  });
  page.on('requestfailed', request =>
    errors.push(`request failed: ${request.url()}`)
  );

  await page.route('**/*', async route => {
    const url = route.request().url().split(/[?#]/)[0];
    let file = null;
    if (url.startsWith(`${ORIGIN}/examples/`)) {
      file = path.join(pkgDir, 'examples', path.basename(url));
    } else if (url.startsWith(`${ORIGIN}/inline/`)) {
      const html = inlinePages[path.basename(url)];
      return html
        ? route.fulfill({ body: html, contentType: 'text/html' })
        : route.fulfill({ status: 404 });
    } else {
      file = cdnFile(url);
    }
    if (!file) {
      // Everything else stays offline.
      return route.abort();
    }
    try {
      await route.fulfill({
        body: await readFile(file),
        contentType: TYPES[path.extname(file)] ?? 'application/octet-stream',
        // Like the real CDNs; required for cross-origin module scripts.
        headers: { 'access-control-allow-origin': '*' }
      });
    } catch {
      await route.fulfill({ status: 404 });
    }
  });

  await page.goto(url);
  return { page, errors };
}

// SVG lines (bars) have an empty bounding box, so wait for presence only.
const attached = { state: 'attached' };

async function assertChartsRender(page) {
  await page.waitForSelector('#line svg .ct-line', attached);
  await page.waitForSelector('#bar svg .ct-bar', attached);
  await page.waitForSelector('#pie svg .ct-slice-pie', attached);

  const result = await page.evaluate(() => ({
    lines: document.querySelectorAll('#line .ct-series .ct-line').length,
    points: document.querySelectorAll('#line .ct-point').length,
    bars: document.querySelectorAll('#bar .ct-bar').length,
    slices: document.querySelectorAll('#pie .ct-slice-pie').length,
    // Proves the stylesheet loaded and applies to the rendered SVG.
    lineStrokeWidth: getComputedStyle(document.querySelector('#line .ct-line'))
      .strokeWidth,
    width: document.querySelector('#line svg').getBoundingClientRect().width
  }));

  assert.equal(result.lines, 2);
  assert.equal(result.points, 10);
  assert.equal(result.bars, 4);
  assert.equal(result.slices, 4);
  assert.equal(result.lineStrokeWidth, '4px');
  assert.ok(result.width > 0, 'chart has a width');
}

async function expectedExports() {
  const esm = await import(pathToFileURL(path.join(pkgDir, 'dist/index.js')));
  return Object.keys(esm).sort();
}

test('examples/umd.html renders with a classic script tag', async () => {
  const { page, errors } = await openPage(`${ORIGIN}/examples/umd.html`);
  await assertChartsRender(page);
  assert.deepEqual(errors, []);
  await page.close();
});

test('examples/esm.html renders with <script type="module">', async () => {
  const { page, errors } = await openPage(`${ORIGIN}/examples/esm.html`);
  await assertChartsRender(page);
  assert.deepEqual(errors, []);
  await page.close();
});

test('browser ESM build exposes every export', async () => {
  const { page, errors } = await openPage(`${ORIGIN}/inline/esm`);
  await page.waitForFunction(() => window.esm);
  const keys = await page.evaluate(() => Object.keys(window.esm).sort());
  assert.deepEqual(keys, await expectedExports());
  assert.deepEqual(errors, []);
  await page.close();
});

for (const name of ['compat-esm', 'compat-umd']) {
  test(`compat plugin emits 1.x draw events (${name})`, async () => {
    const { page, errors } = await openPage(`${ORIGIN}/inline/${name}`);
    await page.waitForFunction(() => window.draws);
    const draws = await page.evaluate(() => window.draws);
    assert.equal(draws.filter(type => type === 'point').length, 3);
    assert.ok(draws.includes('line'));
    assert.ok(draws.includes('grid') && draws.includes('label'));
    assert.deepEqual(errors, []);
    await page.close();
  });
}

for (const name of ['live-esm', 'live-umd']) {
  test(`live updates keep the svg (${name})`, async () => {
    const { page, errors } = await openPage(`${ORIGIN}/inline/${name}`);
    await page.waitForFunction(() => window.result);
    assert.deepEqual(await page.evaluate(() => window.result), {
      kept: true,
      points: 4
    });
    assert.deepEqual(errors, []);
    await page.close();
  });
}

test('compat.umd.js adds the 0.x names for plugin scripts', async () => {
  const { page, errors } = await openPage(`${ORIGIN}/inline/compat-umd-0x`);
  await page.waitForFunction(() => window.result);
  assert.deepEqual(await page.evaluate(() => window.result), {
    plugins: ['early', 'ctLate'],
    aliases: true,
    isLine: true,
    data: [[3, 2, 1]]
  });
  assert.deepEqual(errors, []);
  await page.close();
});

for (const name of ['chartist-min-js', 'bare-jsdelivr', 'bare-unpkg']) {
  test(`UMD global via ${name}`, async () => {
    const { page, errors } = await openPage(`${ORIGIN}/inline/${name}`);
    const keys = await page.evaluate(() =>
      window.Chartist ? Object.keys(window.Chartist).sort() : null
    );
    assert.deepEqual(keys, await expectedExports());
    assert.deepEqual(errors, []);
    await page.close();
  });
}

test('label and grid defaults follow the color scheme', async () => {
  const { page, errors } = await openPage(`${ORIGIN}/inline/color-scheme`);
  await page.waitForFunction(() => window.drawn);
  await page.waitForSelector('#custom .ct-label', attached);
  const colors = await page.evaluate(() =>
    Object.fromEntries(
      ['light', 'dark', 'custom'].map(id => [
        id,
        {
          label: getComputedStyle(document.querySelector(`#${id} .ct-label`))
            .color,
          grid: getComputedStyle(document.querySelector(`#${id} .ct-grid`))
            .stroke
        }
      ])
    )
  );
  assert.deepEqual(colors, {
    light: { label: 'rgba(0, 0, 0, 0.4)', grid: 'rgba(0, 0, 0, 0.2)' },
    dark: {
      label: 'rgba(255, 255, 255, 0.6)',
      grid: 'rgba(255, 255, 255, 0.2)'
    },
    custom: { label: 'rgb(255, 165, 0)', grid: 'rgba(255, 255, 255, 0.2)' }
  });
  assert.deepEqual(errors, []);
  await page.close();
});

test('takes server markup over, keeping its elements and load animation', async () => {
  const { page, errors } = await openPage(`${ORIGIN}/inline/hydrate`);
  await page.waitForFunction(() => window.result);
  const result = await page.evaluate(() => window.result);
  assert.deepEqual(result.causes, ['hydrate']);
  assert.equal(result.sameSvg, true);
  assert.equal(result.samePoints, true);
  assert.equal(result.sameLine, true);
  // The animation that started with the page continues; it isn't restarted.
  assert.equal(result.sameAnimation, true);
  assert.equal(result.startTime[1], result.startTime[0]);
  assert.ok(result.currentTime >= 500, `currentTime ${result.currentTime}`);
  // A dynamically imported Chartist leaves no frame without the chart.
  const frames = await page.evaluate(() => window.frames);
  assert.ok(frames.length > 10, `${frames.length} frames`);
  assert.deepEqual(
    frames.filter(drawn => !drawn),
    []
  );
  assert.deepEqual(errors, []);
  await page.close();
});

test('shows server markup scaled into a phone-wide container without JavaScript', async () => {
  const page = await browser.newPage({
    viewport: { width: 375, height: 667 },
    javaScriptEnabled: false
  });
  await page.route('**/*', async route => {
    const url = route.request().url();
    if (url === `${ORIGIN}/inline/hydrate-no-js`) {
      return route.fulfill({
        body: inlinePages['hydrate-no-js'],
        contentType: 'text/html'
      });
    }
    const file = cdnFile(url.split(/[?#]/)[0]);
    return file
      ? route.fulfill({ body: await readFile(file), contentType: 'text/css' })
      : route.abort();
  });
  await page.goto(`${ORIGIN}/inline/hydrate-no-js`);
  const sizes = await page.evaluate(() => {
    const container = document.querySelector('#chart').getBoundingClientRect();
    const svg = document.querySelector('#chart svg').getBoundingClientRect();
    const drawing = document
      .querySelector('#chart svg g')
      .getBoundingClientRect();
    const root = document.documentElement;
    return {
      container: [container.width, container.height],
      svg: [svg.left, svg.right, svg.width, svg.height],
      drawingRight: drawing.right,
      scroll: [root.scrollWidth, root.clientWidth]
    };
  });
  assert.deepEqual(sizes.container, [343, 171.5]);
  assert.deepEqual(sizes.svg, [16, 359, 343, 171.5]);
  assert.ok(
    sizes.drawingRight <= 359.5,
    `drawing ends at ${sizes.drawingRight}`
  );
  assert.ok(sizes.scroll[0] <= sizes.scroll[1], `scroll width ${sizes.scroll}`);
  await page.close();
});
