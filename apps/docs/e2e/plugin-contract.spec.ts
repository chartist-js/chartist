/**
 * The community plugins of the plugins page, run on v2 with their own
 * published code, as the site serves it: with Chartist as modules (the
 * import of chartist/compat sets up the global the plugin scripts read)
 * and as the UMD build, each converted with `fromLegacyPlugin` on the
 * functional API and on the 1.x classes with compat. Each must draw what
 * it adds, without errors.
 */
import { expect, test, type Page } from '@playwright/test';

type Kind = 'line' | 'bar' | 'pie';

interface Case {
  package: string;
  kind: Kind;
  /** The plugin as a 1.x plugin: an expression over the global `Chartist`. */
  plugin: string;
  /** Extra options of the chart. */
  options?: string;
  stylesheet?: string;
  /** Interacts with the chart (hover, drag) before the check. */
  act?: (page: Page) => Promise<void>;
  check: (page: Page) => Promise<void>;
}

const LIB = '/playground-lib/';
const DATA: Record<Kind, string> = {
  line: `{ labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], series: [{ name: 'Visits', data: [{ meta: 'a', value: 2 }, { meta: 'b', value: 5 }, { meta: 'c', value: 3 }, { meta: 'd', value: 8 }, { meta: 'e', value: 6 }] }, { name: 'Sales', data: [1, 3, 4, 2, 7] }] }`,
  bar: `{ labels: ['Q1', 'Q2', 'Q3', 'Q4'], series: [[5, 4, 7, 8], [3, 2, 6, 4]] }`,
  pie: `{ series: [20, 10, 30, 40] }`
};
const hoverPoint = async (page: Page) => {
  const point = page.locator('#chart .ct-point').nth(1);
  const box = (await point.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
};
const tooltipShows = async (page: Page) =>
  expect(page.locator('.chartist-tooltip')).toContainText('b');

const CASES: Case[] = [
  {
    package: 'chartist-plugin-axistitle',
    kind: 'line',
    plugin: `Chartist.plugins.ctAxisTitle({ axisX: { axisTitle: 'Day', axisClass: 'ct-axis-title', offset: { x: 0, y: 50 }, textAnchor: 'middle' }, axisY: { axisTitle: 'Visits', axisClass: 'ct-axis-title', offset: { x: 0, y: -1 }, flipTitle: false } })`,
    check: page => expect(page.locator('#chart .ct-axis-title')).toHaveCount(2)
  },
  {
    package: 'chartist-plugin-legend',
    kind: 'line',
    plugin: 'Chartist.plugins.legend()',
    check: page => expect(page.locator('.ct-legend li')).toHaveCount(2)
  },
  {
    package: 'chartist-plugin-tooltips',
    kind: 'line',
    plugin: 'Chartist.plugins.tooltip()',
    stylesheet: 'chartist-plugin-tooltips/chartist-plugin-tooltip.css',
    act: hoverPoint,
    check: tooltipShows
  },
  {
    package: 'chartist-plugin-pointlabels',
    kind: 'line',
    plugin: 'Chartist.plugins.ctPointLabels()',
    check: page =>
      expect(page.locator('#chart .ct-series text.ct-label')).toHaveCount(10)
  },
  {
    package: 'chartist-hover',
    kind: 'line',
    plugin:
      'Chartist.plugins.hover({ onMouseEnter: () => { window.entered = true; } })',
    act: hoverPoint,
    check: page =>
      expect
        .poll(() =>
          page.evaluate(() => (window as { entered?: boolean }).entered)
        )
        .toBe(true)
  },
  {
    package: 'chartist-plugin-zoom',
    kind: 'line',
    plugin:
      'Chartist.plugins.zoom({ onZoom: () => { window.zoomed = true; } })',
    options: `axisX: { type: Chartist.AutoScaleAxis }, axisY: { type: Chartist.AutoScaleAxis }`,
    act: async page => {
      const box = (await page.locator('#chart svg').boundingBox())!;
      await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.7, {
        steps: 5
      });
      await page.mouse.up();
    },
    check: page =>
      expect
        .poll(() =>
          page.evaluate(() => (window as { zoomed?: boolean }).zoomed)
        )
        .toBe(true)
  },
  {
    package: 'chartist-plugin-fill-donut',
    kind: 'pie',
    plugin: `Chartist.plugins.fillDonut({ items: [{ content: '<b>Fill</b>' }] })`,
    options: 'donut: true',
    check: async page => {
      // A track behind each slice, and the HTML label.
      await expect(
        page.locator('#chart .ct-fill-donut').first()
      ).toBeAttached();
      await expect(page.locator('#chart .ct-fill-donut-label')).toContainText(
        'Fill'
      );
    }
  },
  {
    package: 'chartist-plugin-barlabels',
    kind: 'bar',
    plugin: 'Chartist.plugins.ctBarLabels()',
    check: page =>
      expect(page.locator('#chart .ct-series text.ct-label')).toHaveCount(8)
  },
  {
    package: 'chartist-plugin-accessibility',
    kind: 'line',
    plugin: `Chartist.plugins.ctAccessibility({ caption: 'Visits per day' })`,
    check: page =>
      expect(page.locator('table caption')).toHaveText('Visits per day')
  },
  {
    package: 'chartist-plugin-threshold',
    kind: 'line',
    plugin: 'Chartist.plugins.ctThreshold({ threshold: 4 })',
    check: async page => {
      await expect(
        page.locator('#chart .ct-threshold-above').first()
      ).toBeAttached();
      await expect(
        page.locator('#chart .ct-threshold-below').first()
      ).toBeAttached();
    }
  },
  {
    package: 'chartist-plugin-targetline',
    kind: 'line',
    plugin: 'Chartist.plugins.ctTargetLine({ value: 4 })',
    options: 'low: 0',
    check: page => expect(page.locator('#chart .ct-target-line')).toHaveCount(1)
  },
  {
    package: '@stklcode/chartist-plugin-tooltips',
    kind: 'line',
    plugin: 'window.ChartistPluginTooltip',
    stylesheet:
      '@stklcode/chartist-plugin-tooltips/chartist-plugin-tooltip.css',
    act: hoverPoint,
    check: tooltipShows
  }
];

