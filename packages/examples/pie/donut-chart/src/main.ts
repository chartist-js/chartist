import 'chartist/styles.css';
import { pieChart } from 'chartist';

pieChart(
  '#chart',
  {
    series: [20, 10, 30, 40]
  },
  {
    donut: true,
    donutWidth: 60,
    startAngle: 270,
    showLabel: true
  }
);
