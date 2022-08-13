import 'chartist/dist/index.css';
import { PieChart } from 'chartist';

new PieChart(
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
