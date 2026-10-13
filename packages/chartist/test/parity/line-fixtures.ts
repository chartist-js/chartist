/**
 * Line chart fixtures for the parity tests: the options of the line
 * examples (packages/examples/line) and the 1.x LineChart spec cases.
 */
import { AutoScaleAxis, FixedScaleAxis } from '../../src/axes';
import type {
  LineChartData,
  LineChartOptions
} from '../../src/charts/LineChart/LineChart.types';
import * as Interpolation from '../../src/interpolation';

export type Fixture = [string, LineChartData, LineChartOptions?];

const holes = {
  labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  series: [[NaN, 15, 0, null, 2, 3, 4, undefined, 1, null]]
} as LineChartData;

const dataHoles = {
  labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  series: [
    [5, 5, 10, 8, 7, 5, 4, null, null, null, 10, 10, 7, 8, 6, 9],
    [
      10,
      15,
      null,
      12,
      null,
      10,
      12,
      15,
      null,
      null,
      12,
      null,
      14,
      null,
      null,
      null
    ],
    [null, null, null, null, 3, 4, 1, 3, 4, 6, 7, 9, 5, null, null, null],
    [
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 5, y: undefined },
      { x: 6, y: 4 },
      { x: 7, y: null },
      { x: 8, y: 4 },
      { x: 9, y: 4 }
    ]
  ]
} as LineChartData;

const xy = {
  series: [
    [
      { x: 1, y: 100 },
      { x: 2, y: 50 },
      { x: 3, y: 25 },
      { x: 5, y: 12.5 },
      { x: 8, y: 6.25 }
    ]
  ]
};

