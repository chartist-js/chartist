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
    donutWidth: '25%',
    showLabel: false
  }
);
