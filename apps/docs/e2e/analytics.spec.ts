import { expect, test } from '@playwright/test';

// The site's pages, served as if from chartist.dev, load the visitor
// counter; served from anywhere else (as in the other tests), they don't.
test('counts visitors on chartist.dev only', async ({ page, baseURL }) => {
  await page.route('https://chartist.dev/**', async route => {
    const path = new URL(route.request().url()).pathname;
    await route.fulfill({
      response: await page.request.fetch(new URL(path, baseURL).href)
    });
  });
  const counter: string[] = [];
  await page.route('https://gc.zgo.at/**', route => {
    counter.push(route.request().url());
    return route.abort();
  });
  await page.goto('https://chartist.dev/docs/getting-started/');
  await expect.poll(() => counter).toEqual(['https://gc.zgo.at/count.js']);
  await expect(page.locator('script[data-goatcounter]')).toHaveAttribute(
    'data-goatcounter',
    'https://chartist.goatcounter.com/count'
  );
});
