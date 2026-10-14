import 'chartist/styles.css';
import { PieChart } from 'chartist';

new PieChart(
  '#chart',
  {
    labels: ['A', 'B', 'C'],
    series: [5, 8, 1]
  },
  {}
);
