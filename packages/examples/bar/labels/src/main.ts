import 'chartist/styles.css';
import { barChart } from 'chartist';

barChart(
  '#chart',
  {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
    series: [[5, 2, 4, 2, 0]]
  },
  {}
);
