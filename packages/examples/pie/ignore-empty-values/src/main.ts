import 'chartist/styles.css';
import { pieChart } from 'chartist';

pieChart(
  '#chart',
  {
    series: [1, 2, 0, 4]
  },
  {
    ignoreEmptyValues: true
  }
);
