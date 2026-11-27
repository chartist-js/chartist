import 'chartist/styles.css';
import { lineChart } from 'chartist';

lineChart(
  '#chart',
  {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: [
      [5, 9, 7, 8, 5, 3, 5],
      [2, 3, 4, 2, 3, 5, 4],
      [1, 2, 2, 3, 2, 1, 2]
    ]
  },
  { stack: true, showArea: true }
);
