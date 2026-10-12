import 'chartist/styles.css';
import { LineChart } from 'chartist';

new LineChart(
  '#chart',
  {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
    series: [[5, 2, 4, 2, 0]]
  },
  {}
);
