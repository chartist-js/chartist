import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { SECTIONS } from '../src/data/landing';
import { NEWS, NEWS_ROWS } from '../src/data/news';

const facts = JSON.parse(
  await readFile(new URL('../src/data/facts.json', import.meta.url), 'utf8')
) as {
  generatedAt: string;
  github: { contributors: number };
  usedBy: { name: string; evidence: string }[];
};

test('every section renders and no placeholder reaches the page', async ({
  page
}) => {
  await page.goto('/');
  for (const { id } of SECTIONS) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
  const text = await page.locator('body').innerText();
  for (const placeholder of [
    '[N]',
    '[MEASURED]',
    '[DATE]',
    '[LOGO',
    '[LICENSE]'
  ]) {
    expect(text).not.toContain(placeholder);
  }
});

test('numbers and "Used by" come from the facts snapshot', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#start').locator('..')).toBeAttached();
  await expect(
    page.getByText(`${facts.github.contributors} contributors`)
  ).toBeVisible();
  const date = new Date(`${facts.generatedAt}T00:00:00Z`).toLocaleDateString(
    'en',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    }
  );
  await expect(page.getByText(`From npm and GitHub · ${date}`)).toBeVisible();
  for (const entry of facts.usedBy) {
    await expect(
      page.locator(`.used-by a[href="${entry.evidence}"]`)
    ).toContainText(entry.name);
  }
});

test('the story switches the easel chart per chapter', async ({ page }) => {
  await page.goto('/');
  await page.locator('#chapter-2').scrollIntoViewIfNeeded();
  await page
    .locator('#chapter-2 h3')
    .evaluate(el => el.scrollIntoView({ block: 'center' }));
  const bars = page.locator('[data-stage-scene="bars"]');
  await expect(bars).toHaveAttribute('data-active', '');
  await expect(bars.locator('svg.ct-chart-bar')).toHaveCount(1);

  await page.getByRole('button', { name: 'Donuts, pies and gauges' }).click();
  const donut = page.locator('[data-stage-scene="donut"]');
  await expect(donut).toHaveAttribute('data-active', '');
  await expect(donut.locator('svg.ct-chart-donut')).toHaveCount(1);
  await expect(page.locator('[data-caption]')).toHaveText(
    'Donuts, pies and gauges'
  );
});

test('the plugin chips change the chart', async ({ page }) => {
  await page.goto('/');
  const chart = page.locator('[data-plugin-chart]');
  await chart.scrollIntoViewIfNeeded();
  await expect(chart.locator('.ct-lollipop')).toHaveCount(7);
  await expect(chart.locator('.ct-value-label')).toHaveCount(7);
  await page.getByRole('button', { name: 'lollipop()' }).click();
  await expect(chart.locator('.ct-lollipop')).toHaveCount(0);
  await page.getByRole('button', { name: 'threshold(7)' }).click();
  // Thu (8) and Sat (9) are at or above 7.
  await expect(
    chart.locator('line.ct-bar[style*="--ct-series-g"]')
  ).toHaveCount(2);
  await expect(page.locator('[data-plugin-usage]')).toContainText(
    'valueLabels(), threshold(7)'
  );
});

test('the live example re-renders after an edit', async ({ page }) => {
  await page.goto('/');
  const live = page.locator('#try [data-live-example]');
  await live.scrollIntoViewIfNeeded();
  await live.getByRole('button', { name: 'Edit' }).click();
  await expect(live).toHaveAttribute('data-ready', '');
  const frame = live.frameLocator('iframe');
  await expect(frame.locator('svg.ct-chart-line')).toHaveCount(1);

  await live.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(
    "import 'chartist/styles.css';\nimport { lineChart } from 'chartist';\nlineChart('#chart', { labels: ['Edited', 'B'], series: [[1, 2]] });\n"
  );
  await expect(frame.getByText('Edited')).toBeVisible({ timeout: 10_000 });

  await live.getByRole('button', { name: 'Reset' }).click();
  await expect(frame.getByText('Mon')).toBeVisible({ timeout: 10_000 });
});

