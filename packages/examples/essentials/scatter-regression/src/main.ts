import 'chartist/styles.css';
import '@chartist-js/essentials/styles.css';
import { autoScaleAxis, lineChart } from 'chartist';
import { trendLine } from '@chartist-js/essentials';

// Daily ice cream sales against the day's high, in °C.
const days = [
  [14, 215],
  [16, 325],
  [11, 185],
  [15, 332],
  [18, 406],
  [22, 522],
  [19, 412],
  [25, 614],
  [23, 544],
  [18, 421],
  [22, 445],
  [17, 408],
  [24, 590],
  [27, 621],
  [21, 489],
  [13, 230],
  [20, 470],
  [26, 632]
];

lineChart(
  '#chart',
  { series: [days.map(([x, y]) => ({ x, y }))] },
  {
    // Points only: a scatter plot.
    showLine: false,
    axisX: { type: autoScaleAxis(), onlyInteger: true },
    low: 0,
    // The least-squares line through the points.
    layers: { above: [trendLine()] }
  }
);
