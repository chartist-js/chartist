import 'chartist/styles.css';
import { BarChart } from 'chartist';

new BarChart(
  '#chart',
  {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
    series: [[5, 2, 4, 2, 0]]
  },
  {}
);
