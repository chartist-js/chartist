/**
 * Content Security Policy smoke test: text art from the build in headless
 * Chromium on pages served with a strict policy. HTML and element output
 * carry no inline styles, and the stylesheet's embedded cell font loads
 * with `font-src data:`. Where Trusted Types are required, the element
 * output needs no `innerHTML`.
 *
 * Run: pnpm nx run terminal:test:smoke (builds first).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const packages = fileURLToPath(new URL('../../..', import.meta.url));
const ORIGIN = 'https://chartist.test';
const DIST = {
  '/terminal/': path.join(packages, 'terminal/dist'),
  '/chartist/': path.join(packages, 'chartist/dist')
};

const page = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="/terminal/styles.css">
</head><body>
<div id="html"></div><div id="element"></div><div id="legend"></div>
<script type="module" src="/csp/cases.js"></script>
</body></html>`;

// `innerHTML` only where the policy allows it: Trusted Types block it.
const script = `
const violations = [];
document.addEventListener('securitypolicyviolation', event =>
  violations.push(event.violatedDirective + ': ' + (event.sample || event.blockedURI))
);
const { lineChart, legend } = await import('/terminal/index.js');
const data = {
  labels: ['Mon', 'Tue', 'Wed'],
  series: [{ name: 'Visitors', data: [1, 5, 3] }]
};
const options = { columns: 40, rows: 10, showArea: true };
const errors = [];
try {
  document.getElementById('element').append(
    lineChart(data, { ...options, format: 'element' })
  );
  document.getElementById('legend').append(legend(data, { format: 'element' }));
  if (!('trustedTypes' in document.body.dataset)) {
    document.getElementById('html').innerHTML =
      lineChart(data, { ...options, format: 'html' });
  }
} catch (error) {
  errors.push(error.message);
}
// A blocked font fails to load (a network error).
const fonts = await document.fonts
  .load("16px 'Chartist Terminal'", '\\u2801')
  .catch(() => []);
// The violation event can arrive after the failed load: wait for it a bit.
for (
  let wait = 0;
  fonts.length === 0 &&
  wait < 50 &&
  !violations.some(violation => violation.startsWith('font-src'));
  wait++
) {
  await new Promise(resolve => setTimeout(resolve, 20));
}
window.result = {
  violations,
  errors,
  charts: document.querySelectorAll('pre.ct-terminal').length,
  font: fonts.length > 0
};
document.body.dataset.done = '';
`;

let browser;

before(async () => {
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
});

/** Opens the page under a policy and returns what it found. */
async function run(policy, { trustedTypes = false } = {}) {
  const tab = await browser.newPage();
  const headers = { 'content-security-policy': policy };
  await tab.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== ORIGIN) {
      return route.abort();
    }
    const send = (body, contentType) =>
      route.fulfill({ body, contentType, headers });
    if (url.pathname === '/') {
      return send(
        trustedTypes
          ? page.replace('<body>', '<body data-trusted-types="">')
          : page,
        'text/html'
      );
    }
    if (url.pathname === '/csp/cases.js') {
      return send(script, 'text/javascript');
    }
    const prefix = Object.keys(DIST).find(p => url.pathname.startsWith(p));
    if (!prefix) {
      return route.fulfill({ status: 404 });
    }
    try {
      const file = path.join(DIST[prefix], url.pathname.slice(prefix.length));
      if (file.endsWith('.css')) {
        return send(await readFile(file), 'text/css');
      }
      // The build imports `chartist` by name. An import map would be an
      // inline script, which the policy blocks, so point it at the build.
      const code = (await readFile(file, 'utf8')).replace(
        /from\s*["']chartist["']/g,
        "from '/chartist/index.js'"
      );
      return send(code, 'text/javascript');
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

test('draws HTML and element output under a strict style policy', async () => {
  const result = await run(
    "default-src 'self'; style-src 'self' 'report-sample'; font-src data:"
  );
  assert.deepEqual(result.violations, []);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.pageErrors, []);
  assert.equal(result.charts, 3);
  assert.equal(result.font, true, 'the cell font loads with font-src data:');
});

test('needs font-src data: for the cell font', async () => {
  const result = await run("default-src 'self'; style-src 'self'");
  assert.equal(result.font, false);
  assert.ok(result.violations.some(v => v.startsWith('font-src')));
});

test('draws element output where Trusted Types are required', async () => {
  const result = await run(
    "default-src 'self'; style-src 'self'; font-src data:; require-trusted-types-for 'script'",
    { trustedTypes: true }
  );
  assert.deepEqual(result.violations, []);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.pageErrors, []);
  assert.equal(result.charts, 2);
});
