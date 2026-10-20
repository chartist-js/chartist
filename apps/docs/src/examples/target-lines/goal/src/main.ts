import 'chartist/styles.css';
import '@chartist-js/essentials/styles.css';
import { barChart } from 'chartist';
import { targetLine } from '@chartist-js/essentials';

barChart(
  '#chart',
  {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    series: [[820, 950, 1100, 760, 1240, 980]]
  },
  {
    low: 0,
    // Extra layers on top of the bars.
    layers: { above: [targetLine({ value: 1000, label: 'Goal' })] }
  }
);
