import 'chartist/styles.css';
import './style.css';
import { lineChart } from 'chartist';
import { fromLegacyPlugin } from 'chartist/compat';

// Plugin scripts register on the global `Chartist`.
const { plugins } = Chartist;

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
    plugins: [
      fromLegacyPlugin(
        // An element of its own, so the legend doesn't overlap the chart.
        plugins.legend({ position: document.querySelector('#legend') })
      )
    ]
  }
);
