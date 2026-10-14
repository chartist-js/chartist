import 'chartist/styles.css';
import { barChart } from 'chartist';

barChart(
  '#chart',
  {
    labels: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    series: [20, 60, 120, 200, 180, 20, 10]
  },
  {
    distributeSeries: true
  }
);
