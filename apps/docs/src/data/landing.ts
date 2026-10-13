/** Copy and demo data of the landing page. */
export const SECTIONS = [
  { id: 'top', label: 'Meet' },
  { id: 'story', label: 'Tour' },
  { id: 'features', label: 'Features' },
  { id: 'extend', label: 'Extend' },
  { id: 'try', label: 'Try it' },
  { id: 'responsive', label: 'Responsive' },
  { id: 'compare', label: 'Compare' },
  { id: 'start', label: 'Get started' }
] as const;

export type Scene = 'line' | 'bars' | 'donut' | 'composed';

export interface Chapter {
  title: string;
  text: string;
  /** A complete, runnable module (the e2e tests run each one). */
  code: string;
  scene: Scene;
  reaction: 'none' | 'curious' | 'proud';
  /** The last chapter: the mascot celebrates. */
  celebrate?: boolean;
}

export const CHAPTERS: Chapter[] = [
  {
    title: 'Draw a line in one line',
    text: 'Give it a container and some numbers. Labels, grid, scaling and responsiveness are handled; the styling is yours.',
    scene: 'line',
    reaction: 'none',
    code: `import { lineChart } from 'chartist';

lineChart('#chart', {
  labels: ['Mon', 'Tue', 'Wed'],
  series: [[5, 9, 7], [3, 4, 6]]
});`
  },
  {
    title: 'Bars, side by side or stacked',
    text: 'Same data shape, different function. Group series per label, or stack them to show totals.',
    scene: 'bars',
    reaction: 'curious',
    code: `import { barChart } from 'chartist';

barChart('#chart', {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  series: [[5, 4, 3, 7], [3, 2, 9, 5]]
}, { stackBars: false });`
  },
  {
    title: 'Donuts, pies and gauges',
    text: 'Slices are SVG paths with classes, so a donut sweep is just a stroke animation in CSS.',
    scene: 'donut',
    reaction: 'none',
    code: `import { pieChart } from 'chartist';

pieChart('#chart', { series: [40, 30, 20, 10] }, {
  donut: true,
  donutWidth: 20
});`
  },
  {
    title: 'Compose bars and lines',
    text: 'Layer bars and lines in one chart, each with its own Y axis on the left or right.',
    scene: 'composed',
    reaction: 'proud',
    code: `import {
  chart, cartesianAxes, stepAxis, autoScaleAxis, bar, line, axisLabels
} from 'chartist';

const days = ['Mon', 'Tue', 'Wed', 'Thu'];
chart('#chart', {
  data: {
    labels: days,
    series: [
      { name: 'orders', data: [4, 6, 5, 8] },
      { name: 'growth', data: [20, 45, 38, 60] }
    ]
  },
  axes: cartesianAxes([
    { id: 'days', side: 'bottom', type: stepAxis(), ticks: days },
    { id: 'orders', side: 'left', type: autoScaleAxis() },
    { id: 'growth', side: 'right', type: autoScaleAxis() }
  ]),
  layers: [
    bar({ series: ['orders'], y: 'orders' }),
    line({ series: ['growth'], y: 'growth', align: 'center' }),
    axisLabels()
  ]
});`
  },
  {
    title: "That's the tour",
    text: 'Four chart shapes, one way of styling them: CSS. Keep scrolling for what makes it worth it.',
    scene: 'composed',
    reaction: 'none',
    celebrate: true,
    code: `// That's the tour.
// Keep scrolling for the details.`
  }
];

export const PIPELINE = [
  {
    phase: 'resolve',
    title: 'Resolve',
    text: 'Your config and plugins come together.'
  },
  {
    phase: 'prepare',
    title: 'Prepare',
    text: 'Series are normalized: gaps, objects, names.'
  },
  {
    phase: 'layout',
    title: 'Layout',
    text: 'The chart area, axes and their ticks.'
  },
  {
    phase: 'compose',
    title: 'Compose',
    text: 'Every grid line, label, line, bar and point becomes a node.'
  },
  {
    phase: 'scene',
    title: 'Scene',
    text: 'The whole tree, before anything is drawn.'
  },
  {
    phase: 'render',
    title: 'Render',
    text: 'Live SVG in the page, or a string on the server.'
  },
  {
    phase: 'mount',
    title: 'Mount',
    text: 'The live elements, ready for interaction.'
  }
] as const;

export const GALLERY = [
  {
    title: 'Simple line',
    api: 'lineChart',
    note: 'Three series, default options.',
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      series: [
        [12, 9, 7, 8, 5],
        [2, 1, 3.5, 7, 3],
        [1, 3, 4, 5, 6]
      ]
    },
    options: { fullWidth: true, chartPadding: { right: 20 } }
  },
  {
    title: 'Area',
    api: 'showArea: true',
    note: 'Fill below the line, styled via --ct-area-opacity.',
    type: 'line',
    data: {
      labels: [1, 2, 3, 4, 5, 6, 7, 8],
      series: [[5, 9, 7, 8, 5, 3, 5, 4]]
    },
    options: { low: 0, showArea: true, fullWidth: true }
  },
  {
    title: 'Stacked bars',
    api: 'stackBars: true',
    note: 'Totals per quarter, segments per series.',
    type: 'bar',
    data: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      series: [
        [800, 1200, 1400, 1300],
        [200, 400, 500, 300],
        [100, 200, 400, 600]
      ]
    },
    options: { stackBars: true }
  },
  {
    title: 'Bars + line',
    api: 'chart() + layers',
    note: 'Two Y axes, each scaled to its own series.',
    type: 'composed',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      series: [
        [4, 6, 5, 8, 7, 9],
        [20, 45, 38, 60, 72, 90]
      ]
    },
    options: {}
  },
  {
    title: 'Gauge',
    api: 'donut + total',
    note: 'A half donut with a start angle.',
    type: 'pie',
    data: { series: [20, 10, 30, 40] },
    options: {
      donut: true,
      donutWidth: 40,
      startAngle: 270,
      total: 200,
      showLabel: false
    }
  },
  {
    title: 'Scatter',
    api: 'showLine: false',
    note: 'Points only.',
    type: 'line',
    data: {
      labels: Array.from({ length: 24 }, (_, i) =>
        i % 4 === 0 ? `W${i / 4 + 1}` : ''
      ),
      series: [
        Array.from(
          { length: 24 },
          (_, i) => Math.round((Math.sin(i * 1.7) * 3 + i * 0.25 + 5) * 10) / 10
        )
      ]
    },
    options: { showLine: false, axisX: { showGrid: false } }
  }
] as const;

export const SWATCHES = [
  { name: 'Classic red', hex: '#d70206' },
  { name: 'Ledger blue', hex: '#2b6cd8' },
  { name: 'Teal', hex: '#00917f' },
  { name: 'Plum', hex: '#8445b0' }
] as const;
