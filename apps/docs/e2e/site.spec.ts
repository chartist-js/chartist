import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'getting started', path: '/docs/getting-started/' },
  { name: '404', path: '/no-such-page/' }
];

/** Scrolls through the page so every lazily rendered chart mounts. */
async function renderAllCharts(page: Page) {
  for (const chart of await page.locator('[data-chart]').all()) {
    await chart.scrollIntoViewIfNeeded();
    await expect(chart.locator('svg')).toHaveCount(1);
  }
}

for (const { name, path } of PAGES) {
  test(`${name}: no console errors and no third-party requests`, async ({
    page,
    baseURL
  }) => {
    const problems: string[] = [];
    page.on('console', message => {
      if (
        message.type() === 'error' &&
        !message.text().includes('404 (Not Found)')
      ) {
        problems.push(message.text());
      }
    });
    page.on('pageerror', error => problems.push(String(error)));
    page.on('request', request => {
      if (new URL(request.url()).origin !== new URL(baseURL!).origin) {
        problems.push(`third-party request: ${request.url()}`);
      }
    });
    await page.goto(path);
    await renderAllCharts(page);
    expect(problems).toEqual([]);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`${name}: no accessibility violations (${theme})`, async ({
      page
    }) => {
      await page.addInitScript(
        t => localStorage.setItem('chartist-theme', t),
        theme
      );
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);
      await renderAllCharts(page);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        results.violations.map(
          v => `${v.id}: ${v.nodes.map(n => n.target).join(', ')}`
        )
      ).toEqual([]);
    });
  }
}

test('unknown paths show the 404 page', async ({ page }) => {
  const response = await page.goto('/no-such-page/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'fell off the easel'
  );
  await expect(
    page.getByRole('img', { name: /scratching his head/ })
  ).toBeVisible();
});

test('the theme toggle persists and applies before the first paint', async ({
  page
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  // Record every data-theme value and when it was set.
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { themeLog: string[] }).themeLog = seen;
    // Observes the document: <html> doesn't exist yet when this runs.
    new MutationObserver(() =>
      seen.push(
        `${document.documentElement.dataset.theme}@${document.readyState}`
      )
    ).observe(document, {
      attributes: true,
      subtree: true,
      attributeFilter: ['data-theme']
    });
  });
  await page.goto('/docs/getting-started/');
  const log = await page.evaluate(
    () => (window as unknown as { themeLog: string[] }).themeLog
  );
  expect(log).toEqual(['dark@loading']);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).colorScheme
    )
  ).toBe('dark');
  await expect(page.getByRole('button', { name: 'Dark mode' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test('light is the default theme, even with a dark OS', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).colorScheme
    )
  ).toBe('light');
});

test('charts render with Chartist into reserved boxes', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.locator('[data-board-chart] svg.ct-chart-line')
  ).toHaveCount(1);

  await page.goto('/docs/getting-started/');
  const box = page.locator('[data-chart]');
  const before = await box.boundingBox();
  await box.scrollIntoViewIfNeeded();
  await expect(box.locator('svg.ct-chart-line .ct-series')).toHaveCount(2);
  const after = await box.boundingBox();
  expect(after?.height).toBe(before?.height);
});

test('the Getting started file works as copied', async ({ page }) => {
  await page.goto('/docs/getting-started/');
  const html = await page
    .locator('pre.astro-code code')
    .filter({ hasText: '<!doctype html>' })
    .innerText();

  // Serve the snippet, with the CDN mapped to the local chartist build.
  const dist = fileURLToPath(
    new URL('../../../packages/chartist/dist/', import.meta.url)
  );
  await page.route(
    'https://cdn.jsdelivr.net/npm/chartist@2/dist/**',
    async route => {
      const file = new URL(route.request().url()).pathname.split('/dist/')[1];
      await route.fulfill({
        body: await readFile(dist + file),
        contentType: file.endsWith('.css') ? 'text/css' : 'text/javascript'
      });
    }
  );
  await page.route('https://snippet.test/', route =>
    route.fulfill({ body: html, contentType: 'text/html' })
  );
  await page.goto('https://snippet.test/');
  await expect(page.locator('#chart svg.ct-chart-line .ct-series')).toHaveCount(
    2
  );
});

test('keyboard: skip link and mobile menu', async ({ page }) => {
  await page.goto('/docs/getting-started/');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to content' })
  ).toBeFocused();

  await page.setViewportSize({ width: 390, height: 800 });
  const menu = page.getByRole('button', { name: 'Menu' });
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible();
});
