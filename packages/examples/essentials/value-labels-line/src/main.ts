import 'chartist/styles.css';
import '@chartist-js/essentials/styles.css';
import './style.css';
import { lineChart } from 'chartist';
import { valueLabels } from '@chartist-js/essentials';

// Temperatures in two cities, each labeled in its series' color.
lineChart(
  '#chart',
  {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    series: [
      { name: 'Basel', data: [18, 21, 19, 24, 22] },
      { name: 'Chur', data: [11, 13, 15, 14, 17] }
    ]
  },
  {
    low: 5,
    high: 30,
    layers: {
      above: [valueLabels({ format: item => `${String(item.value)} °C` })]
    }
  }
);
