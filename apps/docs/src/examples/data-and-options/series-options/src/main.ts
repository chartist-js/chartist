import 'chartist/styles.css';
import { lineChart } from 'chartist';

lineChart(
  '#chart',
  {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: [
      { name: 'visits', data: [12, 9, 7, null, 5, 8, 11] },
      { name: 'signups', data: [2, 1, 3.5, 7, 3, 4, 6] }
    ]
  },
  {
    // For every series
    low: 0,
    showArea: true,
    // Only for the series named "signups"
    series: {
      signups: { lineSmooth: false, showArea: false }
    }
  }
);
