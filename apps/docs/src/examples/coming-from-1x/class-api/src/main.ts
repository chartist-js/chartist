// Chartist 1.x code, running on v2 unchanged.
import 'chartist/styles.css';
import { LineChart } from 'chartist';

new LineChart(
  '#chart',
  {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    series: [
      [12, 9, 7, 8, 5],
      [2, 1, 3.5, 7, 3]
    ]
  },
  {
    fullWidth: true,
    chartPadding: { right: 40 }
  }
);
