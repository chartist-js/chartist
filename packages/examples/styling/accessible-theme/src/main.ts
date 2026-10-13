import 'chartist/styles.css';
import 'chartist/themes/accessible.css';
import './style.css';
import { barChart } from 'chartist';

// The opt-in color-blind-safe palette, on a light and on a dark area.
document.body.classList.add('ct-theme-accessible');
for (const cell of document.querySelectorAll('.cell')) {
  barChart(
    cell,
    {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      series: [
        [5, 4, 3, 7],
        [3, 2, 9, 5],
        [1, 5, 8, 4],
        [6, 3, 4, 2]
      ]
    },
    { seriesBarDistance: 12 }
  );
}
