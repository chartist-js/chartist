import 'chartist/styles.css';
import './style.css';
import { barChart } from 'chartist';

barChart(
  '#chart',
  {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    series: [
      [5, 4, 3, 7],
      [3, 2, 9, 5]
    ]
  },
  { seriesBarDistance: 24 }
);
