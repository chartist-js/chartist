import { expect, test } from '@playwright/test';
import { examples } from '@chartist/examples';

const docsExamples = examples.filter(example => example.docs);

test('the gallery lists every docs example and each thumbnail runs', async ({
  page
}) => {
  await page.goto('/examples/');
  const stages = page.locator('[data-gallery-preview]');
  await expect(stages).toHaveCount(docsExamples.length);
  for (const stage of await stages.all()) {
    await stage.scrollIntoViewIfNeeded();
    // Any visible chart: some examples also hold zero-size svgs.
    await expect(
      stage
        .frameLocator('iframe')
        .locator('svg')
        .filter({ visible: true })
        .first()
    ).toBeVisible({ timeout: 15_000 });
  }
});

test('the type filter shows one type and can be undone', async ({ page }) => {
  await page.goto('/examples/');
  await page.getByRole('button', { name: 'Bar charts' }).click();
  await expect(page.locator('[data-group="bar"]')).toBeVisible();
  await expect(page.locator('[data-group="line"]')).toBeHidden();
  await page.getByRole('button', { name: 'All' }).click();
  await expect(page.locator('[data-group="line"]')).toBeVisible();
});

test('an example page shows the functional code and the 1.x code', async ({
  page
}) => {
  await page.goto('/examples/line/modify-drawing/');
  const live = page.locator('[data-live-example]');
  await expect(live.locator('[data-live-panel="main"]')).toContainText(
    'lineChart('
  );
  await live.getByRole('tab', { name: '1.x classes' }).click();
  await expect(live.locator('[data-live-panel="classic"]')).toContainText(
    'new LineChart('
  );
  await expect(live.locator('[data-live-panel="main"]')).toBeHidden();
});

test('the playground opens an example, follows edits and reopens them', async ({
  page
}) => {
  await page.goto('/playground/#example=line/simple');
  const frame = page.frameLocator('iframe.playground-preview');
  await expect(frame.locator('svg.ct-chart-line')).toBeVisible({
    timeout: 15_000
  });
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.insertText('\n// shared edit\n');
  await expect(page).toHaveURL(/#code=1\./, { timeout: 5_000 });
  const shared = page.url();

  const other = await page.context().newPage();
  await other.goto(shared);
  await expect(other.locator('.cm-content')).toContainText('// shared edit');
  await expect(
    other.frameLocator('iframe.playground-preview').locator('svg.ct-chart-line')
  ).toBeVisible({ timeout: 15_000 });
});

test('a broken code address says so and opens a blank chart', async ({
  page
}) => {
  await page.goto('/playground/#code=1.not-a-real-payload');
  await expect(page.getByRole('alert')).toContainText('blank chart');
  await expect(
    page.frameLocator('iframe.playground-preview').locator('svg.ct-chart-line')
  ).toBeVisible({ timeout: 15_000 });
});
