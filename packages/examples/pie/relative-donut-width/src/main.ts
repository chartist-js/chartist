import 'chartist/styles.css';
import { pieChart } from 'chartist';

pieChart(
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
