/**
 * Records the README's animated Chartist Guy (docs/assets/chartist-guy.gif)
 * from the landing page's hero: the board chart drawing in, the marching
 * line, a tap and a blink. The animations are paused and stepped frame by
 * frame, so every frame is exact.
 *
 * Needs a built site served locally and ImageMagick (`convert`):
 *
 *   pnpm nx build docs
 *   PORT=4352 node apps/docs/e2e/serve.mjs &
 *   node tools/readme-gif.mjs http://127.0.0.1:4352/
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(
  new URL('../packages/chartist/package.json', import.meta.url)
);
const { chromium } = require('@playwright/test');

const url = process.argv[2] ?? 'http://127.0.0.1:4352/';
const FPS = 12.5;
const SECONDS = 6;
const frames = mkdtempSync(join(tmpdir(), 'chartist-gif-'));

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2
});
await page.goto(url);
await page.waitForSelector('#top [data-board-chart] svg');
const stage = page.locator('#top .mascot-stage');
for (let i = 0; i < FPS * SECONDS; i++) {
  await page.evaluate(
    time => {
      for (const animation of document.getAnimations()) {
        if (animation.effect?.target?.closest?.('#top')) {
          animation.pause();
          animation.currentTime = time;
        }
      }
    },
    (i * 1000) / FPS
  );
  await stage.screenshot({
    path: join(frames, `f${String(i).padStart(3, '0')}.png`)
  });
}
await browser.close();

// 8 hundredths of a second per frame is 12.5 frames per second. The flat
// illustration needs no more than 64 colors.
execFileSync('convert', [
  '-delay',
  '8',
  '-loop',
  '0',
  join(frames, 'f*.png'),
  '-resize',
  '480x',
  '-dither',
  'None',
  '-colors',
  '64',
  '-layers',
  'Optimize',
  new URL('../docs/assets/chartist-guy.gif', import.meta.url).pathname
]);
rmSync(frames, { recursive: true });
