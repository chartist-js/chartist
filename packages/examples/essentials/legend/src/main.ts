import 'chartist/styles.css';
import '@chartist-js/essentials/styles.css';
import { lineChart } from 'chartist';
import { legend } from '@chartist-js/essentials';

// Cups per day of three drinks, named above the chart in their colors.
lineChart(
  '#chart',
  {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    series: [
      { name: 'Tea', data: [5, 6, 4, 7, 6] },
      { name: 'Coffee', data: [8, 9, 7, 9, 10] },
      { name: 'Cocoa', data: [2, 1, 3, 2, 4] }
    ]
  },
  {
    low: 0,
    layers: { above: [legend()] }
  }
);
