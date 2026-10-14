import 'chartist/styles.css';
import { PieChart } from 'chartist';

new PieChart(
  '#chart',
  {
    series: [5, 3, 4]
  },
  {
    startAngle: 90
  }
);
