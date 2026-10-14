import 'chartist/styles.css';
import { lineChart } from 'chartist';

lineChart(
  '#chart',
  {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
    series: [[5, 2, 4, 2, 0]]
  },
  {}
);
