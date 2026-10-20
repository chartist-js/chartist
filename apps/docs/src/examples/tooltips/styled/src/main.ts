import 'chartist/styles.css';
import '@chartist-js/tooltips/styles.css';
import './style.css';
import { barChart } from 'chartist';
import { tooltips } from '@chartist-js/tooltips';

barChart(
  '#chart',
  {
    labels: ['Apples', 'Kiwis', 'Pears'],
    series: [
      { name: '2025', data: [12, 9, 7] },
      { name: '2026', data: [14, 11, 6] }
    ]
  },
  { plugins: [tooltips({ className: 'fruit-tooltip' })] }
);
