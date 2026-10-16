import { expect, test, type Page } from '@playwright/test';

/** The type worker and the declarations: requested only after focus. */
const TYPE_REQUEST = /\/assets\/worker-[\w-]+\.js|\.d\.ts$/;

// Loading the TypeScript worker takes a few seconds in a cold browser.
const READY = { timeout: 20_000 };

const preview = (page: Page) => page.frameLocator('iframe.playground-preview');

/** Replaces the open file's content, typing the last characters. */
async function replaceCode(page: Page, code: string, typed = '') {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.insertText(code);
  if (typed) {
    await page.keyboard.type(typed);
  }
}

function requests(page: Page) {
  const urls: string[] = [];
  page.on('request', request => {
    if (TYPE_REQUEST.test(new URL(request.url()).pathname)) {
      urls.push(request.url());
    }
  });
  return urls;
}

test('nothing type-related loads before an editor gets focus', async ({
  page
}) => {
  const urls = requests(page);
  await page.goto('?example=line-area');
  await expect(preview(page).locator('.ct-point')).toHaveCount(8);
  await page.waitForTimeout(500);
  expect(urls).toEqual([]);

  await page.locator('.cm-content').click();
  await expect
    .poll(() => urls.map(url => new URL(url).pathname.split('/').pop()), READY)
    .toEqual(
      expect.arrayContaining([
        'index.d.ts',
        'compat.d.ts',
        'live.d.ts',
        expect.stringMatching(/^worker-/)
      ])
    );
});

test('a misspelled event is underlined, and the chart still runs', async ({
  page
}) => {
  await page.goto('?example=line-area');
  await replaceCode(
    page,
    `import 'chartist/styles.css';
import { lineChart } from 'chartist';

lineChart('#chart', { series: [[1, 5, 3]] }).on('compsoe', () => undefined);
`
  );
  const range = page.locator('.cm-lintRange-error');
  await expect(range).toHaveText("'compsoe'", READY);
  await range.hover();
  await expect(page.locator('.cm-tooltip-lint')).toContainText('compsoe');
  // Type errors don't block running.
  await expect(preview(page).locator('.ct-point')).toHaveCount(3);
});

test('completions know a node narrowed by its role', async ({ page }) => {
  await page.goto('?example=line-area');
  await page.locator('.cm-content').click();
  // Typed once the service is up, so the completion comes from types.
  await expect(page.locator('.playground')).toHaveAttribute(
    'data-types',
    'ready',
    READY
  );
  await replaceCode(
    page,
    `import { lineChart } from 'chartist';

lineChart('#chart', { series: [[1, 2]] }).on('compose', node => {
  if (node.role === 'point') {
    node.ctx`,
    '.'
  );
  const list = page.locator('.cm-tooltip-autocomplete');
  await expect(list.getByRole('option', { name: 'valueIndex' })).toBeVisible(
    READY
  );
  await expect(list.getByRole('option', { name: 'path' })).toHaveCount(0);
});

test('hovering a function shows its signature and doc comment', async ({
  page
}) => {
  await page.goto('?example=line-area');
  await replaceCode(
    page,
    `import { lineChart } from 'chartist';

lineChart('#chart', { series: [[1, 2]] });
`
  );
  const name = page.locator('.cm-line').nth(2).getByText('lineChart');
  const tooltip = page.locator('.cm-tooltip-hover');
  await expect(async () => {
    await page.mouse.move(0, 0);
    await name.hover();
    await expect(tooltip).toBeVisible({ timeout: 1000 });
  }).toPass(READY);
  await expect(tooltip.locator('.cm-pg-signature')).toContainText(
    'lineChart(target: string | Element'
  );
  await expect(tooltip.locator('.cm-pg-doc')).not.toBeEmpty();
});

test('the lint panel lists the diagnostics for keyboard users', async ({
  page
}) => {
  await page.goto('?example=line-area');
  await replaceCode(page, `const n: number = 'one';\n`);
  await expect(page.locator('.cm-lintRange-error')).toHaveText('n', READY);
  await page.keyboard.press('ControlOrMeta+Shift+KeyM');
  await expect(page.locator('.cm-panel-lint li')).toContainText(
    "Type 'string' is not assignable to type 'number'"
  );
});

test('CSS files complete the chart custom properties', async ({ page }) => {
  await page.goto('?example=pie-custom-labels');
  await page.getByRole('tab', { name: 'src/style.css' }).click();
  await replaceCode(page, '.ct-chart {\n  ', '--ct-se');
  await expect(
    page
      .locator('.cm-tooltip-autocomplete')
      .getByRole('option', { name: '--ct-series-a' })
  ).toBeVisible();
});

test('with types off, focus loads nothing', async ({ page }) => {
  const urls = requests(page);
  await page.goto('?example=line-area&types=off');
  await page.locator('.cm-content').click();
  await page.keyboard.type('x');
  await page.waitForTimeout(1000);
  expect(urls).toEqual([]);
});
