import 'chartist/styles.css';
import { pieChart } from 'chartist';

pieChart(
  '#chart',
  {
    labels: ['A', 'B', 'C'],
    series: [5, 8, 1]
  },
  {}
);
