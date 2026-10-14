import 'chartist/styles.css';
import { lineChart } from 'chartist';

lineChart(
  '#chart',
  {
    series: [
      [
        { x: 1, y: 1 },
        { x: 3, y: 5 }
      ]
    ]
  },
  {
    reverseData: true
  }
);
