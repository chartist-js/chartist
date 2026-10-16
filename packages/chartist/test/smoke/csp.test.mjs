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

const css = '.case { width: 400px; height: 200px; }';

const script = `
const violations = [];
document.addEventListener('securitypolicyviolation', event =>
  violations.push(event.violatedDirective + ': ' + (event.sample || event.blockedURI))
);
const { lineChart, barChart, pieChart, band, targetLine, LineChart } =
  await import('/dist/index.js');
const { compat } = await import('/dist/compat.js');
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

let browser;
let reference;

before(async () => {
  browser = await chromium.launch();
  reference = await run(POLICIES.none);
  assert.deepEqual(reference.errors, []);
  assert.equal(reference.charts, Object.keys(CASES).length);
});

after(async () => {
  await browser?.close();
});

/** Opens the cases page under a policy and returns what it measured. */
async function run(policy) {
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
  await tab.goto(`${ORIGIN}/`);
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
