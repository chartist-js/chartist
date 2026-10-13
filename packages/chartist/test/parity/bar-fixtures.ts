/**
 * Bar chart fixtures for the parity tests: the options of the bar examples
 * (packages/examples/bar), their responsive variants, and the 1.x BarChart
 * spec cases.
 */
import { AutoScaleAxis } from '../../src/axes';
import type {
  BarChartData,
  BarChartOptions
} from '../../src/charts/BarChart/BarChart.types';

export type BarFixture = [string, BarChartData, BarChartOptions?];

const quarters = {
  labels: ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'],
  series: [
    [5, 4, 3, 7],
    [3, 2, 9, 5],
    [1, 5, 8, 4],
    [2, 3, 4, 6],
    [4, 1, 2, 1]
  ]
};
const initials = (value: unknown) =>
  String(value)
    .split(/\s+/)
    .map(word => word[0])
    .join('');
const xy = {
  series: [
    [
      { x: 1, y: 1 },
      { x: 3, y: 5 }
    ]
  ]
};
const weeks = {
  labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10'],
  series: [[1, 2, 4, 8, 6, -2, -1, -4, -6, -2]]
};
const months = {
  labels: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ],
  series: [
    [5, 4, 3, 7, 5, 10, 3, 4, 8, 10, 6, 8],
    [3, 2, 9, 5, 4, 6, 4, 6, 7, 8, 7, 4]
  ]
};
const uneven = {
  series: [
    [1, 2, 3, 4],
    [2, 3, 4],
    [3, 4]
  ]
};
const autoAxes = {
  axisX: { type: AutoScaleAxis, onlyInteger: true },
  axisY: { type: AutoScaleAxis, onlyInteger: true }
};

export const BAR_FIXTURES: BarFixture[] = [
  [
    'adaptive',
    quarters,
    {
      stackBars: true,
      axisX: { labelInterpolationFnc: initials },
      axisY: { offset: 20 }
    }
  ],
  [
    'adaptive (min-width 400px: horizontal, reversed)',
    quarters,
    {
      stackBars: true,
      reverseData: true,
      horizontalBars: true,
      axisX: { labelInterpolationFnc: () => undefined },
      axisY: { offset: 60 }
    }
  ],
  [
    'adaptive (min-width 800px: not stacked)',
    quarters,
    {
      stackBars: false,
      seriesBarDistance: 10,
      reverseData: true,
      horizontalBars: true,
      axisY: { offset: 60 }
    }
  ],
  ['auto-scale', xy, autoAxes],
  [
    'bi-polar-interpolated',
    weeks,
    {
      high: 10,
      low: -10,
      axisX: {
        labelInterpolationFnc: (value: unknown, index: number) =>
          index % 2 === 0 ? value : null
      }
    }
  ],
  [
    'distributed-series',
    {
      labels: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
      series: [20, 60, 120, 200, 180, 20, 10]
    },
    { distributeSeries: true }
  ],
  [
    'distributed and stacked',
    { labels: ['a', 'b', 'c'], series: [3, 5, 2] },
    { distributeSeries: true, stackBars: true }
  ],
  [
    'horizontal',
    {
      labels: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ],
      series: [
        [5, 4, 3, 7, 5, 10, 3],
        [3, 2, 9, 5, 4, 6, 4]
      ]
    },
    {
      seriesBarDistance: 10,
      reverseData: true,
      horizontalBars: true,
      axisY: { offset: 70 }
    }
  ],
  [
    'label-position',
    {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      series: [
        [5, 4, 3, 7, 5, 10, 3],
        [3, 2, 9, 5, 4, 6, 4]
      ]
    },
    { axisX: { position: 'start' }, axisY: { position: 'end' } }
  ],
  [
    'labels',
    { labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'], series: [[5, 2, 4, 2, 0]] },
    {}
  ],
  ['multi-series', uneven, {}],
  [
    'multiline',
    {
      labels: [
        'First quarter of the year',
        'Second quarter of the year',
        'Third quarter of the year',
        'Fourth quarter of the year'
      ],
      series: [
        [60000, 40000, 80000, 70000],
        [40000, 30000, 70000, 65000],
        [8000, 3000, 10000, 6000]
      ]
    },
    {
      seriesBarDistance: 10,
      axisX: { offset: 60 },
      axisY: {
        offset: 80,
        labelInterpolationFnc: (value: unknown) => value + ' CHF',
        scaleMinSpace: 15
      }
    }
  ],
  ['overlapping-bars', months, { seriesBarDistance: 15 }],
  [
    'overlapping-bars-on-mobile (max-width 640px)',
    months,
    {
      seriesBarDistance: 5,
      axisX: { labelInterpolationFnc: (value: unknown) => String(value)[0] }
    }
  ],
  ['reverse-data', uneven, { reverseData: true }],
  [
    'stacked',
    {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      series: [
        [800000, 1200000, 1400000, 1300000],
        [200000, 400000, 500000, 300000],
        [100000, 200000, 400000, 600000]
      ]
    },
    {
      stackBars: true,
      axisY: {
        labelInterpolationFnc: (value: unknown) =>
          +(value as number) / 1000 + 'k'
      }
    }
  ],
  [
    'stacked-accumulate-relative',
    {
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      series: [
        [5, 4, -3, -5],
        [5, -4, 3, -5]
      ]
    },
    { stackBars: true, stackMode: 'accumulate-relative' }
  ],
  [
    'stacked overlap',
    {
      labels: ['a', 'b'],
      series: [
        [5, 4],
        [3, 6]
      ]
    },
    { stackBars: true, stackMode: 'overlap' }
  ],
  ['view-box', xy, { ...autoAxes, viewBox: { width: 800, height: 300 } }],
  ['with-circle-modify-drawing (bars only)', weeks, { high: 10, low: -10 }],
  // 1.x BarChart spec cases
  [
    'holes and series names',
    {
      labels: ['a', 'b', 'c'],
      series: [
        { name: 's', meta: 'm', data: [1, null, { value: 3, meta: 'v' }] },
        [2, 4, undefined]
      ]
    },
    {}
  ],
  ['grid background', { series: [[1, 2]] }, { showGridBackground: true }],
  ['zero values', { labels: ['a', 'b'], series: [[0, 0]] }, {}],
  ['empty data', { series: [] }, {}],
  ['only labels', { labels: ['a', 'b'], series: [] }, {}],
  ['high and low clamp', { series: [[5, 20, -5]] }, { high: 10, low: 0 }],
  [
    'class names and fixed size',
    { series: [[1, 2, 3]] },
    {
      classNames: { chart: 'my-bars', bar: 'my-bar' },
      width: '400px',
      height: 200
    }
  ]
];
