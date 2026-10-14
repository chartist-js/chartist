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

test('the people: top ten by commits without bots, the creator flagged', async ({
  page
}) => {
  await page.goto('/credits/');
  const entries = page.locator('[data-credits] li');
  await expect(entries).toHaveCount(facts.credits.people.length);
  const people = facts.credits.people;
  const top = people.slice(0, 10).map(person => person.commits);
  expect(top).toEqual([...top].sort((a, b) => b - a));
  expect(people.some(person => person.login.endsWith('[bot]'))).toBe(false);
  for (const [index, person] of people.entries()) {
    const entry = entries.nth(index);
    await expect(entry).toContainText(person.name);
    await expect(entry).toContainText(
      `${person.commits.toLocaleString('en')} commit`
    );
    await expect(entry.locator('img')).toHaveAttribute('src', /^\//);
  }
  const creator = entries.filter({ hasText: 'creator' });
  await expect(creator).toHaveCount(1);
  await expect(creator).toContainText('Gion Kunz');
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
