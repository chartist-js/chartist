import 'chartist/dist/index.css';
import { BarChart } from 'chartist';

new BarChart(
  '#chart',
  {
    labels: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    series: [20, 60, 120, 200, 180, 20, 10]
  },
  {
    distributeSeries: true
  }
);
