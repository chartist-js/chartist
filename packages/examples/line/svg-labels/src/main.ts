import 'chartist/styles.css';
import { lineChart } from 'chartist';

// The same chart as the HTML-label example, with SVG text labels.
lineChart(
  '#chart',
  {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    series: [
      [12, 9, 7, 8, 5],
      [2, 1, 3.5, 7, 3],
      [1, 3, 4, 5, 6]
    ]
  },
  {
    labels: 'svg',
    fullWidth: true,
    chartPadding: {
      right: 40
    }
  }
);
