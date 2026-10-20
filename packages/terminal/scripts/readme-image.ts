/**
 * Writes assets/readme.png, the chart at the top of the README: a chart
 * composed from Chartist's layers, with a plugin, as HTML text art in a
 * terminal window, taken with Playwright at twice the size. A picture, because GitHub and npm draw the
 * braille dots and box lines of a text block in whatever font they have,
 * and most of those leave gaps. `pnpm nx readme-image terminal` builds the
 * package and runs it.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import {
  autoScaleAxis,
  axisGrid,
  axisLabels,
  band,
  cartesianAxes,
  line,
  node,
  stepAxis,
  toScene,
  type ChartPlugin
} from 'chartist';
import { targetLine } from '@chartist-js/essentials';
import { legend, renderToHtml, terminalSize } from '../src/index.ts';

const root = new URL('../../../', import.meta.url);
// Playwright and the label font are dev dependencies of other projects;
// typed here as far as this script uses them.
interface Page {
  setContent(html: string): Promise<void>;
  evaluate(expression: string): Promise<unknown>;
  locator(selector: string): {
    screenshot(options: {
      path: string;
      omitBackground: boolean;
    }): Promise<unknown>;
  };
}
const { chromium } = createRequire(
  new URL('packages/chartist/package.json', root)
)('@playwright/test') as {
  chromium: {
    launch(): Promise<{
      newPage(options: { deviceScaleFactor: number }): Promise<Page>;
      close(): Promise<void>;
    }>;
  };
};
const mono = readFileSync(
  createRequire(new URL('apps/docs/package.json', root)).resolve(
    '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2'
  )
).toString('base64');
const styles = readFileSync(new URL('../dist/styles.css', import.meta.url));

const columns = 72;
const hours = [
  '00',
  '02',
  '04',
  '06',
  '08',
  '10',
  '12',
  '14',
  '16',
  '18',
  '20',
  '22'
];
const slo = 200;

// Response times over a day: the median as a line, the 10th to 90th
// percentile as a band, and the target as a line of its own.
const median = [118, 112, 108, 126, 168, 214, 246, 224, 188, 166, 142, 128];
const p10 = median.map(value => Math.round(value * 0.72));
const p90 = median.map(value => Math.round(value * 1.38));

// A plugin: keeps a point where the median is over the target, in the
// third series' color, and drops the other points.
const overTarget = (target: number): ChartPlugin => ({
  name: 'over-target',
  install(chart) {
    chart.on('compose', current => {
      if (current.role !== 'point') {
        return;
      }
      const { x, y, value } = current.ctx;
      const over =
        value && typeof value === 'object' && 'y' in value
          ? (value.y ?? 0) > target
          : false;
      return over
        ? node('circle', { cx: x, cy: y, r: 6 }, 'ct-series-c', {
            role: current.role,
            ctx: current.ctx,
            key: current.key
          })
        : null;
    });
  }
});

const scene = toScene(
  {
    data: {
      labels: hours.map(hour => `${hour}:00`),
      series: [{ name: 'median', data: median }]
    },
    axes: cartesianAxes({
      x: {
        type: stepAxis(),
        // Every other hour: a tick without a label has no grid line either.
        labelTransform: (value, index) => (index % 2 ? null : value)
      },
      y: {
        type: autoScaleAxis(),
        low: 0,
        scaleMinSpace: 40,
        labelTransform: value => `${value}ms`
      }
    }),
    layers: [
      axisGrid({ axes: ['y'] }),
      band({ low: p10, high: p90, className: 'ct-series-b' }),
      line({ series: ['median'] }),
      targetLine({ value: slo, label: 'SLO', labelPosition: 'start' }),
      axisLabels()
    ],
    plugins: [overTarget(slo)]
  },
  terminalSize(columns, 19)
);
const chart = renderToHtml(scene);
const key = legend(
  {
    series: [
      { name: 'median' },
      { name: 'p10 to p90' },
      { name: `over the ${slo}ms SLO` }
    ]
  },
  { columns, format: 'html' }
);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
@font-face {
  font-family: 'JetBrains Mono';
  src: url(data:font/woff2;base64,${mono}) format('woff2');
  font-weight: 100 800;
}
${styles}
body { margin: 0; background: transparent; }
.frame { display: inline-block; padding: 24px; }
.window {
  width: fit-content;
  border-radius: 10px;
  overflow: hidden;
  background: #1c1718;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06) inset, 0 8px 20px rgba(0, 0, 0, 0.3);
}
.title-bar { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #2b2426; }
.dot { width: 12px; height: 12px; border-radius: 50%; background: #ff5f57; }
.dot:nth-child(2) { background: #febc2e; }
.dot:nth-child(3) { background: #28c840; }
.title { flex: 1; margin-right: 52px; text-align: center; color: #a99a92; font: 600 12px system-ui, sans-serif; }
.screen {
  padding: 16px;
  color: #f3eadb;
  font: 500 13px 'JetBrains Mono', monospace;
  --ct-label-color: rgb(243 234 219 / 0.7);
  --ct-grid-color: rgb(243 234 219 / 0.16);
}
.screen .ct-terminal { margin: 0; font-size: 13px; font-weight: 700; }
.screen .ct-area { opacity: 0.75; }
.screen .ct-terminal + .ct-terminal { margin-top: 12px; }
</style>
</head>
<body>
<div class="frame"><div class="window">
  <div class="title-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="title">node latency.ts</span></div>
  <div class="screen">
    ${chart}
    ${key}
  </div>
</div></div>
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
await page.setContent(html);
await page.evaluate('document.fonts.ready');
await page.locator('.frame').screenshot({
  path: new URL('../assets/readme.png', import.meta.url).pathname,
  omitBackground: true
});
await browser.close();
