/**
 * The entry point for language models:
 * llms.txt, llms-full.txt and a Markdown version of every guide, API page
 * and example.
 */
import { expect, test } from '@playwright/test';
import { API_PAGES } from '../src/lib/api-pages';
import { DOCS } from './pages';

/** Links in the files are absolute to the configured site: same paths here. */
const local = (url: string, baseURL: string) => {
  const { pathname } = new URL(url);
  return new URL(pathname, baseURL).href;
};

/** The Markdown outside code blocks. */
const prose = (markdown: string) =>
  markdown.split(/^\s*```[\s\S]*?^\s*```/m).join('\n');

test('llms.txt steers to v2 and every link resolves', async ({
  request,
  baseURL
}) => {
  const response = await request.get('/llms.txt');
  expect(response.ok()).toBe(true);
  const text = await response.text();
  expect(text).toMatch(/^# Chartist\n\n> /);
  expect(text).toContain('`lineChart(target, data, options)`');
  expect(text).toContain("Don't write `new Chartist.Line(…)`");
  const links = [...text.matchAll(/\]\((https?:[^)]+)\)/g)].map(
    match => match[1]
  );
  // Every guide, API page and example is listed.
  expect(links.filter(link => /\/docs\/[^/]+\.md$/.test(link))).toHaveLength(
    DOCS.length
  );
  expect(links.filter(link => /\/api\/[^/]+\.md$/.test(link))).toHaveLength(
    API_PAGES.length
  );
  expect(
    links.filter(link => /\/examples\/.+\.md$/.test(link)).length
  ).toBeGreaterThan(30);
  const broken: string[] = [];
  for (const link of links.filter(
    link => !link.includes('gionkunz.github.io')
  )) {
    const target = await request.get(local(link, baseURL!));
    if (!target.ok()) {
      broken.push(`${link}: ${target.status()}`);
    }
  }
  expect(broken).toEqual([]);
});

test('guides convert to Markdown without components or imports', async ({
  request
}) => {
  const leftovers: string[] = [];
  for (const slug of DOCS) {
    const markdown = await (await request.get(`/docs/${slug}.md`)).text();
    expect(markdown, slug).toMatch(/^# .+\n\n> /);
    const outside = prose(markdown);
    for (const pattern of [
      /<(LiveExample|Callout|Step)\b/,
      /^import .* from ['"]\.\.?\//m,
      /^export const /m
    ]) {
      if (pattern.test(outside)) {
        leftovers.push(`${slug}: ${pattern}`);
      }
    }
  }
  expect(leftovers).toEqual([]);
});

test('API Markdown has every entry, and llms-full.txt every page', async ({
  request
}) => {
  const charts = await (await request.get('/api/charts.md')).text();
  for (const name of [
    'lineChart',
    'barChart',
    'pieChart',
    'LineChartPresetOptions'
  ]) {
    expect(charts).toContain(`## ${name}\n`);
  }
  expect(charts).toContain('- `showArea?: boolean`');
  const full = await (await request.get('/llms-full.txt')).text();
  for (const slug of DOCS) {
    const title = /^# (.+)$/m.exec(
      await (await request.get(`/docs/${slug}.md`)).text()
    )![1];
    expect(full, slug).toContain(`## ${title}\n`);
  }
  for (const page of API_PAGES) {
    expect(full, page.slug).toContain(`## ${page.title} (Chartist API)\n`);
  }
});

test('pages point to their Markdown', async ({ page, request }) => {
  for (const [path, markdown] of [
    ['/docs/getting-started/', '/docs/getting-started.md'],
    ['/api/scene/', '/api/scene.md'],
    ['/examples/line/area/', '/examples/line/area.md']
  ]) {
    await page.goto(path);
    await expect(
      page.locator('link[rel="alternate"][type="text/markdown"]')
    ).toHaveAttribute('href', markdown);
    await expect(
      page.getByRole('link', { name: 'View as Markdown' })
    ).toHaveAttribute('href', markdown);
    expect((await request.get(markdown)).ok(), markdown).toBe(true);
  }
});
