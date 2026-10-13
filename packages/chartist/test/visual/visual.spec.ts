/**
 * One screenshot test per example and viewport of @chartist/examples.
 *
 * Settling (design D7 of add-visual-regression-harness):
 * 1. The page clock is installed and paused before the page loads, so no
 *    timer fires on its own (chart initialization, the delayed starts of
 *    guided SMIL animations, the chart.update() timers of animated examples).
 * 2. The clock runs 1 ms, which initializes the chart, and the font loads.
 * 3. The SVG timeline is paused at its current time `start`. The page clock
 *    then runs to `settle.at`. A timer that starts an animation with
 *    `beginElement()` at clock time t starts it at `start + t` on the paused
 *    SVG timeline instead (`beginElementAt`), as in a real playback.
 * 4. The SVG timeline is seeked to `start + settle.at`, and `#chart` is
 *    screenshot and compared with the baseline.
 */
import { expect, test, type Page } from '@playwright/test';
import { examples, viewportSizes } from '@chartist/examples';

const FIXED_TIME = new Date('2026-01-01T00:00:00Z');
const FONT = '12px "Chartist Visual Test"';

declare global {
  interface Window {
    /** Page clock time (ms) when the SVG timeline was paused. */
    __visualSettleStart?: number;
  }
}

/**
 * Init script: while settling, `beginElement()` starts the animation at the
 * SVG time matching the page clock instead of the (paused) current SVG time.
 */
function deferBeginElement() {
  const beginElement = SVGAnimationElement.prototype.beginElement;
  SVGAnimationElement.prototype.beginElement = function () {
    if (window.__visualSettleStart === undefined) {
      return beginElement.call(this);
    }
    return this.beginElementAt(
      (Date.now() - window.__visualSettleStart) / 1000
    );
  };
}

/** Pauses the SVG timeline and returns its time in seconds. */
function pauseSvg(page: Page) {
  return page.evaluate(() => {
    const svg = document.querySelector<SVGSVGElement>('#chart svg');
    if (!svg) {
      throw new Error('No chart SVG');
    }
    svg.pauseAnimations();
    window.__visualSettleStart = Date.now();
    return svg.getCurrentTime();
  });
}

/** Seeks the paused SVG timeline of the chart. */
function seekSvg(page: Page, seconds: number) {
  return page.evaluate(time => {
    const svg = document.querySelector<SVGSVGElement>('#chart svg');
    svg?.pauseAnimations();
    svg?.setCurrentTime(time);
  }, seconds);
}

for (const example of examples) {
  for (const viewport of example.viewports) {
    test(`${example.id} @ ${viewport}`, async ({ page }) => {
      const problems: string[] = [];
      page.on('pageerror', error => problems.push(`page error: ${error}`));
      page.on('console', message => {
        if (message.type() === 'error' || message.type() === 'warning') {
          problems.push(`console ${message.type()}: ${message.text()}`);
        }
      });
      // Offline: only the harness server may be reached.
      await page.route(
        url => url.hostname !== 'localhost',
        route => {
          problems.push(`network request: ${route.request().url()}`);
          return route.abort();
        }
      );

      await page.setViewportSize(viewportSizes[viewport]);
      await page.addInitScript(deferBeginElement);
      await page.clock.install({ time: FIXED_TIME });
      await page.clock.pauseAt(FIXED_TIME);
      await page.goto(`/${example.folder}/`);

      await page.clock.runFor(1);
      await page.locator('#chart svg').first().waitFor();
      await page.evaluate(async font => {
        await document.fonts.load(font);
        await document.fonts.ready;
      }, FONT);
      expect(
        await page.evaluate(font => document.fonts.check(font), FONT),
        'test font loaded'
      ).toBe(true);

      const start = await pauseSvg(page);
      if (example.settle.at > 0) {
        await page.clock.runFor(example.settle.at);
      }
      await seekSvg(page, start + example.settle.at / 1000);

      await expect(page.locator('#chart')).toHaveScreenshot([
        example.type,
        `${example.folder.split('/')[1]}--${viewport}.png`
      ]);
      expect(problems, 'errors, warnings or network requests').toEqual([]);
    });
  }
}
