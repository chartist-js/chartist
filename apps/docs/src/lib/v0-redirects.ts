/**
 * The redirects for the 0.x URLs. The 0.x docs were served at
 * https://gionkunz.github.io/chartist-js/ until the v2 site; their copy now
 * lives under `/v0/` (public/v0/), and the old site gets a redirect page per
 * page (scripts/v0-redirects.ts writes them).
 *
 * A URL without a `#hash` goes to the page's v2 counterpart. A `#hash` in
 * the page's anchor table goes to the v2 page that covers that section;
 * any other `#hash` goes to the same page and hash under `/v0/`, so an old
 * deep link always lands on the content it pointed to. Targets are paths
 * below the site root.
 */
import { redirectHtml } from '../../integrations/redirects.mjs';

/** A page of the 0.x site and where its links go. */
export interface V0Page {
  /** The page's file on the 0.x site, e.g. `getting-started.html`. */
  readonly file: string;
  /** Where the page goes without a `#hash`. */
  readonly target: string;
  /** Where an anchor of the page goes, by its id. */
  readonly anchors: Readonly<Record<string, string>>;
}

/** The same target for each of `ids`. */
const each = (ids: readonly string[], target: string) =>
  Object.fromEntries(ids.map(id => [id, target]));

const example = (path: string) => `examples/${path}/`;

export const V0_PAGES: readonly V0Page[] = [
  {
    file: 'index.html',
    target: '',
    anchors: {
      ...each(
        [
          'responsive-charts-configuration',
          'configuration-overrides-based-on-media-queries'
        ],
        'docs/responsive/'
      ),
      'example-line-simple-responsive': example('line/simple-responsive'),
      'example-line-svg-animation': example('line/svg-animation'),
      'chart-css-animation-example': 'docs/animations/',
      'crazy-animations-with-smil':
        'docs/animations/#smil-for-what-css-cant-animate'
    }
  },
  {
    file: 'getting-started.html',
    target: 'docs/getting-started/',
    anchors: {
      ...each(
        [
          'download-and-setup',
          'bower',
          'one-two-three-css',
          'simple-start',
          'use-a-cdn-alternatively',
          'simple-start-cdn',
          'create-your-first-chart',
          'as-simple-as-it-can-get'
        ],
        'docs/getting-started/'
      ),
      ...each(
        [
          'the-sass-way',
          'custom-include',
          'default-settings',
          'default-sass-settings'
        ],
        'docs/styling-with-css/#sass'
      ),
      ...each(
        [
          'creating-a-chart-using-aspect-ratios',
          'container-aspect-ratio-classes',
          'simple-start-aspect-ratio-chart'
        ],
        'docs/sizing-charts/#aspect-ratios'
      ),
      ...each(
        ['creating-a-chart-with-fixed-dimensions', 'simple-start-fixed-chart'],
        'docs/sizing-charts/#fixed-sizes'
      ),
      ...each(
        ['more-than-one-chart-on-my-page', 'two-charts'],
        'docs/sizing-charts/#more-than-one-chart-on-a-page'
      ),
      ...each(
        ['the-configuration-of-your-chart', 'simple-configuration-chart'],
        'docs/data-and-options/#the-options-argument'
      ),
      ...each(
        [
          'responsive-sugar-topping',
          'responsive-setting-overrides',
          'example-simple-bar'
        ],
        'docs/responsive/'
      ),
      ...each(
        [
          'different-configuration-for-different-series',
          'example-line-series-override'
        ],
        'docs/data-and-options/#options-per-series'
      ),
      ...each(
        [
          'styling-your-chart',
          'customizing-the-default-css',
          'line-chart',
          'custom-style-line-chart',
          'bar-chart',
          'custom-style-bar-chart',
          'pie-chart',
          'custom-style-pie-chart',
          'donut-chart',
          'custom-style-donut-chart'
        ],
        'docs/styling-with-css/'
      ),
      ...each(
        ['colour-up-your-charts', 'colour-override-line-chart'],
        'docs/styling-with-css/#one-color-per-series'
      ),
      ...each(
        ['dynamic-colouring', 'example-dynamic-colours'],
        'docs/events-and-plugins/#dynamic-coloring'
      ),
      ...each(
        ['animations-using-chartistsvg', 'example-simple-svg-animation'],
        'docs/animations/'
      ),
      ...each(
        [
          'switching-axis-type',
          'creating-an-xyplot-chart',
          'example-axis-auto'
        ],
        'docs/axes-and-scales/'
      ),
      ...each(
        [
          'a-line-chart-is-only-1dimensional',
          '1-dimension-values',
          '2-dimensions-values'
        ],
        'docs/axes-and-scales/#a-line-chart-is-only-1-dimensional'
      ),
      ...each(
        ['fixed-stuff-can-be-sweet-too', 'example-axis-fixed-and-auto'],
        'docs/axes-and-scales/#fixed-stuff-can-be-sweet-too'
      )
    }
  },
  {
    file: 'examples.html',
    target: 'examples/',
    anchors: {
      'line-chart-examples': 'examples/#line',
      'bar-chart-examples': 'examples/#bar',
      'pie-chart-examples': 'examples/#pie',
      'simple-line-chart': example('line/simple'),
      'example-line-data-holes': example('line/data-holes'),
      'example-line-data-fill-holes': example('line/data-fill-holes'),
      'example-line-only-integer': example('line/only-integer'),
      'line-scatter-random': example('line/scatter-random'),
      'example-line-area': example('line/area'),
      'example-bipolar-line-area': example('line/bipolar-area'),
      'example-line-modify-drawing': example('line/modify-drawing'),
      'example-line-svg-animation': example('line/svg-animation'),
      'example-line-path-animation': example('line/path-animation'),
      'example-line-simple-smoothing': example('line/simple-smoothing'),
      'example-line-series-override': example('line/series-override'),
      'example-timeseries-moment': example('line/timeseries'),
      'bi-polar-bar-interpolated': example('bar/bi-polar-interpolated'),
      'overlapping-bars': example('bar/overlapping-bars'),
      'example-bar-with-circle-modify-drawing': example(
        'bar/with-circle-modify-drawing'
      ),
      'example-multiline-bar': example('bar/multiline'),
      'stacked-bar': example('bar/stacked'),
      'example-bar-horizontal': example('bar/horizontal'),
      'example-bar-extreme-responsive': example('bar/extreme-responsive'),
      'example-bar-distributed-series': example('bar/distributed-series'),
      'example-bar-label-position': example('bar/label-position'),
      'simple-pie-chart': example('pie/simple'),
      'pie-with-custom-labels': example('pie/custom-labels'),
      'simple-gauge-chart': example('pie/simple-gauge'),
      'example-donut-animation': example('pie/donut-animation'),
      'example-donut-solid-chart': example('pie/donut-chart'),
      'example-gauge-donut-solid-chart': example('pie/simple-gauge')
    }
  },
  {
    // The 0.x API (`Chartist.Core`, `Chartist.Svg`, …) has no v2
    // counterpart, so its anchors stay in the archive.
    file: 'api-documentation.html',
    target: 'api/',
    anchors: {}
  },
  {
    file: 'plugins.html',
    target: 'plugins/',
    anchors: {
      ...each(
        [
          'overview',
          'whats-a-plugin',
          'how-to-use-plugins',
          'plugin-include',
          'available-plugins'
        ],
        'plugins/'
      ),
      ...each(
        ['accessibility-plugin', 'example-plugin-accessibility'],
        'plugins/chartist-plugin-accessibility/'
      ),
      ...each(
        ['tooltip-plugin', 'example-plugin-tooltip'],
        'plugins/chartist-plugin-tooltips/'
      ),
      ...each(
        ['point-label-plugin', 'example-plugin-pointlabel'],
        'plugins/chartist-plugin-pointlabels/'
      ),
      ...each(
        ['axis-title-plugin', 'example-plugin-axistitle'],
        'plugins/chartist-plugin-axistitle/'
      ),
      ...each(
        ['threshold-plugin', 'example-plugin-threshold'],
        'plugins/chartist-plugin-threshold/'
      ),
      ...each(
        ['filldonut-plugin', 'example-plugin-fill-donut'],
        'plugins/chartist-plugin-fill-donut/'
      ),
      ...each(
        ['zoom-plugin', 'example-plugin-zoom'],
        'plugins/chartist-plugin-zoom/'
      ),
      // The core's target lines replace the plugin.
      ...each(
        ['target-line-plugin', 'example-plugin-targetline'],
        'docs/target-lines-and-bands/'
      ),
      ...each(
        [
          'develop-a-plugin',
          'plugin-signature',
          'example-plugin',
          'plugin-example'
        ],
        'docs/events-and-plugins/#writing-a-plugin'
      )
    }
  },
  {
    // A JSDoc page that only showed the README.
    file: 'apidoc/index.html',
    target: 'api/',
    anchors: {}
  }
];

