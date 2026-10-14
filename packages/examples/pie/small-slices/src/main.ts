import 'chartist/styles.css';
import { pieChart } from 'chartist';

pieChart(
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
