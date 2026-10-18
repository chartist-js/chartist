/**
 * Content Security Policy smoke test: draws every chart type and feature
 * from the build in headless Chromium on pages served with a strict policy,
 * and expects no violation. Without 'unsafe-inline' for styles, a style
 * attribute set by a script is blocked; Chartist sets its styles through the
 * CSSOM, which a policy allows. With Trusted Types required, assigning HTML
 * strings is blocked; the DOM renderer creates elements instead.
 *
 * Run: pnpm nx run chartist:test:smoke (builds first).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const pkgDir = fileURLToPath(new URL('../..', import.meta.url));
const ORIGIN = 'https://chartist.test';

const POLICIES = {
  none: '',
  strict: "default-src 'self'; style-src 'self' 'report-sample'",
  trustedTypes:
    "default-src 'self'; style-src 'self'; require-trusted-types-for 'script'"
};

// Every case draws into its own 400 × 200 container. The page script is a
// module from the same origin, as a strict policy requires.
const CASES = {
  line: `lineChart(el, data, { showArea: true })`,
  bar: `barChart(el, data)`,
  horizontalBar: `barChart(el, data, { horizontalBars: true })`,
  pie: `pieChart(el, { labels: ['A', 'B', 'C'], series: [20, 10, 30] })`,
  donut: `pieChart(el, { series: [20, 10, 30] }, { donut: true, donutWidth: 20 })`,
  svgLabels: `barChart(el, data, { labels: 'svg' })`,
  layers: `lineChart(el, data, { low: 0, layers: { below: [band({ low: 1, high: 4 })], above: [targetLine({ value: 4, label: 'goal' })] } })`,
  responsive: `lineChart(el, data, {}, [['(min-width: 1px)', { showPoint: false }]])`,
  update: `lineChart(el, data).update({ data: { labels, series: [[3, 1, 4, 1, 5]] } })`,
  live: `lineChart(el, data, { renderer: liveDomRenderer({ animations: smilAnimations() }) }).update({ data: { labels, series: [[3, 1, 4, 1, 5]] } })`,
  compat: `new LineChart(el, data, { plugins: [compat] }).on('draw', d => {
    if (d.type === 'line') d.element.attr({ style: 'opacity: 0.5' });
  })`
};

const page = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="/dist/index.css">
<link rel="stylesheet" href="/csp/page.css">
</head><body>
${Object.keys(CASES)
  .map(name => `<div class="case" id="${name}"></div>`)
  .join('\n')}
<script type="module" src="/csp/cases.js"></script>
</body></html>`;

const css =
  '.case { width: 400px; height: 200px; } #live { --ct-update-duration: 300ms; }';

const script = `
const violations = [];
document.addEventListener('securitypolicyviolation', event =>
  violations.push(event.violatedDirective + ': ' + (event.sample || event.blockedURI))
);
const { lineChart, barChart, pieChart, band, targetLine, LineChart } =
  await import('/dist/index.js');
const { compat } = await import('/dist/compat.js');
const { liveDomRenderer, smilAnimations } = await import('/dist/live.js');
const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const data = { labels, series: [[1, 5, 3, 4, 2]] };
const errors = [];
${Object.entries(CASES)
  .map(
    ([name, code]) => `try {
  const el = document.getElementById(${JSON.stringify(name)});
  ${code};
} catch (error) {
  errors.push(${JSON.stringify(name)} + ': ' + error.message);
}`
  )
  .join('\n')}
// Let ResizeObserver, responsive options and the 1.x events settle.
await new Promise(resolve => setTimeout(resolve, 300));
const box = element => {
  const { x, y, width, height } = element.getBoundingClientRect();
  return [x, y, width, height].map(Math.round);
};
window.result = {
  violations,
  errors,
  labels: [...document.querySelectorAll('#line .ct-label')].map(box),
  donut: getComputedStyle(document.querySelector('#donut .ct-slice-donut')).strokeWidth,
  compatOpacity: getComputedStyle(document.querySelector('#compat .ct-line')).opacity,
  charts: [...document.querySelectorAll('.case')].filter(el => el.querySelector('svg')).length
};
document.body.dataset.done = '';
`;

// Server markup in the served HTML, taken over with the live renderer at
// the server's size: a line chart with HTML labels and a donut with
// donutWidth. A classic script in the head listens for violations, so
// the ones the parser reports for the markup count too.
const { lineChartConfig, pieChartConfig, renderForHydration } = await import(
  path.join(pkgDir, 'dist/index.js')
);
const hydrateData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  series: [[1, 5, 3, 4, 2]]
};
const donutOptions = { donut: true, donutWidth: 20 };
const hydratePage = `<!doctype html>
<html><head><meta charset="utf-8">
<script src="/csp/listen.js"></script>
<link rel="stylesheet" href="/dist/index.css">
<link rel="stylesheet" href="/csp/hydrate.css">
</head><body>
<div id="hline">${renderForHydration(lineChartConfig(hydrateData), {
  width: 600,
  height: 300
})}</div>
<div id="hdonut">${renderForHydration(
  pieChartConfig({ series: [20, 10, 30] }, donutOptions),
  { width: 300, height: 300 }
)}</div>
<script type="module" src="/csp/hydrate.js"></script>
</body></html>`;

const hydrateCss =
  '#hline { width: 600px; height: 300px; } #hdonut { width: 300px; height: 300px; } svg { display: block; }';

const listen = `window.violations = [];
document.addEventListener('securitypolicyviolation', event =>
  window.violations.push(event.violatedDirective + ': ' + (event.sample || event.blockedURI))
);`;

const hydrateScript = `
const measure = () => ({
  labels: [...document.querySelectorAll('#hline .ct-label')].map(element => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return [x, y, width, height].map(Math.round);
  }),
  donut: [...document.querySelectorAll('#hdonut .ct-slice-donut')].map(
    slice => getComputedStyle(slice).strokeWidth
  )
});
const before = measure();
const svgs = [...document.querySelectorAll('svg')];
const { lineChart, pieChart } = await import('/dist/index.js');
const { liveDomRenderer } = await import('/dist/live.js');
const repaired = [];
const on = { mount: ({ cause, hydration }) => { repaired.push(cause + ' ' + hydration?.repaired); } };
const data = ${JSON.stringify(hydrateData)};
lineChart('#hline', data, { renderer: liveDomRenderer(), on });
pieChart('#hdonut', { series: [20, 10, 30] }, { ...${JSON.stringify(donutOptions)}, renderer: liveDomRenderer(), on });
await new Promise(resolve => setTimeout(resolve, 300));
window.result = {
  violations: window.violations,
  before,
  after: measure(),
  repaired,
  kept: svgs.every(svg => svg.isConnected) && document.querySelectorAll('svg').length === 2
};
document.body.dataset.done = '';
`;

let browser;
let reference;
let hydrateReference;

before(async () => {
  browser = await chromium.launch();
  reference = await run(POLICIES.none);
  assert.deepEqual(reference.errors, []);
  assert.equal(reference.charts, Object.keys(CASES).length);
  hydrateReference = await run(POLICIES.none, '/hydrate');
});

after(async () => {
  await browser?.close();
});

/** Opens a page (the cases by default) under a policy and returns what it measured. */
async function run(policy, pathname = '/') {
  const tab = await browser.newPage();
  const headers = policy ? { 'content-security-policy': policy } : {};
  await tab.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== ORIGIN) {
      return route.abort();
    }
    const send = (body, contentType) =>
      route.fulfill({ body, contentType, headers });
    if (url.pathname === '/') {
      return send(page, 'text/html');
    }
    if (url.pathname === '/hydrate') {
      return send(hydratePage, 'text/html');
    }
    const generated = {
      '/csp/listen.js': listen,
      '/csp/hydrate.js': hydrateScript
    }[url.pathname];
    if (generated) {
      return send(generated, 'text/javascript');
    }
    if (url.pathname === '/csp/hydrate.css') {
      return send(hydrateCss, 'text/css');
    }
    if (url.pathname === '/csp/page.css') {
      return send(css, 'text/css');
    }
    if (url.pathname === '/csp/cases.js') {
      return send(script, 'text/javascript');
    }
    const file = path.join(pkgDir, url.pathname);
    if (!file.startsWith(path.join(pkgDir, 'dist') + path.sep)) {
      return route.fulfill({ status: 404 });
    }
    try {
      const type = file.endsWith('.css') ? 'text/css' : 'text/javascript';
      return send(await readFile(file), type);
    } catch {
      return route.fulfill({ status: 404 });
    }
  });
  const pageErrors = [];
  tab.on('pageerror', error => pageErrors.push(error.message));
  await tab.goto(`${ORIGIN}${pathname}`);
  // A selector, not waitForFunction: the policy blocks Playwright's eval.
  await tab.waitForSelector('body[data-done]', { state: 'attached' });
  const result = await tab.evaluate(() => window.result);
  await tab.close();
  return { ...result, pageErrors };
}

