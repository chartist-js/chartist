import 'chartist/styles.css';
import { pieChart } from 'chartist';

pieChart(
  '#chart',
  {
    series: [5, 3, 4]
  },
  {
    startAngle: 90
  }
);