/** Where the archived copy of a 0.x page is, below the site root. */
export const archivePath = (page: V0Page) =>
  `v0/${page.file.replace(/(^|\/)index\.html$/, '$1')}`;

/**
 * Where a link to `page` with `hash` (without `#`) goes, below the site
 * root. A hash ending in `-code` (a live example's code) counts as the
 * hash it belongs to.
 */
export function v0Target(page: V0Page, hash = ''): string {
  if (!hash) {
    return page.target;
  }
  const own = Object.hasOwn(page.anchors, hash)
    ? hash
    : hash.replace(/-code$/, '');
  return Object.hasOwn(page.anchors, own)
    ? page.anchors[own]
    : `${archivePath(page)}#${hash}`;
}

/** Every target of `page` without its hash, and with it. */
export const v0Targets = (page: V0Page) => [
  page.target,
  ...new Set(Object.values(page.anchors))
];

/**
 * The redirect page that replaces `page` on the old site; `site` is the
 * current site's origin, e.g. `https://chartist.dev`.
 */
export function v0RedirectPage(page: V0Page, site: string): string {
  const url = (path: string) => new URL(path, `${site}/`).href;
  return redirectHtml(url(page.target), {
    title: 'Chartist moved to chartist.dev',
    text: 'The Chartist docs moved to',
    anchors: {
      table: Object.fromEntries(
        Object.entries(page.anchors).map(([id, path]) => [id, url(path)])
      ),
      fallback: url(archivePath(page))
    },
    noindex: false
  });
}

/**
 * The old site's 404 page: any other path below `/chartist-js/` goes to
 * the same path in the archive. GitHub Pages answers it with status 404,
 * so it's for people only; every page has its own redirect.
 */
export function v0NotFoundPage(site: string): string {
  const archive = new URL('v0/', `${site}/`).href;
  const json = JSON.stringify(archive).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Chartist moved to chartist.dev</title>
<meta name="robots" content="noindex">
<script>location.replace(${json} + location.pathname.replace(/^\\/chartist-js\\/?/, '') + location.search + location.hash);</script>
</head>
<body>
<p>The Chartist docs moved to <a href="${archive}">${archive}</a>.</p>
</body>
</html>
`;
}