const SCRIPTS: Record<string, string> = {
  'chartist-plugin-axistitle': 'chartist-plugin-axistitle.js',
  'chartist-plugin-legend': 'chartist-plugin-legend.js',
  'chartist-plugin-tooltips': 'chartist-plugin-tooltip.js',
  'chartist-plugin-pointlabels': 'chartist-plugin-pointlabels.js',
  'chartist-hover': 'chartist-hover.js',
  'chartist-plugin-zoom': 'chartist-plugin-zoom.js',
  'chartist-plugin-fill-donut': 'chartist-plugin-fill-donut.js',
  'chartist-plugin-barlabels': 'chartist-plugin-barlabels.js',
  'chartist-plugin-accessibility': 'chartist-plugin-accessibility.js',
  'chartist-plugin-threshold': 'chartist-plugin-threshold.js',
  'chartist-plugin-targetline': 'chartist-plugin-targetline.js',
  '@stklcode/chartist-plugin-tooltips': 'chartist-plugin-tooltip.umd.js'
};

/** How the page loads Chartist, the plugin, and how it creates the chart. */
const SETUPS = {
  // Modules: importing chartist/compat sets up the global; the deferred
  // plugin script runs after it.
  modules: (c: Case, api: 'functional' | 'classes') => `
<script type="module">import '${LIB}compat.js';</script>
<script defer src="${LIB}plugins/${c.package}/${SCRIPTS[c.package]}"></script>
<script type="module">
  import * as core from '${LIB}index.js';
  import { compat, fromLegacyPlugin } from '${LIB}compat.js';
  ${create(c, api, 'core', 'fromLegacyPlugin', 'compat')};
</script>`,
  // The UMD builds, as classic scripts.
  umd: (c: Case, api: 'functional' | 'classes') => `
<script src="${LIB}index.umd.js"></script>
<script src="${LIB}compat.umd.js"></script>
<script src="${LIB}plugins/${c.package}/${SCRIPTS[c.package]}"></script>
<script>${create(c, api, 'Chartist', 'Chartist.fromLegacyPlugin', 'Chartist.compat')};</script>`
};

