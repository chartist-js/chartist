import 'chartist/styles.css';
import { lineChart } from 'chartist';

lineChart(
  '#chart',
  {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [
      [5, 9, 7, 12],
      [3, 4, 6, 5]
    ]
  },
  {
    fullWidth: true,
    // Room for the last label, which now sits on the right edge.
    chartPadding: { right: 40 }
  }
);