test('draws every chart under a strict style policy', async () => {
  const result = await run(POLICIES.strict);
  assert.deepEqual(result.violations, []);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.pageErrors, []);
  assert.equal(result.charts, Object.keys(CASES).length);
});

test('keeps label sizes, donut width and 1.x styles under the policy', async () => {
  const result = await run(POLICIES.strict);
  assert.deepEqual(result.labels, reference.labels);
  assert.equal(result.donut, '20px');
  assert.equal(result.compatOpacity, '0.5');
});

test('draws every chart where Trusted Types are required', async () => {
  const result = await run(POLICIES.trustedTypes);
  assert.deepEqual(result.violations, []);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.pageErrors, []);
  assert.equal(result.charts, Object.keys(CASES).length);
});

for (const name of ['strict', 'trustedTypes']) {
  test(`takes server markup over without a violation (${name})`, async () => {
    const result = await run(POLICIES[name], '/hydrate');
    assert.deepEqual(result.violations, []);
    assert.deepEqual(result.pageErrors, []);
    assert.equal(result.kept, true);
    assert.deepEqual(result.repaired, ['hydrate 0', 'hydrate 0']);
  });
}

test('lays out server markup under the policy as without it, before and after the takeover', async () => {
  const result = await run(POLICIES.strict, '/hydrate');
  assert.ok(hydrateReference.before.labels.length > 0);
  assert.deepEqual(result.before.labels, hydrateReference.before.labels);
  assert.deepEqual(result.after.labels, hydrateReference.after.labels);
  // Taking the markup over doesn't move the labels.
  assert.deepEqual(result.after.labels, result.before.labels);
  assert.deepEqual(result.before.donut, ['20px', '20px', '20px']);
  assert.deepEqual(result.after.donut, ['20px', '20px', '20px']);
});
