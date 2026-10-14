/**
 * The 1.x URLs: every page of the 1.x site (now under /v1/) is either a v2
 * page or redirects to its /v1/ copy, keeping the hash. The redirects stay
 * out of the sitemap and search.
 */
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import {
  REDIRECT_MARKER,
  redirectFile,
  v1Pages,
  v2Files
} from '../integrations/v1-redirects.mjs';

const DIST = fileURLToPath(
  new URL('../../../dist/apps/docs/', import.meta.url)
);

const read = async (file: string) => {
  try {
    return (await stat(DIST + file)).isFile()
      ? await readFile(DIST + file, 'utf8')
      : undefined;
  } catch {
    return undefined;
  }
};

const isRedirect = (html: string) => html.includes(` ${REDIRECT_MARKER}>`);

test('every 1.x page is a v2 page or redirects to /v1/', async () => {
  const pages = await v1Pages(`${DIST}v1`);
  expect(pages.length).toBeGreaterThan(50);
  const missing: string[] = [];
  for (const page of pages) {
    const v2 = (await Promise.all(v2Files(page).map(read))).find(
      html => html && !isRedirect(html)
    );
    const redirect = await read(redirectFile(page));
    const redirected =
      redirect !== undefined &&
      isRedirect(redirect) &&
      redirect.includes(`url=/v1/${page}"`);
    // Exactly one of them: a redirect never hides a v2 page.
    if (Boolean(v2) === redirected) {
      missing.push(page);
    }
  }
  expect(missing).toEqual([]);
});

test('an old API page lands on its 1.x copy, keeping the hash', async ({
  page
}) => {
  await page.goto('/api/classes/LineChart#constructor');
  await expect(page).toHaveURL(/\/v1\/api\/classes\/LineChart#constructor$/);
  await expect(page.locator('h1')).toContainText('LineChart');
});

test('the redirect works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/api/basics');
  await expect(page).toHaveURL(/\/v1\/api\/basics$/);
  await context.close();
});

test("an old guide v2 doesn't have redirects too", async ({ page }) => {
  await page.goto('/docs/whats-new-in-v1');
  await expect(page).toHaveURL(/\/v1\/docs\/whats-new-in-v1$/);
});

test('/api/ stays the v2 reference', async ({ page }) => {
  await page.goto('/api/');
  await expect(page).toHaveURL(/\/api\/$/);
  await expect(page.locator('html')).not.toHaveAttribute(REDIRECT_MARKER);
  await expect(page.locator('h1')).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/api/');
});

test('redirects stay out of the sitemap and search', async ({
  page,
  request
}) => {
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).not.toMatch(/\/api\/classes\/LineChart/);
  expect(sitemap).not.toMatch(/\/blog\/archive/);

  await page.goto('/');
  const urls = await page.evaluate(async () => {
    const pagefind = await import(
      /* @vite-ignore */ `${location.origin}/pagefind/pagefind.js`
    );
    // Every redirect page names its page, and v2 has a LineChart too.
    const search = await pagefind.search('LineChart');
    const data = await Promise.all(
      search.results.map((result: { data: () => Promise<{ url: string }> }) =>
        result.data()
      )
    );
    return data.map(({ url }: { url: string }) => url);
  });
  expect(urls.length).toBeGreaterThan(0);
  expect(
    urls.filter((url: string) => /\/LineChart(\.html)?$/.test(url))
  ).toEqual([]);
});
