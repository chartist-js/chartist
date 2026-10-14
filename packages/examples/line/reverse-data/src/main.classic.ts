import 'chartist/styles.css';
import { LineChart } from 'chartist';

new LineChart(
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
