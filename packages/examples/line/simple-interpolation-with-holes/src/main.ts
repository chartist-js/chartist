import 'chartist/styles.css';
import { lineChart, Interpolation } from 'chartist';

lineChart(
  '#chart',
  {
    labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    series: [[NaN, 15, 0, null, 2, 3, 4, undefined, 1, null]]
  },
  {
    lineSmooth: Interpolation.simple()
  }
);
