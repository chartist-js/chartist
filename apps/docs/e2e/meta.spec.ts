/** Share previews: head tags, cards, robots.txt. */
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { REDIRECT_MARKER } from '../integrations/redirects.mjs';
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

const dist = new URL('../../../dist/apps/docs/', import.meta.url);

/** The attributes of each tag of a kind in an HTML document. */
function tags(html: string, name: string) {
  return [...html.matchAll(new RegExp(`<${name}\\s([^>]*)>`, 'g'))].map(
    ([, attributes]) =>
      Object.fromEntries(
        [...attributes.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, k, v]) => [
          k,
          v
        ])
      )
  );
}

// The built HTML, not the browser: the tags are static, so one test reads
// every page in a moment.
test('every page has its share tags and a card', async () => {
  for (const { name, path } of PAGES) {
    const file = name === '404' ? '404.html' : `.${path}index.html`;
    const html = await readFile(new URL(file, dist), 'utf8');
    const metas = tags(html.slice(0, html.indexOf('</head>')), 'meta');
    const meta = (key: string) =>
      metas.find(m => m.property === key || m.name === key)?.content;

    expect(meta('og:title'), name).toBeTruthy();
    expect(meta('og:description'), name).toBeTruthy();
    expect(meta('og:site_name'), name).toBe('Chartist');
    expect(['website', 'article'], name).toContain(meta('og:type'));
    expect(meta('twitter:card'), name).toBe('summary_large_image');
    expect(meta('og:image:width'), name).toBe('1200');
    expect(meta('og:image:height'), name).toBe('630');

    const image = meta('og:image')!;
    expect(image, name).toMatch(/^https?:\/\/.+\/og\/.+\.png$/);
    expect(meta('twitter:image'), name).toBe(image);

    const canonical = tags(html, 'link').find(l => l.rel === 'canonical');
    if (name === '404') {
      expect(canonical, name).toBeUndefined();
      expect(meta('robots'), name).toBe('noindex');
    } else {
      const href = canonical!.href;
      expect(new URL(href).pathname, name).toBe(path);
      expect(meta('og:url'), name).toBe(href);
      expect(new URL(image).origin, name).toBe(new URL(href).origin);
    }

    const card = await readFile(new URL(`.${new URL(image).pathname}`, dist));
    expect(pngSize(card), name).toEqual({ width: 1200, height: 630 });
  }
});

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
  const pages = (await readdir(dist, { recursive: true })).filter(
    file => file.endsWith('.html') && !file.startsWith('v1/')
  );
  expect(pages.length).toBeGreaterThan(PAGES.length);
  const missing: string[] = [];
  for (const file of pages) {
    const html = await readFile(new URL(file, dist), 'utf8');
    // Redirect pages aren't pages to share.
    if (html.includes(` ${REDIRECT_MARKER}>`)) {
      continue;
    }
    const image = html.match(
      /<meta property="og:image" content="([^"]+)"/
    )?.[1];
    if (!image || !existsSync(new URL(`.${new URL(image).pathname}`, dist))) {
      missing.push(file);
    }
  }
  expect(missing).toEqual([]);
});
