import 'chartist/styles.css';
import { PieChart } from 'chartist';

new PieChart(
  '#chart',
  {
    series: [0.001, 2]
  },
  {
    width: 100,
    height: 100,
    chartPadding: 0
  }
);
