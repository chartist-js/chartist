import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const facts = JSON.parse(
  await readFile(new URL('../src/data/facts.json', import.meta.url), 'utf8')
) as {
  github: { contributors: number };
  credits: {
    people: { login: string; name: string; commits: number; role?: string }[];
  };
};

test('Cube comes first and links to cube.dev', async ({ page }) => {
  await page.goto('/credits/');
  const first = page.locator('main article, main [data-credits] li').first();
  await expect(first.getByRole('heading', { name: 'Cube' })).toBeVisible();
  await expect(first).toContainText('0.x to 1.x');
  await expect(first.getByRole('link', { name: /cube\.dev/ })).toHaveAttribute(
    'href',
    'https://cube.dev'
  );
});

// Who is credited (top ten by commits, no bots, the flags) is decided when
// the facts are fetched, and unit tested there; the page shows the snapshot.
test('the people from the snapshot, the creator flagged', async ({ page }) => {
  await page.goto('/credits/');
  const entries = page.locator('[data-credits] li');
  const people = facts.credits.people;
  await expect(entries).toHaveCount(people.length);
  await expect(entries.first()).toContainText(people[0].name);
  await expect(entries.first()).toContainText(
    `${people[0].commits.toLocaleString('en')} commit`
  );
  await expect(entries.filter({ hasText: 'creator' })).toHaveCount(1);
  await expect(
    page.getByRole('link', {
      name: `See all ${facts.github.contributors} contributors on GitHub`
    })
  ).toBeVisible();
});

test('the footer and the sponsor card lead to the credits', async ({
  page
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Read the credits' }).click();
  await expect(page).toHaveURL(/\/credits\/$/);
  await page.goto('/docs/getting-started/');
  await page
    .getByRole('contentinfo')
    .getByRole('link', { name: 'Credits' })
    .click();
  await expect(page).toHaveURL(/\/credits\/$/);
});
