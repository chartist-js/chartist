import { expect, test } from '@playwright/test';

const PAGE = '/docs/ssr-hydration/';

test('a diagram is inline SVG in the HTML, without Mermaid in the browser', async ({
  page,
  request
}) => {
  const html = await (await request.get(PAGE)).text();
  const figure = /<figure class="diagram"[^>]*>([\s\S]*?)<\/figure>/.exec(
    html
  )?.[1];
  expect(figure).toMatch(/^<svg [^>]*role="graphics-document document"/);
  expect(figure).toContain('<figcaption>');
  expect(figure).not.toMatch(/<style|\sstyle="/);

  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto(PAGE);
  expect(requests.filter(url => /mermaid/i.test(url))).toEqual([]);
});

test('a diagram follows the theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(PAGE);
  const box = page
    .locator('figure.diagram .node:not(.code):not(.accent) .label-container')
    .first();
  const fill = () => box.evaluate(element => getComputedStyle(element).fill);
  const light = await fill();
  await page.getByRole('button', { name: 'Dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(fill).not.toBe(light);
});
