import 'chartist/styles.css';
import { lineChart } from 'chartist';

lineChart(
  '#chart',
  {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: [
      [5, 2, 4, 2, 0],
      [5, 2, 2, 0]
    ]
  },
  {}
);
