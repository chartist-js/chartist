import 'chartist/styles.css';
import { lineChart } from 'chartist';
import { logAxis } from '@chartist-js/essentials';

// Users of an app that grew from 120 to 850,000 in six years. On a log axis
// each tenfold step is the same height, so the early years stay readable.
lineChart(
  '#chart',
  {
    labels: ['2019', '2020', '2021', '2022', '2023', '2024'],
    series: [[120, 980, 4100, 36000, 210000, 850000]]
  },
  {
    axisY: {
      type: logAxis(),
      offset: 64,
      labelTransform: value => value.toLocaleString('en-US')
    }
  }
);
