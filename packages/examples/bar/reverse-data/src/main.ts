import 'chartist/styles.css';
import { barChart } from 'chartist';

barChart(
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
