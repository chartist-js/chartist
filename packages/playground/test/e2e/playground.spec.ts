import { expect, test, type Page } from '@playwright/test';

const EXAMPLES = {
  'line-area': 'line',
  'line-path-animation': 'line',
  'bar-stacked': 'bar',
  'pie-custom-labels': 'pie'
} as const;

const preview = (page: Page) => page.frameLocator('iframe.playground-preview');
const errors = (page: Page) => page.locator('.playground-error');

/** Records the first error text, for the error-quality table in design.md. */
async function noteError(
  page: Page,
  info: { annotations: { type: string; description?: string }[] }
) {
  info.annotations.push({
    type: 'error',
    description: await errors(page).first().innerText()
  });
}

/** Replaces the content of the open editor tab by typing into CodeMirror. */
async function replaceCode(page: Page, code: string) {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.insertText(code);
}

for (const transformer of ['sucrase', 'ts-blank-space']) {
  for (const [id, type] of Object.entries(EXAMPLES)) {
    test(`renders ${id} (${transformer})`, async ({ page }) => {
      await page.goto(`?example=${id}&transformer=${transformer}`);
      await expect(preview(page).locator(`svg.ct-chart-${type}`)).toBeVisible({
        timeout: 20_000
      });
      await expect(errors(page)).toHaveCount(0);
      const iframe = page.locator('iframe.playground-preview');
      await expect(iframe).toHaveAttribute('sandbox', 'allow-scripts');
    });
  }
}

test('applies chartist/styles.css and the example style.css', async ({
  page
}) => {
  await page.goto('?example=pie-custom-labels');
  const slice = preview(page).locator('.ct-series-a .ct-slice-pie');
  await expect(slice).toHaveCSS('fill', 'rgb(244, 198, 61)');
  // From chartist/styles.css: the chart container gets the default label color.
  await expect(preview(page).locator('svg.ct-chart-pie')).toBeVisible();
  const label = preview(page).locator('.ct-label').first();
  await expect(label).toHaveCSS('font-weight', '700');
});

test('animated example (SMIL via draw events) renders animate elements', async ({
  page
}) => {
  await page.goto('?example=line-path-animation');
  await expect(
    preview(page).locator('svg.ct-chart-line animate').first()
  ).toBeAttached();
});

test('editing main.ts re-renders the chart', async ({ page }) => {
  await page.goto('?example=line-area');
  await expect(preview(page).locator('.ct-point')).toHaveCount(8);
  await replaceCode(
    page,
    `import 'chartist/styles.css';
import { LineChart } from 'chartist';

new LineChart('#chart', { series: [[1, 5, 3]] }, { showArea: true });
`
  );
  await expect(preview(page).locator('.ct-point')).toHaveCount(3);
  await expect(errors(page)).toHaveCount(0);
});

test('a syntax error shows in the error panel and keeps the last chart', async ({
  page
}, info) => {
  await page.goto('?example=line-area');
  await expect(preview(page).locator('svg.ct-chart-line')).toBeVisible();
  await replaceCode(
    page,
    `import { LineChart } from 'chartist';

const data = { series: [[1, 2]] ;
new LineChart('#chart', data);
`
  );
  await expect(errors(page).first()).toContainText('src/main.ts:3');
  await noteError(page, info);
  await expect(page.locator('.playground')).toHaveAttribute(
    'data-state',
    'error'
  );
  await expect(preview(page).locator('svg.ct-chart-line')).toBeVisible();
});

test('runtime errors and console output reach the host', async ({
  page
}, info) => {
  await page.goto('?example=line-area');
  await expect(preview(page).locator('svg.ct-chart-line')).toBeVisible();
  await replaceCode(
    page,
    `console.log('hello', { a: 1 });
throw new Error('boom');
`
  );
  await expect(page.locator('.playground-log')).toContainText('hello {"a":1}');
  await expect(errors(page).first()).toContainText('boom');
  await expect(errors(page).first()).toContainText('src/main.ts');
  await noteError(page, info);
});

test('the preview cannot reach the host page', async ({ page }, info) => {
  await page.goto('?example=line-area');
  await expect(preview(page).locator('svg.ct-chart-line')).toBeVisible();
  await replaceCode(page, `parent.document.title = 'pwned';\n`);
  await expect(errors(page).first()).toBeVisible();
  await expect(page).toHaveTitle('Chartist playground spike');
  await noteError(page, info);
});

test('a module that fails to load is reported', async ({ page }, info) => {
  await page.goto('?example=line-area');
  await expect(preview(page).locator('svg.ct-chart-line')).toBeVisible();
  await replaceCode(page, `import 'http://localhost:9/missing.js';\n`);
  await expect(errors(page).first()).toContainText(/load|fetch|import/i);
  await noteError(page, info);
});

test.describe('ts-blank-space', () => {
  test('fails at runtime on type imports without the type keyword', async ({
    page
  }, info) => {
    await page.goto('?example=line-area&transformer=ts-blank-space');
    await expect(preview(page).locator('svg.ct-chart-line')).toBeVisible({
      timeout: 20_000
    });
    // The 1.x sandbox style. Vite fails on it too once `verbatimModuleSyntax`
    // is on, as in the `npm create vite` vanilla-ts tsconfig.
    await replaceCode(
      page,
      `import { PieChart, PieChartOptions } from 'chartist';
const options: PieChartOptions = {};
new PieChart('#chart', { series: [1, 2] }, options);
`
    );
    await expect(errors(page).first()).toContainText(
      /PieChartOptions|export/i,
      {
        timeout: 20_000
      }
    );
    await noteError(page, info);
  });

  test('reports syntax errors at compile time', async ({ page }, info) => {
    await page.goto('?example=line-area&transformer=ts-blank-space');
    await expect(preview(page).locator('svg.ct-chart-line')).toBeVisible({
      timeout: 20_000
    });
    await replaceCode(page, `const data = { series: [[1, 2]] ;\n`);
    await expect(errors(page).first()).toContainText('src/main.ts:1');
    await noteError(page, info);
  });
});
