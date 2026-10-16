/**
 * Pages the site removed redirect to the page that covers them now, keeping
 * the hash, and stay out of the sitemap.
 */
import { expect, test } from '@playwright/test';
import { MOVED_PAGES } from '../integrations/redirects.mjs';

const OLD = '/plugins/chartist-plugin-targetline/';
const GUIDE = '/docs/target-lines-and-bands/';

test('the target line plugin page lands on the guide, keeping the hash', async ({
  page
}) => {
  // Only the redirect is checked: the request to the guide is answered
  // here, so the test doesn't depend on the guide's content.
  await page.route(`**${GUIDE}`, route =>
    route.fulfill({ contentType: 'text/html', body: '<h1>Guide</h1>' })
  );
  await page.goto(`${OLD}#coming-from-the-plugin`);
  await expect(page).toHaveURL(new RegExp(`${GUIDE}#coming-from-the-plugin$`));
});

test('the redirect works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.route(`**${GUIDE}`, route =>
    route.fulfill({ contentType: 'text/html', body: '<h1>Guide</h1>' })
  );
  await page.goto(OLD);
  await expect(page).toHaveURL(new RegExp(`${GUIDE}$`));
  await context.close();
});

test('moved pages stay out of the sitemap', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  for (const path of Object.keys(MOVED_PAGES)) {
    expect(sitemap).not.toContain(`/${path}<`);
  }
  expect(sitemap).not.toContain('chartist-plugin-targetline');
});