test('the responsive demo follows its container width', async ({ page }) => {
  await page.goto('/');
  const range = page.locator('[data-width-range]');
  await range.scrollIntoViewIfNeeded();
  const chart = page.locator('[data-responsive-chart]');
  await expect(chart.locator('.ct-label', { hasText: 'Jan' })).toHaveCount(1);
  await range.fill('300');
  await expect(page.locator('[data-rule]')).toHaveText(
    'container(width < 360px)'
  );
  await expect(chart.locator('.ct-label', { hasText: 'Q1' })).toHaveCount(1);
  await range.fill('420');
  await expect(page.locator('[data-rule]')).toHaveText(
    'container(360px ≤ width < 520px)'
  );
});

test('reduced motion: nothing runs, the SMIL morph is static', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('.smil.static-only').scrollIntoViewIfNeeded();
  await expect(page.locator('.smil.static-only')).toBeVisible();
  await expect(page.locator('.smil.motion-only')).toBeHidden();
  // Reduced motion shortens transitions to 1ms rather than removing them
  // (motion.css), so one may be mid-flight while the page settles: poll.
  // Named, so a failure says which animation still runs.
  const running = () =>
    page.evaluate(() =>
      document
        .getAnimations()
        .filter(animation => animation.playState === 'running')
        .map(animation => {
          const target = (animation.effect as KeyframeEffect | null)?.target;
          const name =
            'animationName' in animation
              ? animation.animationName
              : 'transitionProperty' in animation
                ? `transition ${animation.transitionProperty}`
                : animation.id;
          return `${target?.className ?? '?'}: ${String(name)}`;
        })
    );
  await expect.poll(running).toEqual([]);
});

test('with motion: scroll timelines run, the SMIL morph animates', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  // The minifier must not fold animation-timeline into the shorthand.
  const progress = page.locator('.scroll-progress');
  await expect
    .poll(() => progress.evaluate(element => element.getAnimations().length))
    .toBe(1);
  const reveals = await page
    .locator('.reveal')
    .evaluateAll(elements =>
      elements.every(element => element.getAnimations().length > 0)
    );
  expect(reveals).toBe(true);
  await page.locator('.smil.motion-only').scrollIntoViewIfNeeded();
  await expect(page.locator('.smil.motion-only')).toBeVisible();
  await expect(page.locator('.smil.static-only')).toBeHidden();
});

test('the story code samples run against the current build', async ({
  page
}) => {
  await page.goto('/');
  const samples = await page.locator('[data-sample] pre code').allInnerTexts();
  expect(samples.length).toBe(4);
  const dist = fileURLToPath(
    new URL('../../../packages/chartist/dist/', import.meta.url)
  );
  await page.route('https://sample.test/chartist.js', async route =>
    route.fulfill({
      body: await readFile(`${dist}index.min.js`),
      contentType: 'text/javascript'
    })
  );
  for (const code of samples) {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.route('https://sample.test/', route =>
      route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html><script type="importmap">{"imports":{"chartist":"https://sample.test/chartist.js"}}</script>
          <div id="chart" style="width:600px;height:300px"></div>
          <script type="module">${code.replace("import 'chartist/styles.css';", '')}</script>`
      })
    );
    await page.goto('https://sample.test/');
    await expect(page.locator('#chart svg')).toHaveCount(1);
    expect(errors).toEqual([]);
    await page.unroute('https://sample.test/');
  }
});

test('the packages section draws one chart as SVG and as text art', async ({
  page
}) => {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'On this page' })
    .getByRole('link', { name: /Packages/ })
    .click();
  await expect(page).toHaveURL(/#packages$/);
  const section = page.locator('#packages');
  await expect(section.locator('.ct-line').first()).toBeVisible();
  await expect(section.locator('pre.ct-terminal:visible')).toHaveCount(1);
  await expect(page.locator('[data-chapter-link="packages"]')).toHaveAttribute(
    'aria-current',
    'true'
  );
  await expect(
    section.getByRole('link', { name: 'All packages' })
  ).toHaveAttribute('href', '/packages/');
});

test('the news rows link to their announcements', async ({ page }) => {
  await page.goto('/');
  const news = page.getByRole('complementary', { name: 'News' });
  await expect(news.getByRole('link')).toHaveCount(
    Math.min(NEWS.length, NEWS_ROWS)
  );
  await expect(
    news.getByRole('link', { name: /@chartist-js\/terminal/ })
  ).toHaveAttribute('href', '/packages/terminal/');
});
