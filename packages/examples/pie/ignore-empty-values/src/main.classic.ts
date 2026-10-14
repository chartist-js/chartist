import 'chartist/styles.css';
import { PieChart } from 'chartist';

new PieChart(
  '#chart',
  {
    series: [1, 2, 0, 4]
  },
  {
    ignoreEmptyValues: true
  }
);
