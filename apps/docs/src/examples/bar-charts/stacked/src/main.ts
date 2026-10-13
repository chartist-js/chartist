import 'chartist/styles.css';
import { barChart } from 'chartist';

barChart(
  '#chart',
  {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [
      [800, 1200, 1400, 1300],
      [200, 400, 500, 300],
      [100, 200, 400, 600]
    ]
  },
  { stackBars: true }
);
