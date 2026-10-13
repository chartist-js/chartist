import 'chartist/styles.css';
import { lineChart } from 'chartist';

lineChart(
  '#chart',
  {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    series: [
      { name: 'visits', data: [12, 9, 7, 8, 5] },
      { name: 'signups', data: [2, 1, 3.5, 7, 3] }
    ]
  },
  { low: 0, showArea: true },
  [
    // Up to 640px: short day names and no points
    [
      '(max-width: 640px)',
      {
        showPoint: false,
        axisX: { labelInterpolationFnc: value => String(value).slice(0, 3) }
      }
    ],
    // Up to 400px: both entries match, and this one comes last,
    // so its labels win. Points stay off from the first entry.
    [
      '(max-width: 400px)',
      {
        axisX: { labelInterpolationFnc: value => String(value)[0] },
        series: { signups: { showArea: false } }
      }
    ]
  ]
);
