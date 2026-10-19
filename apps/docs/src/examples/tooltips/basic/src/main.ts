import 'chartist/styles.css';
import '@chartist-js/tooltips/styles.css';
import { lineChart } from 'chartist';
import { tooltips } from '@chartist-js/tooltips';

// Hover a point, tap it, or press Tab and use the arrow keys.
lineChart(
  '#chart',
  {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    series: [
      { name: 'Visitors', data: [1200, 1500, 1350, 1600, 1100] },
      { name: 'Sign-ups', data: [300, 420, 380, 510, 290] }
    ]
  },
  { low: 0, plugins: [tooltips()] }
);
