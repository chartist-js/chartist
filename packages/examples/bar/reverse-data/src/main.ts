import 'chartist/styles.css';
import { BarChart } from 'chartist';

new BarChart(
  '#chart',
  {
    series: [
      [1, 2, 3, 4],
      [2, 3, 4],
      [3, 4]
    ]
  },
  {
    reverseData: true
  }
);
