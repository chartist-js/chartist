import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { pluginNeighbors, pluginSlug, sortedPlugins } from '../src/lib/plugins';

// The order and the neighbors come from the plugins data, unit tested
// there; the pages follow it.
const slugs = sortedPlugins().map(pluginSlug);

test('the header leads to the plugins, most downloaded first', async ({
  page
}) => {
  await page.goto('/docs/getting-started/');
  await page.getByRole('banner').getByRole('link', { name: 'Plugins' }).click();
  await expect(page).toHaveURL(/\/plugins\/$/);
  const ids = await page
    .locator('[data-plugin]')
    .evaluateAll(items => items.map(item => item.id));
  expect(ids).toEqual(slugs);
});

test('a tile shows the plugin at a glance and opens its page', async ({
  page
}) => {
  await page.goto('/plugins/');
  const tile = page.locator('#chartist-plugin-threshold');
  await expect(tile).toContainText('Threshold');
  await expect(tile).toContainText('Splits lines and bars at a value');
  await expect(tile.locator('.tag', { hasText: 'API v0.x' })).toBeVisible();
  await expect(tile.locator('.tag.warn', { hasText: 'Global' })).toBeVisible();
  await expect(tile.locator('.tag', { hasText: 'No SSR' })).toBeVisible();
  await expect(tile).toContainText('downloads a month');
  await tile.getByRole('link').click();
  await expect(page).toHaveURL(/\/plugins\/chartist-plugin-threshold\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Threshold');
  await page
    .getByRole('navigation', { name: 'Breadcrumb' })
    .getByRole('link', { name: 'Plugins' })
    .click();
  await expect(page).toHaveURL(/\/plugins\/$/);
});

test('the tile previews run the plugins', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto('/plugins/');
  const preview = page.locator(
    '#chartist-plugin-pointlabels [data-gallery-preview]'
  );
  await preview.scrollIntoViewIfNeeded();
  // The plugin's labels, drawn by its published code in the thumbnail.
  await expect(
    preview.frameLocator('iframe').locator('text.ct-label').first()
  ).toBeAttached({ timeout: 10_000 });
  expect(errors).toEqual([]);
});

test('a plugin page credits its author and links its sources', async ({
  page
}) => {
  await page.goto('/plugins/chartist-plugin-threshold/');
  const main = page.locator('article');
  await expect(main).toContainText('Gion Kunz');
  await expect(main).toContainText('WTFPL');
  await expect(main).toContainText('a month');
  await expect(main.locator('.tag', { hasText: 'API v0.x' })).toBeVisible();
  await expect(main.getByRole('link', { name: 'npm' })).toHaveAttribute(
    'href',
    'https://www.npmjs.com/package/chartist-plugin-threshold'
  );
  await expect(
    main.getByRole('heading', { name: 'Use it on your site' })
  ).toBeVisible();
});

test('plugin pages link to their neighbors in the overview order', async ({
  page
}) => {
  await page.goto(`/plugins/${slugs[0]}/`);
  const more = page.getByRole('navigation', { name: 'More plugins' });
  await more.getByRole('link', { name: /Next/ }).click();
  const { next } = pluginNeighbors(slugs[0]);
  await expect(page).toHaveURL(new RegExp(`/plugins/${pluginSlug(next!)}/$`));
});

test('an old link to an entry opens the plugin page', async ({ page }) => {
  await page.goto('/plugins/#chartist-plugin-threshold');
  await expect(page).toHaveURL(/\/plugins\/chartist-plugin-threshold\/$/);
});

test('the filter narrows the tiles by text and chart type', async ({
  page
}) => {
  await page.goto('/plugins/');
  const total = slugs.length;
  const visible = page.locator('[data-plugin]:visible');
  const count = page.locator('[data-plugin-count]');
  await expect(count).toHaveText(`${total} plugins`);

  await page
    .getByRole('searchbox', { name: 'Find a plugin' })
    .fill('threshold');
  await expect(visible).toHaveCount(1);
  await expect(count).toHaveText(`1 of ${total} plugins`);

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
  await expect(page.locator('[data-plugin]:visible')).toHaveCount(slugs.length);
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
    await page.goto(
      `/plugins/${plugin.package.replace(/^@/, '').replace(/\//g, '-')}/`
    );
    const live = page.locator('[data-live-example]');
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
  await page.goto('/plugins/chartist-plugin-pointlabels/');
  const live = page.locator('[data-live-example]');
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
