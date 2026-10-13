/**
 * Pie chart fixtures for the parity tests: the options of the pie examples
 * (packages/examples/pie), their responsive variants, and the 1.x PieChart
 * spec cases.
 */
import type {
  PieChartData,
  PieChartOptions
} from '../../src/charts/PieChart/PieChart.types';

export type PieFixture = [string, PieChartData, PieChartOptions?];

const fruit = { labels: ['Bananas', 'Apples', 'Grapes'], series: [20, 15, 40] };
const four = { series: [20, 10, 30, 40] };
const three = { series: [5, 3, 4] };
const percent = (value: unknown) =>
  `${Math.round((Number(value) / [5, 3, 4].reduce((a, b) => a + b)) * 100)}%`;

export const PIE_FIXTURES: PieFixture[] = [
  [
    'custom-labels',
    fruit,
    { labelInterpolationFnc: (value: unknown) => String(value)[0] }
  ],
  [
    'custom-labels (min-width 640px)',
    fruit,
    {
      chartPadding: 30,
      labelOffset: 100,
      labelDirection: 'explode',
      labelInterpolationFnc: (value: unknown) => value
    }
  ],
  [
    'custom-labels (min-width 1024px)',
    fruit,
    { chartPadding: 20, labelOffset: 80, labelDirection: 'explode' }
  ],
  [
    'donut-animation (static)',
    { series: [10, 20, 50, 20, 5, 50, 15], labels: [1, 2, 3, 4, 5, 6, 7] },
    { donut: true, showLabel: false }
  ],
  [
    'donut-chart',
    four,
    { donut: true, donutWidth: 60, startAngle: 270, showLabel: true }
  ],
  ['donut', three, { donut: true }],
  ['fixed-size', three, { width: 100, height: 100, chartPadding: 10 }],
  [
    'gauge-donut',
    four,
    {
      chartPadding: 50,
      height: 500,
      width: 500,
      donut: true,
      donutWidth: 60,
      startAngle: 270,
      total: 200,
      showLabel: false
    }
  ],
  [
    'ignore-empty-values',
    { series: [1, 2, 0, 4] },
    { ignoreEmptyValues: true }
  ],
  [
    'label-interpolation',
    three,
    {
      width: 100,
      height: 100,
      chartPadding: 10,
      labelInterpolationFnc: percent
    }
  ],
  ['labels', { labels: ['A', 'B', 'C'], series: [5, 8, 1] }, {}],
  [
    'overlapping-labels',
    {
      labels: [
        'Big Slice',
        11231231,
        'Test the string',
        new Date(2014, 8, 26),
        124124124
      ],
      series: [96, 1, 1, 1, 1]
    },
    { preventOverlappingLabelOffset: 12 }
  ],
  [
    'relative-donut-width',
    four,
    {
      chartPadding: 50,
      height: 500,
      width: 500,
      donut: true,
      donutWidth: '25%',
      showLabel: false
    }
  ],
  [
    'simple-gauge',
    four,
    {
      donut: true,
      donutWidth: 60,
      startAngle: 270,
      total: 200,
      showLabel: false
    }
  ],
  ['simple', three, { labelInterpolationFnc: percent }],
  [
    'small-slices',
    { series: [0.001, 2] },
    { width: 100, height: 100, chartPadding: 0 }
  ],
  ['start-angle', three, { startAngle: 90 }],
  [
    'view-box',
    three,
    { chartPadding: 10, viewBox: { width: 350, height: 350 } }
  ],
  [
    'view-box (max-width 575px)',
    three,
    { chartPadding: 10, viewBox: { width: 250, height: 250 } }
  ],
  // 1.x PieChart spec cases
  [
    'series objects with names, classes and meta',
    {
      labels: ['a', 'b', 'c'],
      series: [
        { value: 5, name: 'Five', className: 'mine', meta: 'm' },
        3,
        { value: 8, meta: { x: 1 } }
      ]
    },
    {}
  ],
  ['single value', { series: [4] }, {}],
  ['single non-zero value', { series: [0, 4, 0] }, {}],
  ['all zero', { series: [0, 0] }, {}],
  ['empty data', { series: [] }, {}],
  [
    'labels outside and center',
    { labels: ['x', 'y'], series: [1, 2] },
    { labelPosition: 'outside' }
  ],
  [
    'labels center, implode',
    { labels: ['x', 'y'], series: [1, 2] },
    { labelPosition: 'center', labelDirection: 'implode' }
  ],
  [
    'donut with labels and offset',
    { labels: ['x', 'y', 'z'], series: [1, 2, 3] },
    { donut: true, labelOffset: 20 }
  ],
  [
    'label interpolation returning 0 and empty',
    { series: [1, 2, 3] },
    {
      labelInterpolationFnc: (v: unknown, i: number) =>
        i === 0 ? 0 : i === 1 ? '' : v
    }
  ]
];
