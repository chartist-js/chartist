/**
 * The comparison table. Every value carries its source; review the rows
 * when the facts snapshot is refreshed. Bundle sizes come from facts.json.
 */
export const LIBRARIES = [
  'chartist',
  'chartjs',
  'apexcharts',
  'highcharts'
] as const;
export type Library = (typeof LIBRARIES)[number];

export const NAMES: Record<Library, string> = {
  chartist: 'Chartist',
  chartjs: 'Chart.js',
  apexcharts: 'ApexCharts',
  highcharts: 'Highcharts'
};

export interface Cell {
  value: string;
  /** Good for the reader's choice in this row (shown with a check). */
  good?: boolean;
  source: string;
}

export interface Row {
  label: string;
  hint?: string;
  cells: Record<Library, Cell>;
}

const CHARTIST_DOCS = 'https://github.com/chartist-js/chartist';

export const ROWS: Row[] = [
  {
    label: 'Rendering',
    cells: {
      chartist: { value: 'SVG', good: true, source: CHARTIST_DOCS },
      chartjs: {
        value: 'Canvas',
        source: 'https://github.com/chartjs/Chart.js'
      },
      apexcharts: {
        value: 'SVG (canvas renderer opt-in)',
        good: true,
        source: 'https://apexcharts.com/docs/installation/'
      },
      highcharts: {
        value: 'SVG',
        good: true,
        source:
          'https://www.highcharts.com/docs/chart-design-and-style/style-by-css'
      }
    }
  },
  {
    label: 'Styling with CSS',
    hint: 'colors, lines and text from your stylesheet',
    cells: {
      chartist: {
        value: 'Yes, classes and custom properties',
        good: true,
        source: CHARTIST_DOCS
      },
      chartjs: {
        value: 'No, options in JavaScript (canvas)',
        source: 'https://github.com/chartjs/Chart.js'
      },
      apexcharts: {
        value: 'Mostly options in JavaScript',
        source: 'https://apexcharts.com/docs/installation/'
      },
      highcharts: {
        value: 'Yes, in styled mode',
        good: true,
        source:
          'https://www.highcharts.com/docs/chart-design-and-style/style-by-css'
      }
    }
  },
  {
    label: 'No build step',
    hint: 'load it from a CDN in a plain HTML page',
    cells: {
      chartist: {
        value: 'Yes, native ES module',
        good: true,
        source: CHARTIST_DOCS
      },
      chartjs: {
        value: 'Yes, script tag',
        good: true,
        source: 'https://www.chartjs.org/docs/latest/getting-started/'
      },
      apexcharts: {
        value: 'Yes, script tag',
        good: true,
        source: 'https://apexcharts.com/docs/installation/'
      },
      highcharts: {
        value: 'Yes, script tag',
        good: true,
        source: 'https://www.highcharts.com/docs/getting-started/installation'
      }
    }
  },
  {
    label: 'Server-side rendering',
    cells: {
      chartist: {
        value: 'Yes, to an SVG string, no DOM',
        good: true,
        source: CHARTIST_DOCS
      },
      chartjs: {
        value: 'Not built in',
        source: 'https://github.com/chartjs/Chart.js'
      },
      apexcharts: {
        value: 'Yes, apexcharts/ssr',
        good: true,
        source: 'https://apexcharts.com/docs/installation/'
      },
      highcharts: {
        value: 'Yes, export server (headless browser)',
        good: true,
        source:
          'https://www.highcharts.com/docs/export-module/setting-up-the-server'
      }
    }
  },
  {
    label: 'TypeScript types',
    cells: {
      chartist: {
        value: 'Yes, written in TypeScript',
        good: true,
        source: CHARTIST_DOCS
      },
      chartjs: {
        value: 'Yes, bundled',
        good: true,
        source: 'https://www.npmjs.com/package/chart.js'
      },
      apexcharts: {
        value: 'Yes, bundled',
        good: true,
        source: 'https://www.npmjs.com/package/apexcharts'
      },
      highcharts: {
        value: 'Yes, bundled',
        good: true,
        source: 'https://www.highcharts.com/docs/getting-started/installation'
      }
    }
  },
  {
    label: 'License for commercial use',
    cells: {
      chartist: {
        value: 'Free (MIT or WTFPL)',
        good: true,
        source: `${CHARTIST_DOCS}/blob/main/LICENSE-MIT`
      },
      chartjs: {
        value: 'Free (MIT)',
        good: true,
        source: 'https://github.com/chartjs/Chart.js'
      },
      apexcharts: {
        value: 'Free under $2M revenue, paid above',
        source:
          'https://github.com/apexcharts/apexcharts.js/blob/main/LICENSE.md'
      },
      highcharts: {
        value: 'Paid license',
        source: 'https://shop.highcharts.com/'
      }
    }
  },
  {
    label: 'Chart types',
    cells: {
      chartist: {
        value: 'Line, area, scatter, bar, pie, donut, gauge, composed',
        source: CHARTIST_DOCS
      },
      chartjs: {
        value: '8 types plus mixed charts',
        good: true,
        source: 'https://www.chartjs.org/docs/latest/charts/line.html'
      },
      apexcharts: {
        value: '25+ types',
        good: true,
        source: 'https://github.com/apexcharts/apexcharts.js#readme'
      },
      highcharts: {
        value: 'Dozens, plus Stock, Maps and Gantt',
        good: true,
        source: 'https://www.highcharts.com/docs/getting-started/installation'
      }
    }
  },
  {
    label: 'Tooltips and zoom',
    cells: {
      chartist: { value: 'Through plugins', source: CHARTIST_DOCS },
      chartjs: {
        value: 'Tooltips built in, zoom plugin',
        good: true,
        source: 'https://www.chartjs.org/chartjs-plugin-zoom/latest/'
      },
      apexcharts: {
        value: 'Built in',
        good: true,
        source: 'https://github.com/apexcharts/apexcharts.js#readme'
      },
      highcharts: {
        value: 'Built in',
        good: true,
        source: 'https://www.highcharts.com/docs/getting-started/installation'
      }
    }
  }
];

/** Keys of facts.sizes.bytes per library. */
export const SIZE_KEYS: Record<Library, string> = {
  chartist: 'chartist (lineChart)',
  chartjs: 'chart.js',
  apexcharts: 'apexcharts',
  highcharts: 'highcharts'
};