export const FIXTURES: Fixture[] = [
  // packages/examples/line
  [
    'area',
    { labels: [1, 2, 3, 4, 5, 6, 7, 8], series: [[5, 9, 7, 8, 5, 3, 5, 4]] },
    { low: 0, showArea: true }
  ],
  [
    'auto-scale',
    {
      series: [
        [
          { x: 1, y: 1 },
          { x: 3, y: 5 }
        ]
      ]
    },
    {
      axisX: { type: AutoScaleAxis, onlyInteger: true },
      axisY: { type: AutoScaleAxis, onlyInteger: true }
    }
  ],
  ['axis-auto', xy, { axisX: { type: AutoScaleAxis, onlyInteger: true } }],
  [
    'axis-fixed-and-auto',
    xy,
    {
      axisX: { type: AutoScaleAxis, onlyInteger: true },
      axisY: { type: FixedScaleAxis, ticks: [0, 50, 75, 87.5, 100], low: 0 },
      lineSmooth: Interpolation.step(),
      showPoint: false
    }
  ],
  [
    'bipolar-area',
    {
      labels: [1, 2, 3, 4, 5, 6, 7, 8],
      series: [
        [1, 2, 3, 1, -2, 0, 1, 0],
        [-2, -1, -2, -1, -2.5, -1, -2, -1],
        [0, 0, 0, 1, 2, 2.5, 2, 1],
        [2.5, 2, 1, 0.5, 1, 0.5, -1, -2.5]
      ]
    },
    {
      high: 3,
      low: -3,
      showArea: true,
      showLine: false,
      showPoint: false,
      fullWidth: true,
      axisX: { showLabel: false, showGrid: false }
    }
  ],
  ['cardinal-interpolation-with-holes', holes, { lineSmooth: true }],
  [
    'monotone-cubic-interpolation-with-holes',
    holes,
    { lineSmooth: Interpolation.monotoneCubic() }
  ],
  ['no-interpolation-with-holes', holes, { lineSmooth: false }],
  [
    'simple-interpolation-with-holes',
    holes,
    { lineSmooth: Interpolation.simple({ divisor: 2 }) }
  ],
  [
    'step-interpolation-with-holes',
    holes,
    { lineSmooth: Interpolation.step() }
  ],
  [
    'step-no-postpone-interpolation-with-holes',
    holes,
    { lineSmooth: Interpolation.step({ postpone: false }) }
  ],
  [
    'data-fill-holes',
    dataHoles,
    {
      fullWidth: true,
      chartPadding: { right: 10 },
      lineSmooth: Interpolation.cardinal({ fillHoles: true }),
      low: 0
    }
  ],
  [
    'data-holes',
    dataHoles,
    { fullWidth: true, chartPadding: { right: 10 }, low: 0 }
  ],
  [
    'full-width',
    {
      series: [
        [
          { x: 1, y: 1 },
          { x: 3, y: 5 }
        ]
      ]
    },
    { fullWidth: true }
  ],
  [
    'labels',
    { labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'], series: [[5, 2, 4, 2, 0]] },
    {}
  ],
  [
    'multi-series',
    {
      labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      series: [
        [5, 2, 4, 2, 0],
        [5, 2, 2, 0]
      ]
    },
    {}
  ],
  [
    'only-integer',
    {
      labels: [1, 2, 3, 4, 5, 6, 7, 8],
      series: [
        [1, 2, 3, 1, -2, 0, 1, 0],
        [-2, -1, -2, -1, -3, -1, -2, -1],
        [0, 0, 0, 1, 2, 3, 2, 1],
        [3, 2, 1, 0.5, 1, 0, -1, -3]
      ]
    },
    {
      high: 3,
      low: -3,
      fullWidth: true,
      axisY: { onlyInteger: true, offset: 20 }
    }
  ],
  [
    'reverse-data',
    {
      series: [
        [
          { x: 1, y: 1 },
          { x: 3, y: 5 }
        ]
      ]
    },
    { reverseData: true }
  ],
  [
    'reverse-data with labels, names and meta',
    {
      labels: ['a', 'b', 'c'],
      series: [
        { name: 'first', meta: 'm1', data: [1, { value: 2, meta: 'p' }, 3] },
        [4, 5]
      ]
    },
    { reverseData: true }
  ],
  [
    'series-override',
    {
      labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
      series: [
        { name: 'series-1', data: [5, 2, -4, 2, 0, -2, 5, -3] },
        { name: 'series-2', data: [4, 3, 5, 3, 1, 3, 6, 4] },
        { name: 'series-3', data: [2, 4, 3, 1, 4, 5, 3, 2] }
      ]
    },
    {
      fullWidth: true,
      series: {
        'series-1': { lineSmooth: Interpolation.step() },
        'series-2': { lineSmooth: Interpolation.simple(), showArea: true },
        'series-3': { showPoint: false }
      }
    }
  ],
  [
    'simple',
    {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      series: [
        [12, 9, 7, 8, 5],
        [2, 1, 3.5, 7, 3],
        [1, 3, 4, 5, 6]
      ]
    },
    { fullWidth: true, chartPadding: { right: 40 } }
  ],
  [
    'simple-smoothing',
    {
      labels: [1, 2, 3, 4, 5],
      series: [
        [1, 5, 10, 0, 1],
        [10, 15, 0, 1, 2]
      ]
    },
    {
      lineSmooth: Interpolation.simple({ divisor: 2 }),
      fullWidth: true,
      chartPadding: { right: 20 },
      low: 0
    }
  ],
  [
    'scatter',
    {
      labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      series: [
        [5, 2, 7, 4, 6, 3, 8, 1, 9, 2],
        [3, 8, 1, 6, 2, 9, 4, 7, 5, 10]
      ]
    },
    {
      showLine: false,
      axisX: {
        labelInterpolationFnc: (value: unknown, index: number) =>
          index % 4 === 0 ? `W${value}` : null
      }
    }
  ],
  [
    'timeseries-like (fixed x axis, label fn)',
    {
      series: [
        {
          name: 'a',
          data: [
            { x: 1000, y: 53 },
            { x: 5000, y: 40 },
            { x: 9000, y: 45 }
          ]
        }
      ]
    },
    {
      axisX: {
        type: FixedScaleAxis,
        divisor: 5,
        labelInterpolationFnc: (value: unknown) => `t${value}`
      }
    }
  ],
  [
    'view-box',
    { labels: [1, 2, 3, 4], series: [[1, 2, 3, 4]] },
    { viewBox: { width: 400, height: 200 } }
  ],
  // 1.x LineChart spec cases
  ['grid background', { series: [[1, 2]] }, { showGridBackground: true }],
  [
    'y axis at end, x axis at start',
    { labels: ['a', 'b'], series: [[1, 2]] },
    { axisY: { position: 'end' }, axisX: { position: 'start' } }
  ],
  ['zero values', { labels: ['a', 'b', 'c'], series: [[0, 1, 0]] }, {}],
  ['single value', { labels: ['a'], series: [[1]] }, {}],
  ['empty data', { series: [] }, {}],
  ['only labels', { labels: ['a', 'b'], series: [] }, {}],
  ['empty with high/low', { series: [] }, { high: 10, low: 0 }],
  ['empty with reverseData', { series: [] }, { reverseData: true }],
  [
    'class names and fixed size',
    { series: [[1, 2, 3]] },
    {
      classNames: { chart: 'my-chart', point: 'my-point' },
      width: '400px',
      height: 200
    }
  ],
  [
    'chartPadding number, area base',
    { series: [[5, -3, 2]] },
    { chartPadding: 5, showArea: true, areaBase: 2 }
  ]
];