function create(
  c: Case,
  api: 'functional' | 'classes',
  core: string,
  fromLegacyPlugin: string,
  compat: string
) {
  const options = c.options ? `${c.options}, ` : '';
  return api === 'functional'
    ? // 1.x plugins on v2's functional API.
      `${core}.${c.kind}Chart('#chart', ${DATA[c.kind]}, { ${options}plugins: [${fromLegacyPlugin}(${c.plugin})] })`
    : // The 1.x classes with compat.
      `new ${core}.${{ line: 'LineChart', bar: 'BarChart', pie: 'PieChart' }[c.kind]}('#chart', ${DATA[c.kind]}, { ${options}plugins: [${compat}, ${c.plugin}] })`;
}

for (const c of CASES) {
  for (const setup of ['modules', 'umd'] as const) {
    for (const api of ['functional', 'classes'] as const) {
      test(`${c.package} runs on v2 (${setup}, ${api})`, async ({
        page,
        baseURL
      }) => {
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(String(error)));
        // A page on the site's origin that loads the site's own copies.
        const url = new URL(`/__plugin-contract/`, baseURL).href;
        await page.route(url, route =>
          route.fulfill({
            contentType: 'text/html',
            body: `<!doctype html><html><head>
<link rel="stylesheet" href="${LIB}index.css">
${c.stylesheet ? `<link rel="stylesheet" href="${LIB}plugins/${c.stylesheet}">` : ''}
</head><body><div id="chart" style="width: 640px; height: 320px"></div>
${SETUPS[setup](c, api)}</body></html>`
          })
        );
        await page.goto(url);
        await expect(page.locator('#chart svg')).toBeVisible();
        await c.act?.(page);
        await c.check(page);
        expect(errors).toEqual([]);
      });
    }
  }
}

test('compat leaves a global of another Chartist copy alone', async ({
  page,
  baseURL
}) => {
  const warnings: string[] = [];
  page.on('console', message => {
    if (message.type() === 'warning') {
      warnings.push(message.text());
    }
  });
  const url = new URL(`/__plugin-contract/`, baseURL).href;
  await page.route(url, route =>
    route.fulfill({
      contentType: 'text/html',
      // The UMD core, then compat as a module: two copies of Chartist.
      body: `<!doctype html><script src="${LIB}index.umd.js"></script>
<script type="module">import '${LIB}compat.js'; window.done = true;</script>`
    })
  );
  await page.goto(url);
  await page.waitForFunction(() => (window as { done?: boolean }).done);
  expect(
    await page.evaluate(
      () => 'Line' in (window as { Chartist?: object }).Chartist!
    )
  ).toBe(false);
  expect(warnings.join('\n')).toContain('another copy of Chartist');
});

test('a plugin script loaded at runtime after importing compat, as with a bundler', async ({
  page,
  baseURL
}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(String(error)));
  const url = new URL(`/__plugin-contract/`, baseURL).href;
  await page.route(url, route =>
    route.fulfill({
      contentType: 'text/html',
      // The recipe of "Coming from 1.x", with the site's copies.
      body: `<!doctype html><div id="chart" style="width: 640px; height: 320px"></div>
<script type="module">
  import { lineChart } from '${LIB}index.js';
  import { fromLegacyPlugin } from '${LIB}compat.js';
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = Object.assign(document.createElement('script'), { src });
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Cannot load ' + src));
      document.head.append(script);
    });
  }
  await loadScript('${LIB}plugins/chartist-plugin-axistitle/chartist-plugin-axistitle.js');
  lineChart('#chart', { series: [[1, 3, 2, 4]] }, {
    plugins: [fromLegacyPlugin(Chartist.plugins.ctAxisTitle({ axisY: { axisTitle: 'Visits', axisClass: 'ct-axis-title' } }))]
  });
</script>`
    })
  );
  await page.goto(url);
  await expect(page.locator('#chart .ct-axis-title')).toHaveCount(1);
  expect(errors).toEqual([]);
});
