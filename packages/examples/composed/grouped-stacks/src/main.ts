import 'chartist/styles.css';
import {
  autoScaleAxis,
  axisGrid,
  axisLabels,
  bar,
  cartesianAxes,
  chart,
  stepAxis
} from 'chartist';

// New and returning customers per quarter: one stack per year.
chart('#chart', {
  data: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [
      { name: '2024 new', data: [5, 3, 4, 6] },
      { name: '2024 returning', data: [2, 2, 3, 3] },
      { name: '2025 new', data: [4, 6, 5, 7] },
      { name: '2025 returning', data: [3, 4, 4, 5] }
    ]
  },
  axes: cartesianAxes({
    x: { type: stepAxis() },
    y: { type: autoScaleAxis(), low: 0 }
  }),
  layers: [
    axisGrid(),
    // Each layer stacks its own year; the offsets put the stacks side by side.
    bar({
      series: ['2024 new', '2024 returning'],
      stackBars: true,
      offset: -8
    }),
    bar({ series: ['2025 new', '2025 returning'], stackBars: true, offset: 8 }),
    axisLabels()
  ],
  // The bar chart class centers the X labels under the bars.
  className: 'ct-chart-bar'
});
