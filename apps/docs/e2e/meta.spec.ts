/** Share previews: head tags, cards, robots.txt. */
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PAGES } from './pages';

/** A PNG's size, from its IHDR chunk. */
function pngSize(body: Buffer) {
  expect(body.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  );
  return { width: body.readUInt32BE(16), height: body.readUInt32BE(20) };
}

/**
 * The tags hold absolute URLs on the configured site (DOCS_SITE), which
 * isn't the test server: compare paths, and fetch from the test server.
 */
const local = (url: string, baseURL: string) =>
  new URL(new URL(url).pathname, baseURL).href;

for (const { name, path } of PAGES) {
  test(`${name}: share tags and card`, async ({ page, request, baseURL }) => {
    await page.goto(path);
    const meta = (key: string) =>
      page
        .locator(`head meta[property="${key}"], head meta[name="${key}"]`)
        .getAttribute('content');

    expect(await meta('og:title')).toBeTruthy();
    expect(await meta('og:description')).toBeTruthy();
    expect(await meta('og:site_name')).toBe('Chartist');
    expect(['website', 'article']).toContain(await meta('og:type'));
    expect(await meta('twitter:card')).toBe('summary_large_image');
    expect(await meta('og:image:width')).toBe('1200');
    expect(await meta('og:image:height')).toBe('630');

    const image = (await meta('og:image'))!;
    expect(image).toMatch(/^https?:\/\/.+\/og\/.+\.png$/);
    expect(await meta('twitter:image')).toBe(image);

    const canonical = page.locator('head link[rel="canonical"]');
    if (name === '404') {
      await expect(canonical).toHaveCount(0);
      expect(await meta('robots')).toBe('noindex');
    } else {
      const href = (await canonical.getAttribute('href'))!;
      expect(new URL(href).pathname).toBe(path);
      expect(await meta('og:url')).toBe(href);
      expect(new URL(image).origin).toBe(new URL(href).origin);
    }

    const response = await request.get(local(image, baseURL!));
    expect(response.status()).toBe(200);
    expect(pngSize(await response.body())).toEqual({
      width: 1200,
      height: 630
    });
  });
}

test('robots.txt allows crawling and points to the sitemap', async ({
  request,
  baseURL
}) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain('User-agent: *');
  expect(text).not.toMatch(/Disallow: \/\S/);
  const sitemap = text.match(/^Sitemap: (\S+)$/m)?.[1];
  expect(sitemap).toMatch(/^https?:\/\/.+\/sitemap-index\.xml$/);
  expect((await request.get(local(sitemap!, baseURL!))).status()).toBe(200);
});

test('the sitemap lists every page and nothing else', async ({
  request,
  baseURL
}) => {
  const index = await (await request.get('/sitemap-index.xml')).text();
  const locs = (xml: string) =>
    [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  const paths: string[] = [];
  for (const chunk of locs(index)) {
    paths.push(
      ...locs(await (await request.get(local(chunk, baseURL!))).text()).map(
        url => new URL(url).pathname
      )
    );
  }
  for (const { path } of PAGES.filter(page => page.name !== '404')) {
    expect(paths, path).toContain(path);
  }
  expect(paths.filter(path => /^\/(v1|og)\/|\.md$|404/.test(path))).toEqual([]);
});

test('every built page has a card', async () => {
  const dist = new URL('../../../dist/apps/docs/', import.meta.url);
  const pages = (await readdir(dist, { recursive: true })).filter(
    file => file.endsWith('.html') && !file.startsWith('v1/')
  );
  expect(pages.length).toBeGreaterThan(PAGES.length);
  const missing: string[] = [];
  for (const file of pages) {
    const html = await readFile(new URL(file, dist), 'utf8');
    const image = html.match(
      /<meta property="og:image" content="([^"]+)"/
    )?.[1];
    if (!image || !existsSync(new URL(`.${new URL(image).pathname}`, dist))) {
      missing.push(file);
    }
  }
  expect(missing).toEqual([]);
});
