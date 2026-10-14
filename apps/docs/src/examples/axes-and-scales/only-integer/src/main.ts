import 'chartist/styles.css';
import { lineChart } from 'chartist';

// Bugs found per day: nobody finds half a bug.
lineChart(
  '#chart',
  {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    series: [[2, 3, 1, 4, 2]]
  },
  {
    axisY: {
      onlyInteger: true,
      low: 0
    }
  }
);
