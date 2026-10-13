import 'chartist/styles.css';
import { barChart } from 'chartist';

// A flat array: one value per label, and each bar is its own series.
barChart(
  '#chart',
  {
    labels: ['XS', 'S', 'M', 'L', 'XL'],
    series: [20, 60, 120, 200, 180]
  },
  { distributeSeries: true }
);
