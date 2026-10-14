import { expect, test, type Locator, type Page } from '@playwright/test';

test('a window-sized example chart fills a tall preview', async ({ page }) => {
  // Long code: the preview is much taller than a 16:10 chart in its width.
  await page.goto('/examples/line/svg-animation/');
  const live = page.locator('[data-live-example]');
  const frame = live.locator('iframe');
  const svg = live.frameLocator('iframe').locator('svg.ct-chart-line');
  await expect(svg).toBeVisible({ timeout: 15_000 });
  const outer = (await frame.boundingBox())!;
  expect(outer.height).toBeGreaterThan((outer.width / 1.6) * 1.2);
  // The chart is drawn to the box, less the preview's padding.
  await expect
    .poll(async () => (await svg.boundingBox())!.height / outer.height)
    .toBeGreaterThan(0.9);
  expect((await svg.boundingBox())!.width / outer.width).toBeGreaterThan(0.9);
});

const TYPED = Array.from({ length: 12 }, (_, i) => `const v${i} = ${i};`);

/**
 * Types lines at the end of an editor with no delay, as fast as Playwright
 * types, moving the cursor to the end before each line (which scrolls), and
 * checks they landed as typed.
 */
async function typeFast(page: Page, editor: Locator) {
  const lines = editor.locator('.cm-line');
  await editor.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+End');
  const last = await lines.last().textContent();
  for (const line of TYPED) {
    await page.keyboard.press('ControlOrMeta+End');
    await page.keyboard.type(`\n${line}`);
  }
  await expect
    .poll(async () =>
      (await lines.allTextContents()).slice(-(TYPED.length + 1))
    )
    .toEqual([last, ...TYPED]);
}

// Inline without a height (the editor grows, the page scrolls) and with one
// (the editor scrolls): both scroll while typing at the end.
for (const path of [
  '/docs/events-and-plugins/',
  '/examples/line/svg-animation/'
]) {
  test(`${path}: fast typing in a live example lands in order`, async ({
    page
  }) => {
    for (let run = 0; run < 3; run++) {
      await page.goto(path);
      const live = page.locator('[data-live-example]').first();
      await live.scrollIntoViewIfNeeded();
      await live.getByRole('button', { name: 'Edit' }).click();
      await expect(live).toHaveAttribute('data-ready', '');
      await live.getByRole('tab', { name: 'src/main.ts' }).click();
      await typeFast(page, live);
    }
  });
}

test('fast typing in the full-screen playground lands in order', async ({
  page
}) => {
  for (let run = 0; run < 3; run++) {
    await page.goto('/playground/#example=line/svg-animation');
    const playground = page.locator('.playground');
    await expect(playground.locator('.cm-content')).toBeVisible();
    await typeFast(page, playground);
  }
});

test('the version links point to the archives, on this site for 1.x', async ({
  page,
  request
}) => {
  await page.goto('/docs/getting-started/');
  const footer = page
    .locator('footer')
    .getByRole('navigation', { name: 'Versions' });
  await expect(footer.getByRole('link', { name: 'v1.5 docs' })).toHaveAttribute(
    'href',
    '/v1/'
  );
  await expect(
    footer.getByRole('link', { name: 'v0.11 archive' })
  ).toHaveAttribute('href', 'https://gionkunz.github.io/chartist-js/');
  await expect(
    page.locator('[data-version-switch] option', { hasText: 'v1.5 docs' })
  ).toHaveAttribute('value', '/v1/');
  await expect(
    page.locator('footer').getByRole('link', { name: 'API', exact: true })
  ).toHaveAttribute('href', '/api/');
  // The 1.x docs are served as built, with their assets under /v1/.
  for (const path of ['/v1/', '/v1/api/basics', '/v1/img/logo.svg']) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
  const html = await (await request.get('/v1/')).text();
  expect(html).toContain('src="/v1/assets/js/main.');
});
