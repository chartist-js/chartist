import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Opens the search from the header and types a term. */
async function search(page: Page, term: string) {
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  const input = page.getByRole('combobox', { name: /Search/ });
  await expect(input).toBeFocused();
  await input.fill(term);
  return input;
}

const results = (page: Page) => page.getByRole('listbox', { name: 'Results' });

test('lineChart finds its API entry', async ({ page }) => {
  await page.goto('/docs/getting-started/');
  await search(page, 'lineChart');
  const api = results(page).getByRole('group', { name: 'API' });
  // The API group comes first, and its first result is the entry.
  await expect(results(page).getByRole('group').first()).toHaveAccessibleName(
    'API'
  );
  const first = api.getByRole('option').first();
  await expect(first).toHaveAttribute('href', '/api/charts/#lineChart');
  await expect(first.locator('mark').first()).toHaveText(/lineChart/i);
});

test('a guide term finds its guide', async ({ page }) => {
  await page.goto('/');
  await search(page, 'container queries');
  const docs = results(page).getByRole('group', { name: 'Docs' });
  await expect(docs.getByRole('option').first()).toHaveAttribute(
    'href',
    /^\/docs\/responsive\//
  );
  await expect(
    results(page)
      .getByRole('group', { name: 'Examples' })
      .getByRole('option')
      .first()
  ).toHaveAttribute('href', '/examples/composed/container-queries/');
});

test('works with the keyboard alone', async ({ page }) => {
  await page.goto('/docs/getting-started/');
  const button = page.getByRole('button', { name: 'Search', exact: true });
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: 'Search' });
  await expect(dialog).toBeVisible();
  const input = page.getByRole('combobox', { name: /Search/ });
  await expect(input).toBeFocused();
  // Escape closes it, and focus goes back to the button.
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();

  // `/` opens it too; type, move down, open.
  await page.locator('h1').click();
  await page.keyboard.press('/');
  await expect(input).toBeFocused();
  await page.keyboard.type('lineChart');
  const first = results(page).getByRole('option').first();
  await expect(first).toHaveAttribute('href', '/api/charts/#lineChart');
  await page.keyboard.press('ArrowDown');
  await expect(first).toHaveAttribute('aria-selected', 'true');
  await expect(input).toHaveAttribute(
    'aria-activedescendant',
    (await first.getAttribute('id')) ?? ''
  );
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/api\/charts\/#lineChart$/);
  await expect(page.locator('#lineChart')).toBeInViewport();
});

test('says so when nothing matches', async ({ page }) => {
  await page.goto('/docs/getting-started/');
  // Pagefind matches a one-letter word in the index against a query that
  // starts with it (the docs have "J", "Q" and other path command letters),
  // so the query starts with a letter that never stands alone.
  await search(page, 'fpfpfp');
  await expect(page.getByText(/Nothing found for “fpfpfp”/)).toBeVisible();
  await expect(results(page)).toBeHidden();
});

test('nothing loads before the search opens, and nothing from third parties', async ({
  page,
  baseURL
}) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/docs/getting-started/');
  await page.waitForLoadState('networkidle');
  expect(requests.filter(url => url.includes('pagefind'))).toEqual([]);

  await search(page, 'showArea');
  await expect(results(page).getByRole('option').first()).toBeVisible();
  expect(requests.some(url => url.includes('/pagefind/pagefind.js'))).toBe(
    true
  );
  expect(
    requests.filter(
      url => new URL(url).origin !== new URL(baseURL ?? '').origin
    )
  ).toEqual([]);
});

for (const theme of ['light', 'dark']) {
  for (const [name, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['phone', { width: 390, height: 800 }]
  ] as const) {
    test(`no accessibility violations with the dialog open (${theme}, ${name})`, async ({
      page
    }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript(
        t => localStorage.setItem('chartist-theme', t),
        theme
      );
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/docs/getting-started/');
      await search(page, 'lineChart');
      await expect(results(page).getByRole('option').first()).toBeVisible();
      await page.keyboard.press('ArrowDown');
      const scan = await new AxeBuilder({ page })
        .include('[data-search-dialog]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        scan.violations.map(
          v => `${v.id}: ${v.nodes.map(n => n.target).join(', ')}`
        )
      ).toEqual([]);
    });
  }
}
