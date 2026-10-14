import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** The type worker and the declarations. */
const TYPE_REQUEST = /\/worker-[\w-]+\.js$|\.d\.ts$/;

test('a live example completes Chartist functions from the site', async ({
  page,
  baseURL
}) => {
  const problems: string[] = [];
  const typeRequests: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') {
      problems.push(message.text());
    }
  });
  page.on('pageerror', error => problems.push(String(error)));
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin !== new URL(baseURL!).origin) {
      problems.push(`third-party request: ${request.url()}`);
    }
    if (TYPE_REQUEST.test(url.pathname)) {
      typeRequests.push(url.pathname);
    }
  });

  await page.goto('/docs/events-and-plugins/');
  const live = page.locator('[data-live-example]').first();
  await live.scrollIntoViewIfNeeded();
  await live.getByRole('button', { name: 'Edit' }).click();
  await expect(live).toHaveAttribute('data-ready', '');
  await live.getByRole('tab', { name: 'src/main.ts' }).click();
  // Opening the editor loads nothing type-related; focusing it does.
  expect(typeRequests).toEqual([]);
  await live.locator('.cm-content').click();
  await expect(live.locator('.playground')).toHaveAttribute(
    'data-types',
    'ready',
    { timeout: 20_000 }
  );

  expect(problems).toEqual([]);

  // From here the preview runs half-typed code, which may throw.
  await page.keyboard.press('ControlOrMeta+End');
  // Typed like a person: instant typing can displace a character in live
  // examples (a finding of add-playground-types, not about types).
  await page.keyboard.type('\nbarCh', { delay: 50 });
  const option = page
    .locator('.cm-tooltip-autocomplete')
    .getByRole('option', { name: 'barChart' });
  await expect(option).toBeVisible();
  await expect(
    page.locator('.cm-completionInfo .cm-pg-signature')
  ).toContainText('barChart(');

  const results = await new AxeBuilder({ page })
    .include('[data-live-example]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map(
      v => `${v.id}: ${v.nodes.map(n => n.target).join(', ')}`
    )
  ).toEqual([]);

  // Accepting completes the name, so the preview runs valid code again.
  await page.keyboard.press('Enter');
  await expect(live.locator('.cm-line').last()).toHaveText('barChart');
  await expect(live.locator('.playground-errors li')).toHaveCount(0);
  expect(problems.filter(problem => problem.startsWith('third-party'))).toEqual(
    []
  );
});
