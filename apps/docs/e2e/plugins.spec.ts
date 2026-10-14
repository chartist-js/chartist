import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const facts = JSON.parse(
  await readFile(new URL('../src/data/facts.json', import.meta.url), 'utf8')
) as { plugins: Record<string, { monthlyDownloads: number }> };
const byDownloads = Object.entries(facts.plugins)
  .sort(([, a], [, b]) => b.monthlyDownloads - a.monthlyDownloads)
  .map(([name]) => name.replace(/^@/, '').replace(/\//g, '-'));

test('the header leads to the plugins, most downloaded first', async ({
  page
}) => {
  await page.goto('/docs/getting-started/');
  await page.getByRole('banner').getByRole('link', { name: 'Plugins' }).click();
  await expect(page).toHaveURL(/\/plugins\/$/);
  const ids = await page
    .locator('[data-plugin]')
    .evaluateAll(items => items.map(item => item.id));
  expect(ids).toEqual(byDownloads);
});

test('an entry credits its author and links its sources', async ({ page }) => {
  await page.goto('/plugins/');
  const entry = page.locator('#chartist-plugin-axistitle');
  await expect(entry.getByRole('heading', { level: 2 })).toHaveText(
    'Axis title'
  );
  await expect(entry).toContainText('Alex Stanbury');
  await expect(entry).toContainText('MIT');
  await expect(entry.locator('.tag', { hasText: 'API v0.x' })).toBeVisible();
  await expect(entry.locator('.tag', { hasText: 'No SSR' })).toBeVisible();
  await expect(entry.getByRole('link', { name: 'npm' })).toHaveAttribute(
    'href',
    'https://www.npmjs.com/package/chartist-plugin-axistitle'
  );
  await expect(
    page.locator('#stklcode-chartist-plugin-tooltips .tag', {
      hasText: 'API v1.x'
    })
  ).toBeVisible();
  // A plugin whose repository is gone links to npm and says so.
  await expect(page.locator('#chartist-plugin-tooltips')).toContainText(
    'Repository gone'
  );
});

test('the filter narrows the list by text and chart type', async ({ page }) => {
  await page.goto('/plugins/');
  const total = byDownloads.length;
  const visible = page.locator('[data-plugin]:visible');
  const count = page.locator('[data-plugin-count]');
  await expect(count).toHaveText(`${total} plugins`);

  await page.getByRole('searchbox', { name: 'Find a plugin' }).fill('tooltip');
  await expect(visible).toHaveCount(2);
  await expect(count).toHaveText(`2 of ${total} plugins`);

  await page.getByRole('searchbox', { name: 'Find a plugin' }).fill('');
  await page.getByRole('button', { name: 'Pie' }).click();
  await expect(page.getByRole('button', { name: 'Pie' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  for (const item of await visible.all()) {
    await expect(item).toHaveAttribute('data-types', /\bpie\b/);
  }

  await page
    .getByRole('searchbox', { name: 'Find a plugin' })
    .fill('no such plugin');
  await expect(visible).toHaveCount(0);
  await expect(page.locator('[data-plugin-empty]')).toBeVisible();
  await expect(
    page.locator('[data-plugin-empty]').getByRole('link', {
      name: 'write your own'
    })
  ).toHaveAttribute('href', '#write-your-own');
});

test('without JavaScript every plugin shows and the filter stays hidden', async ({
  browser
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/plugins/');
  await expect(page.locator('[data-plugin]:visible')).toHaveCount(
    byDownloads.length
  );
  await expect(page.locator('[data-plugin-filter]')).toBeHidden();
  await context.close();
});

const examples = Object.keys(
  JSON.parse(
    await readFile(
      new URL('../src/data/plugin-files.json', import.meta.url),
      'utf8'
    )
  ) as Record<string, unknown>
).map(name => ({ package: name }));

for (const plugin of examples) {
  test(`${plugin.package}: its live example runs without errors`, async ({
    page
  }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto('/plugins/');
    const live = page.locator(
      `#${plugin.package.replace(/^@/, '').replace(/\//g, '-')} [data-live-example]`
    );
    await live.scrollIntoViewIfNeeded();
    await live.getByRole('button', { name: 'Edit' }).click();
    await expect(live).toHaveAttribute('data-ready', '');
    await expect(
      live
        .frameLocator('iframe')
        .locator(
          'svg.ct-chart-line, svg.ct-chart-bar, svg.ct-chart-pie, svg.ct-chart-donut'
        )
        .first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(live.locator('.playground-errors li')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('a plugin example runs in the full playground from its link', async ({
  page
}) => {
  await page.goto('/plugins/');
  const live = page.locator('#chartist-plugin-pointlabels [data-live-example]');
  await live.scrollIntoViewIfNeeded();
  await live.getByRole('button', { name: 'Edit' }).click();
  await expect(live).toHaveAttribute('data-ready', '');
  // Edited code opens through a share link (#code=…).
  const editor = live.locator('.cm-content');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.type('\n// edited');
  await live.getByRole('button', { name: 'Open in playground' }).click();
  await expect(page).toHaveURL(/\/playground\/#code=/);
  const playground = page;
  const frame = playground.frameLocator('iframe');
  await expect(frame.locator('svg.ct-chart-line')).toBeVisible({
    timeout: 10_000
  });
  // The plugin drew its labels in the playground too.
  await expect(frame.locator('text.ct-label').first()).toBeVisible();
  await expect(
    playground.getByRole('button', { name: 'Export to StackBlitz' })
  ).toHaveCount(0);
});
