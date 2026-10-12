import 'chartist/styles.css';
import { PieChart } from 'chartist';

new PieChart(
  '#chart',
  {
    series: [20, 10, 30, 40]
  },
  {
    chartPadding: 50,
    height: 500,
    width: 500,
    donut: true,
    donutWidth: 60,
    startAngle: 270,
    total: 200,
    showLabel: false
  }
);
