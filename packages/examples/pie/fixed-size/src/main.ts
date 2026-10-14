import 'chartist/styles.css';
import { pieChart } from 'chartist';

pieChart(
  '#chart',
  {
    series: [5, 3, 4]
  },
  {
    width: 100,
    height: 100,
    chartPadding: 10
  }
);
